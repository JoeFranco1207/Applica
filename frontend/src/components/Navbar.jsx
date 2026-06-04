import { useState, useContext, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useNotification } from "../contexts/NotificationContext";
import { ThemeContext } from "../contexts/ThemeContext";
import ThemeSwitch from "./ThemeSwitch";
import NotificationPanel from "./NotificationPanel";
import PresenceAvatar from './PresenceAvatar';
import "./Navbar.css";
import ApplicaLogo from "../assets/Applica_Logo.png";

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

const InterviewIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="7" width="18" height="10" rx="2" ry="2" />
    <path d="M16 3v4" />
    <path d="M8 3v4" />
    <path d="M3 12h18" />
  </svg>
);

const ChartIcon = ({ size = 18 }) => (
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
    <path d="M4 19V5" />
    <path d="M10 19V11" />
    <path d="M16 19V9" />
    <path d="M22 19V13" />
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications, unreadCount, markNotificationAsRead, fetchNotifications } = useNotification();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);

    if (storedToken) {
      try {
        const parsedUser = JSON.parse(localStorage.getItem("user") || "null");
        setUser(parsedUser);
      } catch (error) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [location.pathname]);

  // Listen for cross-tab storage updates so premium status updates live
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'user') {
        try {
          setUser(JSON.parse(e.newValue || 'null'));
        } catch (err) {
          setUser(null);
        }
      }
      if (e.key === 'token') {
        setToken(e.newValue);
      }
    };

    const onUserUpdated = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (err) {
          setUser(null);
        }
      }
      setToken(localStorage.getItem('token'));
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('app:userUpdated', onUserUpdated);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('app:userUpdated', onUserUpdated);
    };
  }, []);

  useEffect(() => {
    const closeSearchOnOutsideClick = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };

    window.addEventListener('mousedown', closeSearchOnOutsideClick);
    return () => {
      window.removeEventListener('mousedown', closeSearchOnOutsideClick);
    };
  }, []);

  useEffect(() => {
    const queryValue = searchQuery.trim();
    if (!queryValue) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      if (!token || queryValue.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        const response = await axios.get(`${API_BASE}/api/auth/search`, {
          params: { query: queryValue },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setSearchResults(response.data?.data?.profiles || []);
        setSearchOpen(true);
      } catch (error) {
        console.error('Profile search failed', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, token]);

  const handleProfileSelect = (profile) => {
    if (!profile?._id) return;
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    navigate(`/profile/${profile._id}`);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Enter') {
      const queryValue = searchQuery.trim();
      if (!queryValue) return;
      navigate(`/search?query=${encodeURIComponent(queryValue)}`);
      setSearchOpen(false);
      return;
    }
  };

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
  const premiumBadgeStyle = user?.premiumAIAccess ? {} : { backgroundColor: '#6b7280' };
  const badgeClassName = user?.premiumAIAccess ? 'premium-status-badge' : 'free-status-badge';

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
            src={ApplicaLogo}
            alt="Applica"
            style={styles.logoImage}
          />
          <span style={styles.logoText}>Applica</span>
        </div>

        <div style={styles.navLinks}>
          <button style={styles.linkButton} onClick={() => navigate("/explore")}>Browse Jobs</button>
          <button style={styles.linkButton} onClick={() => navigate("/explore")}>Companies</button>
          {user?.role === "jobseeker" && (
            <>
              <button
                style={styles.linkButton}
                onClick={() => navigate("/resume-designs")}
                title="Resume"
              >
                <HeartIcon size={16} />
                <span style={styles.navIconText}>Resume</span>
              </button>
              <button
                style={styles.iconButton}
                onClick={() => navigate("/jobseeker/applications")}
                title="Applications"
              >
                <JobIcon size={18} />
              </button>
              <button
                style={styles.iconButton}
                onClick={() => navigate("/jobseeker/interviews")}
                title="Interview Requests"
              >
                <InterviewIcon size={18} />
              </button>
            </>
          )}
          {user?.role === "employer" && (
            <>
              <button
                style={styles.iconButton}
                onClick={() => navigate("/employer/dashboard")}
                title="Dashboard"
              >
                <ChartIcon size={18} />
              </button>
              <button
                style={styles.iconButton}
                onClick={() => navigate("/employer/applicants")}
                title="Applicants"
              >
                <JobIcon size={18} />
              </button>
              <button
                style={styles.iconButton}
                onClick={() => navigate("/employer/interviews")}
                title="Interviews"
              >
                <InterviewIcon size={18} />
              </button>
            </>
          )}
          </div>

        {token && (
          <div style={styles.searchContainer} ref={searchRef}>
            <input
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search people or posts"
              aria-label="Search people or posts"
              style={styles.searchInput}
            />
            {searchOpen && (searchQuery.trim().length >= 2 || isSearching) && (
              <div style={styles.searchResults}>
                {isSearching ? (
                  <div style={styles.searchResultItem}>Searching...</div>
                ) : searchResults.length ? (
                  searchResults.map((profile) => (
                    <button
                      key={profile._id}
                      type="button"
                      style={styles.searchResultItem}
                      onMouseDown={() => handleProfileSelect(profile)}
                    >
                      <img
                        src={profile.profilePicture || ApplicaLogo}
                        alt={`${profile.firstName} ${profile.lastName}`}
                        style={styles.searchResultAvatar}
                      />
                      <div style={styles.searchResultText}>
                        <div style={styles.searchResultName}>{`${profile.firstName} ${profile.lastName}`}</div>
                        <div style={styles.searchResultMeta}>
                          {profile.companyName ? profile.companyName : profile.role || 'Profile'}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div style={styles.searchResultItem}>No profiles found</div>
                )}
                <button
                  type="button"
                  style={styles.searchMoreButton}
                  onMouseDown={() => {
                    const queryValue = searchQuery.trim();
                    if (!queryValue) return;
                    navigate(`/search?query=${encodeURIComponent(queryValue)}`);
                    setSearchOpen(false);
                  }}
                >
                  See all results
                </button>
              </div>
            )}
          </div>
        )}

        <div style={styles.actions}>
          <ThemeSwitch isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
          {token ? (
            <>
              <div
                className={badgeClassName}
                style={{ ...styles.statusBadge, ...premiumBadgeStyle }}
              >
                {user?.premiumAIAccess ? 'Premium' : 'Free'}
              </div>
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
                    presenceMode={user?.presenceMode || (user?.isOnline ? 'online' : 'offline')}
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
                        navigate("/settings");
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
  searchContainer: {
    position: "relative",
    minWidth: 360,
    maxWidth: 520,
    flex: "1 1 420px",
    marginLeft: 12,
  },
  searchInput: {
    width: "100%",
    borderRadius: 0.5,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text)",
    padding: "10px 14px",
    fontSize: 14,
    outline: "none",
    boxShadow: "none",
  },
  searchResults: {
    position: "absolute",
    top: "calc(100% + 10px)",
    left: 0,
    right: 0,
    zIndex: 1002,
    backgroundColor: "var(--surface-strong)",
    border: "1px solid var(--border)",
    borderRadius: 0.5,
    boxShadow: "none",
    overflow: "hidden",
    maxHeight: 320,
    overflowY: "auto",
  },
  searchResultItem: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    border: "none",
    borderBottom: "1px solid var(--border)",
    borderRadius: 0.5,
    background: "var(--surface-strong)",
    color: "var(--text)",
    cursor: "pointer",
    textAlign: "left",
  },
  searchResultAvatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    objectFit: "cover",
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  searchMoreButton: {
    width: "100%",
    padding: "10px 14px",
    textAlign: "center",
    border: "none",
    borderTop: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--primary)",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
    borderRadius: 0.5,
  },
  searchResultText: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: 700,
    color: "var(--text-h)",
  },
  searchResultMeta: {
    fontSize: 12,
    color: "var(--text-secondary)",
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
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 12px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    color: '#fff',
    backgroundColor: '#6b7280',
    border: '1px solid rgba(255,255,255,0.12)',
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
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--text-h)'
  },
};

