import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from '../../contexts/ThemeContext';

const ProfileSelection = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext);
  // Theme-based inline style overrides used by this page
  const themeStyles = isDarkMode
    ? {
        containerBg: 'linear-gradient(to bottom right, #0f172a, #071125, #111827)',
        glow1Bg: 'rgba(59,130,246,0.12)',
        glow2Bg: 'rgba(168,85,247,0.08)',
        textColor: '#e6eef6',
        subtitleColor: '#cbd5e1',
        cardBg: 'rgba(255,255,255,0.04)',
        cardBorder: '1px solid rgba(148,163,184,0.06)',
        cardBoxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        featureBg: 'rgba(255,255,255,0.02)',
        primaryBtnBg: 'linear-gradient(to right, #275791, #1892aa)',
        secondaryBtnBg: 'rgba(255,255,255,0.06)'
      }
    : {
        containerBg: 'linear-gradient(to bottom right, #ffffff, #f8fafc)',
        glow1Bg: 'rgba(59,130,246,0.08)',
        glow2Bg: 'rgba(168,85,247,0.06)',
        textColor: '#0f172a',
        subtitleColor: '#475569',
        cardBg: 'linear-gradient(180deg, #ffffff, #f8fafc)',
        cardBorder: '1px solid rgba(15,23,42,0.06)',
        cardBoxShadow: '0 10px 40px rgba(15,23,42,0.06)',
        featureBg: 'rgba(15,23,42,0.04)',
        primaryBtnBg: 'linear-gradient(to right, #275791, #1892aa)',
        secondaryBtnBg: 'rgba(15,23,42,0.04)'
      };
  const safeGetStoredUser = () => {
    const raw = localStorage.getItem("user");
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.warn("Failed to parse stored user, clearing invalid data:", raw, error);
      // remove invalid value to avoid repeated failures
      localStorage.removeItem("user");
      return {};
    }
  };
  const [selectedRole, setSelectedRole] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState({});

  useEffect(() => {
    // Check if user already has a role
    const user = safeGetStoredUser();
    if (user.role) {
      // Redirect based on existing role
      if (user.role === "jobseeker") {
        navigate("/create/jobseeker");
      } else if (user.role === "employer") {
        navigate("/create/employer");
      }
    }
  }, [navigate]);

  const getInitialProfileData = (role) => {
    if (role === "employer") {
      return {
        companyName: "",
        companyDescription: "",
        companySize: "",
        contactNumber: "",
        dateEstablished: "",
        companyLogo: "",
        location: {
          region: "",
          city: "",
          barangay: "",
          otherDetails: "",
          coords: null,
        },
        industry: "",
        website: "",
      };
    }

    return {
      bio: "",
      experience: "",
      education: "",
      citizenShip: "",
      resume: "",
      skills: "",
      certifications: "",
      portfolioLinks: "",
      socialLinks: {
        github: "",
        linkedin: "",
        twitter: "",
      },
      location: {
        region: "",
        city: "",
        barangay: "",
        otherDetails: "",
        coords: null,
      },
    };
  };

  const computeProgress = (data, roleToUse = selectedRole) => {
    if (!data) return 0;
    const role = typeof roleToUse === 'string' ? roleToUse.toLowerCase() : roleToUse;

    const locationComplete = Boolean(
      (data.location?.coords?.lat && data.location?.coords?.lng) ||
      (data.location?.region && data.location?.city && data.location?.barangay)
    );

    const normalize = (value) => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return !Number.isNaN(value);
      return Boolean(value);
    };

    const fields = role === 'employer'
      ? [
          data.companyName,
          data.companyDescription,
          data.companySize,
          data.industry,
          data.website,
          data.contactNumber,
          data.dateEstablished,
          locationComplete,
        ]
      : [
          data.bio,
          data.citizenShip,
          data.experience,
          data.education,
          data.skills,
          data.resume,
          locationComplete,
        ];

    const filled = fields.reduce(
      (count, value) => count + (normalize(value) ? 1 : 0),
      0
    );
    return fields.length ? Math.round((filled / fields.length) * 100) : 0;
  };

  const handleContinue = () => {
    if (selectedRole) {
      setProfileData(getInitialProfileData(selectedRole));
      setProfileError(null);
      setShowProfileModal(true);
    }
  };

  const profileProgress = computeProgress(profileData, selectedRole);

  const handleSaveProfile = async () => {
    try {
      setProfileLoading(true);
      setProfileError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setProfileError("Authentication required. Please log in again.");
        return;
      }

      if (profileProgress < 100) {
        setProfileError(
          `Please complete your ${selectedRole === "employer" ? "Employer" : "Jobseeker"} profile before saving. Progress: ${profileProgress}%`
        );
        return;
      }

      const roleResponse = await fetch("http://localhost:8000/api/auth/select-role", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!roleResponse.ok) {
        const message = await roleResponse.text();
        if (roleResponse.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setProfileError("Session expired or invalid. Please log in again.");
          navigate('/auth');
          return;
        }
        setProfileError(message || "Failed to select role.");
        return;
      }

      const profileUrl = selectedRole === "employer"
        ? "http://localhost:8000/api/employer/profile"
        : "http://localhost:8000/api/jobseeker/profile";

      const profileBody = selectedRole === "employer"
        ? {
            companyName: profileData.companyName,
            companyDescription: profileData.companyDescription,
            companySize: profileData.companySize,
            contactNumber: profileData.contactNumber,
            dateEstablished: profileData.dateEstablished,
            companyLocation: profileData.location,
            industry: profileData.industry,
            website: profileData.website,
            companyLogo: profileData.companyLogo || "",
          }
        : {
            bio: profileData.bio,
            experience: profileData.experience,
            education: profileData.education,
            citizenShip: profileData.citizenShip,
            location: profileData.location,
            resume: profileData.resume,
            skills: profileData.skills,
            certifications: profileData.certifications,
            portfolioLinks: profileData.portfolioLinks,
            socialLinks: profileData.socialLinks,
          };

      const profileResponse = await fetch(profileUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileBody),
      });

      const responseText = await profileResponse.text();
      let profileResult;
      try {
        profileResult = JSON.parse(responseText);
      } catch {
        profileResult = { message: responseText };
      }

      if (!profileResponse.ok) {
        setProfileError(profileResult.message || "Failed to save profile.");
        return;
      }

      try {
        const refreshResponse = await fetch("http://localhost:8000/api/auth/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData?.data) {
            localStorage.setItem("user", JSON.stringify(refreshData.data));
          }
        } else {
          const errorText = await refreshResponse.text();
          console.warn("Unable to refresh authenticated user after profile save:", errorText);
        }
      } catch (e) {
        console.warn("Error refreshing user after profile save:", e);
      }

      setShowProfileModal(false);
      navigate("/profile");
    } catch (error) {
      console.error(error);
      setProfileError("Something went wrong while saving your profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleBack = () => {
    const storedUser = safeGetStoredUser();
    if (!storedUser.role || storedUser.role === "user") {
      setProfileError(
        "Please finish your profile setup before navigating away. Your role and profile information must be completed."
      );
      return;
    }
    navigate("/");
  };

  return (
    <div className="page-container" style={{ ...styles.container, background: themeStyles.containerBg, color: 'var(--text)' }}>
      {/* BACKGROUND GLOW */}
      <div style={{ ...styles.glow1, background: themeStyles.glow1Bg }}></div>
      <div style={{ ...styles.glow2, background: themeStyles.glow2Bg }}></div>

      {/* MAIN */}
      <div style={styles.main}>
        <div style={styles.heroSection}>
          <h1 style={{ ...styles.title, color: 'var(--text-h)' }}>
            Choose Your Profile Type
          </h1>

          <p style={{ ...styles.subtitle, color: 'var(--muted)' }}>
            Select how you want to use
            Applica
          </p>
        </div>

        {/* CARDS */}
        <div style={styles.cardsContainer}>
          {/* JOB SEEKER */}
          <div
            style={{
              ...styles.card,
              background: 'var(--surface)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-strong)',
              color: 'var(--text)',
              ...(selectedRole === "jobseeker" && styles.selectedCard),
            }}
            onClick={() =>
              setSelectedRole("jobseeker")
            }
          >
            <div style={styles.iconWrapper}>
              👨‍💻
            </div>

            <h2 style={styles.cardTitle}>
              Job Seeker
            </h2>

            <p style={{ ...styles.cardDescription, color: isDarkMode ? '#f8fbff' : '#0f172a' }}>
              Find jobs, upload resumes, and
              connect with employers.
            </p>

            <div style={styles.features}>
              <div style={styles.feature}>
                ✓ Upload Resume
              </div>

              <div style={styles.feature}>
                ✓ Apply to Jobs
              </div>

              <div style={styles.feature}>
                ✓ Track Applications
              </div>

              <div style={styles.feature}>
                ✓ Discover Opportunities
              </div>
            </div>

            {selectedRole ===
              "jobseeker" && (
              <div style={styles.selectedBadge}>
                Selected
              </div>
            )}
          </div>

          {/* EMPLOYER */}
          <div
            style={{
              ...styles.card,
              background: 'var(--surface)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-strong)',
              color: 'var(--text)',
              ...(selectedRole === "employer" && styles.selectedCardEmployer),
            }}
            onClick={() =>
              setSelectedRole("employer")
            }
          >
            <div style={styles.iconWrapper}>
              🏢
            </div>

            <h2 style={styles.cardTitle}>
              Employer
            </h2>

            <p style={{ ...styles.cardDescription, color: isDarkMode ? '#f8fbff' : '#0f172a' }}>
              Hire skilled professionals and
              manage job postings.
            </p>

            <div style={styles.features}>
              <div style={styles.feature}>
                ✓ Post Jobs
              </div>

              <div style={styles.feature}>
                ✓ Manage Applicants
              </div>

              <div style={styles.feature}>
                ✓ Build Company Profile
              </div>

              <div style={styles.feature}>
                ✓ Find Talent Fast
              </div>
            </div>

            {selectedRole ===
              "employer" && (
              <div style={styles.selectedBadge}>
                Selected
              </div>
            )}
          </div>
        </div>

        {/* BUTTONS */}
        <div style={styles.buttons}>
          <button
            style={{ ...styles.secondaryButton, background: themeStyles.secondaryBtnBg, color: 'var(--text)' }}
            onClick={handleBack}
          >
            Back to Home
          </button>

          <button
            style={{
              ...styles.primaryButton,
              background: themeStyles.primaryBtnBg,
              opacity: selectedRole ? 1 : 0.5,
              cursor: selectedRole ? "pointer" : "not-allowed",
            }}
            disabled={!selectedRole}
            onClick={handleContinue}
          >
            Continue →
          </button>
        </div>
      </div>

      {showProfileModal && (
            <div
              className="modal-overlay"
              style={{
                ...styles.modalOverlay,
                backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(15, 23, 42, 0.08)',
              }}
            >
              <div
                className="modal-card"
                style={{
                  ...styles.modalContainer,
                  width: 'min(920px, 95vw)',
                  display: 'flex',
                  gap: 24,
                  alignItems: 'center',
                  background: isDarkMode ? '#0f172a' : '#ffffff',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(15,23,42,0.08)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ flex: 1 }}>
                  <h2 style={{ ...styles.modalHeading, color: isDarkMode ? '#fff' : '#111827' }}>
                    Set up your {selectedRole === "employer" ? "Employer" : "Jobseeker"} Profile
                  </h2>
                  <div style={styles.progressBarContainer}>
                    <div style={{ ...styles.progressBarFill, width: `${profileProgress}%` }} />
                  </div>
                  <p style={{ ...styles.modalText, color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                    Complete your profile to get the best experience. Progress: {profileProgress}%
                  </p>
                  {profileError && <p style={styles.errorText}>{profileError}</p>}
                </div>

                <div style={{ width: 520 }}>
                  {/* Stepper single-field layout */}
                  <ModalStepper
                    key={selectedRole}
                    role={selectedRole}
                    data={profileData}
                    isDarkMode={isDarkMode}
                    onChange={(next) => setProfileData(next)}
                    onClose={() => setShowProfileModal(false)}
                    onSave={handleSaveProfile}
                    loading={profileLoading}
                  />
                </div>
              </div>
            </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "var(--page-bg)",
    overflow: "hidden",
    position: "relative",
    fontFamily: "Arial",
    color: "var(--text)",
  },

  glow1: {
    position: "absolute",
    width: "350px",
    height: "350px",
    background: "var(--accent)",
    borderRadius: "50%",
    top: "-120px",
    left: "-120px",
    filter: "blur(120px)",
  },

  glow2: {
    position: "absolute",
    width: "350px",
    height: "350px",
    background: "rgba(168,85,247,0.2)",
    borderRadius: "50%",
    bottom: "-120px",
    right: "-120px",
    filter: "blur(120px)",
  },

navbar: {
  width: "100%",
  padding: "20px 40px",
  position: "relative",
  zIndex: 10,
},
logoContainer: {
  maxWidth: "1300px",
  margin: "0 auto",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  position: "relative",
},

  logoWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
  },

  logoImage: {
    width: "50px",
  },

  logoText: {
    fontSize: "1.7rem",
    fontWeight: "700",
  },

backButton: {
  padding: "12px 20px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.2)",
  background: "var(--tile-bg)",
  color: "var(--text)",
  cursor: "pointer",
  backdropFilter: "blur(10px)",
  fontWeight: "600",

  position: "absolute",
  left: "20px",
  top: "20px",
},

  main: {
    position: "relative",
    zIndex: 5,
    maxWidth: "1300px",
    margin: "0 auto",
    padding: "40px 20px 80px",
  },

  heroSection: {
    textAlign: "center",
    marginBottom: "60px",
  },

  title: {
    fontSize: "4rem",
    fontWeight: "800",
    marginBottom: "20px",
    lineHeight: "1.1",
  },

  subtitle: {
    fontSize: "1.2rem",
    color: 'var(--muted)',
    maxWidth: "650px",
    margin: "0 auto",
    lineHeight: "1.7",
  },

  cardsContainer: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(350px, 1fr))",
    gap: "30px",
  },

  card: {
    position: "relative",
    padding: "40px",
    borderRadius: "28px",
    background: 'var(--surface)',
    border: '1px solid var(--border-color)',
    backdropFilter: "blur(12px)",
    transition: "0.3s ease",
    cursor: "pointer",
    boxShadow: 'var(--shadow-strong)',
  },

  selectedCard: {
    border:
      "2px solid rgba(59,130,246,0.8)",
    transform: "translateY(-8px)",
    boxShadow:
      "0 20px 50px rgba(59,130,246,0.35)",
  },

  selectedCardEmployer: {
    border:
      "2px solid rgba(16,185,129,0.8)",
    transform: "translateY(-8px)",
    boxShadow:
      "0 20px 50px rgba(16,185,129,0.35)",
  },

  iconWrapper: {
    width: "90px",
    height: "90px",
    borderRadius: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "3rem",
    background: 'var(--tile-bg)',
    marginBottom: "25px",
  },

  cardTitle: {
    fontSize: "2rem",
    fontWeight: "700",
    marginBottom: "15px",
  },

  cardDescription: {
    lineHeight: "1.8",
    marginBottom: "25px",
    fontSize: "1rem",
  },

  features: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  feature: {
    background:
      "var(--tile-bg)",
    padding: "14px 16px",
    borderRadius: "14px",
    fontSize: "0.95rem",
    color: 'var(--muted)',
  },

  selectedBadge: {
    position: "absolute",
    top: "20px",
    right: "20px",
    background:
      "linear-gradient(to right, #275791, #1892aa)",
    padding: "8px 14px",
    borderRadius: "999px",
    fontSize: "0.8rem",
    fontWeight: "700",
  },

  buttons: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    marginTop: "60px",
    flexWrap: "wrap",
  },

  primaryButton: {
    padding: "16px 34px",
    borderRadius: "14px",
    border: "none",
    background:
      "linear-gradient(to right, #275791, #1892aa)",
    color: "#fff",
    fontSize: "1rem",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow:
      "0 10px 30px rgba(59,130,246,0.4)",
  },

  secondaryButton: {
    padding: "16px 34px",
    borderRadius: "14px",
    border:
      "1px solid rgba(255,255,255,0.15)",
    background: 'var(--tile-bg)',
    color: 'var(--text)',
    fontSize: "1rem",
    fontWeight: "700",
    cursor: "pointer",
    backdropFilter: "blur(12px)",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },
  modalContainer: {
    width: "min(560px, 90vw)",
    background: 'var(--surface)',
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.35)",
    border: '1px solid var(--border-color)',
  },
  progressBarContainer: {
    position: "relative",
    background: 'rgba(255,255,255,0.06)',
    height: "12px",
    borderRadius: "999px",
    overflow: "hidden",
    marginBottom: "16px",
  },
  progressBarFill: {
    height: "100%",
    background: "linear-gradient(90deg, #275791, #10b981)",
    transition: "width 0.3s ease",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    color: 'var(--muted)',
    fontWeight: "700",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid var(--border)",
    boxShadow: "inset 0 0 0 1px var(--border)",
    background: 'var(--surface)',
    color: 'var(--text)',
    marginBottom: "16px",
    outline: "none",
    fontSize: "0.95rem",
  },
  textarea: {
    width: "100%",
    minHeight: "110px",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid var(--border)",
    boxShadow: "inset 0 0 0 1px var(--border)",
    background: 'var(--surface)',
    color: 'var(--text)',
    marginBottom: "16px",
    resize: "vertical",
    fontSize: "0.95rem",
  },
  locationGroup: {
    marginTop: "12px",
  },
  locationHeading: {
    marginBottom: "12px",
    color: 'var(--muted)',
    fontSize: "1rem",
  },
  modalHeading: {
    margin: 0,
    marginBottom: "16px",
    fontSize: "1.8rem",
    color: 'var(--text)',
  },
  modalText: {
    color: 'var(--muted)',
    marginBottom: "24px",
    lineHeight: "1.7",
  },
  modalButtons: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
  },
  cancelButton: {
    padding: "12px 18px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "transparent",
    color: 'var(--text)',
    cursor: "pointer",
  },
  confirmButton: {
    padding: "12px 18px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(90deg, #10b981, #275791)",
    color: "#fff",
    cursor: "pointer",
  },
  errorText: {
    color: "#f87171",
    marginBottom: "16px",
  },
};

