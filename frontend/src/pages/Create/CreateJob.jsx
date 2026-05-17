import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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

      showMessage("Job created successfully!", "success");

      setTimeout(() => {
        navigate("/profile");
      }, 1500);
    } catch (error) {
      showMessage(
        error.response?.data?.message ||
          "Error creating job",
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
      {/* MAIN */}
      <div style={styles.main}>
        <div style={styles.card}>
          <div style={styles.leftSide}>
            <h1 style={styles.title}>Create Job Posting</h1>

            <p style={styles.subtitle}>
              Post a new job opportunity for your company
            </p>

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
              {/* Job Title */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Job Title *
                </label>
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

              {/* Description */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Job Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the job role and responsibilities"
                  style={styles.textarea}
                  required
                />
              </div>

              {/* Requirements */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Requirements *
                </label>
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  placeholder="List key requirements and qualifications"
                  style={styles.textarea}
                  required
                />
              </div>

              {/* Location */}
              <div style={styles.grid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Location
                  </label>
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
                  <label style={styles.label}>
                    Salary (₱)
                  </label>
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

              {/* BUTTONS */}
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
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Post Job"}
                </button>
              </div>
            </form>
          </div>
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
    borderBottom: "1px solid rgba(255,255,255,0.1)",
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
    border: "1px solid rgba(255,255,255,0.3)",
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
    maxWidth: "900px",
    background: "rgba(255,255,255,0.08)",
    borderRadius: "24px",
    backdropFilter: "blur(12px)",
    padding: "40px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
  },

  leftSide: {
    width: "100%",
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
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    fontSize: "1rem",
    outline: "none",
  },

  textarea: {
    minHeight: "100px",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    resize: "vertical",
    fontSize: "1rem",
    outline: "none",
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
    border: "1px solid rgba(255,255,255,0.2)",
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
};

export default CreateJob;
