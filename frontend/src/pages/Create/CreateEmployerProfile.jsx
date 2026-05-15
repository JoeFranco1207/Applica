import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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
  "Soccsksargen",
  "Zamboanga",
];

const companySizes = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001+",
];

const industries = [
  "Technology",
  "Finance",
  "Healthcare",
  "Retail",
  "Manufacturing",
  "Education",
  "Hospitality",
  "Transportation",
  "Real Estate",
  "Energy",
  "Telecommunications",
  "Other",
];

const CreateEmployerProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: "",
    companyDescription: "",
    companyLocation: {
      region: "",
      city: "",
      barangay: "",
      otherDetails: "",
    },
    companySize: "",
    industry: "",
    website: "",
    contactNumber: "",
    dateEstablished: "",
  });

  const [companyLogo, setCompanyLogo] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const [mapUrl, setMapUrl] = useState("");

  useEffect(() => {
    const location = `
      ${formData.companyLocation.otherDetails}
      ${formData.companyLocation.barangay}
      ${formData.companyLocation.city}
      ${formData.companyLocation.region}
    `;

    const encodedLocation = encodeURIComponent(location);

    setMapUrl(
      `https://maps.google.com/maps?q=${encodedLocation}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    );
  }, [formData.companyLocation]);

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

    if (name.startsWith("companyLocation.")) {
      const locationField = name.split(".")[1];

      setFormData((prev) => ({
        ...prev,
        companyLocation: {
          ...prev.companyLocation,
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

  const handleLogoChange = (e) => {
    const file = e.target.files[0];

    if (file && file.type.startsWith("image/")) {
      setCompanyLogo(file);
    } else {
      showMessage("Please select a valid image file", "error");
    }
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

      const formDataToSend = new FormData();

      formDataToSend.append(
        "companyName",
        formData.companyName
      );

      formDataToSend.append(
        "companyDescription",
        formData.companyDescription
      );

      formDataToSend.append(
        "companyLocation",
        JSON.stringify(formData.companyLocation)
      );

      formDataToSend.append(
        "companySize",
        formData.companySize
      );

      formDataToSend.append(
        "industry",
        formData.industry
      );

      formDataToSend.append(
        "website",
        formData.website
      );

      formDataToSend.append(
        "contactNumber",
        formData.contactNumber
      );

      formDataToSend.append(
        "dateEstablished",
        formData.dateEstablished
      );

      if (companyLogo) {
        formDataToSend.append(
          "companyLogo",
          companyLogo
        );
      }

      await axios.put(
        "http://localhost:8000/api/employer/profile",
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      showMessage(
        "Company profile created successfully!",
        "success"
      );

      setTimeout(() => {
        navigate("/");
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

          <h2 style={styles.logoText}>Applica</h2>
        </div>

        <button style={styles.backBtn} onClick={() => navigate("/create")}>
          ← Back
        </button>
      </nav>

      {/* MAIN */}
      <div style={styles.main}>
        <div style={styles.card}>
          {/* LEFT */}
          <div style={styles.leftSide}>
            <h1 style={styles.title}>
              Create Company Profile
            </h1>

            <p style={styles.subtitle}>
              Complete your employer information
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
              {/* Logo */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Company Logo
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  style={styles.input}
                />
              </div>

              {/* Company Name */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Company Name
                </label>

                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="Enter company name"
                  style={styles.input}
                  required
                />
              </div>

              {/* Description */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Company Description
                </label>

                <textarea
                  name="companyDescription"
                  value={formData.companyDescription}
                  onChange={handleInputChange}
                  placeholder="Tell us about your company"
                  style={styles.textarea}
                />
              </div>

              {/* Industry */}
              <div style={styles.grid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Industry
                  </label>

                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    style={styles.input}
                  >
                    <option value="">
                      Select Industry
                    </option>

                    {industries.map((industry) => (
                      <option
                        key={industry}
                        value={industry}
                      >
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Company Size
                  </label>

                  <select
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleInputChange}
                    style={styles.input}
                  >
                    <option value="">
                      Select Size
                    </option>

                    {companySizes.map((size) => (
                      <option
                        key={size}
                        value={size}
                      >
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Website */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Website
                </label>

                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  style={styles.input}
                />
              </div>

              {/* Contact */}
              <div style={styles.grid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Contact Number
                  </label>

                  <input
                    type="text"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    placeholder="09xxxxxxxxx"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Established
                  </label>

                  <input
                    type="date"
                    name="dateEstablished"
                    value={formData.dateEstablished}
                    onChange={handleInputChange}
                    style={styles.input}
                  />
                </div>
              </div>

              {/* LOCATION */}
              <h2 style={styles.locationTitle}>
                Company Location
              </h2>

              <div style={styles.grid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Region
                  </label>

                  <select
                    name="companyLocation.region"
                    value={
                      formData.companyLocation.region
                    }
                    onChange={handleInputChange}
                    style={styles.input}
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
                    name="companyLocation.city"
                    value={
                      formData.companyLocation.city
                    }
                    onChange={handleInputChange}
                    placeholder="City"
                    style={styles.input}
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
                    name="companyLocation.barangay"
                    value={
                      formData.companyLocation
                        .barangay
                    }
                    onChange={handleInputChange}
                    placeholder="Barangay"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Other Details
                  </label>

                  <input
                    type="text"
                    name="companyLocation.otherDetails"
                    value={
                      formData.companyLocation
                        .otherDetails
                    }
                    onChange={handleInputChange}
                    placeholder="Street / Building"
                    style={styles.input}
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
                  disabled={loading}
                >
                  {loading
                    ? "Creating..."
                    : "Create Profile"}
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
    maxWidth: "1100px",
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
    minHeight: "120px",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.15)",
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
    border: "2px solid rgba(255,255,255,0.1)",
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

export default CreateEmployerProfile;