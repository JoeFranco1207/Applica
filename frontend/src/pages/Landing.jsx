import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../contexts/ThemeContext";
import ThemeSwitch from "../components/ThemeSwitch";

export default function Landing() {
  const [userMenuOpen, setUserMenuOpen] =
    useState(false);

  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  const isAuthenticated =
    !!localStorage.getItem("token");

  const userData = isAuthenticated
    ? JSON.parse(localStorage.getItem("user") || "{}")
    : null;

  const userName = userData?.name || "User";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUserMenuOpen(false);

    navigate("/");

    window.location.reload();
  };

  return (
    <div style={{
      ...styles.container,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
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

            {isAuthenticated ? (
              <>
                <button
                  style={
                    styles.createButton
                  }
                  onClick={() =>
                    navigate("/create")
                  }
                >
                  Create+
                </button>

                <div
                  style={
                    styles.profileMenu
                  }
                >
                  <button
                    style={
                      styles.profileButton
                    }
                    onClick={() =>
                      setUserMenuOpen(
                        !userMenuOpen
                      )
                    }
                  >
                    <span
                      style={
                        styles.profileIcon
                      }
                    >
                      ⋯
                    </span>
                  </button>

                  {userMenuOpen && (
                    <div
                      style={{
                        ...styles.dropdown,
                        backgroundColor: isDarkMode ? "#2a2a2a" : "#ffffff",
                        borderColor: isDarkMode ? "#444" : "#e0e0e0",
                      }}
                    >
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
                        onClick={
                          handleLogout
                        }
                        style={{
                          ...styles.dropdownItem,
                          color:
                            "#ff4757",
                          borderBottom:
                            "none",
                        }}
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                style={
                  styles.loginButton
                }
                onClick={() =>
                  navigate("/auth")
                }
              >
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={styles.heroSection}>
        <div style={styles.heroContent}>
          <h1 style={{
            ...styles.heroTitle,
            color: isDarkMode ? "#ffffff" : "#000",
          }}>
            Welcome to Your
            Professional Journey
          </h1>

          <p style={{
            ...styles.heroSubtitle,
            color: isDarkMode ? "#aaa" : "#666",
          }}>
            Discover amazing job
            opportunities and connect
            with leading companies
          </p>

          <div
            style={styles.heroButtons}
          >
            <button
              style={
                styles.primaryButton
              }
              onClick={() => navigate("/explore")}
            >
              Explore Jobs
            </button>

            <button
              style={
                styles.secondaryButton
              }
              onClick={() => {
                if (
                  isAuthenticated
                ) {
                  navigate("/create");
                } else {
                  navigate("/auth");
                }
              }}
            >
              {isAuthenticated
                ? "Complete Profile"
                : "Get Started"}
            </button>
          </div>
        </div>

        <div style={styles.heroImage}>
          <div
            style={
              styles.imagePlaceholder
            }
          >
            <span
              style={
                styles.placeholderText
              }
            >
            

            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        style={{
          ...styles.featuresSection,
          backgroundColor: isDarkMode ? "#2a2a2a" : "#f8fafc",
        }}
      >
        <h2 style={{
          ...styles.sectionTitle,
          color: isDarkMode ? "#ffffff" : "#000",
        }}>
          Why Choose Applica?
        </h2>

        <div style={styles.featuresGrid}>
          <FeatureCard
            title="Find Perfect Jobs"
            description="Discover job opportunities tailored to your skills and preferences."
            isDarkMode={isDarkMode}
          />

          <FeatureCard
            title="Connect with Companies"
            description="Build relationships with leading organizations and recruiters."
            isDarkMode={isDarkMode}
          />

          <FeatureCard
            title="Grow Your Career"
            description="Access resources and guidance to advance your professional journey."
            isDarkMode={isDarkMode}
          />

          <FeatureCard
            title="Easy Applications"
            description="Apply to multiple jobs quickly using your profile."
            isDarkMode={isDarkMode}
          />
        </div>
      </section>

      {/* Jobs */}
      <section style={styles.jobsSection}>
        <h2 style={{
          ...styles.sectionTitle,
          color: isDarkMode ? "#ffffff" : "#000",
        }}>
          Trending Jobs
        </h2>

        <p style={{
          ...styles.sectionDescription,
          color: isDarkMode ? "#d1d5db" : "#4b5563",
        }}>
          Do you know the jobs? Discover popular openings and explore a feed of the best roles on the market.
        </p>

        <div style={styles.jobsList}>
          <JobCard
            title="Senior React Developer"
            company="Tech Innovations Inc"
            location="Manila, NCR"
            salary="₱150,000 - ₱180,000"
            isDarkMode={isDarkMode}
          />

          <JobCard
            title="UX/UI Designer"
            company="Creative Studios"
            location="Quezon City, NCR"
            salary="₱100,000 - ₱130,000"
            isDarkMode={isDarkMode}
          />

          <JobCard
            title="Data Analyst"
            company="Analytics Pro"
            location="Makati, NCR"
            salary="₱120,000 - ₱150,000"
            isDarkMode={isDarkMode}
          />

          <JobCard
            title="Full Stack Developer"
            company="Web Solutions Ltd"
            location="Cebu, Cebu"
            salary="₱140,000 - ₱170,000"
            isDarkMode={isDarkMode}
          />
        </div>

        <div style={styles.viewAllButton}>
          <button
            style={
              styles.primaryButton
            }
            onClick={() => navigate("/explore")}
          >
            View All Jobs
          </button>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        ...styles.ctaSection,
        background: isDarkMode 
          ? "linear-gradient(135deg, #0a1a3a 0%, #1a3a5a 100%)"
          : "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
      }}>
        <div style={styles.ctaContent}>
          <h2 style={styles.ctaTitle}>
            Ready to Land Your Dream
            Job?
          </h2>

          <p style={styles.ctaText}>
            Complete your profile and
            start applying today.
          </p>

          <button
            style={styles.ctaButton}
            onClick={() => {
              if (
                isAuthenticated
              ) {
                navigate("/create");
              } else {
                navigate("/auth");
              }
            }}
          >
            {isAuthenticated
              ? "Complete Your Profile"
              : "Get Started Now"}
          </button>
        </div>
      </section>

      {userData?.role === "employer" && (
        <button
          style={styles.fab}
          onClick={() => navigate("/create/job")}
          title="Post Job"
        >
          +
        </button>
      )}

      {/* Footer */}
      <footer style={{
        ...styles.footer,
        backgroundColor: isDarkMode ? "#000000" : "#0f172a",
      }}>
        <div style={styles.footerContent}>
          <div
            style={styles.footerSection}
          >
            <h4
              style={styles.footerTitle}
            >
              About Applica
            </h4>

            <p style={{
              ...styles.footerText,
              color: isDarkMode ? "#999" : "rgba(255,255,255,0.7)",
            }}>
              Connecting talented
              professionals with
              leading companies.
            </p>
          </div>

          <div
            style={styles.footerSection}
          >
            <h4
              style={styles.footerTitle}
            >
              Quick Links
            </h4>

            <ul
              style={styles.footerLinks}
            >
              <li>
                <a
                  href="#"
                  style={{
                    ...styles.footerLink,
                    color: isDarkMode ? "#999" : "rgba(255,255,255,0.7)",
                  }}
                >
                  Browse Jobs
                </a>
              </li>

              <li>
                <a
                  href="#"
                  style={{
                    ...styles.footerLink,
                    color: isDarkMode ? "#999" : "rgba(255,255,255,0.7)",
                  }}
                >
                  Companies
                </a>
              </li>

              <li>
                <a
                  href="#"
                  style={{
                    ...styles.footerLink,
                    color: isDarkMode ? "#999" : "rgba(255,255,255,0.7)",
                  }}
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div
            style={styles.footerSection}
          >
            <h4
              style={styles.footerTitle}
            >
              Connect With Us
            </h4>

            <div
              style={styles.socialLinks}
            >
              <a
                href="#"
                style={{
                  ...styles.socialLink,
                  backgroundColor: isDarkMode 
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(255,255,255,0.1)",
                }}
              >
                f
              </a>

              <a
                href="#"
                style={{
                  ...styles.socialLink,
                  backgroundColor: isDarkMode 
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(255,255,255,0.1)",
                }}
              >
                𝕏
              </a>

              <a
                href="#"
                style={{
                  ...styles.socialLink,
                  backgroundColor: isDarkMode 
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(255,255,255,0.1)",
                }}
              >
                in
              </a>
            </div>
          </div>
        </div>

        <div style={{
          ...styles.footerBottom,
          borderColor: isDarkMode 
            ? "rgba(255,255,255,0.1)"
            : "rgba(255,255,255,0.1)",
          color: isDarkMode ? "#666" : "rgba(255,255,255,0.6)",
        }}>
          <p>
            © 2026 Applica. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  isDarkMode,
}) {
  return (
    <div style={{
      ...styles.featureCard,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
      boxShadow: isDarkMode
        ? "0 4px 20px rgba(0,0,0,0.3)"
        : "0 4px 20px rgba(0,0,0,0.05)",
    }}>
      <h3 style={{
        ...styles.featureTitle,
        color: isDarkMode ? "#ffffff" : "#000",
      }}>
        {title}
      </h3>

      <p
        style={{
          ...styles.featureDescription,
          color: isDarkMode ? "#aaa" : "#666",
        }}
      >
        {description}
      </p>
    </div>
  );
}

function JobCard({
  title,
  company,
  location,
  salary,
  isDarkMode,
}) {
  return (
    <div style={{
      ...styles.jobCard,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
      borderColor: isDarkMode ? "#444" : "#e0e0e0",
    }}>
      <div style={styles.jobCardHeader}>
        <h3 style={{
          ...styles.jobTitle,
          color: isDarkMode ? "#ffffff" : "#000",
        }}>
          {title}
        </h3>

        <button
          style={styles.saveButton}
        >
          Save
        </button>
      </div>

      <p style={{
        ...styles.jobCompany,
        color: "#2563eb",
      }}>
        {company}
      </p>

      <div style={styles.jobDetails}>
        <span
          style={{
            ...styles.jobLocation,
            color: isDarkMode ? "#999" : "#666",
          }}
        >
          {location}
        </span>

        <span
          style={{
            ...styles.jobSalary,
            color: isDarkMode ? "#eee" : "#000",
          }}
        >
          {salary}
        </span>
      </div>

      <button
        style={styles.applyButton}
      >
        Apply Now
      </button>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#ffffff",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  navbar: {
    backgroundColor: "#ffffff",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },

  navContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "16px 30px",
    display: "flex",
    justifyContent:
      "space-between",
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

  createButton: {
    background:
      "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
    border: "none",
    borderRadius: "12px",
    padding: "10px 24px",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
  },

  loginButton: {
    background: "transparent",
    border: "2px solid #2563eb",
    borderRadius: "12px",
    padding: "10px 24px",
    color: "#2563eb",
    fontWeight: "700",
    cursor: "pointer",
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
    border:
      "1px solid #e0e0e0",
    borderRadius: "12px",
    boxShadow:
      "0 4px 20px rgba(0,0,0,0.1)",
    minWidth: "180px",
    overflow: "hidden",
  },

  dropdownItem: {
    width: "100%",
    padding: "12px 16px",
    background: "none",
    border: "none",
    borderBottom:
      "1px solid #f0f0f0",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "14px",
    color: "#333",
  },

  heroSection: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "80px 30px",
    display: "flex",
    alignItems: "center",
    gap: "60px",
  },

  heroContent: {
    flex: 1,
  },

  heroTitle: {
    fontSize: "52px",
    fontWeight: "800",
    color: "#000",
    marginBottom: "20px",
    lineHeight: "1.2",
  },

  heroSubtitle: {
    fontSize: "18px",
    color: "#666",
    marginBottom: "32px",
    lineHeight: "1.6",
  },

  heroButtons: {
    display: "flex",
    gap: "16px",
  },

  primaryButton: {
    padding: "14px 32px",
    border: "none",
    borderRadius: "12px",
    background:
      "linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },

  secondaryButton: {
    padding: "14px 32px",
    border:
      "2px solid #2563eb",
    borderRadius: "12px",
    background: "transparent",
    color: "#2563eb",
    fontWeight: "700",
    cursor: "pointer",
  },

  heroImage: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
  },

  imagePlaceholder: {
    width: "100%",
    height: "400px",
    background:
      "linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)",
    borderRadius: "24px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  placeholderText: {
    fontSize: "100px",
  },

  featuresSection: {
    backgroundColor: "#f8fafc",
    padding: "80px 30px",
  },

  sectionTitle: {
    fontSize: "42px",
    fontWeight: "800",
    textAlign: "center",
    marginBottom: "16px",
  },

  sectionDescription: {
    maxWidth: "720px",
    margin: "0 auto 40px auto",
    fontSize: "18px",
    lineHeight: "1.6",
    textAlign: "center",
  },

  featuresGrid: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "30px",
  },

  featureCard: {
    backgroundColor: "#ffffff",
    padding: "30px",
    borderRadius: "16px",
    boxShadow:
      "0 4px 20px rgba(0,0,0,0.05)",
    textAlign: "center",
  },

  featureTitle: {
    fontSize: "20px",
    fontWeight: "700",
    marginBottom: "12px",
  },

  featureDescription: {
    color: "#666",
    lineHeight: "1.6",
  },

  jobsSection: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "80px 30px",
  },

  jobsList: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "24px",
    marginBottom: "40px",
  },

  jobCard: {
    padding: "24px",
    border:
      "1.5px solid #e0e0e0",
    borderRadius: "16px",
  },

  jobCardHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    marginBottom: "12px",
  },

  jobTitle: {
    fontSize: "18px",
    fontWeight: "700",
    margin: 0,
  },

  saveButton: {
    background: "none",
    border: "none",
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: "600",
  },

  jobCompany: {
    color: "#2563eb",
    fontWeight: "600",
  },

  jobDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    margin: "16px 0",
  },

  jobLocation: {
    color: "#666",
  },

  jobSalary: {
    fontWeight: "700",
  },

  applyButton: {
    width: "100%",
    padding: "12px",
    border:
      "2px solid #2563eb",
    borderRadius: "10px",
    background: "transparent",
    color: "#2563eb",
    fontWeight: "700",
    cursor: "pointer",
  },

  viewAllButton: {
    textAlign: "center",
  },

  ctaSection: {
    background:
      "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
    padding: "80px 30px",
    textAlign: "center",
  },

  ctaContent: {
    maxWidth: "600px",
    margin: "0 auto",
  },

  ctaTitle: {
    fontSize: "42px",
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: "20px",
  },

  ctaText: {
    color:
      "rgba(255,255,255,0.9)",
    marginBottom: "32px",
    fontSize: "18px",
  },

  ctaButton: {
    padding: "16px 40px",
    border: "none",
    borderRadius: "12px",
    background: "#ffffff",
    color: "#2563eb",
    fontWeight: "700",
    cursor: "pointer",
  },

  footer: {
    backgroundColor: "#0f172a",
    color: "#ffffff",
  },

  footerContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "60px 30px",
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "40px",
  },

  footerSection: {},

  footerTitle: {
    marginBottom: "16px",
    fontWeight: "700",
  },

  footerText: {
    color:
      "rgba(255,255,255,0.7)",
    lineHeight: "1.6",
  },

  footerLinks: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },

  footerLink: {
    color:
      "rgba(255,255,255,0.7)",
    textDecoration: "none",
    display: "block",
    marginBottom: "8px",
  },

  socialLinks: {
    display: "flex",
    gap: "16px",
  },

  socialLink: {
    width: "40px",
    height: "40px",
    backgroundColor:
      "rgba(255,255,255,0.1)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    color: "#ffffff",
  },

  footerBottom: {
    borderTop:
      "1px solid rgba(255,255,255,0.1)",
    textAlign: "center",
    padding: "24px",
    color:
      "rgba(255,255,255,0.6)",
  },

  fab: {
    position: "fixed",
    left: "24px",
    bottom: "24px",
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "36px",
    cursor: "pointer",
    boxShadow: "0 16px 40px rgba(37, 99, 235, 0.25)",
    zIndex: 50,
  },
};