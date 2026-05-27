import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch (error) {
      return null;
    }
  });
  const [employerJobs, setEmployerJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getCount = (value) => {
    if (Array.isArray(value)) return value.length;
    if (typeof value === "number") return value;
    if (typeof value === "string" && value !== "" && !Number.isNaN(Number(value))) {
      return Number(value);
    }
    return 0;
  };

  const getJobCount = (job, key, fallbackKeys = []) => {
    const rawValue = job?.[key];
    if (rawValue !== undefined && rawValue !== null) {
      return getCount(rawValue);
    }

    for (const fallbackKey of fallbackKeys) {
      const fallbackValue = job?.[fallbackKey];
      if (fallbackValue !== undefined && fallbackValue !== null) {
        return getCount(fallbackValue);
      }
    }

    return 0;
  };

  const fetchJobs = async (currentToken, currentUser) => {
    if (!currentToken || currentUser?.role !== "employer") return;

    setLoading(true);
    setError("");

    try {
      const response = await axios.get("http://localhost:8000/api/employer/my-jobs", {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      const jobsPayload = response.data?.data || response.data?.jobs || [];
      if (!Array.isArray(jobsPayload)) {
        console.warn("EmployerDashboard: unexpected job response shape", response.data);
      }
      setEmployerJobs(Array.isArray(jobsPayload) ? jobsPayload : []);
    } catch (fetchError) {
      console.error("Error fetching employer jobs:", fetchError?.response?.data || fetchError);
      setError("Unable to load dashboard data. Please refresh the page.");
      setEmployerJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!user && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.warn("EmployerDashboard: failed to parse user from storage", err);
      }
    }

    const currentUser = user || (storedUser ? JSON.parse(storedUser) : null);
    fetchJobs(token, currentUser);
  }, [user]);

  const isEmployer = user?.role === "employer";
  const companyName = user?.companyName || "Your company";

  const totalViews = employerJobs.reduce((sum, job) => sum + getJobCount(job, "views", ["viewCount", "viewsCount"]), 0);
  const totalApplicants = employerJobs.reduce(
    (sum, job) => sum + getJobCount(job, "applicants", ["applicantCount", "applications"]),
    0
  );
  const acceptedApplicants = employerJobs.reduce((sum, job) => {
    const applicants = Array.isArray(job.applicants) ? job.applicants : [];
    return sum + applicants.filter((applicant) => applicant?.status === "accepted").length;
  }, 0);
  const totalLikes = employerJobs.reduce((sum, job) => sum + getJobCount(job, "likes", ["likeCount", "likesCount"]), 0);

  const acceptanceRate = totalApplicants ? Math.round((acceptedApplicants / totalApplicants) * 100) : 0;
  const engagementRate = totalViews ? Math.round((totalLikes / totalViews) * 100) : 0;

  const sortedJobs = [...employerJobs].sort(
    (a, b) => getCount(b.views) - getCount(a.views)
  );
  const topJobs = sortedJobs.slice(0, 4);

  const today = new Date();
  const trendDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return { date, label: date.toLocaleDateString(undefined, { weekday: "short" }), count: 0 };
  });

  employerJobs.forEach((job) => {
    job.applicants?.forEach((applicant) => {
      const appliedAt = applicant.appliedAt ? new Date(applicant.appliedAt) : null;
      if (!appliedAt || Number.isNaN(appliedAt.getTime())) return;

      const dayIndex = trendDays.findIndex((trendDay) =>
        trendDay.date.toDateString() === appliedAt.toDateString()
      );
      if (dayIndex >= 0) {
        trendDays[dayIndex].count += 1;
      }
    });
  });

  const activityMessages = [];
  if (!loading && !error && employerJobs.length) {
    activityMessages.push(
      `Your team received ${totalViews.toLocaleString()} job views across ${employerJobs.length} post${employerJobs.length === 1 ? "" : "s"}.`
    );
    activityMessages.push(
      `${totalApplicants.toLocaleString()} candidate applications were submitted in total.`
    );
    activityMessages.push(`Your overall acceptance rate is ${acceptanceRate}%.`);
    activityMessages.push(`${totalLikes.toLocaleString()} likes were recorded on your job posts.`);
  }

  if (!isEmployer) {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.card}>
          <h1 style={styles.heading}>Employer Dashboard</h1>
          <p style={styles.subtitle}>
            This dashboard is available for employer accounts only.
          </p>
          <button style={styles.ctaButton} onClick={() => navigate("/profile")}>Go to Profile</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <div style={styles.headerRow}>
        <div>
          <p style={styles.overline}>Company analytics</p>
          <h1 style={styles.heading}>{companyName} dashboard</h1>
          <p style={styles.subtitle}>
            Track views, applicants, engagement, and job performance in one place.
          </p>
        </div>
        <button style={styles.refreshButton} onClick={() => {
          const token = localStorage.getItem("token");
          const stored = localStorage.getItem("user");
          const currentUser = stored ? JSON.parse(stored) : null;
          fetchJobs(token, currentUser);
        }}>
          {loading ? "Refreshing..." : "Refresh metrics"}
        </button>
      </div>

      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <p style={styles.metricLabel}>Total job views</p>
          <p style={styles.metricValue}>{totalViews.toLocaleString()}</p>
        </div>
        <div style={styles.metricCard}>
          <p style={styles.metricLabel}>Total applicants</p>
          <p style={styles.metricValue}>{totalApplicants.toLocaleString()}</p>
        </div>
        <div style={styles.metricCard}>
          <p style={styles.metricLabel}>Acceptance rate</p>
          <p style={styles.metricValue}>{acceptanceRate}%</p>
        </div>
        <div style={styles.metricCard}>
          <p style={styles.metricLabel}>Engagement rate</p>
          <p style={styles.metricValue}>{engagementRate}%</p>
        </div>
      </div>

      <div style={styles.dashboardGrid}>
        <section style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Most clicked jobs</h2>
            <span style={styles.sectionBadge}>{topJobs.length} jobs tracked</span>
          </div>
          <div style={styles.jobsList}>
            {topJobs.map((job) => (
              <div key={job._id} style={styles.jobRow}>
                <div>
                  <h3 style={styles.jobTitle}>{job.title}</h3>
                  <p style={styles.jobMeta}>
                    {(job.views?.length || 0).toLocaleString()} views • {(job.applicants?.length || 0).toLocaleString()} applicants
                  </p>
                </div>
                <span style={styles.engagementPill}>{(job.likes?.length || 0).toLocaleString()} likes</span>
              </div>
            ))}
          </div>
        </section>

        <section style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Applicant trends this week</h2>
          </div>
          <div style={styles.chartCard}>
            {trendDays.map((trendDay, index) => {
              const maxCount = Math.max(...trendDays.map((day) => day.count), 1);
              return (
                <div key={index} style={styles.chartRow}>
                  <span style={styles.chartLabel}>{trendDay.label}</span>
                  <div style={styles.chartTrack}>
                    <div
                      style={{
                        ...styles.chartBar,
                        width: `${(trendDay.count / maxCount) * 100}%`,
                      }}
                    />
                  </div>
                  <span style={styles.chartCount}>{trendDay.count}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section style={styles.sectionCard}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Recent activity</h2>
        </div>
        <div style={styles.activityList}>
          {loading ? (
            <div style={styles.activityCard}>
              <p style={styles.activityText}>Loading latest metrics…</p>
            </div>
          ) : error ? (
            <div style={styles.activityCard}>
              <p style={{ ...styles.activityText, color: "#dc2626" }}>{error}</p>
            </div>
          ) : activityMessages.length ? (
            activityMessages.map((item) => (
              <div key={item} style={styles.activityCard}>
                <p style={styles.activityText}>{item}</p>
              </div>
            ))
          ) : (
            <div style={styles.activityCard}>
              <p style={styles.activityText}>No activity yet. Post jobs to start tracking performance.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

const styles = {
  pageContainer: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "28px 22px 40px",
    color: "var(--text)",
  },
  headerRow: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginBottom: 28,
  },
  overline: {
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "0.16em",
    fontSize: 12,
    color: "var(--muted)",
  },
  heading: {
    margin: 0,
    fontSize: 34,
    fontWeight: 700,
    color: "var(--text-h)",
  },
  subtitle: {
    margin: "10px 0 0",
    color: "var(--muted)",
    maxWidth: 680,
    lineHeight: 1.65,
  },
  refreshButton: {
    padding: "10px 18px",
    borderRadius: 999,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text)",
    cursor: "pointer",
    fontWeight: 700,
    minWidth: 150,
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
    marginBottom: 24,
  },
  metricCard: {
    padding: 22,
    borderRadius: 22,
    background: "var(--surface-alt)",
    border: "1px solid var(--border)",
    minHeight: 128,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--muted)",
    marginBottom: 10,
  },
  metricValue: {
    margin: 0,
    fontSize: 34,
    fontWeight: 700,
    color: "var(--text-h)",
  },
  dashboardGrid: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: 16,
    marginBottom: 24,
  },
  sectionCard: {
    padding: 24,
    borderRadius: 24,
    background: "var(--surface-alt)",
    border: "1px solid var(--border)",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 18,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: "var(--text-h)",
  },
  sectionBadge: {
    padding: "6px 12px",
    borderRadius: 999,
    background: "rgba(59, 130, 246, 0.12)",
    color: "#2563eb",
    fontSize: 12,
    fontWeight: 700,
  },
  jobsList: {
    display: "grid",
    gap: 14,
  },
  jobRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 18,
    borderRadius: 18,
    background: "var(--surface)",
    border: "1px solid var(--border)",
  },
  jobTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: "var(--text-h)",
  },
  jobMeta: {
    margin: "6px 0 0",
    color: "var(--muted)",
    fontSize: 13,
  },
  engagementPill: {
    padding: "8px 14px",
    borderRadius: 999,
    background: "rgba(16, 185, 129, 0.12)",
    color: "#10b981",
    fontWeight: 700,
    fontSize: 13,
  },
  chartCard: {
    display: "grid",
    gap: 14,
  },
  chartRow: {
    display: "grid",
    gridTemplateColumns: "110px 1fr 56px",
    alignItems: "center",
    gap: 12,
  },
  chartLabel: {
    fontSize: 13,
    color: "var(--muted)",
  },
  chartTrack: {
    height: 14,
    borderRadius: 999,
    background: "var(--surface)",
    overflow: "hidden",
  },
  chartBar: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #3b82f6, #0ea5e9)",
  },
  chartCount: {
    textAlign: "right",
    fontWeight: 700,
    color: "var(--text-h)",
  },
  activityList: {
    display: "grid",
    gap: 12,
  },
  activityCard: {
    padding: 18,
    borderRadius: 20,
    background: "var(--surface)",
    border: "1px solid var(--border)",
  },
  activityText: {
    margin: 0,
    color: "var(--text)",
    lineHeight: 1.8,
  },
  ctaButton: {
    marginTop: 22,
    padding: "12px 20px",
    borderRadius: 999,
    border: "none",
    backgroundColor: "var(--primary)",
    color: "var(--cta-text)",
    cursor: "pointer",
    fontWeight: 700,
  },
};
