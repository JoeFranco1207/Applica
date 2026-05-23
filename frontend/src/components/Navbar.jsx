import { useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../contexts/NotificationContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import ThemeSwitch from "./ThemeSwitch";
import NotificationPanel from "./NotificationPanel";
import PresenceAvatar from './PresenceAvatar';

const BellIcon = ({ size = 20, count = 0 }) => (
  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
    {count > 0 && (
      <span
        style={{
          position: 'absolute',
          top: '-6px',
          right: '-6px',
          minWidth: '18px',
          height: '18px',
          padding: '0 5px',
          backgroundColor: '#ef4444',
          borderRadius: '999px',
          color: '#fff',
          fontSize: '11px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
          boxShadow: '0 0 0 2px rgba(255,255,255,0.2)',
        }}
      >
        {count > 9 ? '9+' : count}
      </span>
    )}
  </div>
);

const JobIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="3" y="7" width="18" height="14" rx="2" ry="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const HeartIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

const ChatIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <path d="M8 10h8" />
    <path d="M8 14h5" />
  </svg>
);

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const navigate = useNavigate();
  const { notifications, unreadCount, markNotificationAsRead, fetchNotifications } = useNotification();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const token = localStorage.getItem("token");
  const user = token ? JSON.parse(localStorage.getItem("user") || "{}") : null;

  const { language, setLanguage, translate } = useLanguage();
  const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  const initials = fullName
    ? fullName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : "U";
  const profileImage = user?.profilePicture || user?.companyLogo || null;

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await axios.post(
          "http://localhost:8000/api/auth/logout",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (error) {
      console.log("Logout failed:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setMenuOpen(false);
      navigate("/auth");
      window.location.reload();
    }
  };

  return (
    <nav style={{
      ...styles.navbar,
      backgroundColor: "var(--surface)",
      color: "var(--text-h)",
      boxShadow: "var(--shadow)",
    }}>
      <div style={styles.navContent}>
        <div style={styles.brand} onClick={() => navigate("/")}>
          <img
            src="/src/assets/Applica_Logo.png"
            alt="Applica"
            style={styles.logoImage}
          />
          <span style={styles.logoText}>Applica</span>
        </div>

        <div style={styles.navLinks}>
          <button style={styles.linkButton} onClick={() => navigate("/explore")}>
            {translate("nav.browseJobs")}
          </button>
          <button style={styles.linkButton} onClick={() => navigate("/explore")}>{translate("nav.companies")}</button>
          <button style={styles.linkButton} onClick={() => navigate("/explore")}>{translate("nav.resources")}</button>
          {user?.role === "jobseeker" && (
            <button
              style={styles.linkButton}
              onClick={() => navigate("/resume-designs")}
              title={translate("nav.resume")}
            >
              <HeartIcon size={16} />
              <span style={styles.navIconText}>{translate("nav.resume")}</span>
            </button>
          )}
          {user?.role === "employer" && (
            <button
              style={styles.linkButton}
              onClick={() => navigate("/employer/applicants")}
              title={translate("nav.applicants")}
            >
              <JobIcon size={16} />
              <span style={styles.navIconText}>{translate("nav.applicants")}</span>
            </button>
          )}
        </div>

        <div style={styles.actions}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={styles.languageSelect}
            title={translate("nav.language")}
          >
            <option value="en">{translate("nav.english")}</option>
            <option value="tl">{translate("nav.filipino")}</option>
          </select>
          <ThemeSwitch isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
          {token ? (
            <>
              <button
                type="button"
                style={{ ...styles.notificationButton, cursor: 'pointer' }}
                title="Messages"
                onClick={() => navigate('/chat')}
              >
                <ChatIcon size={20} />
              </button>
              <div style={styles.notificationMenu}>
                <button
                  type="button"
                  style={{ ...styles.notificationButton, cursor: 'pointer' }}
                  title="Notifications"
                  onClick={() => {
                    setNotificationOpen((prev) => {
                      const next = !prev;
                      if (next) {
                        fetchNotifications();
                      }
                      return next;
                    });
                  }}
                >
                  <BellIcon size={20} count={unreadCount} />
                </button>
                {notificationOpen && (
                  <div style={styles.notificationPanel}>
                    <NotificationPanel onClose={() => setNotificationOpen(false)} />
                  </div>
                )}
              </div>
              <div style={styles.profileMenu}>
                <button
                  style={styles.profileButton}
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  <PresenceAvatar
                    src={profileImage}
                    alt={fullName || 'Profile'}
                    userId={user?._id || user?.id}
                    initialPresenceMode={user?.presenceMode || (user?.isOnline ? 'online' : 'offline')}
                    size={36}
                    style={styles.profilePicture}
                    showLastActive={false}
                  />
                </button>
                {menuOpen && (
                  <div style={{
                    ...styles.dropdown,
                    backgroundColor: "var(--surface-strong)",
                    borderColor: "var(--border)",
                  }}>
                    <button
                      style={{
                        ...styles.dropdownItem,
                        color: "var(--text-h)",
                      }}
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/profile");
                      }}
                    >
                      My Profile
                    </button>
                    <button
                      style={{
                        ...styles.dropdownItem,
                        color: isDarkMode ? "#ccc" : "#333",
                      }}
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/profile");
                      }}
                    >
                      Settings
                    </button>
                    <button
                      style={{
                        ...styles.dropdownItem,
                        color: "var(--primary)",
                        borderBottom: "none",
                      }}
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              style={styles.loginButton}
              onClick={() => navigate("/auth")}
            >
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    width: "100%",
    padding: "12px 20px",
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxSizing: "border-box",
    boxShadow: "0 1px 10px rgba(0,0,0,0.05)",
  },
  navContent: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
  },
  logoImage: {
    width: 32,
    height: 32,
    objectFit: "contain",
  },
  logoText: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: "0.02em",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  linkButton: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "inherit",
    fontSize: 14,
    padding: "6px 10px",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  navIconText: {
    display: "inline-block",
    lineHeight: 1,
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  languageSelect: {
    borderRadius: 999,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text)",
    padding: "8px 12px",
    fontSize: 14,
    cursor: "pointer",
  },
  createButton: {
    backgroundColor: "var(--primary)",
    color: "var(--cta-text)",
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 700,
    boxShadow: "0 12px 24px rgba(37, 99, 235, 0.18)",
  },
  loginButton: {
    backgroundColor: "transparent",
    color: "var(--text-h)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: "10px 14px",
    cursor: "pointer",
  },
  profileMenu: {
    position: "relative",
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "1px solid var(--border)",
    background: "var(--surface)",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  profilePicture: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "50%",
  },
  profileInitials: {
    fontSize: 14,
    fontWeight: 700,
  },
  notificationMenu: {
    position: "relative",
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "1px solid var(--border)",
    background: "var(--surface)",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "var(--text-h)",
    transition: "all 0.2s",
    zIndex: 101,
    position: "relative",
  },
  notificationDropdown: {
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: 8,
    backgroundColor: "var(--surface-strong)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    minWidth: 320,
    maxHeight: 400,
    overflowY: "auto",
    zIndex: 1000,
  },
  notificationItem: {
    padding: "12px 16px",
    borderBottom: "1px solid var(--border)",
    cursor: "pointer",
    transition: "background 0.2s",
    fontSize: 13,
    lineHeight: 1.4,
  },
  notificationItemUnread: {
    backgroundColor: "#f8fafc",
    color: "#475569",
  },
  notificationItemRead: {
    backgroundColor: "#ffffff",
    color: "#1f2937",
  },
  notificationPanel: {
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: 8,
    backgroundColor: "var(--surface-strong)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    minWidth: 320,
    maxHeight: 500,
    overflowY: "auto",
    zIndex: 1001,
  },
  notificationPanelHeader: {
    padding: "16px",
    borderBottom: "1px solid var(--border)",
    backgroundColor: "var(--surface-strong)",
  },
  notificationList: {
    maxHeight: 420,
    overflowY: "auto",
  },
  notificationItemPanel: {
    padding: "12px 16px",
    borderBottom: "1px solid var(--border)",
    cursor: "pointer",
    transition: "background 0.2s",
    fontSize: 13,
    lineHeight: 1.5,
  },
  dropdown: {
    position: "absolute",
    right: 0,
    top: 48,
    minWidth: 160,
    borderRadius: 12,
    border: "1px solid #e0e0e0",
    boxShadow: "0 16px 40px rgba(0,0,0,0.08)",
    overflow: "hidden",
    zIndex: 1000,
  },
  dropdownItem: {
    width: "100%",
    textAlign: "left",
    padding: "12px 16px",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid rgba(0,0,0,0.04)",
    cursor: "pointer",
    fontSize: 14,
  },
};