// Inline stepper used inside the modal for compact single-field flow
function ModalStepper({ role, data = {}, onChange, onClose, onSave, loading, isDarkMode }) {
  // strictly use explicit role prop to decide employer vs jobseeker steps
  const isEmployer = role === 'employer';
  const [index, setIndex] = useState(0);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    setIndex(0);
    setLocationError(null);
  }, [role]);
  const employerIndustryOptions = [
    "Agriculture & Fisheries",
    "Business Process Outsourcing (BPO)",
    "Construction",
    "Creative & Media",
    "Education",
    "Energy & Utilities",
    "Engineering",
    "Finance & Banking",
    "Food & Beverage",
    "Government & Public Administration",
    "Healthcare & Pharmaceuticals",
    "Hospitality & Tourism",
    "Information Technology",
    "Insurance",
    "Legal Services",
    "Logistics & Transportation",
    "Manufacturing",
    "Marketing & Advertising",
    "Property & Real Estate",
    "Retail & Wholesale",
    "Security & Safety",
    "Telecommunications",
    "Textiles & Apparel",
    "Transportation & Automotive",
    "Wellness & Personal Care",
    "Other",
  ];

  const employerSteps = [
    { key: 'companyName', label: 'Company Name', type: 'text' },
    { key: 'companyDescription', label: 'Company Description', type: 'textarea' },
    { key: 'location', label: 'Location Setup', type: 'map' },
    { key: 'industry', label: 'Industry', type: 'select', options: employerIndustryOptions },
    { key: 'companySize', label: 'Company Size', type: 'select', options: ['1-10','11-50','51-200','201-500','501-1000','1001+'] },
    { key: 'contactDetails', label: 'Contact Details', type: 'contact' },
    { key: 'companyIdentity', label: 'Company Identity (Date Established + optional logo)', type: 'companyIdentity' },
  ];

  const jobseekerSteps = [
    { key: 'bio', label: 'Bio', type: 'textarea' },
    { key: 'citizenShip', label: 'Citizenship', type: 'select', options: ['Filipino', 'Foreign'] },
    { key: 'location', label: 'Location', type: 'map' },
    { key: 'experience', label: 'Experience', type: 'textarea' },
    { key: 'education', label: 'Education', type: 'text' },
    { key: 'skills', label: 'Skills', type: 'text' },
    { key: 'resume', label: 'Resume', type: 'file' },
    { key: 'certifications', label: 'Certifications (optional)', type: 'textarea', optional: true },
    { key: 'portfolioLinks', label: 'Portfolio Links (optional)', type: 'textarea', optional: true },
    { key: 'socialLinks.github', label: 'GitHub Profile (optional)', type: 'text', optional: true },
    { key: 'socialLinks.linkedin', label: 'LinkedIn Profile (optional)', type: 'text', optional: true },
    { key: 'socialLinks.twitter', label: 'Twitter Handle (optional)', type: 'text', optional: true },
  ];

  const steps = isEmployer ? employerSteps : jobseekerSteps;
  

  const getValue = (key) => {
    if (key === 'location') return data.location || null;
    if (!key.includes('.')) return data[key] || '';
    return key.split('.').reduce((acc, k) => (acc ? acc[k] : ''), data) || '';
  };

  const getControlStyle = () => ({
    background: 'var(--control-bg)',
    border: '1px solid var(--control-border)',
    color: 'var(--muted-text)',
  });

  const setValue = (key, value) => {
    const next = { ...data };
    if (key.includes('.')) {
      const [a, b] = key.split('.');
      next[a] = { ...(next[a] || {}), [b]: value };
    } else {
      next[key] = value;
    }
    if (onChange) onChange(next);
  };

  const isStepComplete = (currentStep) => {
    if (!currentStep) return false;

    if (currentStep.type === 'map') {
      const location = getValue('location');
      return Boolean(
        (location?.coords?.lat && location?.coords?.lng) ||
          (location?.region && location?.city && location?.barangay)
      );
    }

    if (currentStep.type === 'contact') {
      return Boolean(getValue('contactNumber') && getValue('website'));
    }

    if (currentStep.type === 'companyIdentity') {
      return Boolean(getValue('dateEstablished'));
    }

    if (currentStep.optional && !getValue(currentStep.key)) {
      return true;
    }

    return Boolean(getValue(currentStep.key));
  };

  const handleNext = () => {
    const currentStep = steps[index];
    if (!isStepComplete(currentStep)) return;
    if (index === steps.length - 1) {
      if (onSave) onSave();
      return;
    }
    setIndex((i) => i + 1);
  };
  const handleBack = () => setIndex((i) => Math.max(0, i - 1));

  const step = steps[index] || steps[0];

  return (
    <div key={step.key}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--muted-foreground)' }}>{step.label}</div>
        <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Step {index + 1} / {steps.length}</div>
      </div>
      <div>
        {step.type === 'textarea' ? (
          <div>
            <label style={styles.label}>{step.label}</label>
            <textarea
              value={getValue(step.key) || ''}
              onChange={(e) => setValue(step.key, e.target.value)}
              style={{
                ...styles.textarea,
                ...getControlStyle(),
                minHeight: step.key === 'experience' ? 220 : styles.textarea.minHeight,
              }}
            />
          </div>
        ) : step.type === 'select' ? (
          <div>
            <label style={styles.label}>{step.label}</label>
            <select
              value={getValue(step.key) || ''}
              onChange={(e) => setValue(step.key, e.target.value)}
              style={{ ...styles.input, ...getControlStyle() }}
            >
              <option value="">Select {step.label}</option>
              {step.options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ) : step.type === 'map' ? (
          <div>
            <label style={styles.label}>{step.label}</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <button
                type="button"
                onClick={() => {
                  if (!navigator.geolocation) return alert('Geolocation not supported by your browser.');
                  setLocationLoading(true);
                  setLocationError(null);
                  navigator.geolocation.getCurrentPosition((pos) => {
                    const { latitude: lat, longitude: lng } = pos.coords;
                    const existingLocation = getValue('location') || {};
                    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
                      .then((response) => response.json())
                      .then((data) => {
                        const address = data.address || {};
                        const region = address.state || address.county || address.region || '';
                        const city = address.city || address.town || address.village || address.municipality || '';
                        const barangay = address.suburb || address.neighbourhood || address.hamlet || '';
                        const otherDetails = [
                          address.road,
                          address.house_number,
                          address.postcode,
                          address.city_district,
                        ]
                          .filter(Boolean)
                          .join(', ');

                        setValue('location', {
                          ...existingLocation,
                          coords: { lat, lng },
                          region,
                          city,
                          barangay,
                          otherDetails: otherDetails || data.display_name || `${lat},${lng}`,
                        });
                      })
                      .catch(() => {
                        setLocationError('Unable to resolve your address automatically. Please enter it manually.');
                      })
                      .finally(() => setLocationLoading(false));
                  }, () => {
                    setLocationLoading(false);
                    setLocationError('Unable to retrieve your location. Please allow location access.');
                  });
                }}
                style={styles.confirmButton}
                disabled={locationLoading}
              >
                {locationLoading ? 'Finding address…' : 'Use my current location'}
              </button>

              <button
                type="button"
                onClick={() => {
                  const loc = getValue('location');
                  const coords = loc && loc.coords;
                  const url = coords ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}` : 'https://www.google.com/maps';
                  window.open(url, '_blank');
                }}
                style={{
                  ...styles.secondaryButton,
                  background: isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
                  color: isDarkMode ? '#fff' : '#111827',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #cbd5e1',
                }}
              >
                Open in Google Maps
              </button>
            </div>

            <div style={{ width: '100%', height: 220, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
              {(() => {
                const loc = getValue('location');
                const coords = loc && loc.coords;
                const center = coords ? `${coords.lat},${coords.lng}` : '14.5995,120.9842';
                const src = `https://www.google.com/maps?q=${center}&z=15&output=embed`;
                return <iframe title="map" src={src} style={{ width: '100%', height: '100%', border: 0 }} />;
              })()}
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 8, color: '#cbd5e1' }}>You can also enter your address manually if needed.</div>
              {locationError && (
                <div style={{ marginBottom: 12, color: '#f87171' }}>{locationError}</div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <input
                  type="text"
                  name="location.region"
                  value={getValue('location.region') || ''}
                  onChange={(e) => setValue('location.region', e.target.value)}
                  placeholder="Region"
                  style={styles.input}
                />
                <input
                  type="text"
                  name="location.city"
                  value={getValue('location.city') || ''}
                  onChange={(e) => setValue('location.city', e.target.value)}
                  placeholder="City"
                  style={styles.input}
                />
                <input
                  type="text"
                  name="location.barangay"
                  value={getValue('location.barangay') || ''}
                  onChange={(e) => setValue('location.barangay', e.target.value)}
                  placeholder="Barangay"
                  style={styles.input}
                />
                <input
                  type="text"
                  name="location.otherDetails"
                  value={getValue('location.otherDetails') || ''}
                  onChange={(e) => setValue('location.otherDetails', e.target.value)}
                  placeholder="Street / Landmark"
                  style={styles.input}
                />
              </div>
            </div>
          </div>
        ) : step.type === 'image' ? (
          <div>
            <label style={styles.label}>{step.label}</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setValue(step.key, file.name);
                }
              }}
              style={styles.input}
            />
            {getValue(step.key) && (
              <div style={{ marginTop: 8, color: '#cbd5e1' }}>Selected image: {getValue(step.key)}</div>
            )}
          </div>
        ) : step.type === 'contact' ? (
          <div>
            <label style={styles.label}>{step.label}</label>
            <div style={{ display: 'grid', gap: 8 }}>
              <input
                type="text"
                value={getValue('contactNumber') || ''}
                onChange={(e) => setValue('contactNumber', e.target.value)}
                placeholder="Contact Number"
                style={styles.input}
              />
              <input
                type="text"
                value={getValue('website') || ''}
                onChange={(e) => setValue('website', e.target.value)}
                placeholder="Website"
                style={styles.input}
              />
            </div>
          </div>
        ) : step.type === 'companyIdentity' ? (
          <div>
            <label style={styles.label}>{step.label}</label>
            <div style={{ display: 'grid', gap: 8 }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (!file.type.startsWith('image/')) {
                    alert('Please select a valid image file.');
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    setValue('companyLogo', reader.result || '');
                  };
                  reader.readAsDataURL(file);
                }}
                style={styles.input}
              />
              {getValue('companyLogo') && (
                <img
                  src={getValue('companyLogo')}
                  alt="Company logo preview"
                  style={{ width: '100%', maxHeight: 180, objectFit: 'contain', borderRadius: 12, border: '1px solid rgba(148, 163, 184, 0.2)' }}
                />
              )}
              <input
                type="date"
                value={getValue('dateEstablished') || ''}
                onChange={(e) => setValue('dateEstablished', e.target.value)}
                style={styles.input}
              />
            </div>
          </div>
        ) : step.type === 'file' ? (
          <div>
            <label style={styles.label}>{step.label}</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setValue(step.key, file.name);
                }
              }}
              style={styles.input}
            />
            {getValue(step.key) && (
              <div style={{ marginTop: 8, color: '#cbd5e1' }}>Selected file: {getValue(step.key)}</div>
            )}
          </div>
        ) : (
          <div>
            <label style={styles.label}>{step.label}</label>
            <input type={step.type === 'date' ? 'date' : 'text'} value={getValue(step.key) || ''} onChange={(e) => setValue(step.key, e.target.value)} style={styles.input} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <button type="button" onClick={handleBack} disabled={index === 0} style={{ ...styles.cancelButton, opacity: index === 0 ? 0.5 : 1 }}>Back</button>
        <button type="button" onClick={handleNext} style={styles.confirmButton} disabled={loading || !isStepComplete(step)}>{index === steps.length - 1 ? (loading ? 'Saving...' : 'Save Profile') : 'Next'}</button>
      </div>
    </div>
  );
}

export default ProfileSelection;
