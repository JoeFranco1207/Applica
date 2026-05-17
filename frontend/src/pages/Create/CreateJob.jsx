import { useState } from "react";
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
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

      const payload = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        location: formData.location,
        salary: formData.salary ? parseInt(formData.salary) : 0,
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
                  placeholder="e.g., Manila, NCR"
                  style={styles.input}
                />
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
                disabled={loading}
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
