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
    responsibilities: "",
    qualifications: "",
    benefits: "",
    location: "",
    salary: "",
    salaryMin: "",
    salaryMax: "",
    salaryFrequency: "monthly",
    employmentType: "Full-time",
    remoteType: "Remote",
    externalLink: "",
  });
  const [jobMedia, setJobMedia] = useState([]);
  const [mediaPreview, setMediaPreview] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [activeJobCount, setActiveJobCount] = useState(0);
  const [descriptionWords, setDescriptionWords] = useState(0);
  const [requirementsWords, setRequirementsWords] = useState(0);

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
        setIsPremium(!!freshUser.premiumAIAccess);
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

  const getWordCount = (text = "") => {
    return typeof text !== "string"
      ? 0
      : text
          .trim()
          .split(/\s+/)
          .filter(Boolean).length;
  };

  const fetchEmployerJobCount = async (token) => {
    try {
      const response = await axios.get("http://localhost:8000/api/employer/my-jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const jobs = response.data?.data;
      if (Array.isArray(jobs)) {
        setActiveJobCount(jobs.length);
      }
    } catch (error) {
      console.error("Unable to fetch employer job count", error);
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

      const freshUser = await refreshAuthenticatedUser(token);
      if (freshUser?.role === "employer") {
        await fetchEmployerJobCount(token);
      }
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
  const descriptionWordLimit = isPremium ? 300 : 100;
  const requirementsWordLimit = isPremium ? 150 : 60;
  const activeJobLimitText = isPremium ? "Unlimited" : "1";
  const activeJobDurationText = isPremium ? "Your premium job stays active for 2 months." : "Free jobs stay active for 2 weeks.";

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    const videoFiles = files.filter((file) => file.type.startsWith("video/"));

    if (videoFiles.length > 0) {
      const file = videoFiles[0];
      const base64Data = await readFileAsDataUrl(file);
      setJobMedia([
        {
          type: "video",
          data: base64Data,
          contentType: file.type,
          fileName: file.name,
        },
      ]);
      setMediaPreview([base64Data]);
      return;
    }

    if (!imageFiles.length) return;

    const previews = await Promise.all(imageFiles.map((file) => readFileAsDataUrl(file)));
    const mediaItems = imageFiles.map((file, index) => ({
      type: "image",
      data: previews[index],
      contentType: file.type,
      fileName: file.name,
    }));

    setJobMedia(mediaItems);
    setMediaPreview(previews);
  };

  const removeMedia = () => {
    setJobMedia([]);
    setMediaPreview([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const formattedValue = ["description", "requirements", "responsibilities", "qualifications", "benefits"].includes(name)
      ? autoBulletText(value)
      : value;

    if (name === "description") {
      setDescriptionWords(getWordCount(formattedValue));
    }
    if (name === "requirements") {
      setRequirementsWords(getWordCount(formattedValue));
    }

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

      if (descriptionWords > descriptionWordLimit) {
        showMessage(
          `Job description may only contain up to ${descriptionWordLimit} words on your current plan.`,
          "error"
        );
        setLoading(false);
        return;
      }

      if (requirementsWords > requirementsWordLimit) {
        showMessage(
          `Requirements may only contain up to ${requirementsWordLimit} words on your current plan.`,
          "error"
        );
        setLoading(false);
        return;
      }

      const salaryMinValue = formData.salaryMin ? parseInt(formData.salaryMin, 10) : undefined;
      const salaryMaxValue = formData.salaryMax ? parseInt(formData.salaryMax, 10) : undefined;

      if (
        salaryMinValue !== undefined &&
        salaryMaxValue !== undefined &&
        salaryMinValue > salaryMaxValue
      ) {
        showMessage("Salary minimum cannot be greater than salary maximum.", "error");
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
        responsibilities: formData.responsibilities,
        qualifications: formData.qualifications,
        benefits: formData.benefits,
        location: formData.location,
        salary: salaryMinValue
          ? salaryMinValue
          : formData.salary
          ? parseInt(formData.salary, 10)
          : 0,
        salaryMin: salaryMinValue,
        salaryMax: salaryMaxValue,
        salaryFrequency: formData.salaryFrequency,
        employmentType: formData.employmentType || "Full-time",
        remoteType: formData.remoteType || "Remote",
        externalLink: normalizedLink || undefined,
        media: jobMedia.length ? jobMedia : undefined,
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

      // Optimistic UI: publish the newly created job to a small client cache
      // and dispatch a window event so Browse can pick it up immediately.
      const createdJob = response.data?.data || response.data || null;
      try {
        if (createdJob) {
          // Save to local cache for later merging (survives reload)
          const key = "applica:optimisticJobs";
          const existing = JSON.parse(localStorage.getItem(key) || "[]");
          localStorage.setItem(key, JSON.stringify([createdJob, ...existing]));

          // Dispatch an in-window event for immediate update
          try {
            window.dispatchEvent(new CustomEvent("applica:newJob", { detail: createdJob }));
          } catch (evErr) {
            // Fallback for environments that don't support CustomEvent constructor
            const evt = document.createEvent("CustomEvent");
            evt.initCustomEvent("applica:newJob", true, true, createdJob);
            window.dispatchEvent(evt);
          }
        }
      } catch (cacheErr) {
        console.error("Failed to cache optimistic job:", cacheErr);
      }

      showMessage("Job posted successfully!", "success");
      setTimeout(() => {
        navigate("/explore");
      }, 1200);
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
    <div className="page-container" style={styles.container}>
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

          {!authChecking && isEmployer && (
            <div style={styles.planBanner}>
              <div>
                <strong>{isPremium ? "Premium employer" : "Free employer"}</strong>
                <p style={styles.planBannerText}>
                  {isPremium
                    ? `Unlimited active jobs, up to ${descriptionWordLimit} words for job descriptions, and up to ${requirementsWordLimit} words for requirements.`
                    : `Up to ${activeJobLimitText} active job (${activeJobCount} currently active). Free employers are limited to ${descriptionWordLimit} words in descriptions and ${requirementsWordLimit} words in requirements.`}
                </p>
                <p style={styles.planBannerTextSmaller}>{activeJobDurationText}</p>
              </div>
              {!isPremium && (
                <button
                  type="button"
                  style={styles.upgradeBtn}
                  onClick={() => navigate('/ai-premium')}
                >
                  Upgrade to Premium
                </button>
              )}
            </div>
          )}

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
              <div style={styles.fieldHint}>
                {descriptionWords}/{descriptionWordLimit} words
                {descriptionWords > descriptionWordLimit && (
                  <span style={styles.errorHint}> — too many words for your current plan.</span>
                )}
              </div>
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
              <div style={styles.fieldHint}>
                {requirementsWords}/{requirementsWordLimit} words
                {requirementsWords > requirementsWordLimit && (
                  <span style={styles.errorHint}> — too many words for your current plan.</span>
                )}
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Responsibilities</label>
              <textarea
                name="responsibilities"
                value={formData.responsibilities}
                onChange={handleInputChange}
                placeholder="Describe the main responsibilities of this role..."
                style={styles.textarea}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Qualifications</label>
              <textarea
                name="qualifications"
                value={formData.qualifications}
                onChange={handleInputChange}
                placeholder="List key qualifications and preferred skills..."
                style={styles.textarea}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Benefits</label>
              <textarea
                name="benefits"
                value={formData.benefits}
                onChange={handleInputChange}
                placeholder="Mention benefits, perks, or compensation details..."
                style={styles.textarea}
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
                <label style={styles.label}>Salary range</label>
                <div style={styles.salaryPanel}>
                  <div style={styles.salaryInputsRow}>
                    <div style={styles.salaryColumn}>
                      <span style={styles.salaryLabel}>Min</span>
                      <input
                        type="number"
                        name="salaryMin"
                        value={formData.salaryMin}
                        onChange={handleInputChange}
                        placeholder="e.g., 500"
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.salaryColumn}>
                      <span style={styles.salaryLabel}>Max</span>
                      <input
                        type="number"
                        name="salaryMax"
                        value={formData.salaryMax}
                        onChange={handleInputChange}
                        placeholder="e.g., 20000"
                        style={styles.input}
                      />
                    </div>
                  </div>
                  <div style={styles.salaryFrequencyRow}>
                    <label style={styles.salaryLabel}>Payment cycle</label>
                    <select
                      name="salaryFrequency"
                      value={formData.salaryFrequency}
                      onChange={handleInputChange}
                      style={styles.select}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="weekly">Weekly</option>
                      <option value="daily">Daily</option>
                      <option value="one-time">One-time</option>
                    </select>
                  </div>
                  <span style={styles.helpText}>
                    Add a minimum and maximum salary, then choose how it is paid.
                  </span>
                </div>
              </div>
            </div>

            <div style={styles.twoColumnGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Employment type</label>
                <select
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleInputChange}
                  style={styles.select}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Freelance">Freelance</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Remote / work type</label>
                <select
                  name="remoteType"
                  value={formData.remoteType}
                  onChange={handleInputChange}
                  style={styles.select}
                >
                  <option value="Remote">Remote</option>
                  <option value="On-site">On-site</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
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
              <label style={styles.label}>Job image(s) or video</label>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleMediaUpload}
                style={styles.fileInput}
              />
              {mediaPreview.length > 0 && (
                <div style={styles.mediaPreviewContainer}>
                  {jobMedia[0]?.type === "video" ? (
                    <video
                      src={mediaPreview[0]}
                      style={styles.mediaPreviewItem}
                      controls
                    />
                  ) : (
                    <div style={styles.mediaGrid}>
                      {mediaPreview.map((src, index) => (
                        <img
                          key={`${src}-${index}`}
                          src={src}
                          alt={`Job media preview ${index + 1}`}
                          style={styles.mediaPreviewItem}
                        />
                      ))}
                    </div>
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
  mediaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "8px",
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
  salaryPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: "18px",
    borderRadius: "14px",
    border: "1px solid rgba(59, 130, 246, 0.16)",
    backgroundColor: "rgba(59, 130, 246, 0.06)",
    width: "100%",
    boxSizing: "border-box",
  },
  salaryInputsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },
  salaryFrequencyRow: {
    display: "grid",
    gap: "8px",
  },
  salaryColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: 0,
  },
  salaryLabel: {
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--text-muted)",
  },
  select: {
    width: "100%",
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
  helpText: {
    fontSize: "12px",
    color: "var(--text-muted)",
    marginTop: "6px",
    maxWidth: "100%",
  },
  fieldHint: {
    fontSize: "12px",
    color: "var(--text-muted)",
    marginTop: "6px",
  },
  errorHint: {
    color: "#dc2626",
    marginLeft: "6px",
  },
  planBanner: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "14px 18px",
    borderRadius: "14px",
    border: "1px solid rgba(59, 130, 246, 0.18)",
    backgroundColor: "rgba(59, 130, 246, 0.08)",
    marginBottom: "18px",
  },
  planBannerText: {
    fontSize: "13px",
    color: "var(--text)",
    lineHeight: 1.5,
    marginTop: "6px",
  },
  planBannerTextSmaller: {
    fontSize: "12px",
    color: "var(--text-muted)",
    lineHeight: 1.4,
    marginTop: "4px",
  },
  upgradeBtn: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "var(--primary)",
    color: "var(--cta-text)",
    fontWeight: 600,
    cursor: "pointer",
    transition: "transform 0.2s, background-color 0.2s",
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

