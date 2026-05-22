import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Icon Components
const BriefcaseIcon = ({ size = 20 }) => (
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
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  </svg>
);

const CheckIcon = ({ size = 20 }) => (
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
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ArrowLeftIcon = ({ size = 20 }) => (
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
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const CreateJob = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    location: "",
    salary: "",
    externalLink: "",
  });
  const [jobMedia, setJobMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3000);
  };

  const refreshAuthenticatedUser = async (token) => {
    if (!token) {
      return null;
    }

    try {
      const response = await axios.get("http://localhost:8000/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const freshUser = response.data?.data;
      if (freshUser) {
        localStorage.setItem("user", JSON.stringify(freshUser));
        setUserRole(freshUser.role);
      }
      return freshUser;
    } catch (error) {
      const status = error.response?.status;
      if (status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        showMessage("Session expired. Please log in again.", "error");
        navigate("/auth");
      } else if (status === 403) {
        showMessage("You are not authorized to create jobs.", "error");
      } else {
        showMessage("Unable to verify your employer status.", "error");
      }
      return null;
    } finally {
      setAuthChecking(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        showMessage("Please login to post jobs.", "error");
        navigate("/auth");
        return;
      }
      await refreshAuthenticatedUser(token);
    };
    initialize();
  }, [navigate]);

  const autoBulletText = (value) => {
    return value
      .split("\n")
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return "";
        return `- ${trimmed.replace(/^[-*]\s*/, "")}`;
      })
      .join("\n");
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await axios.get("https://nominatim.openstreetmap.org/reverse", {
        params: {
          format: "jsonv2",
          lat,
          lon: lng,
          addressdetails: 1,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Reverse geocode failed", error);
      return null;
    }
  };

  const formatGeocodedLocation = (data) => {
    if (!data?.address) return null;
    const address = data.address;

    const parts = [];
    if (address.road) parts.push(address.road);
    if (address.neighbourhood) parts.push(address.neighbourhood);
    if (address.suburb) parts.push(address.suburb);

    const city = address.city || address.town || address.village || address.hamlet || address.county;
    if (city && !parts.includes(city)) parts.push(city);

    const region = address.state || address.region || address.county;
    if (region && !parts.includes(region)) parts.push(region);

    if (parts.length) return parts.join(", ");
    return data.display_name || null;
  };

  const fillLocationFromCoords = async (latitude, longitude) => {
    const data = await reverseGeocode(latitude, longitude);
    const readableLocation = formatGeocodedLocation(data);

    if (readableLocation) {
      setFormData((prev) => ({ ...prev, location: readableLocation }));
      showMessage("Location set to " + readableLocation, "success");
    } else {
      setFormData((prev) => ({ ...prev, location: `${latitude},${longitude}` }));
      showMessage("Unable to determine address; using coordinates as fallback.", "error");
    }
  };

  const isEmployer = !authChecking && userRole === "employer";

  const handleMediaUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result;
      const mediaType = file.type.startsWith("video/") ? "video" : "image";
      setJobMedia({
        type: mediaType,
        data: base64Data,
        contentType: file.type,
        fileName: file.name,
      });
      setMediaPreview(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setJobMedia(null);
    setMediaPreview(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const formattedValue = ["description", "requirements"].includes(name)
      ? autoBulletText(value)
      : value;

    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        showMessage("Please login first", "error");
        setLoading(false);
        return;
      }

      const freshUser = await refreshAuthenticatedUser(token);
      if (!freshUser) {
        setLoading(false);
        return;
      }
      if (freshUser.role !== "employer") {
        showMessage("Only employer accounts can create jobs.", "error");
        setLoading(false);
        return;
      }

      const rawLink = formData.externalLink.trim();
      const normalizedLink =
        rawLink && !/^https?:\/\//i.test(rawLink)
          ? `https://${rawLink}`
          : rawLink;

      const payload = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        location: formData.location,
        salary: formData.salary ? parseInt(formData.salary) : 0,
        externalLink: normalizedLink || undefined,
        media: jobMedia || undefined,
      };

      const response = await axios.post(
        "http://localhost:8000/api/employer/create-job",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showMessage("Job posted successfully!", "success");
      setTimeout(() => {
        navigate("/profile");
      }, 1500);
    } catch (error) {
      showMessage(
        error.response?.data?.message || "Error posting job",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate("/profile")}>
          <ArrowLeftIcon size={18} />
        </button>
        <h1 style={styles.headerTitle}>Post a Job</h1>
        <div style={{ width: 40 }} />
      </div>

      <div style={styles.main}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <BriefcaseIcon size={24} />
            <div>
              <h2 style={styles.cardTitle}>Create Job Posting</h2>
              <p style={styles.cardSubtitle}>Share your job opportunity with talented professionals</p>
            </div>
          </div>

          {message && (
            <div
              style={{
                ...styles.messageBox,
                backgroundColor:
                  messageType === "error"
                    ? "rgba(220, 38, 38, 0.1)"
                    : "rgba(34, 197, 94, 0.1)",
                borderColor:
                  messageType === "error"
                    ? "#dc2626"
                    : "#22c55e",
                color:
                  messageType === "error"
                    ? "#dc2626"
                    : "#22c55e",
              }}
            >
              {message}
            </div>
          )}

          {!authChecking && !isEmployer && (
            <div
              style={{
                ...styles.messageBox,
                backgroundColor: "rgba(255, 246, 230, 0.9)",
                borderColor: "#f59e0b",
                color: "#92400e",
                marginBottom: 16,
              }}
            >
              You must be signed in as an employer to post a job.
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Job Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Senior React Developer"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the role and responsibilities..."
                style={styles.textarea}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Requirements *</label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleInputChange}
                placeholder="List key requirements and qualifications..."
                style={styles.textarea}
                required
              />
            </div>

            <div style={styles.twoColumnGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Search city, address, or landmark"
                  style={styles.input}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!navigator.geolocation) {
                      showMessage("Geolocation not supported by your browser.", "error");
                      return;
                    }
                    navigator.geolocation.getCurrentPosition(
                      async (position) => {
                        const { latitude, longitude } = position.coords;
                        await fillLocationFromCoords(latitude, longitude);
                      },
                      () => {
                        showMessage("Unable to detect current location.", "error");
                      }
                    );
                  }}
                  style={styles.locationButton}
                >
                  Use current location
                </button>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Salary (₱)</label>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  placeholder="e.g., 150000"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.mapPreview}>
              <iframe
                title="Job location preview"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                  formData.location || "Philippines"
                )}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                style={styles.mapIframe}
                allowFullScreen
                loading="lazy"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Application link</label>
              <input
                type="text"
                name="externalLink"
                value={formData.externalLink}
                onChange={handleInputChange}
                placeholder="Optional: website, application form, or company page"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Job image or video</label>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaUpload}
                style={styles.fileInput}
              />
              {mediaPreview && (
                <div style={styles.mediaPreviewContainer}>
                  {jobMedia?.type === "video" ? (
                    <video
                      src={mediaPreview}
                      style={styles.mediaPreviewItem}
                      controls
                    />
                  ) : (
                    <img
                      src={mediaPreview}
                      alt="Job media preview"
                      style={styles.mediaPreviewItem}
                    />
                  )}
                  <button
                    type="button"
                    onClick={removeMedia}
                    style={styles.removeMediaButton}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div style={styles.formActions}>
              <button
                type="button"
                style={styles.secondaryBtn}
                onClick={() => navigate("/profile")}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={styles.primaryBtn}
                disabled={loading || !isEmployer}
              >
                <CheckIcon size={18} />
                <span>{loading ? "Posting..." : "Post Job"}</span>
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
    backgroundColor: "var(--bg)",
    color: "var(--text-h)",
    display: "flex",
    flexDirection: "column",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid var(--border)",
    backgroundColor: "var(--surface)",
  },

  backBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-h)",
    cursor: "pointer",
    padding: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    transition: "background 0.2s",
  },

  headerTitle: {
    fontSize: "20px",
    fontWeight: "700",
    margin: 0,
  },

  main: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "24px 20px",
  },

  card: {
    width: "100%",
    maxWidth: "600px",
    backgroundColor: "var(--surface-strong)",
    borderRadius: "12px",
    border: "1px solid var(--border)",
    padding: "24px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
  },

  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "24px",
  },

  cardTitle: {
    fontSize: "18px",
    fontWeight: "700",
    margin: "0 0 4px 0",
  },

  cardSubtitle: {
    fontSize: "13px",
    color: "var(--text-muted)",
    margin: 0,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  label: {
    fontWeight: "600",
    fontSize: "13px",
    color: "var(--text-h)",
  },

  input: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    backgroundColor: "var(--surface)",
    color: "var(--text)",
    fontSize: "13px",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.2s",
  },
  fileInput: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    backgroundColor: "var(--surface)",
    color: "var(--text)",
    fontSize: "13px",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.2s",
  },
  locationButton: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    backgroundColor: "var(--surface)",
    color: "var(--text)",
    fontSize: "13px",
    cursor: "pointer",
    marginTop: "8px",
    alignSelf: "flex-start",
  },
  mapPreview: {
    width: "100%",
    height: "260px",
    borderRadius: "16px",
    overflow: "hidden",
    border: "1px solid var(--border)",
  },
  mapIframe: {
    width: "100%",
    height: "100%",
    border: "0",
  },
  mediaPreviewContainer: {
    position: "relative",
    marginTop: "12px",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },
  mediaPreviewItem: {
    width: "100%",
    maxHeight: "260px",
    display: "block",
    borderRadius: "14px",
    objectFit: "cover",
  },
  removeMediaButton: {
    position: "absolute",
    top: "10px",
    right: "10px",
    padding: "8px 12px",
    borderRadius: "999px",
    border: "none",
    backgroundColor: "rgba(0,0,0,0.6)",
    color: "#fff",
    cursor: "pointer",
    fontSize: "13px",
  },
  textarea: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    backgroundColor: "var(--surface)",
    color: "var(--text)",
    fontSize: "13px",
    fontFamily: "inherit",
    outline: "none",
    minHeight: "90px",
    resize: "vertical",
    transition: "border-color 0.2s",
  },

  twoColumnGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },

  formActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    marginTop: "8px",
  },

  primaryBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    backgroundColor: "var(--primary)",
    color: "var(--cta-text)",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
    transition: "opacity 0.2s",
  },

  secondaryBtn: {
    padding: "10px 16px",
    backgroundColor: "transparent",
    color: "var(--text-h)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
    transition: "background 0.2s",
  },

  messageBox: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "16px",
  },
};

export default CreateJob;
