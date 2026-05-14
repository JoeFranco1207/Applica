import { useState, useEffect } from "react";
import axios from "axios";
import Landing from "./Landing.jsx";

export default function Signup() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(false);
  const [showPassword, setShowPassword] =
    useState(false);

  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= 768
  );

  const [focusedField, setFocusedField] =
    useState(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState("");

  const [loading, setLoading] = useState(false);

  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);

  useEffect(() => {
    // Check if token exists in localStorage on mount
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () =>
      window.removeEventListener(
        "resize",
        handleResize
      );
  }, []);

  const [signupData, setSignupData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

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

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 4000);
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    if (
      signupData.password !==
      signupData.confirmPassword
    ) {
      return showMessage(
        "Passwords do not match.",
        "error"
      );
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:8000/api/auth/Register",
        {
          firstName: signupData.firstName,
          lastName: signupData.lastName,
          email: signupData.email,
          password: signupData.password,
          phoneNumber:
            signupData.phoneNumber,
        }
      );

      setVerificationEmail(signupData.email);
      setShowVerificationModal(true);

      // Send verification code to email
      await handleSendVerificationCode(signupData.email);

      setSignupData({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      showMessage(
        err.response?.data?.message ||
          "Something went wrong.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:8000/api/auth/Login",
        {
          email: loginData.email,
          password: loginData.password,
        }
      );

      // Check if user is already verified
      if (res.data.data?.user?.isVerified) {
        // User is verified, proceed to landing page
        showMessage(
          res.data.message ||
            "Login successful.",
          "success"
        );

        // Store token in localStorage
        if (res.data.data?.token) {
          localStorage.setItem("token", res.data.data.token);
        }

        setIsAuthenticated(true);
      } else {
        // User is not verified, show verification modal
        setVerificationEmail(loginData.email);
        setShowVerificationModal(true);
        
        // Send verification code to email
        await handleSendVerificationCode(loginData.email);
      }

      setLoginData({
        email: "",
        password: "",
      });
    } catch (err) {
      showMessage(
        err.response?.data?.message ||
          "Invalid credentials.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerificationCode = async (email) => {
    try {
      const res = await axios.post(
        "http://localhost:8000/api/auth/sendVerificationCode",
        { email }
      );

      showMessage(
        res.data.message ||
          "Verification code sent to your email.",
        "success"
      );
    } catch (err) {
      showMessage(
        err.response?.data?.message ||
          "Failed to send verification code.",
        "error"
      );
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();

    if (!verificationCode) {
      return showMessage(
        "Please enter the verification code.",
        "error"
      );
    }

    try {
      setVerificationLoading(true);

      const res = await axios.put(
        "http://localhost:8000/api/auth/verifyCode",
        {
          email: verificationEmail,
          code: verificationCode,
        }
      );

      showMessage(
        res.data.message ||
          "Verification successful!",
        "success"
      );

      // Store token in localStorage
      if (res.data.data?.token) {
        localStorage.setItem("token", res.data.data.token);
      }

      setShowVerificationModal(false);
      setVerificationCode("");
      setVerificationEmail("");
      setIsAuthenticated(true);
    } catch (err) {
      showMessage(
        err.response?.data?.message ||
          "Invalid verification code.",
        "error"
      );
    } finally {
      setVerificationLoading(false);
    }
  };

  return isAuthenticated ? (
    <Landing />
  ) : (
    <div
      style={{
        ...styles.page,
        flexDirection: isMobile
          ? "column"
          : "row",
      }}
    >
      <div
        style={{
          ...styles.leftSection,
          width: isMobile
            ? "100%"
            : "50%",
        }}
      >
        <div style={styles.brand}>
          <img
            src="/src/assets/Applica_Logo.png"
            alt="Logo"
            style={styles.logo}
          />

          <h1
            style={{
              ...styles.brandTitle,
              textAlign: isMobile
                ? "center"
                : "left",
            }}
          >
            Build Your Future
            Professionally
          </h1>

          <p
            style={{
              ...styles.brandText,
              textAlign: isMobile
                ? "center"
                : "left",
            }}
          >
            Join thousands of
            professionals transforming
            their careers.
          </p>
        </div>
      </div>

      <div
        style={{
          ...styles.rightSection,
          width: isMobile
            ? "100%"
            : "50%",
        }}
      >
        {!isLogin ? (
          <form
            style={styles.card}
            onSubmit={handleSignupSubmit}
          >
            <h2 style={styles.heading}>
              Create Account
            </h2>

            <Input
              label="First Name"
              name="firstName"
              value={signupData.firstName}
              onChange={
                handleSignupChange
              }
              focusedField={focusedField}
              setFocusedField={
                setFocusedField
              }
            />

            <Input
              label="Last Name"
              name="lastName"
              value={signupData.lastName}
              onChange={
                handleSignupChange
              }
              focusedField={focusedField}
              setFocusedField={
                setFocusedField
              }
            />

            <Input
              label="Email"
              name="email"
              type="email"
              value={signupData.email}
              onChange={
                handleSignupChange
              }
              focusedField={focusedField}
              setFocusedField={
                setFocusedField
              }
            />

            <Input
              label="Phone Number"
              name="phoneNumber"
              value={signupData.phoneNumber}
              onChange={
                handleSignupChange
              }
              focusedField={focusedField}
              setFocusedField={
                setFocusedField
              }
            />

            <PasswordInput
              label="Password"
              value={signupData.password}
              onChange={
                handleSignupChange
              }
              name="password"
              showPassword={
                showPassword
              }
              setShowPassword={
                setShowPassword
              }
            />

            <PasswordInput
              label="Confirm Password"
              value={
                signupData.confirmPassword
              }
              onChange={
                handleSignupChange
              }
              name="confirmPassword"
              showPassword={
                showPassword
              }
              setShowPassword={
                setShowPassword
              }
            />

            {message && (
              <div
                style={{
                  ...styles.messageBox,
                  ...(messageType ===
                  "success"
                    ? styles.successBox
                    : styles.errorBox),
                }}
              >
                <span
                  style={styles.icon}
                >
                  {messageType ===
                  "success"
                    ? "✓"
                    : "!"}
                </span>

                {message}
              </div>
            )}

            <button
              type="submit"
              style={styles.submitButton}
              disabled={loading}
            >
              {loading
                ? "Creating..."
                : "Create Account"}
            </button>

            <p style={styles.footerText}>
              Already have an account?{" "}
              <span
                style={styles.link}
                onClick={() => {
                  setIsLogin(true);
                  setMessage("");
                }}
              >
                Sign In
              </span>
            </p>
          </form>
        ) : (
          <form
            style={styles.card}
            onSubmit={handleLoginSubmit}
          >
            <h2 style={styles.heading}>
              Sign In
            </h2>

            <Input
              label="Email"
              name="email"
              type="email"
              value={loginData.email}
              onChange={
                handleLoginChange
              }
              focusedField={focusedField}
              setFocusedField={
                setFocusedField
              }
            />

            <PasswordInput
              label="Password"
              value={loginData.password}
              onChange={
                handleLoginChange
              }
              name="password"
              showPassword={
                showPassword
              }
              setShowPassword={
                setShowPassword
              }
            />

            {message && (
              <div
                style={{
                  ...styles.messageBox,
                  ...(messageType ===
                  "success"
                    ? styles.successBox
                    : styles.errorBox),
                }}
              >
                <span
                  style={styles.icon}
                >
                  {messageType ===
                  "success"
                    ? "✓"
                    : "!"}
                </span>

                {message}
              </div>
            )}

            <button
              type="submit"
              style={styles.submitButton}
              disabled={loading}
            >
              {loading
                ? "Signing In..."
                : "Sign In"}
            </button>

            <p style={styles.footerText}>
              Don't have an account?{" "}
              <span
                style={styles.link}
                onClick={() => {
                  setIsLogin(false);
                  setMessage("");
                }}
              >
                Create account
              </span>
            </p>
          </form>
        )}
      </div>

      {showVerificationModal && (
        <VerificationModal
          email={verificationEmail}
          verificationCode={verificationCode}
          setVerificationCode={setVerificationCode}
          onSubmit={handleVerifyCode}
          loading={verificationLoading}
          onClose={() => {
            setShowVerificationModal(false);
            setVerificationCode("");
            setVerificationEmail("");
          }}
        />
      )}
    </div>
    );
}

function Input({
  label,
  name,
  value,
  onChange,
  focusedField,
  setFocusedField,
  type = "text",
}) {
  return (
    <div style={styles.inputGroup}>
      <div style={styles.inputWrapper}>
        <label
          style={{
            ...styles.floatingLabel,
            top: value || focusedField === name ? "-8px" : "14px",
            fontSize: value || focusedField === name ? "12px" : "15px",
            color: focusedField === name ? "#2563eb" : "#999",
          }}
        >
          {label}
        </label>

        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required
          onFocus={() =>
            setFocusedField(name)
          }
          onBlur={() =>
            setFocusedField(null)
          }
          style={{
            ...styles.input,
            borderColor:
        focusedField === name
         ? "#2563eb"
         : "#d0d0d0",
          }}
          placeholder=""
        />
      </div>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  name,
  showPassword,
  setShowPassword,
}) {
  return (
    <div style={styles.inputGroup}>
      <div
        style={{
          ...styles.passwordWrapper,
          borderColor: "#d0d0d0",
          position: "relative",
        }}
      >
        <label
          style={{
            ...styles.floatingLabel,
            top: value ? "-8px" : "14px",
            fontSize: value ? "12px" : "15px",
            color: value ? "#2563eb" : "#999",
          }}
        >
          {label}
        </label>

        <input
          type={
            showPassword
              ? "text"
              : "password"
          }
          name={name}
          value={value}
          onChange={onChange}
          required
          style={styles.passwordInput}
          placeholder=""
        />

        <button
          type="button"
          style={styles.showButton}
          onClick={() =>
            setShowPassword(
              !showPassword
            )
          }
        >
          {showPassword
            ? "Hide"
            : "Show"}
        </button>
      </div>
    </div>
  );
}

function VerificationModal({
  email,
  verificationCode,
  setVerificationCode,
  onSubmit,
  loading,
  onClose,
}) {
  const [focusedField, setFocusedField] = useState(null);

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div 
        style={styles.modalContainer}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          style={styles.closeButton}
          onClick={onClose}
        >
          ✕
        </button>

        <div style={styles.modalContent}>
          <h2 style={styles.modalHeading}>
            Verify Your Email
          </h2>

          <p style={styles.modalText}>
            We've sent a verification code to{" "}
            <strong>{email}</strong>
          </p>

          <form onSubmit={onSubmit}>
            <div style={styles.inputGroup}>
              <div style={styles.inputWrapper}>
                <label
                  style={{
                    ...styles.floatingLabel,
                    top:
                      verificationCode ||
                      focusedField === "code"
                        ? "-8px"
                        : "14px",
                    fontSize:
                      verificationCode ||
                      focusedField === "code"
                        ? "12px"
                        : "15px",
                    color:
                      focusedField === "code"
                        ? "#2563eb"
                        : "#999",
                  }}
                >
                  Verification Code
                </label>

                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(
                      e.target.value
                    )
                  }
                  onFocus={() =>
                    setFocusedField("code")
                  }
                  onBlur={() =>
                    setFocusedField(null)
                  }
                  style={{
                    ...styles.input,
                    borderColor:
                      focusedField === "code"
                        ? "#2563eb"
                        : "#d0d0d0",
                  }}
                  placeholder=""
                  maxLength="6"
                />
              </div>
            </div>

            <button
              type="submit"
              style={styles.submitButton}
              disabled={loading}
            >
              {loading
                ? "Verifying..."
                : "Verify Code"}
            </button>
          </form>

          <p style={styles.resendText}>
            Didn't receive the code?{" "}
            <span
              style={styles.resendLink}
              onClick={() =>
                setVerificationCode("")
              }
            >
              Resend
            </span>
          </p>
        </div>
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
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  leftSection: {
    background:
      "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "60px",
  },

  rightSection: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "30px",
    background: "#ffffff",
  },

  brand: {
    maxWidth: "500px",
  },

  logo: {
    width: "120px",
    marginBottom: "30px",
  },

  brandTitle: {
    color: "#fff",
    fontSize: "52px",
    fontWeight: "800",
    lineHeight: "1.1",
    marginBottom: "20px",
  },

  brandText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: "18px",
    lineHeight: "1.7",
  },

  card: {
    width: "100%",
    maxWidth: "470px",
    backgroundColor: "#fff",
    padding: "40px",
    borderRadius: "24px",
    boxShadow:
      "0 20px 50px rgba(0,0,0,0.08)",
    animation: "fadeIn 0.4s ease",
  },

  heading: {
    fontSize: "34px",
    fontWeight: "800",
    marginBottom: "30px",
    color: "#000",
  },

  inputGroup: {
    marginBottom: "18px",
  },

  inputWrapper: {
    position: "relative",
  },

  floatingLabel: {
    position: "absolute",
    left: "16px",
    transition: "all 0.3s ease",
    backgroundColor: "#ffffff",
    paddingLeft: "4px",
    paddingRight: "4px",
    pointerEvents: "none",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "600",
    color: "#111",
  },

