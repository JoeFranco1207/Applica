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
      coords: null,
    },
    experience: "",
    education: "",
    resume: "",
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

  const [existingResumeName, setExistingResumeName] = useState("");
  const [existingProfilePicture, setExistingProfilePicture] = useState("");

  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [mapUrl, setMapUrl] = useState("");

  // Check authorization on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth");
    }
  }, [navigate]);


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
          const hasData = Boolean(
            user.bio ||
            user.citizenShip ||
            user.experience ||
            user.education ||
            user.resume ||
            user.profilePicture ||
            user.location?.region ||
            user.location?.city ||
            user.location?.barangay ||
            user.location?.otherDetails
          );

          setFormData({
            bio: user.bio || "",
            citizenShip: user.citizenShip || "Filipino",
            location: {
              region: user.location?.region || "",
              city: user.location?.city || "",
              barangay: user.location?.barangay || "",
              otherDetails: user.location?.otherDetails || "",
              coords: user.location?.coords || null,
            },
            experience: user.experience || "",
            education: user.education || "",
            resume: user.resume || "",
          });

          if (user.resume) setExistingResumeName(user.resume);
          if (user.profilePicture) {
            setExistingProfilePicture(user.profilePicture);
            setProfilePicturePreview(user.profilePicture);
          }

          setIsEditing(hasData);
          setEditable(!hasData);
        }
      } catch {
        // ignore
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const location = `
      ${formData.location.otherDetails}
      ${formData.location.barangay}
      ${formData.location.city}
      ${formData.location.region}
    `;

    const encodedLocation = encodeURIComponent(location.trim());
    setMapUrl(`https://maps.google.com/maps?q=${encodedLocation}&t=&z=15&ie=UTF8&iwloc=&output=embed`);
  }, [formData.location]);

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3000);
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
      setFormData((prev) => ({
        ...prev,
        resume: file.name,
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("location.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          [field]: value,
        },
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse`,
        {
          params: {
            format: 'jsonv2',
            lat,
            lon: lng,
            addressdetails: 1,
          },
        }
      );

      return response.data;
    } catch (err) {
      console.error('Reverse geocode failed', err);
      return null;
    }
  };

  const fillLocationFromCoords = async () => {
    if (!navigator.geolocation) {
      showMessage('Geolocation is not supported by your browser.', 'error');
      return;
    }

    setLocationLoading(true);
    setLocationMessage('Getting your location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const data = await reverseGeocode(latitude, longitude);
        if (!data || !data.address) {
          showMessage('Unable to determine your address from location.', 'error');
          setLocationLoading(false);
          setLocationMessage('Unable to fill location automatically. Please enter it manually.');
          return;
        }

        const address = data.address;
        const region = address.state || address.region || address.county || '';
        const city = address.city || address.town || address.village || address.suburb || address.county || '';
        const barangay = address.hamlet || address.neighbourhood || address.suburb || '';
        const country = address.country || '';
        const otherDetails = [address.road, address.house_number, address.building, address.neighbourhood].filter(Boolean).join(', ');

        setFormData((prev) => ({
          ...prev,
          citizenShip: country.toLowerCase().includes('philippine') ? 'Filipino' : 'Foreign',
          location: {
            region: region || prev.location.region,
            city: city || prev.location.city,
            barangay: barangay || prev.location.barangay,
            otherDetails: otherDetails || prev.location.otherDetails,
            coords: {
              lat: latitude,
              lng: longitude,
            },
          },
        }));

        setLocationMessage('Location filled from your current GPS position.');
        setLocationLoading(false);
      },
      (error) => {
        console.error(error);
        setLocationLoading(false);
        showMessage('Please allow location access to fill address automatically.', 'error');
        setLocationMessage('Location access denied or unavailable. Enter location manually below.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  const hasLocationData = (location) => {
    if (!location) return false;
    const hasCoords = location.coords?.lat != null && location.coords?.lng != null;
    const hasManualFields = location.region && location.city && location.barangay;
    return hasCoords || hasManualFields;
  };

  const computeCompletion = (data) => {
    const fields = [
      data?.bio,
      data?.citizenShip,
      data?.experience,
      data?.education,
      data?.location?.region,
      data?.location?.city,
      data?.location?.barangay,
      data?.location?.otherDetails,
      data?.profilePicture || existingProfilePicture,
      data?.resume || existingResumeName,
    ];

    const filled = fields.reduce((count, value) => count + (value ? 1 : 0), 0);
    return Math.round((filled / fields.length) * 100);
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

      if (!hasLocationData(formData.location)) {
        showMessage(
          "Please complete your location either by using location permission or entering it manually.",
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

      const response = await axios.put(
        "http://localhost:8000/api/jobseeker/profile",
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedProfile = response.data?.data || body;

      const storedUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...storedUser,
          ...updatedProfile,
          profilePicture: updatedProfile.profilePicture,
          location: updatedProfile.location,
          resume: updatedProfile.resume,
        })
      );

      if (updatedProfile.profilePicture) {
        setExistingProfilePicture(updatedProfile.profilePicture);
        setProfilePicturePreview(updatedProfile.profilePicture);
      }

      if (updatedProfile.resume) {
        setExistingResumeName(updatedProfile.resume);
      }

      setIsEditing(true);
      setEditable(false);

      showMessage(
        isEditing
          ? "Profile updated successfully!"
          : "Profile created successfully!",
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
      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
        <button style={styles.backBtn} onClick={() => navigate("/profile")}>← Back</button>
      </div>

      <div style={styles.main}>
        <div style={styles.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h1 style={styles.title}>{isEditing ? "Edit Jobseeker Profile" : "Create Jobseeker Profile"}</h1>
              <p style={styles.subtitle}>Complete your profile and update your current information.</p>
            </div>
            {isEditing && (
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                {!editable && (
                  <button
                    onClick={() => setEditable(true)}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 10,
                      border: "none",
                      background: "#3b82f6",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                )}
                {editable && (
                  <button
                    onClick={() => setEditable(false)}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "transparent",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={{ marginTop: 24, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: "#cbd5e1" }}>Profile Completion</span>
              <span style={{ fontSize: 13, color: "#cbd5e1" }}>{computeCompletion(formData)}%</span>
            </div>
            <div style={{ height: 10, background: "rgba(255,255,255,0.08)", borderRadius: 6, overflow: "hidden", marginTop: 10 }}>
              <div style={{ height: 10, width: `${computeCompletion(formData)}%`, background: computeCompletion(formData) === 100 ? "#22c55e" : "#3b82f6" }} />
            </div>
          </div>

          {message && (
            <div
              style={{
                ...styles.message,
                backgroundColor: messageType === "error" ? "#ffe5e5" : "#e5ffe8",
                color: messageType === "error" ? "#c0392b" : "#27ae60",
              }}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Profile Picture</label>
              <input
                id="jobseekerProfilePictureInput"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={styles.hiddenInput}
                disabled={!editable}
              />
              <label htmlFor="jobseekerProfilePictureInput" style={styles.imageUploadCircle}>
                {(profilePicturePreview || existingProfilePicture) ? (
                  <img
                    src={profilePicturePreview || existingProfilePicture}
                    alt="Profile preview"
                    style={styles.imageUploadPreview}
                  />
                ) : (
                  <div style={styles.uploadPlaceholder}>
                    <span style={styles.uploadIcon}>📷</span>
                    <span style={styles.uploadText}>Choose image</span>
                  </div>
                )}
              </label>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Write a short bio"
                style={styles.textarea}
                disabled={!editable}
              />
            </div>

            <div style={styles.grid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Experience</label>
                <textarea
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  placeholder="Your experience"
                  style={styles.textarea}
                  disabled={!editable}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Education</label>
                <input
                  type="text"
                  name="education"
                  value={formData.education}
                  onChange={handleInputChange}
                  placeholder="Your education"
                  style={styles.input}
                  disabled={!editable}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Citizenship</label>
              <select
                name="citizenShip"
                value={formData.citizenShip}
                onChange={handleInputChange}
                style={styles.input}
                disabled={!editable}
              >
                <option value="Filipino">Filipino</option>
                <option value="Foreign">Foreign</option>
              </select>
            </div>

            <h2 style={styles.locationTitle}>Location</h2>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={fillLocationFromCoords}
                disabled={!editable || locationLoading}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: 12,
                  border: "none",
                  background: "#2563eb",
                  color: "#fff",
                  cursor: editable ? "pointer" : "not-allowed",
                }}
              >
                {locationLoading ? "Locating…" : "Use my current location"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editable) return;
                }}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: 12,
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  color: "#111",
                  cursor: editable ? "pointer" : "not-allowed",
                }}
              >
                Enter location manually
              </button>
            </div>

            {locationMessage && <div style={{ color: "#facc15", fontSize: 13, marginTop: 8 }}>{locationMessage}</div>}

            <div style={styles.grid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Region</label>
                <select
                  name="location.region"
                  value={formData.location.region}
                  onChange={handleInputChange}
                  style={styles.input}
                  disabled={!editable}
                >
                  <option value="">Select Region</option>
                  {regions.map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>City</label>
                <input
                  type="text"
                  name="location.city"
                  value={formData.location.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  style={styles.input}
                  disabled={!editable}
                />
              </div>
            </div>

            <div style={styles.grid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Barangay</label>
                <input
                  type="text"
                  name="location.barangay"
                  value={formData.location.barangay}
                  onChange={handleInputChange}
                  placeholder="Barangay"
                  style={styles.input}
                  disabled={!editable}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Other Details</label>
                <input
                  type="text"
                  name="location.otherDetails"
                  value={formData.location.otherDetails}
                  onChange={handleInputChange}
                  placeholder="Street / Landmark"
                  style={styles.input}
                  disabled={!editable}
                />
              </div>
            </div>

            <div style={styles.mapContainer}>
              <iframe
                title="Google Map"
                width="100%"
                height="300"
                style={styles.map}
                loading="lazy"
                allowFullScreen
                src={mapUrl}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Resume / CV</label>
              <input
                id="jobseekerResumeInput"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeChange}
                style={styles.hiddenInput}
                disabled={!editable}
              />
              <label
                htmlFor="jobseekerResumeInput"
                style={{
                  ...styles.input,
                  cursor: editable ? "pointer" : "not-allowed",
                  display: "inline-block",
                }}
              >
                {formData.resume ? `Selected: ${formData.resume}` : "Choose resume (.pdf, .doc, .docx)"}
              </label>
              {existingResumeName && !resumeFile && (
                <div style={styles.hintText}>Current resume: {existingResumeName}</div>
              )}
            </div>

            <div style={styles.buttonContainer}>
              <button
                type="button"
                style={styles.cancelBtn}
                onClick={() => navigate("/profile")}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={styles.submitBtn}
                disabled={loading || !editable}
              >
                {loading ? (isEditing ? "Saving..." : "Creating...") : (isEditing ? "Save Changes" : "Create Profile")}
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
    background: "var(--bg)",
    fontFamily: "Arial, sans-serif",
    color: "var(--text)",
  },

  navbar: {
    height: "70px",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(10px)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 40px",
    borderBottom: "1px solid var(--border)",
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
    color: "var(--text-h)",
  },

  backBtn: {
    background: "transparent",
    color: "var(--text-h)",
    border: "1px solid var(--border)",
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
    background: "var(--surface)",
    borderRadius: "24px",
    backdropFilter: "blur(12px)",
    padding: "40px",
    boxShadow: "var(--card-shadow)",
    border: "1px solid var(--border)",
  },

  title: {
    fontSize: "2.5rem",
    marginBottom: "10px",
    color: "var(--text-h)",
  },

  subtitle: {
    color: "var(--muted)",
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
    color: "var(--text-h)",
  },

  input: {
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid var(--border)",
    background: "var(--surface-alt)",
    color: "var(--text)",
    fontSize: "1rem",
    outline: "none",
  },

  textarea: {
    minHeight: "120px",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid var(--border)",
    background: "var(--surface-alt)",
    color: "var(--text)",
    resize: "vertical",
    fontSize: "1rem",
    outline: "none",
  },

  locationTitle: {
    marginTop: "20px",
    fontSize: "1.5rem",
    color: "var(--text-h)",
  },

  mapContainer: {
    marginTop: "20px",
    borderRadius: "20px",
    overflow: "hidden",
    border: "2px solid var(--border)",
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
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--text-h)",
    cursor: "pointer",
    fontWeight: "600",
  },

  submitBtn: {
    padding: "14px 24px",
    borderRadius: "12px",
    border: "none",
    background: "var(--primary)",
    color: "var(--cta-text)",
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
    border: "2px dashed var(--border)",
    backgroundColor: "var(--surface-alt)",
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