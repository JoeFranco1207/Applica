import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { translateText } from "../utils/translate";

const IGNORED_PARENT_TAGS = [
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "TEXTAREA",
  "INPUT",
  "CANVAS",
  "SVG",
  "PATH",
  "OPTION",
  "VIDEO",
  "AUDIO",
  "CODE",
  "PRE",
];

const getRootNode = () => document.getElementById("root") || document.body;

const getCacheKey = (text, target) => `auto-translate::${target}::${text}`;

const shouldProcessTextNode = (node) => {
  if (!node.nodeValue || !node.nodeValue.trim()) return false;
  const parent = node.parentElement;
  if (!parent) return false;
  if (IGNORED_PARENT_TAGS.includes(parent.tagName)) return false;
  if (parent.closest("script,style,noscript,textarea,input,svg,canvas,video,audio,code,pre")) return false;
  if (node.__originalText__ && node.__lastTranslatedText__ === node.nodeValue) return false;
  return true;
};

const translateTextNode = async (node, target) => {
  const currentValue = node.nodeValue || "";
  const isCurrentValueTranslated = node.__originalText__ !== undefined && node.__lastTranslatedText__ === currentValue;
  const originalValue = isCurrentValueTranslated ? node.__originalText__ : currentValue;

  // Update original text when content changes dynamically.
  if (node.__originalText__ === undefined || !isCurrentValueTranslated) {
    node.__originalText__ = currentValue;
  }

  const trimmed = originalValue.trim();
  if (!trimmed) return;

  const cacheKey = getCacheKey(trimmed, target);
  const cache = window.__appAutoTranslateCache__ || (window.__appAutoTranslateCache__ = new Map());
  let translated = cache.get(cacheKey);

  if (!translated) {
    translated = await translateText(trimmed, target);
    cache.set(cacheKey, translated);
  }

  const prefix = originalValue.slice(0, originalValue.indexOf(trimmed));
  const suffix = originalValue.slice(originalValue.indexOf(trimmed) + trimmed.length);
  const translatedValue = `${prefix}${translated}${suffix}`;
  node.__lastTranslatedText__ = translatedValue;
  node.nodeValue = translatedValue;
};

const translateAttribute = async (element, attributeName, target) => {
  // Convert attribute name to camelCase for dataset keys (e.g., "aria-label" -> "ariaLabel")
  const camelCaseAttr = attributeName.replace(/-./g, x => x[1].toUpperCase());
  const originalKey = `original${camelCaseAttr.charAt(0).toUpperCase()}${camelCaseAttr.slice(1)}`;
  const translatedKey = `translated${camelCaseAttr.charAt(0).toUpperCase()}${camelCaseAttr.slice(1)}`;
  const currentValue = element.getAttribute(attributeName);
  if (!currentValue) return;

  const originalValue = element.dataset[originalKey];
  const lastTranslated = element.dataset[translatedKey];
  if (originalValue && lastTranslated === currentValue) return;

  const sourceValue = originalValue || currentValue;
  if (!element.dataset[originalKey]) {
    element.dataset[originalKey] = sourceValue;
  }

  const cacheKey = getCacheKey(sourceValue, target);
  const cache = window.__appAutoTranslateCache__ || (window.__appAutoTranslateCache__ = new Map());
  let translated = cache.get(cacheKey);

  if (!translated) {
    translated = await translateText(sourceValue, target);
    cache.set(cacheKey, translated);
  }

  element.dataset[translatedKey] = translated;
  element.setAttribute(attributeName, translated);
};

const translateNode = async (node, target) => {
  if (node.nodeType === Node.TEXT_NODE && shouldProcessTextNode(node)) {
    await translateTextNode(node, target);
    return;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const attributesToTranslate = ["placeholder", "alt", "title", "aria-label"];
    await Promise.all(
      attributesToTranslate.map((attr) => translateAttribute(node, attr, target))
    );

    for (const child of node.childNodes) {
      await translateNode(child, target);
    }
  }
};

const translatePage = async (target) => {
  const root = getRootNode();
  if (!root) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return shouldProcessTextNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  const nodes = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }

  await Promise.all(nodes.map((node) => translateTextNode(node, target)));

  const attributesToTranslate = ["placeholder", "alt", "title", "aria-label"];
  const selector = attributesToTranslate.map((attr) => `[${attr}]`).join(",");
  const elements = Array.from(root.querySelectorAll(selector));

  await Promise.all(
    elements.map(async (element) => {
      await Promise.all(
        attributesToTranslate.map((attr) => translateAttribute(element, attr, target))
      );
    })
  );
};

const processMutations = (mutations, target) => {
  const tasks = [];

  for (const mutation of mutations) {
    if (mutation.type === "characterData" && shouldProcessTextNode(mutation.target)) {
      tasks.push(translateTextNode(mutation.target, target));
    }

    if (mutation.type === "childList") {
      mutation.addedNodes.forEach((node) => {
        tasks.push(translateNode(node, target));
      });
    }

    if (mutation.type === "attributes") {
      const attrName = mutation.attributeName;
      if (attrName && ["placeholder", "alt", "title", "aria-label"].includes(attrName)) {
        const element = mutation.target;
        tasks.push(translateAttribute(element, attrName, target));
      }
    }
  }

  return Promise.all(tasks);
};

export default function GlobalTranslator() {
  const { language } = useLanguage();
  const location = useLocation();
  const observerRef = useRef(null);

  useEffect(() => {
    const root = getRootNode();
    if (!root) return;

    const currentTarget = language || "en";
    translatePage(currentTarget).catch((error) => {
      console.error("Global translation failed:", error);
    });

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new MutationObserver((mutations) => {
      processMutations(mutations, currentTarget).catch((error) => {
        console.error("Mutation translation failed:", error);
      });
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "alt", "title", "aria-label"],
    });
    observerRef.current = observer;

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [language, location.pathname]);

  return null;
}

