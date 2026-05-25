import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ThemeContext } from "../contexts/ThemeContext";
import { useTranslate } from "../hooks/useTranslate";

export default function AIPremium() {
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext);
  const t = useTranslate();
  const token = localStorage.getItem("token");
  const user = token ? JSON.parse(localStorage.getItem("user") || "{}") : null;

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const plans = [
    {
      id: "monthly",
      name: "Monthly Premium",
      price: "₱99",
      duration: "1 Month",
      features: [
        "Unlimited AI-powered resume generation",
        "Resume match to find best jobs",
        "AI applicant filtering (for employers)",
        "Priority support",
      ],
      popular: false,
    },
    {
      id: "quarterly",
      name: "Quarterly Premium",
      price: "₱249",
      duration: "3 Months",
      features: [
        "Unlimited AI-powered resume generation",
        "Resume match to find best jobs",
        "AI applicant filtering (for employers)",
        "Priority support",
        "20% savings vs monthly",
      ],
      popular: true,
    },
    {
      id: "annual",
      name: "Annual Premium",
      price: "₱799",
      duration: "12 Months",
      features: [
        "Unlimited AI-powered resume generation",
        "Resume match to find best jobs",
        "AI applicant filtering (for employers)",
        "Priority support",
        "33% savings vs monthly",
      ],
      popular: false,
    },
  ];

  const handleSelectPlan = (plan) => {
    if (!token) {
      navigate("/auth");
      return;
    }
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handlePurchase = async (method = "gcash") => {
    if (!selectedPlan || !token) {
      setError("Please select a plan and sign in");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:8000/api/payments/ai-premium",
        { method, plan: selectedPlan.id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const paymentUrl = response.data?.data?.paymentUrl;
      const sourceId = response.data?.data?.sourceId;

      if (sourceId) {
        try {
          localStorage.setItem("aiPremiumSourceId", sourceId);
        } catch (e) {
          console.warn("Failed to save aiPremiumSourceId to localStorage", e);
        }
      }

      if (paymentUrl) {
        window.location.assign(paymentUrl);
      } else {
        setError("Could not start payment. Please try again later.");
      }
    } catch (err) {
      console.error("AI premium checkout error", err);
      setError(
        err.response?.data?.message ||
          "Failed to start payment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: isDarkMode ? "#0f172a" : "#f8fafc",
      padding: "40px 20px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    header: {
      maxWidth: "1200px",
      margin: "0 auto 60px",
      textAlign: "center",
    },
    title: {
      fontSize: "42px",
      fontWeight: "800",
      color: isDarkMode ? "#f1f5f9" : "#0f172a",
      marginBottom: "16px",
      letterSpacing: "-1px",
    },
    subtitle: {
      fontSize: "18px",
      color: isDarkMode ? "#cbd5e1" : "#64748b",
      marginBottom: "8px",
    },
    description: {
      fontSize: "16px",
      color: isDarkMode ? "#94a3b8" : "#78909c",
      maxWidth: "600px",
      margin: "0 auto",
      lineHeight: "1.6",
    },
    plansContainer: {
      maxWidth: "1200px",
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
      gap: "28px",
      marginBottom: "60px",
    },
    planCard: (popular) => ({
      backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
      borderRadius: "16px",
      padding: "32px 24px",
      border: popular
        ? "2px solid #1892aa"
        : isDarkMode
        ? "1px solid #334155"
        : "1px solid #e2e8f0",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      boxShadow: popular
        ? "0 10px 30px rgba(24, 146, 170, 0.15)"
        : isDarkMode
        ? "0 1px 3px rgba(0, 0, 0, 0.3)"
        : "0 1px 3px rgba(0, 0, 0, 0.1)",
      transition: "transform 0.2s, box-shadow 0.2s",
    }),
    popularBadge: {
      position: "absolute",
      top: "-12px",
      right: "24px",
      background: "linear-gradient(90deg, #1892aa 0%, #275791 100%)",
      color: "#fff",
      padding: "6px 16px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: "700",
      letterSpacing: "0.5px",
    },
    planName: {
      fontSize: "20px",
      fontWeight: "800",
      color: isDarkMode ? "#f1f5f9" : "#0f172a",
      marginBottom: "12px",
      marginTop: "0",
    },
    planPrice: {
      fontSize: "36px",
      fontWeight: "900",
      color: "#1892aa",
      marginBottom: "4px",
    },
    planDuration: {
      fontSize: "14px",
      color: isDarkMode ? "#94a3b8" : "#64748b",
      marginBottom: "24px",
    },
    featuresList: {
      listStyle: "none",
      padding: "0",
      margin: "0 0 32px 0",
      flex: 1,
    },
    featureItem: {
      fontSize: "14px",
      color: isDarkMode ? "#cbd5e1" : "#475569",
      padding: "12px 0",
      borderBottom: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    featureIcon: {
      color: "#1892aa",
      fontSize: "18px",
      flexShrink: 0,
    },
    selectButton: (popular) => ({
      padding: "14px 24px",
      borderRadius: "10px",
      border: "none",
      fontWeight: "700",
      fontSize: "16px",
      cursor: "pointer",
      transition: "all 0.2s",
      backgroundColor: popular ? "#1892aa" : "transparent",
      color: popular ? "#fff" : "#1892aa",
      borderWidth: "2px",
      borderStyle: "solid",
      borderColor: "#1892aa",
    }),
    backButton: {
      maxWidth: "1200px",
      margin: "0 auto 40px",
      padding: "0 20px",
    },
    backBtn: {
      background: "transparent",
      border: "none",
      color: isDarkMode ? "#94a3b8" : "#64748b",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
      padding: "8px 12px",
      marginLeft: "-12px",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.backButton}>
        <button
          style={styles.backBtn}
          onClick={() => navigate(-1)}
          title="Go back"
        >
          ← Back
        </button>
      </div>

      <div style={styles.header}>
        <h1 style={styles.title}>AI Premium</h1>
        <p style={styles.subtitle}>Unlock powerful AI features</p>
        <p style={styles.description}>
          Get unlimited AI-powered resume generation, resume matching, and AI
          applicant filtering to accelerate your job search or hiring process.
        </p>
      </div>

      <div style={styles.plansContainer}>
        {plans.map((plan) => (
          <div key={plan.id} style={styles.planCard(plan.popular)}>
            {plan.popular && (
              <div style={styles.popularBadge}>MOST POPULAR</div>
            )}
            <h3 style={styles.planName}>{plan.name}</h3>
            <div style={styles.planPrice}>{plan.price}</div>
            <div style={styles.planDuration}>{plan.duration}</div>

            <ul style={styles.featuresList}>
              {plan.features.map((feature, idx) => (
                <li key={idx} style={styles.featureItem}>
                  <span style={styles.featureIcon}>✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              style={styles.selectButton(plan.popular)}
              onClick={() => handleSelectPlan(plan)}
              disabled={loading}
            >
              {plan.popular ? "Get Started" : "Choose Plan"}
            </button>
          </div>
        ))}
      </div>

      {showPaymentModal && selectedPlan && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onClick={() => setShowPaymentModal(false)}
        >
          <div
            style={{
              backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
              borderRadius: "16px",
              padding: "40px 32px",
              maxWidth: "600px",
              width: "100%",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div
                style={{
                  display: "inline-block",
                  background: "linear-gradient(135deg, #1892aa 0%, #275791 100%)",
                  color: "#fff",
                  padding: "8px 16px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: "700",
                  letterSpacing: "0.5px",
                  marginBottom: "16px",
                }}
              >
                APPLICA AI PREMIUM
              </div>
              <h2
                style={{
                  margin: "0 0 8px",
                  color: isDarkMode ? "#f1f5f9" : "#0f172a",
                  fontSize: "28px",
                  fontWeight: "800",
                }}
              >
                {selectedPlan.name}
              </h2>
              <p
                style={{
                  color: isDarkMode ? "#cbd5e1" : "#64748b",
                  margin: "0",
                  fontSize: "14px",
                }}
              >
                {selectedPlan.duration}
              </p>
            </div>

            {/* Amount Section */}
            <div
              style={{
                textAlign: "center",
                padding: "28px",
                background: isDarkMode
                  ? "rgba(24, 146, 170, 0.1)"
                  : "rgba(24, 146, 170, 0.05)",
                borderRadius: "12px",
                marginBottom: "32px",
                border: isDarkMode
                  ? "1px solid rgba(24, 146, 170, 0.2)"
                  : "1px solid rgba(24, 146, 170, 0.1)",
              }}
            >
              <p
                style={{
                  color: isDarkMode ? "#94a3b8" : "#64748b",
                  margin: "0 0 8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Amount to Pay
              </p>
              <div
                style={{
                  fontSize: "48px",
                  fontWeight: "900",
                  color: "#1892aa",
                  margin: "0",
                  letterSpacing: "-1px",
                }}
              >
                {selectedPlan.price}
              </div>
            </div>

            {/* Payment Method Section */}
            <div style={{ marginBottom: "24px" }}>
              <p
                style={{
                  color: isDarkMode ? "#cbd5e1" : "#64748b",
                  margin: "0 0 16px",
                  fontSize: "13px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Select Payment Method
              </p>

              {error && (
                <div
                  style={{
                    color: "#dc2626",
                    backgroundColor: "#fee2e2",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    fontSize: "14px",
                  }}
                >
                  {error}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <button
                  style={{
                    padding: "16px",
                    borderRadius: "10px",
                    border: "2px solid #1892aa",
                    background: "#1892aa",
                    color: "#fff",
                    fontSize: "16px",
                    fontWeight: "700",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                    transition: "all 0.2s",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                  }}
                  onClick={() => handlePurchase("gcash")}
                  disabled={loading}
                >
                  <span style={{ fontSize: "24px" }}>💳</span>
                  <span>{loading ? "Processing..." : "GCash"}</span>
                </button>
                <button
                  style={{
                    padding: "16px",
                    borderRadius: "10px",
                    border: "2px solid #1892aa",
                    background: "transparent",
                    color: "#1892aa",
                    fontSize: "16px",
                    fontWeight: "700",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                    transition: "all 0.2s",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                  }}
                  onClick={() => handlePurchase("card")}
                  disabled={loading}
                >
                  <span style={{ fontSize: "24px" }}>💳</span>
                  <span>{loading ? "Processing..." : "Card"}</span>
                </button>
              </div>
            </div>

            {/* Cancel Button */}
            <button
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "8px",
                border: "none",
                background: isDarkMode ? "#334155" : "#e2e8f0",
                color: isDarkMode ? "#cbd5e1" : "#475569",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onClick={() => setShowPaymentModal(false)}
              disabled={loading}
            >
              Cancel
            </button>

            {/* Powered by PayMongo */}
            <div
              style={{
                textAlign: "center",
                marginTop: "20px",
                fontSize: "12px",
                color: isDarkMode ? "#64748b" : "#94a3b8",
              }}
            >
              Powered by PayMongo
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
