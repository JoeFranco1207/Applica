import { createContext, useState, useEffect } from "react";

export const ThemeContext = createContext();

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

const getInitialTheme = () => {
  if (typeof window === "undefined") return false;
  const userId = getStoredUserId();
  const storageKey = userId ? `theme_${userId}` : "theme";
  const savedTheme = localStorage.getItem(storageKey);
  if (savedTheme) return savedTheme === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);

  useEffect(() => {
    const theme = isDarkMode ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    const userId = getStoredUserId();
    const storageKey = userId ? `theme_${userId}` : "theme";
    localStorage.setItem(storageKey, theme);
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
