import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useNotification } from '../contexts/NotificationContext';

export default function EmployerApplicants() {
  const navigate = useNavigate();
  const { createInterview } = useNotification();
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

  const handleApplicantInterview = async (jobId, applicantId, applicantUser, jobTitle) => {
    if (!token) {
      navigate("/auth");
      return;
    }

    setJobActionLoading(true);

    try {
      const payload = {
        employer: user?._id,
        title: `Interview with ${applicantUser?.firstName || ''} ${applicantUser?.lastName || ''}`.trim() || 'Interview',
        description: `Interview for ${jobTitle || 'application'}`,
        participants: [
          { user: applicantId, role: 'applicant' },
          { user: user?._id, role: 'employer' },
        ],
        scheduledAt: new Date().toISOString(),
        location: 'Online',
      };

      const res = await createInterview(payload, false);
      const interview = res?.data;
      if (!interview?.roomId) {
        throw new Error('Interview room was not created');
      }

      await handleApplicantStatusChange(jobId, applicantId, 'interview');
      navigate(`/interview/${interview.roomId}`);
    } catch (error) {
      console.error('Error creating interview:', error);
      alert('Could not create interview room. Please try again.');
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

  const handleResumeView = async (jobId, applicantId, resumeUrl) => {
    if (resumeUrl) {
      window.open(resumeUrl, '_blank', 'noopener,noreferrer');
    }

    if (!token || !jobId || !applicantId) {
      return;
    }

    try {
      await axios.post(
        `/api/employer/my-jobs/${jobId}/applicants/${applicantId}/view-resume`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error('Error notifying applicant resume view:', error);
    }
  };

  const getAllApplicants = () => {
    const applicantsByStatus = {
      pending: [],
      reviewing: [],
      interview: [],
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
      <div className="page-container" style={styles.container}>
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
    <div className="page-container" style={styles.container}>
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
              { key: "interview", label: "Interview" },
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
                <div style={{ ...styles.tabCount, ...(activeTab === key ? styles.tabCountActive : {}) }}>
                  {applicantsByStatus[key].length}
                </div>
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
                            {activeTab === "pending" && (
                              <button
                                style={styles.reviewButton}
                                disabled={jobActionLoading}
                                onClick={() => handleApplicantStatusChange(entry.jobId, entry.applicantUser._id, "reviewing")}
                              >
                                Review
                              </button>
                            )}
                            {activeTab === "reviewing" && (
                              <button
                                style={styles.actionPrimary}
                                disabled={jobActionLoading}
                                onClick={() => handleApplicantInterview(entry.jobId, entry.applicantUser._id, entry.applicantUser, entry.jobTitle)}
                              >
                                Interview
                              </button>
                            )}
                            {activeTab === "interview" && (
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
        <div className="modal-overlay" style={styles.modalOverlay} onClick={closeApplicantModal}>
          <div className="modal-card" style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={{
              ...styles.modalHeader,
              background: 'linear-gradient(135deg, var(--primary) 0%, rgba(var(--primary-rgb), 0.8) 100%)',
              borderRadius: '16px 16px 0 0',
              margin: '-28px -28px 0 -28px',
              padding: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: 'none'
            }}>
              <div>
                  <h2 style={{
                    margin: 0,
                    color: '#ffffff',
                    fontSize: '26px',
                    fontWeight: '800'
                  }}>
                    {selectedApplicantInfo?.firstName} {selectedApplicantInfo?.lastName}
                  </h2>
                    {(selectedApplicant.jobTitle || selectedApplicant.companyName) && (
                    <div style={{
                      color: 'rgba(255,255,255,0.95)',
                      marginTop: '8px',
                      marginBottom: '0',
                      fontSize: '14px',
                      fontWeight: 500
                    }}>
                      {selectedApplicant.jobTitle || ""}
                      {selectedApplicant.jobTitle && selectedApplicant.companyName ? " · " : ""}
                      {selectedApplicant.companyName || ""}
                    </div>
                  )}
                </div>
              <button style={{
                ...styles.modalClose,
                color: '#ffffff',
                fontSize: '28px',
                opacity: 0.8
              }} onClick={closeApplicantModal}>✕</button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.modalGrid}>
                <div style={styles.profileColumn}>
                  {selectedApplicantInfo?.profilePicture ? (
                    <img src={selectedApplicantInfo.profilePicture} alt="Applicant" style={styles.modalAvatarLarge} />
                  ) : (
                    <div style={styles.defaultAvatarLarge}>{(selectedApplicantInfo?.firstName || "").charAt(0)}</div>
                  )}
                  <h3 style={styles.modalName}>{selectedApplicantInfo?.firstName} {selectedApplicantInfo?.lastName}</h3>
                  <div style={styles.modalJobTitle}>{selectedApplicant.jobTitle || selectedApplicant.jobName || ""}</div>
                  <div style={styles.profileStats}>
                    <div style={styles.statBlock}>
                      <span style={styles.infoLabel}>Status</span>
                      <span style={styles.infoValue}>{selectedApplicant.status || "pending"}</span>
                    </div>
                    <div style={styles.statBlock}>
                      <span style={styles.infoLabel}>Applied</span>
                      <span style={styles.infoValue}>{formatDate(selectedApplicant.appliedAt || selectedApplicant.updatedAt || selectedApplicant.createdAt)}</span>
                    </div>
                  </div>

                  <div style={styles.modalActions}>
                    {selectedApplicant.jobId && (
                      <>
                        {selectedApplicant.status === "pending" && (
                          <button
                            style={styles.reviewButton}
                            disabled={jobActionLoading}
                            onClick={() => handleApplicantStatusChange(selectedApplicant.jobId, selectedApplicantInfo?._id, "reviewing")}
                          >
                            Review
                          </button>
                        )}
                        {selectedApplicant.status === "reviewing" && (
                          <button
                            style={styles.acceptButton}
                            disabled={jobActionLoading}
                            onClick={() => handleApplicantInterview(selectedApplicant.jobId, selectedApplicantInfo?._id, selectedApplicantInfo, selectedApplicant.jobTitle)}
                          >
                            Interview
                          </button>
                        )}
                        {selectedApplicant.status === "interview" && (
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
                            style={styles.rejectButton}
                            disabled={jobActionLoading}
                            onClick={() => handleApplicantStatusChange(selectedApplicant.jobId, selectedApplicantInfo?._id, "rejected")}
                          >
                            Reject
                          </button>
                        )}
                        <button
                          style={styles.removeButton}
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
                    )}
                  </div>
                </div>

                <div style={styles.detailsColumn}>
                  <div style={styles.infoRow}><span style={styles.infoLabel}>Email</span><span style={styles.infoValue}>{selectedApplicantInfo?.email || "—"}</span></div>
                  <div style={styles.infoRow}><span style={styles.infoLabel}>Phone</span><span style={styles.infoValue}>{selectedApplicantInfo?.phoneNumber || "—"}</span></div>
                  <div style={styles.infoRow}><span style={styles.infoLabel}>Location</span><span style={styles.infoValue}>{selectedApplicantInfo?.location ? `${selectedApplicantInfo.location.region || ""}${selectedApplicantInfo.location.city ? ", " + selectedApplicantInfo.location.city : ""}` : "—"}</span></div>
                  {selectedApplicantInfo?.experience && <div style={styles.infoBlock}><div style={styles.infoLabel}>Experience</div><div style={styles.infoValue}>{selectedApplicantInfo.experience}</div></div>}
                  {selectedApplicantInfo?.education && <div style={styles.infoBlock}><div style={styles.infoLabel}>Education</div><div style={styles.infoValue}>{selectedApplicantInfo.education}</div></div>}
                  {selectedApplicantInfo?.bio && <div style={styles.infoBlock}><div style={styles.infoLabel}>Bio</div><div style={styles.infoValue}>{selectedApplicantInfo.bio}</div></div>}
                  {selectedApplicant?.coverLetter && (
                    <div style={styles.infoBlock}>
                      <div style={styles.infoLabel}>Cover Letter</div>
                      <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text)', lineHeight: 1.7, fontSize: 14 }}>
                        {selectedApplicant.coverLetter}
                      </div>
                    </div>
                  )}
                  {(selectedApplicantInfo?.resume || selectedApplicant?.resume) && (
                    <div style={styles.infoBlock}>
                      <div style={styles.infoLabel}>Resume</div>
                      <div>
                        <a
                          href={selectedApplicantInfo?.resume || selectedApplicant?.resume}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.resumeLink}
                          onClick={(e) => {
                            e.preventDefault();
                            handleResumeView(
                              selectedApplicant.jobId,
                              selectedApplicantInfo?._id || selectedApplicant?.user?._id || selectedApplicant?._id,
                              selectedApplicantInfo?.resume || selectedApplicant?.resume
                            );
                          }}
                        >
                          Open resume
                        </a>
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
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    boxShadow: "var(--card-shadow)",
  },
  pageTitle: {
    margin: 0,
    fontSize: "2rem",
    fontWeight: 700,
    color: "var(--text-h)",
  },
  pageDescription: {
    margin: "10px 0 0",
    color: "var(--muted)",
    maxWidth: 620,
    lineHeight: 1.6,
  },
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 18px",
    borderRadius: 14,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text-h)",
    cursor: "pointer",
    fontWeight: 700,
  },
  infoText: {
    color: "var(--muted)",
    padding: 24,
    backgroundColor: "var(--surface-alt)",
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
    border: "1px solid var(--border)",
    borderRadius: 16,
    backgroundColor: "var(--surface)",
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
    borderBottom: "1px solid var(--border)",
    padding: "14px 16px",
    background: "var(--surface)",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "1rem",
    fontWeight: 800,
    color: "var(--text-h)",
  },
  
  sectionCount: {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "var(--text-h)",
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
    gap: 24,
    marginBottom: 12,
    alignItems: "center",
    paddingBottom: 8,
    borderBottom: "1px solid var(--border)",
  },
  tabItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 16px",
    borderRadius: 0,
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    transition: "color 120ms ease, border-color 120ms ease, background-color 120ms ease",
    fontWeight: 700,
    color: "var(--muted)",
    borderBottom: "3px solid transparent",
    outline: "none",
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
  },
  tabActive: {
    backgroundColor: "transparent",
    color: "var(--accent)",
    border: "none",
    boxShadow: "none",
    transform: "none",
    borderBottom: "3px solid var(--accent)",
  },
  tabLabel: {
    fontSize: 14,
  },
  tabCount: {
    backgroundColor: "var(--surface-alt)",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    color: "var(--muted)",
    marginLeft: 8,
    minWidth: 26,
    textAlign: "center",
  },
  tabCountActive: {
    backgroundColor: "var(--accent)",
    color: "var(--cta-text)",
  },
  tabContent: {
    width: "100%",
  },
  cardInner: {
    background: "var(--surface-alt)",
    borderRadius: 12,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  defaultAvatar: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: "var(--accent-bg)",
    color: "var(--accent)",
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
    padding: "14px 12px",
    borderBottom: "1px solid rgba(2,6,23,0.04)",
    width: "100%",
    boxSizing: "border-box",
    transition: "background 160ms ease, transform 160ms ease, box-shadow 160ms ease",
    cursor: "default",
    borderRadius: 10,
    backgroundClip: "padding-box",
    boxShadow: "0 1px 0 rgba(2,6,23,0.02)",
  },
  applicantRowTableHover: {
    backgroundColor: "var(--surface-alt)",
    transform: "translateY(-2px)",
    boxShadow: "var(--card-shadow)",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 8px",
    borderBottom: "1px solid rgba(2,6,23,0.06)",
    background: "var(--surface-alt)",
  },
  headerCellLeft: {
    flex: 1,
    fontWeight: 700,
    color: "var(--text-h)",
  },
  headerCellCenter: {
    width: 220,
    fontWeight: 700,
    color: "var(--text-h)",
  },
  headerCellRight: {
    width: 140,
    textAlign: "right",
    fontWeight: 700,
    color: "var(--text-h)",
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
    color: "var(--muted)",
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
    color: "var(--text-h)",
  },
  submissionLabel: {
    fontSize: 12,
    color: "var(--muted)",
    marginBottom: 6,
  },
  submissionTime: {
    fontSize: 14,
    color: "var(--text-h)",
  },
  actionStack: {
    display: "flex",
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "wrap",
  },
  actionPrimary: {
    padding: "8px 12px",
    borderRadius: 10,
    backgroundColor: "var(--accent)",
    color: "var(--cta-text)",
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
  },
  actionSecondary: {
    padding: "8px 12px",
    borderRadius: 8,
    backgroundColor: "var(--surface)",
    color: "var(--accent)",
    border: "1px solid rgba(59,130,246,0.12)",
    fontWeight: 700,
    cursor: "pointer",
  },
  jobReference: {
    margin: 4,
    fontSize: "0.85rem",
    color: "var(--muted)",
  },
  jobList: {
    display: "grid",
    gap: 20,
  },
  jobCard: {
    border: "1px solid var(--border)",
    borderRadius: 20,
    backgroundColor: "var(--surface)",
    overflow: "hidden",
    boxShadow: "var(--card-shadow)",
  },
  jobHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 20,
    padding: 24,
    borderBottom: "1px solid var(--border)",
  },
  jobTitle: {
    margin: 0,
    fontSize: "1.3rem",
    fontWeight: 700,
    color: "var(--text-h)",
  },
  jobMeta: {
    margin: "8px 0 0",
    color: "var(--muted)",
    fontSize: 14,
  },
  jobStatsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    color: "var(--muted)",
    fontSize: 13,
  },
  jobStatItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 999,
    backgroundColor: "var(--surface-alt)",
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
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    boxShadow: "var(--card-shadow)",
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
    color: "var(--text-h)",
  },
  applicantEmail: {
    margin: 4,
    color: "var(--muted)",
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
    backgroundColor: "var(--surface-alt)",
    color: "var(--text)",
    fontWeight: 700,
    fontSize: 12,
  },
  viewButton: {
    padding: "8px 12px",
    borderRadius: 10,
    backgroundColor: "var(--surface)",
    border: "1px solid var(--accent)",
    color: "var(--accent)",
    cursor: "pointer",
    fontWeight: 700,
  },
  acceptButton: {
    padding: "8px 12px",
    borderRadius: 10,
    backgroundColor: "var(--accent)",
    color: "var(--cta-text)",
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
  },
  rejectButton: {
    padding: "8px 12px",
    borderRadius: 10,
    backgroundColor: "var(--surface-alt)",
    color: "var(--text-h)",
    border: "1px solid var(--border)",
    cursor: "pointer",
    fontWeight: 700,
  },
  reviewButton: {
    padding: "8px 12px",
    borderRadius: 10,
    backgroundColor: "var(--surface)",
    color: "var(--accent)",
    border: "1px solid rgba(59,130,246,0.12)",
    cursor: "pointer",
    fontWeight: 700,
  },
  removeButton: {
    padding: "8px 12px",
    borderRadius: 10,
    backgroundColor: "var(--surface-alt)",
    color: "var(--text-h)",
    border: "1px solid var(--border)",
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
    width: "min(900px, 96%)",
    maxHeight: "90vh",
    overflowY: "auto",
    backgroundColor: "var(--surface)",
    borderRadius: 16,
    padding: 28,
    boxShadow: "var(--card-shadow)",
    border: "1px solid var(--border)",
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
    border: "1px solid var(--border)",
  },
  modalAvatarLarge: {
    width: 120,
    height: 120,
    borderRadius: "50%",
    objectFit: "cover",
    border: "1px solid var(--border)",
  },
  defaultAvatarLarge: {
    width: 120,
    height: 120,
    borderRadius: "50%",
    background: "var(--accent-bg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 36,
    fontWeight: 800,
    color: "var(--accent)",
  },
  modalName: {
    margin: "16px 0 6px",
    fontSize: 22,
    fontWeight: 800,
    color: "var(--text-h)",
    lineHeight: 1.1,
  },
  modalJobTitle: {
    color: "var(--muted)",
    fontSize: 14,
    lineHeight: 1.5,
    maxWidth: 260,
  },
  profileStats: {
    display: "grid",
    gap: 10,
    width: "100%",
    marginTop: 18,
  },
  statBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    gap: 6,
    padding: "18px 18px",
    borderRadius: 16,
    backgroundColor: "var(--surface-alt)",
    border: "1px solid var(--border)",
    width: "100%",
    textAlign: "left",
  },
  modalActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 18,
    width: "100%",
  },
  modalGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(240px, 300px) minmax(0, 1fr)",
    gap: 28,
    alignItems: "start",
  },
  profileColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    alignItems: "flex-start",
  },
  detailsColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    backgroundColor: "var(--surface-alt)",
    padding: 24,
    borderRadius: 20,
    minHeight: 100,
    alignItems: "flex-start",
    textAlign: "left",
  },
  infoRow: {
    display: "flex",
    justifyContent: "flex-start",
    gap: 18,
    alignItems: "flex-start",
    padding: "10px 0",
    borderBottom: "1px dashed rgba(2,6,23,0.08)",
    flexWrap: "wrap",
    width: "100%",
  },
  infoLabel: {
    display: "block",
    marginBottom: 6,
    fontWeight: 800,
    color: "var(--text-h)",
    minWidth: 100,
    flexShrink: 0,
  },
  infoValue: {
    color: "var(--muted)",
    textAlign: "left",
    flex: 1,
    minWidth: 0,
  },
  infoBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    padding: "8px 0",
    width: "100%",
    textAlign: "left",
  },
  infoBlock: {
    padding: "8px 0",
  },
  resumeLink: {
    color: "var(--accent)",
    fontWeight: 700,
    textDecoration: "underline",
  },
  modalTitle: {
    margin: 0,
    fontSize: "1.6rem",
    fontWeight: 700,
    color: "var(--text-h)",
  },
  modalSubtitle: {
    margin: "6px 0 0",
    color: "var(--muted)",
    fontSize: 14,
    lineHeight: 1.4,
  },
  modalClose: {
    border: "none",
    background: "transparent",
    fontSize: "1.25rem",
    cursor: "pointer",
    color: "var(--muted)",
  },
  modalBody: {
    display: "grid",
    gap: 12,
    color: "var(--text)",
  },
  modalLabel: {
    margin: 0,
    fontWeight: 700,
    fontSize: 13,
    color: "var(--text-h)",
  },
  modalValue: {
    margin: 0,
    color: "var(--muted)",
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


