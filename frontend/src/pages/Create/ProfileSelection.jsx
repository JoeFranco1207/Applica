import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const ProfileSelection = () => {
  const navigate = useNavigate();
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
  const [profileProgress, setProfileProgress] = useState(0);
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
        location: {
          region: "",
          city: "",
          barangay: "",
          otherDetails: "",
        },
        industry: "",
        website: "",
      };
    }

    return {
      bio: "",
      experience: "",
      education: "",
      citizenShip: "Filipino",
      resume: "",
      location: {
        region: "",
        city: "",
        barangay: "",
        otherDetails: "",
        coords: null,
      },
    };
  };

  const computeProgress = useCallback((data) => {
    if (!data) return 0;
    const locationComplete = data.location?.coords?.lat && data.location?.coords?.lng
      ? true
      : data.location?.region && data.location?.city && data.location?.barangay;

    const fields = selectedRole === "employer"
      ? [
          data.companyName,
          data.companyDescription,
          data.location?.region,
          data.location?.city,
          data.location?.barangay,
          data.industry,
          data.website,
        ]
      : [
          data.bio,
          data.experience,
          data.education,
          data.citizenShip,
          data.resume,
          locationComplete,
        ];

    const filled = fields.reduce(
      (count, value) => count + (value ? 1 : 0),
      0
    );
    return Math.round((filled / fields.length) * 100);
  }, [selectedRole]);

  const handleContinue = () => {
    if (selectedRole) {
      setProfileData(getInitialProfileData(selectedRole));
      setProfileError(null);
      setShowProfileModal(true);
    }
  };

  useEffect(() => {
    setProfileProgress(computeProgress(profileData));
  }, [profileData, computeProgress]);

  const handleSaveProfile = async () => {
    try {
      setProfileLoading(true);
      setProfileError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setProfileError("Authentication required. Please log in again.");
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
            companyLocation: profileData.location,
            industry: profileData.industry,
            website: profileData.website,
          }
        : {
            bio: profileData.bio,
            experience: profileData.experience,
            education: profileData.education,
            citizenShip: profileData.citizenShip,
            location: profileData.location,
            resume: profileData.resume,
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

      const storedUser = safeGetStoredUser();
      localStorage.setItem(
        "user",
        JSON.stringify({ ...storedUser, role: selectedRole })
      );

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
    navigate("/");
  };

  return (
    <div style={styles.container}>
      {/* BACKGROUND GLOW */}
      <div style={styles.glow1}></div>
      <div style={styles.glow2}></div>

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

      {showProfileModal && (
            <div style={styles.modalOverlay} onClick={() => setShowProfileModal(false)}>
              <div
                style={{ ...styles.modalContainer, width: 'min(920px, 95vw)', display: 'flex', gap: 24, alignItems: 'center' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ flex: 1 }}>
                  <h2 style={styles.modalHeading}>
                    Set up your {selectedRole === "employer" ? "Employer" : "Jobseeker"} Profile
                  </h2>
                  <div style={styles.progressBarContainer}>
                    <div style={{ ...styles.progressBarFill, width: `${profileProgress}%` }} />
                  </div>
                  <p style={styles.modalText}>
                    Complete your profile to get the best experience. Progress: {profileProgress}%
                  </p>
                  {profileError && <p style={styles.errorText}>{profileError}</p>}
                </div>

                <div style={{ width: 520 }}>
                  {/* Stepper single-field layout */}
                  <ModalStepper
                    role={selectedRole}
                    data={profileData}
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
  progressBarContainer: {
    position: "relative",
    background: "rgba(255,255,255,0.1)",
    height: "12px",
    borderRadius: "999px",
    overflow: "hidden",
    marginBottom: "16px",
  },
  progressBarFill: {
    height: "100%",
    background: "linear-gradient(90deg, #3b82f6, #10b981)",
    transition: "width 0.3s ease",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    color: "#e2e8f0",
    fontWeight: "700",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    marginBottom: "16px",
    outline: "none",
    fontSize: "0.95rem",
  },
  textarea: {
    width: "100%",
    minHeight: "110px",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    marginBottom: "16px",
    resize: "vertical",
    fontSize: "0.95rem",
  },
  locationGroup: {
    marginTop: "12px",
  },
  locationHeading: {
    marginBottom: "12px",
    color: "#cbd5e1",
    fontSize: "1rem",
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

// Inline stepper used inside the modal for compact single-field flow
function ModalStepper({ role, data = {}, onChange, onClose, onSave, loading }) {
  const isEmployer = role === 'employer';
  const employerSteps = [
    { key: 'companyName', label: 'Company Name', type: 'text' },
    { key: 'companyDescription', label: 'Company Description', type: 'textarea' },
    { key: 'industry', label: 'Industry', type: 'text' },
    { key: 'companySize', label: 'Company Size', type: 'select', options: ['1-10','11-50','51-200','201-500','501-1000','1001+'] },
    { key: 'website', label: 'Website', type: 'text' },
    { key: 'contactNumber', label: 'Contact Number', type: 'text' },
    { key: 'dateEstablished', label: 'Established (YYYY-MM-DD)', type: 'date' },
    { key: 'location', label: 'Location', type: 'map' },
  ];

  const jobseekerSteps = [
    { key: 'bio', label: 'Bio', type: 'textarea' },
    { key: 'experience', label: 'Experience', type: 'text' },
    { key: 'education', label: 'Education', type: 'text' },
    { key: 'citizenShip', label: 'Citizenship', type: 'select', options: ['Filipino', 'Foreign'] },
    { key: 'location', label: 'Location', type: 'map' },
    { key: 'resume', label: 'Resume / CV', type: 'file' },
  ];

  const steps = isEmployer ? employerSteps : jobseekerSteps;
  const [index, setIndex] = useState(0);

  const getValue = (key) => {
    if (key === 'location') return data.location || null;
    if (!key.includes('.')) return data[key] || '';
    return key.split('.').reduce((acc, k) => (acc ? acc[k] : ''), data) || '';
  };

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

  const handleNext = () => {
    if (index === steps.length - 1) {
      if (onSave) onSave();
      return;
    }
    setIndex((i) => i + 1);
  };
  const handleBack = () => setIndex((i) => Math.max(0, i - 1));

  const step = steps[index];

  return (
    <div>
      <div style={{ fontSize: 14, color: '#cbd5e1', marginBottom: 8 }}>{step.label}</div>
      <div>
        {step.type === 'textarea' ? (
          <textarea value={getValue(step.key) || ''} onChange={(e) => setValue(step.key, e.target.value)} style={styles.textarea} />
        ) : step.type === 'select' ? (
          <select value={getValue(step.key) || ''} onChange={(e) => setValue(step.key, e.target.value)} style={styles.input}>
            <option value="">Select {step.label}</option>
            {step.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : step.type === 'map' ? (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <button
                onClick={() => {
                  if (!navigator.geolocation) return alert('Geolocation not supported by your browser.');
                  navigator.geolocation.getCurrentPosition((pos) => {
                    const { latitude: lat, longitude: lng } = pos.coords;
                    const existingLocation = getValue('location') || {};
                    setValue('location', {
                      ...existingLocation,
                      coords: { lat, lng },
                      otherDetails: `${lat},${lng}`,
                    });
                  }, () => {
                    alert('Unable to retrieve your location. Please allow location access.');
                  });
                }}
                style={styles.confirmButton}
              >
                Use my current location
              </button>

              <button
                onClick={() => {
                  const loc = getValue('location');
                  const coords = loc && loc.coords;
                  const url = coords ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}` : 'https://www.google.com/maps';
                  window.open(url, '_blank');
                }}
                style={styles.secondaryButton}
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
        ) : step.type === 'file' ? (
          <div>
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
          <input type={step.type === 'date' ? 'date' : 'text'} value={getValue(step.key) || ''} onChange={(e) => setValue(step.key, e.target.value)} style={styles.input} />
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        <button onClick={onClose} style={styles.cancelButton}>Skip for now</button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleBack} disabled={index === 0} style={{ ...styles.cancelButton, opacity: index === 0 ? 0.5 : 1 }}>Back</button>
          <button onClick={handleNext} style={styles.confirmButton} disabled={loading}>{index === steps.length - 1 ? (loading ? 'Saving...' : 'Save Profile') : 'Next'}</button>
        </div>
      </div>
    </div>
  );
}

export default ProfileSelection;