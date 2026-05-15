import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../contexts/ThemeContext";
import ThemeSwitch from "../components/ThemeSwitch";
import axios from "axios";

export default function Profile() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      try {
        const response = await axios.get("http://localhost:3000/api/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          setUser(response.data.data);
          // Update localStorage with fresh data
          localStorage.setItem("user", JSON.stringify(response.data.data));
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        // Fallback to localStorage if API fails
        const userData = localStorage.getItem("user");
        if (userData) {
          try {
            setUser(JSON.parse(userData));
          } catch (parseError) {
            console.error("Error parsing user data:", parseError);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUserMenuOpen(false);
    navigate("/");
    window.location.reload();
  };

  if (loading) {
    return (
      <div style={{
        ...styles.container,
        backgroundColor: isDarkMode ? "#1a1a1a" : "#f8fafc",
      }}>
        <p style={{ color: isDarkMode ? "#fff" : "#000" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{
      ...styles.container,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f8fafc",
      color: isDarkMode ? "#ffffff" : "#000",
    }}>
      {/* Navbar */}
      <nav style={{
        ...styles.navbar,
        backgroundColor: isDarkMode ? "#0f0f0f" : "#ffffff",
      }}>
        <div style={styles.navContent}>
          <div
            style={styles.logo}
            onClick={() => navigate("/")}
          >
            <img
              src="/src/assets/Applica_Logo.png"
              alt="Applica"
              style={styles.logoImage}
            />
            <span style={styles.logoText}>
              Applica
            </span>
          </div>

          <div style={styles.navLinks}>
            <a
              href="#"
              style={{
                ...styles.navLink,
                color: isDarkMode ? "#ccc" : "#666",
              }}
            >
              Browse Jobs
            </a>
            <a
              href="#"
              style={{
                ...styles.navLink,
                color: isDarkMode ? "#ccc" : "#666",
              }}
            >
              Companies
            </a>
            <a
              href="#"
              style={{
                ...styles.navLink,
                color: isDarkMode ? "#ccc" : "#666",
              }}
            >
              Resources
            </a>
          </div>

          <div style={styles.navActions}>
            <ThemeSwitch 
              isDarkMode={isDarkMode} 
              toggleTheme={toggleTheme} 
            />

            <div style={styles.profileMenu}>
              <button
                style={styles.profileButton}
                onClick={() =>
                  setUserMenuOpen(!userMenuOpen)
                }
              >
                <span style={styles.profileIcon}>
                  ⋯
                </span>
              </button>

              {userMenuOpen && (
                <div style={{
                  ...styles.dropdown,
                  backgroundColor: isDarkMode ? "#2a2a2a" : "#ffffff",
                  borderColor: isDarkMode ? "#444" : "#e0e0e0",
                }}>
                  <button
                    style={{
                      ...styles.dropdownItem,
                      color: isDarkMode ? "#ccc" : "#333",
                      borderColor: isDarkMode ? "#444" : "#f0f0f0",
                    }}
                    onClick={() =>
                      navigate("/profile")
                    }
                  >
                    My Profile
                  </button>
                  <button
                    style={{
                      ...styles.dropdownItem,
                      color: isDarkMode ? "#ccc" : "#333",
                      borderColor: isDarkMode ? "#444" : "#f0f0f0",
                    }}
                  >
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    style={{
                      ...styles.dropdownItem,
                      color: "#ff4757",
                      borderBottom: "none",
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div style={styles.mainContent}>
        <div style={{
          ...styles.profileContainer,
          backgroundColor: isDarkMode ? "#0f0f0f" : "#ffffff",
        }}>
          <div style={{
            ...styles.profileHeader,
            background: isDarkMode
              ? "linear-gradient(135deg, #0a1a3a 0%, #1a3a5a 100%)"
              : "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
          }}>
            <div style={styles.profileImageContainer}>
              <div style={{
                ...styles.profileImage,
                backgroundColor: isDarkMode
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(255,255,255,0.3)",
              }}>
                {user?.firstName ? user.firstName.charAt(0).toUpperCase() : "U"}
              </div>
            </div>

            <div style={styles.profileInfo}>
              <h1 style={{
                ...styles.profileName,
                color: "#ffffff",
              }}>
                {user ? `${user.firstName} ${user.lastName}` : "User Profile"}
              </h1>
              <p style={{
                ...styles.profileEmail,
                color: "rgba(255,255,255,0.9)",
              }}>
                {user?.email || "No email provided"}
              </p>
              <p style={{
                ...styles.profileRole,
                color: "rgba(255,255,255,0.8)",
              }}>
                {user?.role === "employer" ? "Employer" : user?.role === "jobseeker" ? "Job Seeker" : "User"}
              </p>
            </div>

            <button
              style={styles.editButton}
              onClick={() => {
                if (user?.role === "employer") {
                  navigate("/create/employer");
                } else {
                  navigate("/create/jobseeker");
                }
              }}
            >
              Edit Profile
            </button>
          </div>

          <div style={{
            ...styles.profileSection,
            borderColor: isDarkMode ? "#333" : "#f0f0f0",
            backgroundColor: isDarkMode ? "#0f0f0f" : "#ffffff",
          }}>
            <h2 style={{
              ...styles.sectionTitle,
              color: isDarkMode ? "#ffffff" : "#000",
            }}>
              Account Details
            </h2>

            <div style={styles.detailsGrid}>
              <div style={styles.detailItem}>
                <label style={{
                  ...styles.detailLabel,
                  color: "#2563eb",
                }}>
                  Full Name
                </label>
                <p style={{
                  ...styles.detailValue,
                  color: isDarkMode ? "#ccc" : "#333",
                }}>
                  {user ? `${user.firstName} ${user.lastName}` : "Not provided"}
                </p>
              </div>

              <div style={styles.detailItem}>
                <label style={{
                  ...styles.detailLabel,
                  color: "#2563eb",
                }}>
                  Email
                </label>
                <p style={{
                  ...styles.detailValue,
                  color: isDarkMode ? "#ccc" : "#333",
                }}>
                  {user?.email || "Not provided"}
                </p>
              </div>

              <div style={styles.detailItem}>
                <label style={{
                  ...styles.detailLabel,
                  color: "#2563eb",
                }}>
                  Account Type
                </label>
                <p style={{
                  ...styles.detailValue,
                  color: isDarkMode ? "#ccc" : "#333",
                }}>
                  {user?.role === "employer"
                    ? "Employer"
                    : "Job Seeker"}
                </p>
              </div>

              <div style={styles.detailItem}>
                <label style={{
                  ...styles.detailLabel,
                  color: "#2563eb",
                }}>
                  Member Since
                </label>
                <p style={{
                  ...styles.detailValue,
                  color: isDarkMode ? "#ccc" : "#333",
                }}>
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "Not available"}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            ...styles.profileSection,
            borderColor: isDarkMode ? "#333" : "#f0f0f0",
            backgroundColor: isDarkMode ? "#0f0f0f" : "#ffffff",
          }}>
            <h2 style={{
              ...styles.sectionTitle,
              color: isDarkMode ? "#ffffff" : "#000",
            }}>
              Profile Status
            </h2>

            <div style={styles.statusContainer}>
              <div style={styles.statusItem}>
                <span style={{
                  ...styles.statusLabel,
                  color: isDarkMode ? "#fff" : "#333",
                }}>
                  Profile Completion
                </span>
                <div style={{
                  ...styles.progressBar,
                  backgroundColor: isDarkMode ? "#333" : "#e0e0e0",
                }}>
                  <div
                    style={
                      styles.progressFill
                    }
                  ></div>
                </div>
                <span style={{
                  ...styles.statusValue,
                  color: isDarkMode ? "#999" : "#666",
                }}>
                  {user?.profileComplete
                    ? "100%"
                    : "Incomplete"}
                </span>
              </div>
            </div>
          </div>

          <div style={styles.actionsContainer}>
            <button
              style={styles.secondaryButton}
              onClick={() => navigate("/")}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  navbar: {
    backgroundColor: "#ffffff",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },

  navContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "16px 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
  },

  logoImage: {
    width: "40px",
    height: "40px",
  },

  logoText: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#2563eb",
  },

  navLinks: {
    display: "flex",
    gap: "40px",
    flex: 1,
    marginLeft: "60px",
  },

  navLink: {
    textDecoration: "none",
    color: "#666",
    fontWeight: "600",
    fontSize: "14px",
  },

  navActions: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },

  profileMenu: {
    position: "relative",
  },

  profileButton: {
    background:
      "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
    border: "none",
    borderRadius: "50%",
    width: "44px",
    height: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  profileIcon: {
    color: "#ffffff",
    fontSize: "22px",
  },

  dropdown: {
    position: "absolute",
    top: "54px",
    right: 0,
    backgroundColor: "#ffffff",
    border: "1px solid #e0e0e0",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    minWidth: "180px",
    overflow: "hidden",
  },

  dropdownItem: {
    width: "100%",
    padding: "12px 16px",
    background: "none",
    border: "none",
    borderBottom: "1px solid #f0f0f0",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "14px",
    color: "#333",
  },

  mainContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 30px",
  },

  profileContainer: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    overflow: "hidden",
  },

  profileHeader: {
    padding: "40px",
    background:
      "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    gap: "30px",
  },

  profileImageContainer: {
    flex: "0 0 auto",
  },

  profileImage: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    backgroundColor:
      "rgba(255,255,255,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "48px",
    fontWeight: "800",
    border: "3px solid rgba(255,255,255,0.5)",
  },

  profileInfo: {
    flex: 1,
  },

  profileName: {
    fontSize: "32px",
    fontWeight: "800",
    margin: "0 0 8px 0",
  },

  profileEmail: {
    fontSize: "16px",
    margin: "0 0 4px 0",
    opacity: 0.9,
  },

  profileRole: {
    fontSize: "14px",
    opacity: 0.8,
    margin: 0,
  },

  editButton: {
    padding: "12px 28px",
    border: "2px solid rgba(255,255,255,0.5)",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.15)",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "14px",
  },

  profileSection: {
    padding: "40px",
    borderBottom: "1px solid #f0f0f0",
  },

  sectionTitle: {
    fontSize: "24px",
    fontWeight: "700",
    marginBottom: "24px",
    color: "#000",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "30px",
  },

  detailItem: {
    display: "flex",
    flexDirection: "column",
  },

  detailLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#2563eb",
    textTransform: "uppercase",
    marginBottom: "8px",
  },

  detailValue: {
    fontSize: "16px",
    color: "#333",
    margin: 0,
  },

  statusContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  statusItem: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  statusLabel: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#333",
  },

  progressBar: {
    width: "100%",
    height: "8px",
    backgroundColor: "#e0e0e0",
    borderRadius: "4px",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    width: "75%",
    background:
      "linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)",
    borderRadius: "4px",
  },

  statusValue: {
    fontSize: "14px",
    color: "#666",
  },

  actionsContainer: {
    padding: "40px",
    display: "flex",
    gap: "16px",
    justifyContent: "flex-end",
  },

  secondaryButton: {
    padding: "12px 28px",
    border: "2px solid #2563eb",
    borderRadius: "12px",
    background: "transparent",
    color: "#2563eb",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "14px",
  },
};
