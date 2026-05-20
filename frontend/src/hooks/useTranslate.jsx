import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translateText } from '../utils/translate';

function makeCacheKey(text, lang) {
  try {
    const key = btoa(unescape(encodeURIComponent(text))).slice(0, 200);
    return `translate::${lang}::${key}`;
  } catch (e) {
    return `translate::${lang}::${text.slice(0, 200)}`;
  }
}

export const useTranslate = (text, opts = {}) => {
  const { language } = useLanguage();
  const target = opts.target || language || 'en';
  const [translated, setTranslated] = useState(text);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const doTranslate = async (t) => {
    const src = t ?? text;
    if (!src || typeof src !== 'string') return src;
    if (!target || target === 'en') {
      setTranslated(src);
      return src;
    }
    const cacheKey = makeCacheKey(src, target);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setTranslated(cached);
      return cached;
    }
    try {
      setLoading(true);
      const res = await translateText(src, target);
      const out = res || src;
      setTranslated(out);
      try { localStorage.setItem(cacheKey, out); } catch (e) {}
      return out;
    } catch (err) {
      setError(err?.message || 'translate_error');
      setTranslated(src);
      return src;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (!text || typeof text !== 'string') {
      setTranslated(text);
      return;
    }
    // run translation when text or target changes
    doTranslate(text).then(() => { if (!mounted) return; });
    return () => { mounted = false; };
  }, [text, target]);

  return { translated, loading, error, translateNow: doTranslate };
};

export default useTranslate;
