import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function EmployerApplicants() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const [employerJobs, setEmployerJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [showApplicantModal, setShowApplicantModal] = useState(false);
  const [jobActionLoading, setJobActionLoading] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");

  const fetchEmployerJobs = async () => {
    if (!token || user?.role !== "employer") return;

    setLoading(true);
    setError("");

    try {
      const response = await axios.get("http://localhost:8000/api/employer/my-jobs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setEmployerJobs(response.data.data || []);
    } catch (err) {
      console.error("Error fetching employer jobs:", err);
      setError("Unable to load applicant data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployerJobs();
  }, [token, user?.role]);

  const getApplicantUser = (applicant) => {
    if (!applicant) return null;
    if (applicant.user && typeof applicant.user === "object") return applicant.user;
    if (applicant.user) return { _id: applicant.user };
    return applicant;
  };

  const formatDate = (d) => {
    if (!d) return "-";
    const date = new Date(d);
    if (isNaN(date)) return d;
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const openApplicantModal = (applicant, jobId) => {
    setSelectedApplicant({ ...applicant, jobId, applicantUser: getApplicantUser(applicant) });
    setShowApplicantModal(true);
  };

  const closeApplicantModal = () => {
    setSelectedApplicant(null);
    setShowApplicantModal(false);
  };

  const selectedApplicantInfo = selectedApplicant?.applicantUser || getApplicantUser(selectedApplicant);

  const handleApplicantStatusChange = async (jobId, applicantId, status) => {
    if (!token) {
      navigate("/auth");
      return;
    }

    setJobActionLoading(true);

    try {
      const response = await axios.patch(
        `http://localhost:8000/api/employer/my-jobs/${jobId}/applicants/${applicantId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedJob = response.data.data;
      if (updatedJob) {
        setEmployerJobs((prevJobs) =>
          prevJobs.map((job) => (job._id === updatedJob._id ? updatedJob : job))
        );
      } else {
        await fetchEmployerJobs();
      }

      const currentApplicantId =
        selectedApplicant?.applicantUser?._id || selectedApplicant?.user?._id || selectedApplicant?._id;
      if (currentApplicantId === applicantId) {
        setSelectedApplicant((prev) =>
          prev ? { ...prev, status, applicantUser: getApplicantUser(prev) } : prev
        );
      }
    } catch (error) {
      console.error("Error updating applicant status:", error);
      alert(error.response?.data?.message || "Could not update applicant status. Please try again.");
    } finally {
      setJobActionLoading(false);
    }
  };

  const handleApplicantRemove = async (jobId, applicantId) => {
    if (!token) {
      navigate("/auth");
      return;
    }

    setJobActionLoading(true);

    try {
      const response = await axios.delete(
        `http://localhost:8000/api/employer/my-jobs/${jobId}/applicants/${applicantId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedJob = response.data.data;
      if (updatedJob) {
        setEmployerJobs((prevJobs) =>
          prevJobs.map((job) => (job._id === updatedJob._id ? updatedJob : job))
        );
      } else {
        await fetchEmployerJobs();
      }

      const currentApplicantId =
        selectedApplicant?.applicantUser?._id || selectedApplicant?.user?._id || selectedApplicant?._id;
      if (currentApplicantId === applicantId) {
        closeApplicantModal();
      }
    } catch (error) {
      console.error("Error removing applicant:", error);
      alert(error.response?.data?.message || "Could not remove applicant. Please try again.");
    } finally {
      setJobActionLoading(false);
    }
  };

  const getAllApplicants = () => {
    const applicantsByStatus = {
      pending: [],
      reviewing: [],
      accepted: [],
      rejected: [],
    };

    employerJobs.forEach((job) => {
      (job.applicants || []).forEach((applicant) => {
        const applicantUser = applicant.user || applicant;
        const status = applicant.status || "pending";
        applicantsByStatus[status]?.push({
          ...applicant,
          applicantUser,
          jobId: job._id,
          jobTitle: job.title,
          companyName: job.companyName,
        });
      });
    });

    return applicantsByStatus;
  };

  if (!token || user?.role !== "employer") {
    return (
      <div style={styles.container}>
        <div style={styles.headerCard}>
          <h1 style={styles.pageTitle}>Applicants</h1>
          <p style={styles.pageDescription}>
            Only employers can view and manage applications here.
          </p>
          <button style={styles.backButton} onClick={() => navigate("/")}>Go home</button>
        </div>
      </div>
    );
  }

  const applicantsByStatus = getAllApplicants();

  return (
    <div style={styles.container}>
      <div style={styles.headerCard}>
        <div>
          <h1 style={styles.pageTitle}>Applicant Review</h1>
          <p style={styles.pageDescription}>
            Review all applications across your job postings.
          </p>
        </div>
        <button style={styles.backButton} onClick={() => navigate("/profile")}>Back to profile</button>
      </div>

      {loading ? (
        <p style={styles.infoText}>Loading applicant data...</p>
      ) : error ? (
        <p style={{ ...styles.infoText, color: "#dc2626" }}>{error}</p>
      ) : !employerJobs.length ? (
        <p style={styles.infoText}>You have no job postings yet.</p>
      ) : (
        <div style={styles.tabContainer}>
          <div style={styles.tabBar}>
            {[
              { key: "pending", label: "Pending" },
              { key: "reviewing", label: "Reviewing" },
              { key: "accepted", label: "Accepted" },
              { key: "rejected", label: "Rejected" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  ...styles.tabItem,
                  ...(activeTab === key ? styles.tabActive : {}),
                }}
              >
                <div style={styles.tabLabel}>{label}</div>
                <div style={styles.tabCount}>{applicantsByStatus[key].length}</div>
              </button>
            ))}
          </div>

          <div style={styles.tabContent}>
            <div style={{ ...styles.statusSection, flex: "1 1 auto", maxWidth: "100%" }}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>{activeTab === "pending" ? "Applicants" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
                <span style={styles.sectionCount}>{applicantsByStatus[activeTab].length}</span>
              </div>

              {applicantsByStatus[activeTab].length ? (
                <div style={styles.sectionBody}>
                  <div style={{ ...styles.headerRow, position: "sticky", top: 0, zIndex: 3 }}>
                    <div style={styles.headerCellLeft}>Applicant</div>
                    <div style={styles.headerCellCenter}>Submission Time</div>
                    <div style={styles.headerCellRight}>Action</div>
                  </div>
                  {applicantsByStatus[activeTab].map((entry) => {
                    const rowKey = `${entry.jobId}-${entry.applicantUser._id}`;
                    return (
                      <div
                        key={rowKey}
                        style={{
                          ...styles.applicantRowTable,
                          ...(hoveredRow === rowKey ? styles.applicantRowTableHover : {}),
                        }}
                        onMouseEnter={() => setHoveredRow(rowKey)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        <div style={styles.rowLeft}>
                          <input type="checkbox" style={styles.rowCheckbox} />
                          {entry.applicantUser.profilePicture ? (
                            <img src={entry.applicantUser.profilePicture} alt="Applicant" style={styles.applicantAvatar} />
                          ) : (
                            <div style={styles.defaultAvatar}>{(entry.applicantUser.firstName || "").charAt(0)}</div>
                          )}
                          <div style={{ marginLeft: 12 }}>
                            <div style={styles.applicantNameRow}>{entry.applicantUser.firstName} {entry.applicantUser.lastName}</div>
                            <div style={styles.jobReference}>{entry.jobTitle} · {entry.companyName}</div>
                          </div>
                        </div>

                        <div style={styles.rowCenter}>
                          <div style={styles.submissionTime}>{formatDate(entry.appliedAt || entry.updatedAt || entry.createdAt)}</div>
                        </div>

                        <div style={styles.rowRight}>
                          <div style={styles.actionStack}>
                              <button
                                style={styles.viewButton}
                                onClick={() => openApplicantModal(entry, entry.jobId)}
                              >
                                View
                              </button>
                            {activeTab !== "accepted" && (
                              <button
                                style={styles.actionPrimary}
                                disabled={jobActionLoading}
                                onClick={() => handleApplicantStatusChange(entry.jobId, entry.applicantUser._id, "accepted")}
                              >
                                Accept
                              </button>
                            )}
                            {activeTab !== "rejected" && (
                              <button
                                style={styles.actionSecondary}
                                disabled={jobActionLoading}
                                onClick={() => handleApplicantStatusChange(entry.jobId, entry.applicantUser._id, "rejected")}
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={styles.infoText}>No {activeTab} applicants yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showApplicantModal && selectedApplicant && (
        <div style={styles.modalOverlay} onClick={closeApplicantModal}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitleRow}>
                {selectedApplicantInfo?.profilePicture && (
                  <img
                    src={selectedApplicantInfo.profilePicture}
                    alt="Applicant"
                    style={styles.modalAvatar}
                  />
                )}
                <h2 style={styles.modalTitle}>
                  {selectedApplicantInfo?.firstName} {selectedApplicantInfo?.lastName}
                </h2>
              </div>
              <button style={styles.modalClose} onClick={closeApplicantModal}>✕</button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.modalGrid}>
                <div style={styles.profileColumn}>
                  {selectedApplicantInfo?.profilePicture ? (
                    <img src={selectedApplicantInfo.profilePicture} alt="Applicant" style={styles.modalAvatarLarge} />
                  ) : (
                    <div style={styles.defaultAvatarLarge}>{(selectedApplicantInfo?.firstName || "").charAt(0)}</div>
                  )}
                  <h3 style={{ margin: "12px 0 4px", fontSize: 20 }}>{selectedApplicantInfo?.firstName} {selectedApplicantInfo?.lastName}</h3>
                  <div style={{ color: "#64748b", marginBottom: 12 }}>{selectedApplicant.jobTitle || selectedApplicant.jobName || ""}</div>
                  <div style={styles.infoRow}><strong style={styles.infoLabel}>Status</strong><span style={styles.infoValue}>{selectedApplicant.status || "pending"}</span></div>
                  <div style={styles.infoRow}><strong style={styles.infoLabel}>Applied</strong><span style={styles.infoValue}>{formatDate(selectedApplicant.appliedAt || selectedApplicant.updatedAt || selectedApplicant.createdAt)}</span></div>
                  <div style={{ marginTop: 14 }}>{selectedApplicant.jobId && (
                    <>
                      {selectedApplicant.status !== "accepted" && (
                        <button
                          style={styles.acceptButton}
                          disabled={jobActionLoading}
                          onClick={() => handleApplicantStatusChange(selectedApplicant.jobId, selectedApplicantInfo?._id, "accepted")}
                        >
                          Accept
                        </button>
                      )}
                      {selectedApplicant.status !== "rejected" && (
                        <button
                          style={{ ...styles.rejectButton, marginLeft: 8 }}
                          disabled={jobActionLoading}
                          onClick={() => handleApplicantStatusChange(selectedApplicant.jobId, selectedApplicantInfo?._id, "rejected")}
                        >
                          Reject
                        </button>
                      )}
                      <button
                        style={{ ...styles.removeButton, marginLeft: 8 }}
                        disabled={jobActionLoading}
                        onClick={() => {
                          if (window.confirm('Delete this applicant? This cannot be undone.')) {
                            handleApplicantRemove(selectedApplicant.jobId, selectedApplicantInfo?._id);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </>
                  )}</div>
                </div>

                <div style={styles.detailsColumn}>
                  <div style={styles.infoRow}><span style={styles.infoLabel}>Email</span><span style={styles.infoValue}>{selectedApplicantInfo?.email || "—"}</span></div>
                  <div style={styles.infoRow}><span style={styles.infoLabel}>Phone</span><span style={styles.infoValue}>{selectedApplicantInfo?.phoneNumber || "—"}</span></div>
                  <div style={styles.infoRow}><span style={styles.infoLabel}>Location</span><span style={styles.infoValue}>{selectedApplicantInfo?.location ? `${selectedApplicantInfo.location.region || ""}${selectedApplicantInfo.location.city ? ", " + selectedApplicantInfo.location.city : ""}` : "—"}</span></div>
                  {selectedApplicantInfo?.experience && <div style={styles.infoBlock}><div style={styles.infoLabel}>Experience</div><div style={styles.infoValue}>{selectedApplicantInfo.experience}</div></div>}
                  {selectedApplicantInfo?.education && <div style={styles.infoBlock}><div style={styles.infoLabel}>Education</div><div style={styles.infoValue}>{selectedApplicantInfo.education}</div></div>}
                  {selectedApplicantInfo?.bio && <div style={styles.infoBlock}><div style={styles.infoLabel}>Bio</div><div style={styles.infoValue}>{selectedApplicantInfo.bio}</div></div>}
                  {selectedApplicantInfo?.resume && (
                    <div style={styles.infoBlock}>
                      <div style={styles.infoLabel}>Resume</div>
                      <div>
                        <a href={selectedApplicantInfo.resume} target="_blank" rel="noreferrer" style={styles.resumeLink}>Open resume</a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    maxWidth: "100%",
    margin: 0,
    padding: "32px 48px",
    minHeight: "calc(100vh - 86px)",
    boxSizing: "border-box",
  },
  headerCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    marginBottom: 24,
    padding: 24,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 40px rgba(15, 23, 42, 0.06)",
  },
  pageTitle: {
    margin: 0,
    fontSize: "2rem",
    fontWeight: 700,
    color: "#0f172a",
  },
  pageDescription: {
    margin: "10px 0 0",
    color: "#475569",
    maxWidth: 620,
    lineHeight: 1.6,
  },
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 18px",
    borderRadius: 14,
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    color: "#0f172a",
    cursor: "pointer",
    fontWeight: 700,
  },
  infoText: {
    color: "#64748b",
    padding: 24,
    backgroundColor: "#f8fafc",
    borderRadius: 18,
  },
  sectionsGrid: {
    display: "flex",
    gap: 20,
    alignItems: "flex-start",
    width: "100%",
    boxSizing: "border-box",
  },
  statusSection: {
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    backgroundColor: "#ffffff",
    padding: 0,
    minHeight: 220,
    display: "flex",
    flexDirection: "column",
    gap: 0,
    flex: "0 0 260px",
    maxWidth: 260,
    minWidth: 240,
    boxSizing: "border-box",
    overflow: "hidden",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderBottom: "1px solid #f1f5f9",
    padding: "14px 16px",
    background: "#ffffff",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "1rem",
    fontWeight: 800,
    color: "#0f172a",
  },
  sectionCount: {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "#0f172a",
  },
  sectionBody: {
    display: "block",
    gap: 12,
    marginTop: 0,
    padding: 8,
    overflowY: "auto",
    maxHeight: "520px",
  },
  tabContainer: {
    width: "100%",
  },
  tabBar: {
    display: "flex",
    gap: 12,
    marginBottom: 12,
  },
  tabItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderRadius: 12,
    background: "#ffffff",
    border: "1px solid rgba(2,6,23,0.06)",
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(2,6,23,0.02)",
    fontWeight: 700,
  },
  tabActive: {
    background: "linear-gradient(180deg,#0b69ff,#0a58d6)",
    color: "#fff",
    border: "none",
  },
  tabLabel: {
    fontSize: 14,
  },
  tabCount: {
    background: "rgba(0,0,0,0.06)",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 800,
  },
  tabCountActive: {
    background: "rgba(255,255,255,0.18)",
    color: "#fff",
  },
  tabContent: {
    width: "100%",
  },
  cardInner: {
    background: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  cardTop: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  defaultAvatar: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: "#c7d2fe",
    color: "#0b69ff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 18,
  },
  cardButtons: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  verticalActions: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  applicantRowTable: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 10px",
    borderBottom: "1px solid rgba(2,6,23,0.04)",
    width: "100%",
    boxSizing: "border-box",
    transition: "background 120ms ease",
    cursor: "default",
  },
  applicantRowTableHover: {
    backgroundColor: "#fbfdff",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 8px",
    borderBottom: "1px solid rgba(2,6,23,0.06)",
    background: "#fafafa",
  },
  headerCellLeft: {
    flex: 1,
    fontWeight: 700,
    color: "#0f172a",
  },
  headerCellCenter: {
    width: 220,
    fontWeight: 700,
    color: "#0f172a",
  },
  headerCellRight: {
    width: 140,
    textAlign: "right",
    fontWeight: 700,
    color: "#0f172a",
  },
  rowLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  rowCenter: {
    width: 220,
    textAlign: "left",
    color: "#475569",
  },
  rowRight: {
    width: 140,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    flexShrink: 0,
  },
  rowCheckbox: {
    width: 18,
    height: 18,
  },
  applicantNameRow: {
    fontWeight: 700,
    color: "#0f172a",
  },
  submissionLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 6,
  },
  submissionTime: {
    fontSize: 14,
    color: "#0f172a",
  },
  actionStack: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    alignItems: "flex-end",
  },
  actionPrimary: {
    padding: "8px 12px",
    borderRadius: 8,
    backgroundColor: "#0b69ff",
    color: "#fff",
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
  },
  actionSecondary: {
    padding: "8px 12px",
    borderRadius: 8,
    backgroundColor: "#fff",
    color: "#0b69ff",
    border: "1px solid rgba(11,105,255,0.12)",
    fontWeight: 700,
    cursor: "pointer",
  },
  jobReference: {
    margin: 4,
    fontSize: "0.85rem",
    color: "#64748b",
  },
  jobList: {
    display: "grid",
    gap: 20,
  },
  jobCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    backgroundColor: "#ffffff",
    overflow: "hidden",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.06)",
  },
  jobHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 20,
    padding: 24,
    borderBottom: "1px solid #e2e8f0",
  },
  jobTitle: {
    margin: 0,
    fontSize: "1.3rem",
    fontWeight: 700,
    color: "#0f172a",
  },
  jobMeta: {
    margin: "8px 0 0",
    color: "#475569",
    fontSize: 14,
  },
  jobStatsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    color: "#475569",
    fontSize: 13,
  },
  jobStatItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 999,
    backgroundColor: "#f8fafc",
  },
  applicantContainer: {
    display: "grid",
    gap: 12,
    padding: 24,
  },
  applicantRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "12px 14px",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    border: "1px solid rgba(2,6,23,0.04)",
    boxShadow: "0 6px 18px rgba(2,6,23,0.04)",
    width: "100%",
    boxSizing: "border-box",
  },
  applicantDetails: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },
  applicantAvatar: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    objectFit: "cover",
    border: "1px solid rgba(2,6,23,0.06)",
  },
  applicantName: {
    margin: 0,
    fontWeight: 700,
    color: "#0f172a",
  },
  applicantEmail: {
    margin: 4,
    color: "#475569",
    fontSize: 13,
  },
  applicantActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
  },
  applicantStatus: {
    padding: "8px 12px",
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    color: "#334155",
    fontWeight: 700,
    fontSize: 12,
  },
  viewButton: {
    padding: "8px 12px",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    border: "1px solid #2563eb",
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: 700,
  },
  acceptButton: {
    padding: "8px 12px",
    borderRadius: 10,
    backgroundColor: "#0b69ff",
    color: "#ffffff",
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
  },
  rejectButton: {
    padding: "8px 12px",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    color: "#ef4444",
    border: "1px solid rgba(239,68,68,0.12)",
    cursor: "pointer",
    fontWeight: 700,
  },
  reviewButton: {
    padding: "8px 12px",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    color: "#0b69ff",
    border: "1px solid rgba(11,105,255,0.12)",
    cursor: "pointer",
    fontWeight: 700,
  },
  removeButton: {
    padding: "8px 12px",
    borderRadius: 10,
    backgroundColor: "#fff5f5",
    color: "#b91c1c",
    border: "1px solid rgba(185,28,28,0.08)",
    cursor: "pointer",
    fontWeight: 700,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(2,6,23,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    padding: 20,
  },
  modalCard: {
    width: "min(820px, 96%)",
    maxHeight: "90vh",
    overflowY: "auto",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 28,
    boxShadow: "0 30px 80px rgba(2,6,23,0.16)",
    border: "1px solid rgba(2,6,23,0.04)",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  modalTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  modalAvatar: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    objectFit: "cover",
    border: "1px solid #e2e8f0",
  },
  modalAvatarLarge: {
    width: 120,
    height: 120,
    borderRadius: "50%",
    objectFit: "cover",
    border: "1px solid #e2e8f0",
  },
  defaultAvatarLarge: {
    width: 120,
    height: 120,
    borderRadius: "50%",
    background: "#c7d2fe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 36,
    fontWeight: 800,
    color: "#0b69ff",
  },
  modalGrid: {
    display: "grid",
    gridTemplateColumns: "240px 1fr",
    gap: 24,
    alignItems: "start",
  },
  profileColumn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  detailsColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    padding: "6px 0",
    borderBottom: "1px dashed rgba(2,6,23,0.04)",
  },
  infoLabel: {
    fontWeight: 800,
    color: "#0f172a",
    minWidth: 90,
  },
  infoValue: {
    color: "#475569",
    textAlign: "right",
  },
  infoBlock: {
    padding: "8px 0",
  },
  resumeLink: {
    color: "#0b69ff",
    fontWeight: 700,
    textDecoration: "underline",
  },
  modalTitle: {
    margin: 0,
    fontSize: "1.6rem",
    fontWeight: 700,
    color: "#0f172a",
  },
  modalClose: {
    border: "none",
    background: "transparent",
    fontSize: "1.25rem",
    cursor: "pointer",
    color: "#475569",
  },
  modalBody: {
    display: "grid",
    gap: 12,
    color: "#334155",
  },
  modalLabel: {
    margin: 0,
    fontWeight: 700,
    fontSize: 13,
    color: "#0f172a",
  },
  modalValue: {
    margin: 0,
    color: "#475569",
    fontSize: 14,
    lineHeight: 1.6,
  },
  modalActionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    margin: "18px 0",
  },
};

