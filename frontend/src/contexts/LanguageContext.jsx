import { createContext, useState, useEffect, useContext } from "react";
import translations from "../translations";

export const LanguageContext = createContext();

const getStoredUserId = () => {
  if (typeof window === "undefined") return null;
  try {
    const storedUser = localStorage.getItem("user");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    return parsedUser?.id || parsedUser?._id || null;
  } catch {
    return null;
  }
};

const getInitialLanguage = () => {
  if (typeof window === "undefined") return "en";
  const userId = getStoredUserId();
  const storageKey = userId ? `language_${userId}` : "language";
  return localStorage.getItem(storageKey) || "en";
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    const userId = getStoredUserId();
    const storageKey = userId ? `language_${userId}` : "language";
    localStorage.setItem(storageKey, language);
  }, [language]);

  const translate = (key, fallback = "") => {
    const keys = key.split(".");
    let value = translations[language];
    for (const segment of keys) {
      value = value?.[segment];
      if (value === undefined) break;
    }
    return value !== undefined && value !== null ? value : fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translate }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