input: {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "12px",
  border: "1.5px solid #d0d0d0",
  outline: "none",
  fontSize: "15px",
  transition: "0.3s",
  boxSizing: "border-box",
  backgroundColor: "#ffffff",
  color: "#000000",
},
passwordWrapper: {
  display: "flex",
  alignItems: "center",
  border: "1.5px solid #d0d0d0",
  borderRadius: "12px",
  overflow: "hidden",
  backgroundColor: "#ffffff",
},

passwordInput: {
  flex: 1,
  border: "none",
  outline: "none",
  padding: "14px 16px",
  fontSize: "15px",
  backgroundColor: "#ffffff",
  color: "#000000",
},

  showButton: {
    border: "none",
    background: "transparent",
    padding: "0 16px",
    cursor: "pointer",
    color: "#2563eb",
    fontWeight: "700",
  },

  submitButton: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "12px",
    background:
      "linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)",
    color: "#fff",
    fontWeight: "700",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "10px",
    transition: "0.3s",
  },

  footerText: {
    textAlign: "center",
    marginTop: "24px",
    color: "#666",
  },

  link: {
    color: "#2563eb",
    fontWeight: "700",
    cursor: "pointer",
  },

  messageBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px",
    borderRadius: "12px",
    marginBottom: "18px",
    fontWeight: "600",
    animation:
      "slideDown 0.4s ease forwards",
  },

  successBox: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    border: "1px solid #86efac",
  },

  errorBox: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fca5a5",
  },

  icon: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
    fontWeight: "800",
  },

  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },

  modalContainer: {
    backgroundColor: "#fff",
    padding: "40px",
    borderRadius: "24px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    maxWidth: "450px",
    width: "90%",
    animation: "slideDown 0.3s ease",
    position: "relative",
  },

  closeButton: {
    position: "absolute",
    top: "16px",
    right: "16px",
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#999",
    transition: "0.3s",
    padding: "0",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  modalContent: {
    textAlign: "center",
  },

  modalHeading: {
    fontSize: "28px",
    fontWeight: "800",
    marginBottom: "16px",
    color: "#000",
  },

  modalText: {
    fontSize: "15px",
    color: "#666",
    marginBottom: "28px",
    lineHeight: "1.6",
  },

  resendText: {
    fontSize: "14px",
    color: "#666",
    marginTop: "18px",
  },

  resendLink: {
    color: "#2563eb",
    fontWeight: "700",
    cursor: "pointer",
  },
};