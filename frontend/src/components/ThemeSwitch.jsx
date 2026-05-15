import "./ThemeSwitch.css";

export default function ThemeSwitch({ isDarkMode, toggleTheme }) {
  return (
    <button
      className={`theme-switch ${isDarkMode ? "dark" : "light"}`}
      onClick={toggleTheme}
      title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <div className="switch-track">
        <div className="switch-thumb">
          <span className="switch-icon">
            {isDarkMode ? "🌙" : "☀️"}
          </span>
        </div>
      </div>
    </button>
  );
}
