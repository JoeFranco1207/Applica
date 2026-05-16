import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ProfileSelection = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [roleError, setRoleError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if user already has a role
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.role) {
      setUserRole(user.role);
      // Redirect based on existing role
      if (user.role === "jobseeker") {
        navigate("/create/jobseeker");
      } else if (user.role === "employer") {
        navigate("/create/employer");
      }
    }
  }, [navigate]);

  const handleContinue = () => {
    if (selectedRole) {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmRole = async () => {
    try {
      setIsSubmitting(true);
      setRoleError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setRoleError("Authentication required. Please log in again.");
        return;
      }

      const response = await fetch("http://localhost:8000/api/auth/select-role", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      const result = await response.json();

      if (!response.ok) {
        setRoleError(result.message || "Unable to set role. Please try again.");
        return;
      }

      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...storedUser,
          role: selectedRole,
        })
      );

      setShowConfirmModal(false);
      navigate("/profile");
    } catch (error) {
      console.error(error);
      setRoleError("Something went wrong while setting your role.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div style={styles.container}>
      {/* BACKGROUND GLOW */}
      <div style={styles.glow1}></div>
      <div style={styles.glow2}></div>

      {/* NAVBAR */}
      <nav style={styles.navbar}>
        <div style={styles.logoContainer}>
          <div
            style={styles.logoWrapper}
            onClick={handleBack}
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

          <button
            style={styles.backButton}
            onClick={handleBack}
          >
            ← Back
          </button>
        </div>
      </nav>

      {/* MAIN */}
      <div style={styles.main}>
        <div style={styles.heroSection}>
          <h1 style={styles.title}>
            Choose Your Profile Type
          </h1>

          <p style={styles.subtitle}>
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
              ...(selectedRole ===
                "jobseeker" &&
                styles.selectedCard),
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

            <p style={styles.cardDescription}>
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
              ...(selectedRole ===
                "employer" &&
                styles.selectedCardEmployer),
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

            <p style={styles.cardDescription}>
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
            style={styles.secondaryButton}
            onClick={handleBack}
          >
            Back to Home
          </button>

          <button
            style={{
              ...styles.primaryButton,
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

      {showConfirmModal && (
        <div style={styles.modalOverlay} onClick={() => setShowConfirmModal(false)}>
          <div
            style={styles.modalContainer}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={styles.modalHeading}>Confirm Role</h2>
            <p style={styles.modalText}>
              You selected <strong>{selectedRole}</strong>. Are you sure you want to continue with this role?
            </p>
            {roleError && <p style={styles.errorText}>{roleError}</p>}
            <div style={styles.modalButtons}>
              <button
                style={styles.cancelButton}
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                style={styles.confirmButton}
                onClick={handleConfirmRole}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Confirm"}
              </button>
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
    background:
      "linear-gradient(to bottom right, #0f172a, #111827, #1e293b)",
    overflow: "hidden",
    position: "relative",
    fontFamily: "Arial",
    color: "#fff",
  },

  glow1: {
    position: "absolute",
    width: "350px",
    height: "350px",
    background:
      "rgba(59,130,246,0.25)",
    borderRadius: "50%",
    top: "-120px",
    left: "-120px",
    filter: "blur(120px)",
  },

  glow2: {
    position: "absolute",
    width: "350px",
    height: "350px",
    background:
      "rgba(168,85,247,0.2)",
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
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
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
    color: "#cbd5e1",
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
    background:
      "rgba(255,255,255,0.08)",
    border:
      "1px solid rgba(255,255,255,0.1)",
    backdropFilter: "blur(12px)",
    transition: "0.3s ease",
    cursor: "pointer",
    boxShadow:
      "0 10px 40px rgba(0,0,0,0.25)",
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
    background:
      "rgba(255,255,255,0.1)",
    marginBottom: "25px",
  },

  cardTitle: {
    fontSize: "2rem",
    fontWeight: "700",
    marginBottom: "15px",
  },

  cardDescription: {
    color: "#cbd5e1",
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
      "rgba(255,255,255,0.06)",
    padding: "14px 16px",
    borderRadius: "14px",
    fontSize: "0.95rem",
    color: "#e2e8f0",
  },

  selectedBadge: {
    position: "absolute",
    top: "20px",
    right: "20px",
    background:
      "linear-gradient(to right, #3b82f6, #2563eb)",
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
      "linear-gradient(to right, #3b82f6, #2563eb)",
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
    background:
      "rgba(255,255,255,0.08)",
    color: "#fff",
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
    background: "#0f172a",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.35)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  modalHeading: {
    margin: 0,
    marginBottom: "16px",
    fontSize: "1.8rem",
    color: "#fff",
  },
  modalText: {
    color: "#cbd5e1",
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
    color: "#fff",
    cursor: "pointer",
  },
  confirmButton: {
    padding: "12px 18px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(90deg, #10b981, #3b82f6)",
    color: "#fff",
    cursor: "pointer",
  },
  errorText: {
    color: "#f87171",
    marginBottom: "16px",
  },
};

export default ProfileSelection;