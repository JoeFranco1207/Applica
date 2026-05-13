import { useState, useEffect } from "react";
import axios from "axios";

export default function Signup() {
  const [isLogin, setIsLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= 768
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);

    return () =>
      window.removeEventListener("resize", handleResize);
  }, []);

  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSignupChange = (e) => {
    setSignupData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLoginChange = (e) => {
    setLoginData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (signupData.password !== signupData.confirmPassword) {
      return setMessage("Passwords do not match.");
    }

    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:8000/api/signup",
        {
          fullName: signupData.fullName,
          email: signupData.email,
          password: signupData.password,
        }
      );

      setMessage(
        res.data.message ||
          "Account created successfully."
      );

      setSignupData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:8000/api/login",
        {
          email: loginData.email,
          password: loginData.password,
        }
      );

      setMessage(
        res.data.message ||
          "Login successful."
      );

      setLoginData({
        email: "",
        password: "",
      });
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
          "Invalid credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = (mode) => {
    setIsLogin(mode);
    setMessage("");
  };

  return (
    <div
      style={{
        ...styles.page,
        flexDirection: isMobile ? "column" : "row",
      }}
    >
      {/* LEFT SIDE */}
      <div
        style={{
          ...styles.leftSection,
          width: isMobile ? "100%" : "50%",
          minHeight: isMobile ? "200px" : "100vh",
        }}
      >
        <div style={styles.brand}>
          <div style={styles.logoPlaceholder}>
            <img 
              src="/src/assets/Applica_Logo.png" 
              alt="Applica Logo"
              style={styles.logo}
            />
          </div>
          <h1
            style={{
              ...styles.brandTitle,
              fontSize: isMobile ? "28px" : "52px",
              textAlign: isMobile ? "center" : "left",
            }}
          >
            Build Your Future Professionally
          </h1>

          <p
            style={{
              ...styles.brandText,
              textAlign: isMobile ? "center" : "left",
            }}
          >
            Join thousands of professionals, creators, and ambitious individuals transforming their careers on our modern platform.
          </p>

          <div style={styles.features}>
            <div style={styles.featureItem}>
              <span style={styles.checkmark}>✓</span>
              <span>Career growth opportunities</span>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.checkmark}>✓</span>
              <span>Professional networking</span>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.checkmark}>✓</span>
              <span>Industry connections</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div
        style={{
          ...styles.rightSection,
          width: isMobile ? "100%" : "50%",
          padding: isMobile ? "24px" : "60px 50px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* SIGNUP FORM */}
        <form
          style={{
            ...styles.card,
            padding: isMobile ? "32px" : "48px",
            transform: isLogin ? "translateX(100%)" : "translateX(0)",
            opacity: isLogin ? 0 : 1,
            transition: "all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
            position: "absolute",
            width: isMobile ? "calc(100% - 64px)" : "calc(100% - 96px)",
            maxWidth: "480px",
          }}
          onSubmit={handleSignupSubmit}
        >
          <div style={styles.topHeader}>
            <h2 style={styles.heading}>Create Account</h2>
            <p style={styles.subHeading}>
              Start your professional journey with a secure account
            </p>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Full Name *</label>
            <input
              type="text"
              name="fullName"
              placeholder="John Doe"
              value={signupData.fullName}
              onChange={handleSignupChange}
              onFocus={() => setFocusedField("fullName")}
              onBlur={() => setFocusedField(null)}
              style={{
                ...styles.input,
                borderColor: focusedField === "fullName" ? "#2563eb" : "#d0d0d0",
                boxShadow: focusedField === "fullName" ? "0 0 0 3px rgba(37, 99, 235, 0.1)" : "none",
              }}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address *</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={signupData.email}
              onChange={handleSignupChange}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              style={{
                ...styles.input,
                borderColor: focusedField === "email" ? "#2563eb" : "#d0d0d0",
                boxShadow: focusedField === "email" ? "0 0 0 3px rgba(37, 99, 235, 0.1)" : "none",
              }}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password *</label>
            <div style={{
              ...styles.passwordWrapper,
              borderColor: focusedField === "password" ? "#2563eb" : "#d0d0d0",
              boxShadow: focusedField === "password" ? "0 0 0 3px rgba(37, 99, 235, 0.1)" : "none",
            }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Create a strong password"
                value={signupData.password}
                onChange={handleSignupChange}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                style={styles.passwordInput}
                required
              />
              <button
                type="button"
                style={styles.showButton}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password *</label>
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm your password"
              value={signupData.confirmPassword}
              onChange={handleSignupChange}
              onFocus={() => setFocusedField("confirmPassword")}
              onBlur={() => setFocusedField(null)}
              style={{
                ...styles.input,
                borderColor: focusedField === "confirmPassword" ? "#2563eb" : "#d0d0d0",
                boxShadow: focusedField === "confirmPassword" ? "0 0 0 3px rgba(37, 99, 235, 0.1)" : "none",
              }}
              required
            />
          </div>

          {message && (
            <div style={{
              ...styles.messageBox,
              backgroundColor: message.includes("successfully") || message.includes("Account created") ? "#f0fdf4" : "#fef2f2",
              color: message.includes("successfully") || message.includes("Account created") ? "#15803d" : "#dc2626",
              borderLeftColor: message.includes("successfully") || message.includes("Account created") ? "#22c55e" : "#ef4444",
            }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            style={styles.submitButton}
            disabled={loading}
            onMouseEnter={(e) => !loading && (e.target.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => (e.target.style.transform = "translateY(0)")}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p style={styles.footerText}>
            Already have an account?{" "}
            <span style={styles.link} onClick={() => toggleMode(true)}>
              Sign in
            </span>
          </p>
        </form>

        {/* LOGIN FORM */}
        <form
          style={{
            ...styles.card,
            padding: isMobile ? "32px" : "48px",
            transform: isLogin ? "translateX(0)" : "translateX(-100%)",
            opacity: isLogin ? 1 : 0,
            transition: "all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
            position: "absolute",
            width: isMobile ? "calc(100% - 64px)" : "calc(100% - 96px)",
            maxWidth: "480px",
          }}
          onSubmit={handleLoginSubmit}
        >
          <div style={styles.topHeader}>
            <h2 style={styles.heading}>Sign In</h2>
            <p style={styles.subHeading}>
              Welcome back to your professional platform
            </p>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address *</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={loginData.email}
              onChange={handleLoginChange}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              style={{
                ...styles.input,
                borderColor: focusedField === "email" ? "#2563eb" : "#d0d0d0",
                boxShadow: focusedField === "email" ? "0 0 0 3px rgba(37, 99, 235, 0.1)" : "none",
              }}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password *</label>
            <div style={{
              ...styles.passwordWrapper,
              borderColor: focusedField === "password" ? "#2563eb" : "#d0d0d0",
              boxShadow: focusedField === "password" ? "0 0 0 3px rgba(37, 99, 235, 0.1)" : "none",
            }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={loginData.password}
                onChange={handleLoginChange}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                style={styles.passwordInput}
                required
              />
              <button
                type="button"
                style={styles.showButton}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {message && (
            <div style={{
              ...styles.messageBox,
              backgroundColor: message.includes("successful") ? "#f0fdf4" : "#fef2f2",
              color: message.includes("successful") ? "#15803d" : "#dc2626",
              borderLeftColor: message.includes("successful") ? "#22c55e" : "#ef4444",
            }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            style={styles.submitButton}
            disabled={loading}
            onMouseEnter={(e) => !loading && (e.target.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => (e.target.style.transform = "translateY(0)")}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p style={styles.footerText}>
            Don't have an account?{" "}
            <span style={styles.link} onClick={() => toggleMode(false)}>
              Create account
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    backgroundColor: "#ffffff",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    margin: 0,
    padding: 0,
  },

  leftSection: {
    background:
      "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "60px",
    position: "relative",
    overflow: "hidden",
  },

  logoPlaceholder: {
    marginBottom: "40px",
    display: "flex",
    justifyContent: "flex-start",
  },

  logo: {
    maxWidth: "140px",
    height: "auto",
    display: "block",
    filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1))",
    backgroundColor: "transparent",
    objectFit: "contain",
  },

  brand: {
    maxWidth: "560px",
  },

  brandTitle: {
    color: "#ffffff",
    fontWeight: "800",
    lineHeight: "1.2",
    marginBottom: "24px",
    letterSpacing: "-1px",
  },

  brandText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: "18px",
    lineHeight: "1.8",
    marginBottom: "40px",
  },

  features: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "rgba(255, 255, 255, 0.95)",
    fontSize: "15px",
  },

  checkmark: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: "50%",
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontWeight: "bold",
    color: "#ffffff",
  },

  rightSection: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },

  card: {
    width: "100%",
    maxWidth: "480px",
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
    border: "1px solid #f0f0f0",
  },

  topHeader: {
    marginBottom: "36px",
  },

  heading: {
    fontSize: "36px",
    fontWeight: "800",
    color: "#000000",
    marginBottom: "10px",
    letterSpacing: "-1px",
  },

  subHeading: {
    color: "#555555",
    fontSize: "16px",
    lineHeight: "1.6",
    fontWeight: "400",
  },

  inputGroup: {
    marginBottom: "24px",
  },

  label: {
    display: "block",
    marginBottom: "10px",
    color: "#000000",
    fontWeight: "600",
    fontSize: "14px",
    letterSpacing: "0.3px",
  },

  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1.5px solid #d0d0d0",
    fontSize: "15px",
    outline: "none",
    backgroundColor: "#ffffff",
    boxSizing: "border-box",
    transition: "all 0.3s ease",
    fontFamily: "inherit",
    color: "#000000",
  },

  passwordWrapper: {
    display: "flex",
    alignItems: "center",
    border: "1.5px solid #d0d0d0",
    borderRadius: "12px",
    overflow: "hidden",
    backgroundColor: "#ffffff",
    transition: "all 0.3s ease",
  },

  passwordInput: {
    flex: 1,
    padding: "14px 16px",
    border: "none",
    outline: "none",
    fontSize: "15px",
    fontFamily: "inherit",
    color: "#000000",
    backgroundColor: "#ffffff",
  },

  showButton: {
    border: "none",
    background: "transparent",
    padding: "0 16px",
    cursor: "pointer",
    color: "#2563eb",
    fontWeight: "600",
    fontSize: "13px",
    transition: "color 0.2s ease",
  },

  submitButton: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "none",
    background:
      "linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "8px",
    transition: "all 0.3s ease",
    boxShadow: "0 8px 20px rgba(37, 99, 235, 0.25)",
    letterSpacing: "0.3px",
  },

  footerText: {
    textAlign: "center",
    marginTop: "24px",
    color: "#555555",
    fontSize: "14px",
    fontWeight: "500",
  },

  link: {
    color: "#2563eb",
    fontWeight: "700",
    cursor: "pointer",
    transition: "color 0.2s ease",
  },

  messageBox: {
    padding: "14px 16px",
    borderRadius: "12px",
    marginBottom: "20px",
    fontSize: "14px",
    fontWeight: "500",
    borderLeftWidth: "4px",
    borderLeftStyle: "solid",
  },

  divider: {
    display: "flex",
    alignItems: "center",
    margin: "28px 0",
    color: "#999999",
    fontSize: "13px",
  },

  socialButtonsContainer: {
    display: "flex",
    gap: "12px",
  },

  socialButton: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1.5px solid #d0d0d0",
    backgroundColor: "#ffffff",
    color: "#000000",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontFamily: "inherit",
  },
};