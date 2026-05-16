import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const regions = [
  "NCR",
  "Calabarzon",
  "Central Luzon",
  "Central Visayas",
  "Cordillera",
  "Davao",
  "Eastern Visayas",
  "Ilocos",
  "Mimaropa",
  "Mindanao",
  "Soccsksargen",
  "Zamboanga",
];

const CreateJobseekerProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    bio: "",
    citizenShip: "Filipino",
    location: {
      region: "",
      city: "",
      barangay: "",
      otherDetails: "",
    },
    experience: "",
    education: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editable, setEditable] = useState(true);

  const [profilePicture, setProfilePicture] =
    useState("");
  const [profilePicturePreview, setProfilePicturePreview] =
    useState("");

  const [resumeFile, setResumeFile] =
    useState(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState("");

  const [progress, setProgress] = useState(0);
  const [existingResumeName, setExistingResumeName] = useState("");
  const [existingProfilePicture, setExistingProfilePicture] = useState("");

  const [loading, setLoading] = useState(false);

  const [mapUrl, setMapUrl] = useState("");

  // Check authorization on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth");
    }
  }, [navigate]);

  useEffect(() => {
    const location = `
      ${formData.location.otherDetails}
      ${formData.location.barangay}
      ${formData.location.city}
      ${formData.location.region}
    `;

    const encodedLocation =
      encodeURIComponent(location);

    setMapUrl(
      `https://maps.google.com/maps?q=${encodedLocation}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    );
  }, [formData.location]);

  // preload profile when logged in
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await axios.get("http://localhost:8000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const user = response.data?.data;
        if (user && user.role === "jobseeker") {
          setFormData((prev) => ({
            ...prev,
            bio: user.bio || "",
            citizenShip: user.citizenShip || prev.citizenShip,
            location: {
              region: user.location?.region || prev.location.region,
              city: user.location?.city || prev.location.city,
              barangay: user.location?.barangay || prev.location.barangay,
              otherDetails: user.location?.otherDetails || prev.location.otherDetails,
            },
            experience: user.experience || "",
            education: user.education || "",
          }));

            if (user.resume) setExistingResumeName(user.resume);
            if (user.profilePicture) {
              setExistingProfilePicture(user.profilePicture);
              setProfilePicturePreview(user.profilePicture);
            }
            // mark as existing profile
            setIsEditing(true);
            setEditable(false);
        }
      } catch (err) {
        // ignore
      }
    };

    fetchProfile();
  }, []);

  // compute progress
  useEffect(() => {
    const fields = [
      formData.bio,
      formData.citizenShip,
      formData.location.region,
      formData.location.city,
      formData.location.barangay,
      formData.experience,
      formData.education,
      existingResumeName || resumeFile,
      profilePicture || existingProfilePicture,
    ];

    const filled = fields.reduce((acc, v) => (v ? acc + 1 : acc), 0);
    const pct = Math.round((filled / fields.length) * 100);
    setProgress(pct);
  }, [formData, resumeFile, existingResumeName, profilePicture, existingProfilePicture]);

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("location.")) {
      const locationField = name.split(".")[1];

      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setProfilePicture(reader.result);
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      showMessage(
        "Please select a valid image file",
        "error"
      );
    }
  };

  const handleResumeChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setResumeFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const token =
        localStorage.getItem("token");

      if (!token) {
        showMessage(
          "Please login first",
          "error"
        );

        setLoading(false);
        return;
      }

      if (
        !formData.location.region ||
        !formData.location.city ||
        !formData.location.barangay
      ) {
        showMessage(
          "Please complete your location",
          "error"
        );

        setLoading(false);
        return;
      }

      if (!existingResumeName && !resumeFile) {
        showMessage(
          "Resume is required",
          "error"
        );

        setLoading(false);
        return;
      }

      const body = {
        bio: formData.bio,
        citizenShip: formData.citizenShip,
        location: formData.location,
        experience: formData.experience,
        education: formData.education,
        resume: existingResumeName || resumeFile?.name || "",
        profilePicture: profilePicture || existingProfilePicture || "",
      };

      await axios.put(
        "http://localhost:8000/api/jobseeker/profile",
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showMessage(
        "Profile created successfully!",
        "success"
      );

      setTimeout(() => {
        navigate("/profile");
      }, 1500);
    } catch (error) {
      showMessage(
        error.response?.data?.message ||
          "Error creating profile",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* NAVBAR */}
      <nav style={styles.navbar}>
        <div style={styles.logoContainer}>
          <img
            src="/src/assets/Applica_Logo.png"
            alt="logo"
            style={styles.logo}
          />

          <h2 style={styles.logoText}>
            Applica
          </h2>
        </div>

        <button
          style={styles.backBtn}
          onClick={() => navigate("/profile")}
        >
          ← Back
        </button>
      </nav>

      {/* MAIN */}
      <div style={styles.main}>
        <div style={styles.card}>
          <h1 style={styles.title}>
            {isEditing ? "Edit Jobseeker Profile" : "Create Jobseeker Profile"}
          </h1>

          <p style={styles.subtitle}>
            Complete your profile to apply for
            jobs
          </p>

          <div style={styles.progressContainer}>
            <div style={styles.progressLabel}>Profile completion</div>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${progress}%` }}></div>
            </div>
            <div style={styles.progressPercent}>{progress}%</div>
          </div>

          {isEditing && !editable && (
            <div style={{ marginBottom: 12 }}>
              <button
                onClick={() => setEditable(true)}
                style={{ padding: '8px 12px', borderRadius: 8, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                Edit
              </button>
            </div>
          )}

          {message && (
            <div
              style={{
                ...styles.message,
                backgroundColor:
                  messageType === "error"
                    ? "#ffe5e5"
                    : "#e5ffe8",
                color:
                  messageType === "error"
                    ? "#c0392b"
                    : "#27ae60",
              }}
            >
              {message}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={styles.form}
          >
            {/* PROFILE PICTURE */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Profile Picture
              </label>

              <input
                id="jobseekerProfilePictureInput"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={styles.hiddenInput}
                disabled={!editable}
              />

              <label
                htmlFor="jobseekerProfilePictureInput"
                style={styles.imageUploadCircle}
              >
                {(profilePicturePreview || existingProfilePicture) ? (
                  <img
                    src={profilePicturePreview || existingProfilePicture}
                    alt="Profile preview"
                    style={styles.imageUploadPreview}
                  />
                ) : (
                  <div style={styles.uploadPlaceholder}>
                    <span style={styles.uploadIcon}>📷</span>
                    <span style={styles.uploadText}>
                      Click to upload
                    </span>
                  </div>
                )}
              </label>
            </div>

            {/* BIO */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Bio
              </label>

              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell employers about yourself..."
                style={styles.textarea}
                disabled={!editable}
              />
            </div>

            {/* EXPERIENCE */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Experience
              </label>

              <textarea
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                placeholder="Describe your experience..."
                style={styles.textarea}
                disabled={!editable}
              />
            </div>

            {/* EDUCATION */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Education
              </label>

              <textarea
                name="education"
                value={formData.education}
                onChange={handleInputChange}
                placeholder="Educational background..."
                style={styles.textarea}
                disabled={!editable}
              />
            </div>

            {/* RESUME */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Resume / CV
              </label>

              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeChange}
                style={styles.input}
                disabled={!editable}
              />
              {existingResumeName && !resumeFile && (
                <p style={styles.hintText}>
                  Current resume: {existingResumeName}
                </p>
              )}
            </div>

            {/* CITIZENSHIP */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Citizenship
              </label>

              <select
                name="citizenShip"
                value={formData.citizenShip}
                onChange={handleInputChange}
                style={styles.input}
                disabled={!editable}
              >
                <option value="Filipino">
                  Filipino
                </option>

                <option value="Foreign">
                  Foreign
                </option>
              </select>
            </div>

            {/* LOCATION */}
            <h2 style={styles.locationTitle}>
              Location Information
            </h2>

            <div style={styles.grid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Region
                </label>

                <select
                  name="location.region"
                  value={
                    formData.location.region
                  }
                  onChange={handleInputChange}
                  style={styles.input}
                  disabled={!editable}
                >
                  <option value="">
                    Select Region
                  </option>

                  {regions.map((region) => (
                    <option
                      key={region}
                      value={region}
                    >
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  City
                </label>

                <input
                  type="text"
                  name="location.city"
                  value={
                    formData.location.city
                  }
                  onChange={handleInputChange}
                  placeholder="City"
                  style={styles.input}
                  disabled={!editable}
                />
              </div>
            </div>

            <div style={styles.grid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Barangay
                </label>

                <input
                  type="text"
                  name="location.barangay"
                  value={
                    formData.location.barangay
                  }
                  onChange={handleInputChange}
                  placeholder="Barangay"
                  style={styles.input}
                  disabled={!editable}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Other Details
                </label>

                <input
                  type="text"
                  name="location.otherDetails"
                  value={
                    formData.location
                      .otherDetails
                  }
                  onChange={handleInputChange}
                  placeholder="Street / Landmark"
                  style={styles.input}
                  disabled={!editable}
                />
              </div>
            </div>

            {/* GOOGLE MAP */}
            <div style={styles.mapContainer}>
              <iframe
                title="Google Map"
                width="100%"
                height="300"
                style={styles.map}
                loading="lazy"
                allowFullScreen
                src={mapUrl}
              ></iframe>
            </div>

            {/* BUTTONS */}
            <div style={styles.buttonContainer}>
              <button
                type="button"
                style={styles.cancelBtn}
                onClick={() => navigate("/create")}
              >
                Cancel
              </button>

              <button
                type="submit"
                style={styles.submitBtn}
                disabled={loading || !editable}
              >
                {loading
                  ? isEditing
                    ? "Saving..."
                    : "Creating..."
                  : isEditing
                  ? "Save Changes"
                  : "Create Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background:
      "linear-gradient(to right, #0f172a, #1e293b)",
    fontFamily: "Arial",
    color: "#fff",
  },

  navbar: {
    height: "70px",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(10px)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 40px",
    borderBottom:
      "1px solid rgba(255,255,255,0.1)",
  },

  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  logo: {
    width: "45px",
  },

  logoText: {
    fontSize: "1.5rem",
    fontWeight: "bold",
  },

  backBtn: {
    background: "transparent",
    color: "#fff",
    border:
      "1px solid rgba(255,255,255,0.3)",
    padding: "10px 18px",
    borderRadius: "10px",
    cursor: "pointer",
  },

  main: {
    display: "flex",
    justifyContent: "center",
    padding: "40px 20px",
  },

  card: {
    width: "100%",
    maxWidth: "1000px",
    background: "rgba(255,255,255,0.08)",
    borderRadius: "24px",
    backdropFilter: "blur(12px)",
    padding: "40px",
    boxShadow:
      "0 10px 40px rgba(0,0,0,0.3)",
  },

  title: {
    fontSize: "2.5rem",
    marginBottom: "10px",
  },

  subtitle: {
    color: "#cbd5e1",
    marginBottom: "30px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },

  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  label: {
    fontWeight: "600",
    fontSize: "0.95rem",
  },

  input: {
    padding: "14px",
    borderRadius: "12px",
    border:
      "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    fontSize: "1rem",
    outline: "none",
  },

  textarea: {
    minHeight: "120px",
    padding: "14px",
    borderRadius: "12px",
    border:
      "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    resize: "vertical",
    fontSize: "1rem",
    outline: "none",
  },

  locationTitle: {
    marginTop: "20px",
    fontSize: "1.5rem",
  },

  mapContainer: {
    marginTop: "20px",
    borderRadius: "20px",
    overflow: "hidden",
    border:
      "2px solid rgba(255,255,255,0.1)",
  },

  map: {
    border: "none",
  },

  buttonContainer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "15px",
    marginTop: "20px",
  },

  cancelBtn: {
    padding: "14px 24px",
    borderRadius: "12px",
    border:
      "1px solid rgba(255,255,255,0.2)",
    background: "transparent",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },

  submitBtn: {
    padding: "14px 24px",
    borderRadius: "12px",
    border: "none",
    background: "#3b82f6",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "1rem",
  },

  message: {
    padding: "14px",
    borderRadius: "12px",
    fontWeight: "600",
    marginBottom: "10px",
  },
  hiddenInput: {
    display: "none",
  },
  imageUploadCircle: {
    marginTop: "12px",
    width: "150px",
    height: "150px",
    borderRadius: "50%",
    border: "2px dashed rgba(255,255,255,0.4)",
    backgroundColor: "rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    overflow: "hidden",
  },
  imageUploadPreview: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  uploadPlaceholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    color: "#cbd5e1",
    fontSize: "0.95rem",
    textAlign: "center",
  },
  uploadIcon: {
    fontSize: "1.8rem",
  },
  uploadText: {
    fontSize: "0.9rem",
  },
  imagePreviewWrapper: {
    marginTop: "12px",
    maxWidth: "160px",
    borderRadius: "16px",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  imagePreview: {
    width: "100%",
    height: "auto",
    display: "block",
  },
  hintText: {
    marginTop: "8px",
    fontSize: "0.9rem",
    color: "#d1d5db",
  },
  progressContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
  },
  progressLabel: {
    fontSize: "14px",
    color: "#cbd5e1",
    minWidth: "140px",
  },
  progressBar: {
    flex: 1,
    height: "12px",
    background: "rgba(255,255,255,0.08)",
    borderRadius: "8px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #16a34a 0%, #3b82f6 100%)",
  },
  progressPercent: {
    minWidth: "48px",
    textAlign: "right",
    color: "#cbd5e1",
    fontWeight: "700",
  },
};

export default CreateJobseekerProfile;