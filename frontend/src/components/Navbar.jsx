import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../contexts/NotificationContext";
import { ThemeContext } from "../contexts/ThemeContext";
import ThemeSwitch from "./ThemeSwitch";

const BellIcon = ({ size = 20, hasNotification = false }) => (
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
    {hasNotification && (
      <span
        style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          width: '10px',
          height: '10px',
          backgroundColor: '#ef4444',
          borderRadius: '50%',
        }}
      />
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

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [dbNotifications, setDbNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { unreadCount } = useNotification();
  const token = localStorage.getItem("token");
  const user = token ? JSON.parse(localStorage.getItem("user") || "{}") : null;

  // Fetch notifications from database
  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const response = await fetch('http://localhost:8000/api/notifications?limit=20', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setDbNotifications(data.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifs(false);
    }
  };

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (notificationOpen && token) {
      fetchNotifications();
    }
  }, [notificationOpen]);

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setMenuOpen(false);
    navigate("/auth");
    window.location.reload();
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
            Browse Jobs
          </button>
          <button style={styles.linkButton} onClick={() => navigate("/explore")}>Companies</button>
          <button style={styles.linkButton} onClick={() => navigate("/explore")}>Resources</button>
          {user?.role === "employer" && (
            <button
              style={styles.linkButton}
              onClick={() => navigate("/employer/applicants")}
              title="View applicants"
            >
              <JobIcon size={16} />
              <span style={styles.navIconText}>Applicants</span>
            </button>
          )}
        </div>

        <div style={styles.actions}>
          <ThemeSwitch isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
          {token ? (
            <>
              <div style={styles.notificationMenu}>
                <button
                  style={{...styles.notificationButton, cursor: 'pointer'}}
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  title="Notifications"
                >
                  <BellIcon size={20} hasNotification={unreadCount > 0} />
                </button>
                {notificationOpen && (
                  <div style={{
                    ...styles.notificationPanel,
                    backgroundColor: "var(--surface-strong)",
                    borderColor: "var(--border)",
                    color: "var(--text)",
                  }}>
                    <div style={styles.notificationPanelHeader}>
                      <h3 style={{margin: 0, fontSize: '18px', fontWeight: 700}}>Notifications</h3>
                    </div>
                    {loadingNotifs ? (
                      <div style={{padding: '20px', textAlign: 'center', color: 'var(--text-muted)'}}>
                        Loading...
                      </div>
                    ) : dbNotifications.length === 0 ? (
                      <div style={{padding: '20px', textAlign: 'center', color: 'var(--text-muted)'}}>
                        No notifications yet
                      </div>
                    ) : (
                      <div style={styles.notificationList}>
                        {dbNotifications.map((notif) => (
                          <div
                            key={notif._id}
                            style={{
                              ...styles.notificationItemPanel,
                              backgroundColor: notif.read ? 'transparent' : 'rgba(52, 152, 219, 0.05)',
                              borderColor: "var(--border)",
                            }}
                          >
                            <div style={{display: 'flex', gap: '12px'}}>
                              {notif.actorAvatar ? (
                                <img 
                                  src={notif.actorAvatar} 
                                  alt={notif.actorName}
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    flexShrink: 0,
                                    objectFit: 'cover'
                                  }}
                                />
                              ) : (
                                <div style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  background: '#3498db',
                                  flexShrink: 0
                                }}/>
                              )}
                              <div style={{flex: 1}}>
                                <div style={{fontSize: '13px', fontWeight: 600}}>
                                  {notif.actorName}
                                </div>
                                <div style={{fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px'}}>
                                  {notif.message}
                                </div>
                                <div style={{fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px'}}>
                                  {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString()}
                                </div>
                              </div>
                              {!notif.read && (
                                <div style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: '#3498db',
                                  flexShrink: 0,
                                  marginTop: '4px'
                                }}/>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div style={styles.profileMenu}>
                <button
                  style={styles.profileButton}
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      style={styles.profilePicture}
                    />
                  ) : (
                    <span style={styles.profileInitials}>{initials}</span>
                  )}
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
