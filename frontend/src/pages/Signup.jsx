import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";

export default function Signup() {
  const navigate = useNavigate();
  const { translate: t } = useLanguage();

  const [isLoading, setIsLoading] =
    useState(true);

  const [isLogin, setIsLogin] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [isMobile, setIsMobile] =
    useState(window.innerWidth <= 768);

  const [focusedField, setFocusedField] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [
    showVerificationModal,
    setShowVerificationModal,
  ] = useState(false);

  const [
    verificationCode,
    setVerificationCode,
  ] = useState("");

  const [
    verificationEmail,
    setVerificationEmail,
  ] = useState("");

  const [
    verificationLoading,
    setVerificationLoading,
  ] = useState(false);

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    if (token) {
      navigate("/");
    }

    setIsLoading(false);
  }, [navigate]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(
        window.innerWidth <= 768
      );
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

  const [signupData, setSignupData] =
    useState({
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    });

  const [loginData, setLoginData] =
    useState({
      email: "",
      password: "",
    });

  const handleSignupChange = (e) => {
    setSignupData((prev) => ({
      ...prev,
      [e.target.name]:
        e.target.value,
    }));
  };

  const handleLoginChange = (e) => {
    setLoginData((prev) => ({
      ...prev,
      [e.target.name]:
        e.target.value,
    }));
  };

  const showMessage = (
    text,
    type
  ) => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 4000);
  };

  const handleSignupSubmit = async (
    e
  ) => {
    e.preventDefault();

    if (
      signupData.password !==
      signupData.confirmPassword
    ) {
      return showMessage(
        t("signup.passwordsMismatch"),
        "error"
      );
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:8000/api/auth/Register",
        {
          firstName:
            signupData.firstName,
          lastName:
            signupData.lastName,
          email: signupData.email,
          password:
            signupData.password,
          phoneNumber:
            signupData.phoneNumber,
        }
      );

      setVerificationEmail(
        signupData.email
      );

      setShowVerificationModal(true);

      await handleSendVerificationCode(
        signupData.email
      );

      showMessage(
        res.data.message ||
          t("signup.accountCreated"),
        "success"
      );

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
          t("signup.somethingWrong"),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (
    e
  ) => {
    e.preventDefault();

    try {
      setLoading(true);

      const deviceInfo = `${navigator.platform} - ${navigator.userAgent}`;
      const res = await axios.post(
        "http://localhost:8000/api/auth/Login",
        {
          email: loginData.email,
          password: loginData.password,
          deviceInfo,
        }
      );

      if (res.data.data?.token) {
        localStorage.setItem(
          "token",
          res.data.data.token
        );

        // Store user data in localStorage
        if (res.data.data.user) {
          localStorage.setItem(
            "user",
            JSON.stringify(res.data.data.user)
          );
        }

        showMessage(
          res.data.message ||
            t("signup.loginSuccess"),
          "success"
        );

        // If the user exists but is NOT verified, show the verification modal
        const loggedUser = res.data.data.user;
        if (loggedUser && !loggedUser.isVerified) {
          setVerificationEmail(loggedUser.email || loginData.email);
          setShowVerificationModal(true);
          await handleSendVerificationCode(loggedUser.email || loginData.email);

          // clear sensitive fields and stop further navigation so user can verify
          setLoginData({ email: "", password: "" });
          return;
        }

        setTimeout(() => {
          const user = res.data.data.user;
          // If user hasn't chosen a role (defaults to 'user'), send them to profile selection
          if (!user || user.role === "user") {
            navigate("/create");
          } else {
            navigate("/");
          }
        }, 1500);
      } else {
        setVerificationEmail(
          loginData.email
        );

        setShowVerificationModal(
          true
        );

        await handleSendVerificationCode(
          loginData.email
        );
      }

      setLoginData({
        email: "",
        password: "",
      });
    } catch (err) {
      if (err.response?.status === 409) {
        showMessage(
          err.response?.data?.message ||
            "This account is already logged in. Please log out from the other device first.",
          "error"
        );
      } else {
        showMessage(
          err.response?.data?.message ||
            "Invalid credentials.",
          "error"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerificationCode =
    async (email) => {
      try {
        const res =
          await axios.post(
            "http://localhost:8000/api/auth/sendVerificationCode",
            { email }
          );

        showMessage(
          res.data.message ||
            "Verification code sent.",
          "success"
        );
      } catch (err) {
        showMessage(
          err.response?.data
            ?.message ||
            "Failed to send verification code.",
          "error"
        );
      }
    };

  const handleVerifyCode = async (
    e
  ) => {
    e.preventDefault();

    if (!verificationCode) {
      return showMessage(
        "Please enter the verification code.",
        "error"
      );
    }

    try {
      setVerificationLoading(
        true
      );

      const res = await axios.put(
        "http://localhost:8000/api/auth/verifyCode",
        {
          email:
            verificationEmail,
          code: verificationCode,
        }
      );

      showMessage(
        res.data.message ||
          "Verification successful!",
        "success"
      );

      if (res.data.data?.token) {
        localStorage.setItem(
          "token",
          res.data.data.token
        );
      }

      setShowVerificationModal(
        false
      );

      setVerificationCode("");
      setVerificationEmail("");

      setTimeout(() => {
        // After verification, backend may return a token + user
        const returned = res.data.data || {};
        if (returned.user) {
          localStorage.setItem("user", JSON.stringify(returned.user));
        }

        if (!returned.user || returned.user.role === "user") {
          navigate("/create");
        } else {
          navigate("/");
        }
      }, 1500);
    } catch (err) {
      showMessage(
        err.response?.data?.message ||
          "Invalid verification code.",
        "error"
      );
    } finally {
      setVerificationLoading(
        false
      );
    }
  };

  if (isLoading) {
    return null;
  }

  return (
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
            onSubmit={
              handleSignupSubmit
            }
          >
            <h2 style={styles.heading}>
              {t("signup.signUpTitle")}
            </h2>

            <Input
              label={t("signup.firstName")}
              name="firstName"
              value={
                signupData.firstName
              }
              onChange={
                handleSignupChange
              }
              focusedField={
                focusedField
              }
              setFocusedField={
                setFocusedField
              }
              autoComplete="given-name"
            />

            <Input
              label={t("signup.lastName")}
              name="lastName"
              value={
                signupData.lastName
              }
              onChange={
                handleSignupChange
              }
              focusedField={
                focusedField
              }
              setFocusedField={
                setFocusedField
              }
              autoComplete="family-name"
            />

            <Input
              label={t("signup.email")}
              name="email"
              type="email"
              value={
                signupData.email
              }
              onChange={
                handleSignupChange
              }
              focusedField={
                focusedField
              }
              setFocusedField={
                setFocusedField
              }
              autoComplete="email"
            />

            <Input
              label={t("signup.phoneNumber")}
              name="phoneNumber"
              value={
                signupData.phoneNumber
              }
              onChange={
                handleSignupChange
              }
              focusedField={
                focusedField
              }
              setFocusedField={
                setFocusedField
              }
              autoComplete="tel"
            />

            <PasswordInput
              label={t("signup.password")}
              value={
                signupData.password
              }
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
              autoComplete="new-password"
            />

            <PasswordInput
              label={t("signup.confirmPassword")}
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
              autoComplete="new-password"
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
              style={
                styles.submitButton
              }
              disabled={loading}
            >
              {loading
                ? t("signup.creating")
                : t("signup.register")}
            </button>

            <p style={styles.footerText}>
              {t("signup.alreadyHaveAccount")} {" "}
              <span
                style={styles.link}
                onClick={() => {
                  setIsLogin(true);
                  setMessage("");
                }}
              >
                {t("signup.login")}
              </span>
            </p>
          </form>
        ) : (
          <form
            style={styles.card}
            onSubmit={
              handleLoginSubmit
            }
          >
            <h2 style={styles.heading}>
              {t("signup.signInTitle")}
            </h2>

            <Input
              label={t("signup.email")}
              name="email"
              type="email"
              value={
                loginData.email
              }
              onChange={
                handleLoginChange
              }
              focusedField={
                focusedField
              }
              setFocusedField={
                setFocusedField
              }
              autoComplete="username"
            />

            <PasswordInput
              label={t("signup.password")}
              value={
                loginData.password
              }
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
              autoComplete="current-password"
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
              style={
                styles.submitButton
              }
              disabled={loading}
            >
              {loading
                ? t("signup.signingIn")
                : t("signup.login")}
            </button>

            <p style={styles.footerText}>
              {t("signup.createAccount")} {" "}
              <span
                style={styles.link}
                onClick={() => {
                  setIsLogin(false);
                  setMessage("");
                }}
              >
                {t("signup.signUpTitle")}
              </span>
            </p>
          </form>
        )}
      </div>

      {showVerificationModal && (
        <VerificationModal
          email={verificationEmail}
          verificationCode={
            verificationCode
          }
          setVerificationCode={
            setVerificationCode
          }
          onSubmit={
            handleVerifyCode
          }
          onResend={() =>
            handleSendVerificationCode(
              verificationEmail || loginData.email
            )
          }
          loading={
            verificationLoading
          }
          onClose={() => {
            setShowVerificationModal(
              false
            );

            setVerificationCode(
              ""
            );

            setVerificationEmail(
              ""
            );
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
  autoComplete,
}) {
  return (
    <div style={styles.inputGroup}>
      <div style={styles.inputWrapper}>
        <label
          style={{
            ...styles.floatingLabel,
            top:
              value ||
              focusedField === name
                ? "-8px"
                : "14px",
            fontSize:
              value ||
              focusedField === name
                ? "12px"
                : "15px",
            color:
              focusedField === name
                ? "#2563eb"
                : "#999",
          }}
        >
          {label}
        </label>

        <input
          type={type}
          name={name}
          value={value}
          placeholder={label}
          autoComplete={autoComplete}
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
  autoComplete,
}) {
  return (
    <div style={styles.inputGroup}>
      <div
        style={{
          ...styles.passwordWrapper,
          position: "relative",
        }}
      >
        <label
          style={{
            ...styles.floatingLabel,
            top: value
              ? "-8px"
              : "14px",
            fontSize: value
              ? "12px"
              : "15px",
            color: value
              ? "#2563eb"
              : "#999",
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
          placeholder={label}
          autoComplete={autoComplete}
          onChange={onChange}
          required
          style={
            styles.passwordInput
          }
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
  onResend,
  loading,
  onClose,
}) {
  return (
    <div
      style={styles.modalOverlay}
      onClick={onClose}
    >
      <div
        style={styles.modalContainer}
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <button
          style={styles.closeButton}
          onClick={onClose}
        >
          ✕
        </button>

        <h2 style={styles.modalHeading}>
          Verify Your Email
        </h2>

        <p style={styles.modalText}>
          We sent a verification code
          to <strong>{email}</strong>
        </p>

        <form onSubmit={onSubmit}>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) =>
              setVerificationCode(
                e.target.value
              )
            }
            style={styles.input}
            placeholder="Enter code"
            maxLength={6}
          />

          <button
            type="submit"
            style={
              styles.submitButton
            }
            disabled={loading}
          >
            {loading
              ? "Verifying..."
              : "Verify Code"}
          </button>
          <div style={{marginTop:12, display:'flex', justifyContent:'center'}}>
            <button
              type="button"
              onClick={onResend}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontWeight: 700
              }}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Resend code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    backgroundColor: "var(--bg)",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "var(--text)",
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
    background: "var(--surface)",
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
    backgroundColor: "var(--surface)",
    padding: "40px",
    borderRadius: "24px",
    boxShadow:
      "var(--shadow)",
    border: "1px solid var(--border)",
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
    backgroundColor: "var(--surface)",
    paddingLeft: "4px",
    paddingRight: "4px",
    pointerEvents: "none",
  },

  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    border:
      "1.5px solid var(--border)",
    outline: "none",
    fontSize: "15px",
    boxSizing: "border-box",
    backgroundColor: "var(--surface-alt)",
    color: "var(--text)",
  },

  passwordWrapper: {
    display: "flex",
    alignItems: "center",
    border:
      "1.5px solid var(--border)",
    borderRadius: "12px",
    overflow: "hidden",
    backgroundColor: "var(--surface-alt)",
  },

  passwordInput: {
    flex: 1,
    border: "none",
    outline: "none",
    padding: "14px 16px",
    fontSize: "15px",
    backgroundColor: "var(--surface-alt)",
    color: "var(--text)",
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
    background: "var(--primary)",
    color: "#fff",
    fontWeight: "700",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "10px",
  },

  footerText: {
    textAlign: "center",
    marginTop: "24px",
    color: "var(--text-muted)",
  },

  link: {
    color: "var(--primary)",
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
    backgroundColor:
      "rgba(255,255,255,0.6)",
    fontWeight: "800",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor:
      "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },

  modalContainer: {
    backgroundColor: "var(--surface)",
    padding: "40px",
    borderRadius: "24px",
    width: "90%",
    maxWidth: "450px",
    position: "relative",
    border: "1px solid var(--border)",
  },

  closeButton: {
    position: "absolute",
    top: "16px",
    right: "16px",
    border: "none",
    background: "none",
    fontSize: "24px",
    cursor: "pointer",
  },

  modalHeading: {
    fontSize: "28px",
    fontWeight: "800",
    marginBottom: "16px",
    color: "var(--text)",
  },

  modalText: {
    fontSize: "15px",
    color: "var(--text-muted)",
    marginBottom: "28px",
    lineHeight: "1.6",
  },
};