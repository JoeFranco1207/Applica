import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ThemeContext } from "../contexts/ThemeContext";
import ThemeSwitch from "../components/ThemeSwitch";
import axios from "axios";

const HeartIcon = ({ filled = false, size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const CommentIcon = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const RepostIcon = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

const ShareIcon = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const EyeIcon = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const BriefcaseIcon = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v2" />
  </svg>
);

const ClockIcon = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 7 12 12 15 15" />
  </svg>
);

const calculateEmployerProfileCompletion = (user) => {
  if (!user || user.role !== "employer") return 0;

  const fields = [
    user.companyName,
    user.companyDescription,
    user.companySize,
    user.industry,
    user.website,
    user.contactNumber,
    user.dateEstablished,
    user.companyLocation?.region,
    user.companyLocation?.city,
    user.companyLocation?.barangay,
    user.companyLocation?.otherDetails,
  ];

  const filledCount = fields.reduce(
    (count, value) => count + (!!value ? 1 : 0),
    0
  );

  return Math.round((filledCount / fields.length) * 100);
};

const calculateJobseekerProfileCompletion = (user) => {
  if (!user || user.role !== "jobseeker") return 0;

  const fields = [
    user.bio,
    user.citizenShip,
    user.experience,
    user.education,
    user.resume,
    user.profilePicture,
    user.location?.region,
    user.location?.city,
    user.location?.barangay,
    user.location?.otherDetails,
  ];

  const filledCount = fields.reduce(
    (count, value) => count + (!!value ? 1 : 0),
    0
  );

  return Math.round((filledCount / fields.length) * 100);
};

export default function Profile() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [employerJobs, setEmployerJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [showApplicantModal, setShowApplicantModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState("");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [initialScale, setInitialScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const startOffsetRef = useRef({ x: 0, y: 0 });
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [myPosts, setMyPosts] = useState([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  const navigate = useNavigate();
  const { id: profileId } = useParams();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const currentUserId = currentUser?.id || currentUser?._id || null;
  const isOwnProfile = !profileId || profileId === currentUserId;

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/auth");
        return;
      }

      const url = profileId
        ? `http://localhost:8000/api/auth/users/${profileId}`
        : "http://localhost:8000/api/auth/profile";

      try {
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data && response.data.data) {
          setUser(response.data.data);
          if (!profileId) {
            localStorage.setItem("user", JSON.stringify(response.data.data));
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        if (!profileId) {
          const userData = localStorage.getItem("user");
          if (userData) {
            try {
              setUser(JSON.parse(userData));
            } catch (parseError) {
              console.error("Error parsing user data:", parseError);
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate, profileId]);

  useEffect(() => {
    const fetchEmployerJobs = async () => {
      if (!user?.role || user.role !== "employer") return;

      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        setMetricsLoading(true);
        const response = await axios.get("http://localhost:8000/api/employer/my-jobs", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setEmployerJobs(response.data.data || []);
      } catch (error) {
        console.error("Error fetching employer jobs:", error);
      } finally {
        setMetricsLoading(false);
      }
    };

    fetchEmployerJobs();
  }, [user]);

  useEffect(() => {
    const fetchMyPosts = async () => {
      const userId = profileId || user?._id;
      if (!userId) return;
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await axios.get(`http://localhost:8000/api/posts/author/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMyPosts(res.data.data || []);
      } catch (err) {
        console.error('Error fetching my posts', err);
      }
    };

    fetchMyPosts();
  }, [user, profileId]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUserMenuOpen(false);
    navigate("/");
    window.location.reload();
  };

  const openApplicantModal = (applicant, jobId) => {
    setSelectedApplicant({ ...applicant, jobId });
    setShowApplicantModal(true);
  };

  const closeApplicantModal = () => {
    setSelectedApplicant(null);
    setShowApplicantModal(false);
  };

  const selectedApplicantInfo = selectedApplicant?.user || selectedApplicant;

  const handleApplicantStatusChange = async (jobId, applicantId, status) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth");
      return;
    }

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
      setEmployerJobs((prevJobs) =>
        prevJobs.map((job) => (job._id === updatedJob._id ? updatedJob : job))
      );

      if (selectedApplicant && (selectedApplicant.user?._id || selectedApplicant._id) === applicantId) {
        setSelectedApplicant((prev) => prev ? { ...prev, status } : prev);
      }
    } catch (error) {
      console.error("Error updating applicant status:", error);
      alert("Could not update applicant status. Please try again.");
    }
  };

  const handleApplicantRemove = async (jobId, applicantId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth");
      return;
    }

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
      setEmployerJobs((prevJobs) =>
        prevJobs.map((job) => (job._id === updatedJob._id ? updatedJob : job))
      );

      if (selectedApplicant && (selectedApplicant.user?._id || selectedApplicant._id) === applicantId) {
        closeApplicantModal();
      }
    } catch (error) {
      console.error("Error removing applicant:", error);
      alert("Could not remove applicant. Please try again.");
    }
  };

  const handleJobDelete = async (jobId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth");
      return;
    }

    if (!window.confirm("Delete this job posting? This cannot be undone.")) {
      return;
    }

    try {
      await axios.delete(`http://localhost:8000/api/employer/my-jobs/${jobId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setEmployerJobs((prevJobs) => prevJobs.filter((job) => job._id !== jobId));
      if (selectedJobId === jobId) {
        setSelectedJobId(null);
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      alert("Could not delete job. Please try again.");
    }
  };

  const openPostModal = (post) => {
    setSelectedPost(post);
    setCommentText("");
    setShowPostModal(true);
  };

  const closePostModal = () => {
    setShowPostModal(false);
    setSelectedPost(null);
    setCommentText("");
  };

  const submitComment = async () => {
    if (!commentText.trim() || !selectedPost) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    setCommentLoading(true);
    try {
      const response = await axios.post(
        `http://localhost:8000/api/posts/${selectedPost._id}/comment`,
        { content: commentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.data) {
        setSelectedPost(response.data.data);
        setCommentText("");
        const updatedPosts = myPosts.map((p) =>
          p._id === selectedPost._id ? response.data.data : p
        );
        setMyPosts(updatedPosts);
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setCommentLoading(false);
    }
  };

  const submitReply = async (commentId) => {
    if (!replyText.trim() || !selectedPost) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    setReplyLoading(true);
    try {
      const response = await axios.post(
        `http://localhost:8000/api/posts/${selectedPost._id}/comment/${commentId}/reply`,
        { content: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.data) {
        setSelectedPost(response.data.data);
        setReplyText("");
        setReplyingToCommentId(null);
        const updatedPosts = myPosts.map((p) =>
          p._id === selectedPost._id ? response.data.data : p
        );
        setMyPosts(updatedPosts);
      }
    } catch (error) {
      console.error("Error posting reply:", error);
    } finally {
      setReplyLoading(false);
    }
  };

  const openImageModal = () => {
    setSelectedImageFile(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setNaturalSize({ w: 0, h: 0 });
    setInitialScale(1);
    if (fileInputRef.current) fileInputRef.current.value = null;

    // preload current image into cropper if available
    const current = user?.profilePicture || user?.companyLogo || "";
    if (current) {
      setSelectedImagePreview(current);
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        const PREVIEW = 360;
        const minDim = Math.min(img.width, img.height) || 1;
        const initScale = PREVIEW / minDim;
        setNaturalSize({ w: img.width, h: img.height });
        setInitialScale(initScale);
        setZoom(1);
        const renderW = img.width * initScale;
        const renderH = img.height * initScale;
        const startX = (PREVIEW - renderW) / 2;
        const startY = (PREVIEW - renderH) / 2;
        setOffset({ x: startX, y: startY });
      };
      img.src = current;
    } else {
      setSelectedImagePreview("");
    }

    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImageFile(null);
    setSelectedImagePreview("");
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    setSelectedImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImagePreview(reader.result);

      // load image to get natural size and initialize offsets/scale
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        const PREVIEW = 360; // px square for cropper
        const minDim = Math.min(img.width, img.height) || 1;
        const initScale = PREVIEW / minDim;
        setNaturalSize({ w: img.width, h: img.height });
        setInitialScale(initScale);
        setZoom(1);
        const renderW = img.width * initScale;
        const renderH = img.height * initScale;
        const startX = (PREVIEW - renderW) / 2;
        const startY = (PREVIEW - renderH) / 2;
        setOffset({ x: startX, y: startY });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async () => {
    if (!selectedImagePreview && !user) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    setUploadingAvatar(true);

    try {
      let url;
      let payload;

      if (user.role === "jobseeker") {
        url = "http://localhost:8000/api/jobseeker/update-profile";
        payload = { profilePicture: selectedImagePreview };
      } else if (user.role === "employer") {
        url = "http://localhost:8000/api/employer/profile";
        payload = { companyLogo: selectedImagePreview };
      }

      if (!url || !payload) {
        return;
      }

      // If a cropper is in use, generate a circular cropped image from current state
      const PREVIEW = 360;
      let finalDataUrl = selectedImagePreview || user?.profilePicture || user?.companyLogo || "";

      // ensure we have an Image object to draw for accurate cropping
      let img = imgRef.current;
      if (!img && finalDataUrl) {
        img = new Image();
        await new Promise((res, rej) => {
          img.onload = () => res();
          img.onerror = () => res();
          img.src = finalDataUrl;
        });
        imgRef.current = img;
        if (!naturalSize.w && img.width) setNaturalSize({ w: img.width, h: img.height });
      }

      if (img) {
        const canvas = document.createElement("canvas");
        canvas.width = PREVIEW;
        canvas.height = PREVIEW;
        const ctx = canvas.getContext("2d");

        // clip to circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(PREVIEW / 2, PREVIEW / 2, PREVIEW / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        const renderW = img.width * initialScale * zoom;
        const renderH = img.height * initialScale * zoom;

        ctx.drawImage(img, offset.x, offset.y, renderW, renderH);
        ctx.restore();

        finalDataUrl = canvas.toDataURL("image/png");
      }

      payload = user.role === "jobseeker" ? { profilePicture: finalDataUrl } : { companyLogo: finalDataUrl };

      const method = user.role === "jobseeker" ? axios.patch : axios.put;

      await method(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const updatedUser = {
        ...user,
        ...payload,
      };

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      // reset file input so same file can be reselected
      if (fileInputRef.current) fileInputRef.current.value = null;
      closeImageModal();
    } catch (error) {
      console.error("Image upload failed:", error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleHeaderCircleClick = () => {
    openImageModal();
  };

  // Cropper interaction handlers
  const PREVIEW = 360; // px square for cropper

  const renderWidth = naturalSize.w * initialScale * zoom;
  const renderHeight = naturalSize.h * initialScale * zoom;

  const onMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    startOffsetRef.current = { ...offset };
  };

  const onTouchStart = (e) => {
    const t = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = { x: t.clientX, y: t.clientY };
    startOffsetRef.current = { ...offset };
  };

  useEffect(() => {
    const onMove = (ev) => {
      if (!isDragging) return;
      const clientX = ev.clientX ?? (ev.touches && ev.touches[0].clientX);
      const clientY = ev.clientY ?? (ev.touches && ev.touches[0].clientY);
      if (clientX == null || clientY == null) return;
      const dx = clientX - dragStartRef.current.x;
      const dy = clientY - dragStartRef.current.y;
      // compute raw
      let nx = startOffsetRef.current.x + dx;
      let ny = startOffsetRef.current.y + dy;
      // clamp so image always covers preview circle
      const PREVIEW = 360;
      const rw = naturalSize.w * initialScale * zoom || 0;
      const rh = naturalSize.h * initialScale * zoom || 0;
      // allowable left range: PREVIEW - rw <= x <= 0
      const minX = Math.min(PREVIEW - rw, 0);
      const maxX = 0;
      const minY = Math.min(PREVIEW - rh, 0);
      const maxY = 0;
      if (nx < minX) nx = minX;
      if (nx > maxX) nx = maxX;
      if (ny < minY) ny = minY;
      if (ny > maxY) ny = maxY;
      setOffset({ x: nx, y: ny });
    };

    const onUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      window.addEventListener("touchmove", onMove, { passive: false });
      window.addEventListener("touchend", onUp);
    }

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [isDragging, offset]);

  if (loading) {
    return (
      <div style={{
        ...styles.container,
        backgroundColor: isDarkMode ? "#1a1a1a" : "#f8fafc",
      }}>
        <p style={{ color: isDarkMode ? "#fff" : "#000" }}>Loading...</p>
      </div>
    );
  }

  const completion =
    user?.role === "employer"
      ? calculateEmployerProfileCompletion(user)
      : calculateJobseekerProfileCompletion(user);

  return (
    <div style={{
      ...styles.container,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f8fafc",
      color: isDarkMode ? "#ffffff" : "#000",
    }}>
      {/* Main Content */}
      <div style={styles.mainContent}>
        <div style={{
          ...styles.profileContainer,
          backgroundColor: isDarkMode ? "#0f0f0f" : "#ffffff",
        }}>
          <div style={{
            ...styles.profileHeader,
            background: isDarkMode
              ? "linear-gradient(135deg, #0a1a3a 0%, #1a3a5a 100%)"
              : "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
          }}>
            <div style={styles.profileImageContainer}>
              <div
                style={styles.profileImageLabel}
                onClick={handleHeaderCircleClick}
                title={
                  user?.role === "jobseeker"
                    ? "Click to upload profile picture"
                    : "Click to upload company logo"
                }
              >
                <div style={{
                  ...styles.profileImage,
                  backgroundColor: isDarkMode
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(255,255,255,0.3)",
                }}>
                  {(user?.profilePicture || user?.companyLogo) ? (
                    <img
                      src={user.profilePicture || user.companyLogo}
                      alt="Profile"
                      style={styles.profileHeaderImage}
                    />
                  ) : (
                    (user?.role === "employer"
                      ? user?.companyName?.charAt(0)
                      : user?.firstName?.charAt(0))
                      ? (user?.role === "employer"
                        ? user.companyName.charAt(0).toUpperCase()
                        : user.firstName.charAt(0).toUpperCase())
                      : "U"
                  )}
                </div>
              </div>
            </div>

            <div style={styles.profileInfo}>
              <h1 style={{
                ...styles.profileName,
                color: "#ffffff",
              }}>
                {user ? (user?.role === "employer" ? user.companyName : `${user.firstName} ${user.lastName}`) : "User Profile"}
              </h1>
              <p style={{
                ...styles.profileEmail,
                color: "rgba(255,255,255,0.9)",
              }}>
                {user?.email || "No email provided"}
              </p>
              <p style={{
                ...styles.profileRole,
                color: "rgba(255,255,255,0.8)",
              }}>
                {user?.role === "employer" ? "Employer" : user?.role === "jobseeker" ? "Job Seeker" : "User"}
              </p>
            </div>

            {isOwnProfile && (
              <button
                style={styles.editButton}
                onClick={() => {
                  if (user?.role === "employer") {
                    navigate("/create/employer");
                  } else {
                    navigate("/create/jobseeker");
                  }
                }}
              >
                Edit Profile
              </button>
            )}
          </div>

          <div style={{
            ...styles.profileSection,
            borderColor: isDarkMode ? "#333" : "#f0f0f0",
            backgroundColor: isDarkMode ? "#0f0f0f" : "#ffffff",
          }}>
            <h2 style={{
              ...styles.sectionTitle,
              color: isDarkMode ? "#ffffff" : "#000",
            }}>
              Account Details
            </h2>

            <div style={styles.detailsGrid}>
              <div style={styles.detailItem}>
                <label style={{
                  ...styles.detailLabel,
                  color: "#2563eb",
                }}>
                  Full Name
                </label>
                <p style={{
                  ...styles.detailValue,
                  color: isDarkMode ? "#ccc" : "#333",
                }}>
                  {user ? `${user.firstName} ${user.lastName}` : "Not provided"}
                </p>
              </div>

              <div style={styles.detailItem}>
                <label style={{
                  ...styles.detailLabel,
                  color: "#2563eb",
                }}>
                  Email
                </label>
                <p style={{
                  ...styles.detailValue,
                  color: isDarkMode ? "#ccc" : "#333",
                }}>
                  {user?.email || "Not provided"}
                </p>
              </div>

              <div style={styles.detailItem}>
                <label style={{
                  ...styles.detailLabel,
                  color: "#2563eb",
                }}>
                  Account Type
                </label>
                <p style={{
                  ...styles.detailValue,
                  color: isDarkMode ? "#ccc" : "#333",
                }}>
                  {user?.role === "employer"
                    ? "Employer"
                    : "Job Seeker"}
                </p>
              </div>

              <div style={styles.detailItem}>
                <label style={{
                  ...styles.detailLabel,
                  color: "#2563eb",
                }}>
                  Member Since
                </label>
                <p style={{
                  ...styles.detailValue,
                  color: isDarkMode ? "#ccc" : "#333",
                }}>
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "Not available"}
                </p>
              </div>
            </div>
          </div>

          {user?.role === "jobseeker" && (
            <div style={{
              ...styles.profileSection,
              borderColor: isDarkMode ? "#333" : "#f0f0f0",
              backgroundColor: isDarkMode ? "#0f0f0f" : "#ffffff",
            }}>
              <h2 style={{
                ...styles.sectionTitle,
                color: isDarkMode ? "#ffffff" : "#000",
              }}>
                Jobseeker Profile
              </h2>

              <div style={styles.detailsGrid}>
                <div style={styles.detailItem}>
                  <label style={styles.detailLabel}>Bio</label>
                  <p style={styles.detailValue}>{user?.bio || "Not provided"}</p>
                </div>
                <div style={styles.detailItem}>
                  <label style={styles.detailLabel}>Citizenship</label>
                  <p style={styles.detailValue}>{user?.citizenShip || "Not provided"}</p>
                </div>
                <div style={styles.detailItem}>
                  <label style={styles.detailLabel}>Experience</label>
                  <p style={styles.detailValue}>{user?.experience || "Not provided"}</p>
                </div>
                <div style={styles.detailItem}>
                  <label style={styles.detailLabel}>Education</label>
                  <p style={styles.detailValue}>{user?.education || "Not provided"}</p>
                </div>
                <div style={styles.detailItem}>
                  <label style={styles.detailLabel}>Location</label>
                  <p style={styles.detailValue}>{`${user?.location?.region || ""}${user?.location?.city ? ", " + user.location.city : ""}${user?.location?.barangay ? ", " + user.location.barangay : ""}${user?.location?.otherDetails ? ", " + user.location.otherDetails : ""}` || "Not provided"}</p>
                </div>
                <div style={styles.detailItem}>
                  <label style={styles.detailLabel}>Resume</label>
                  <p style={styles.detailValue}>{user?.resume || "Not provided"}</p>
                </div>
                <div style={styles.detailItem}>
                  <label style={styles.detailLabel}>Profile Picture</label>
                  <p style={styles.detailValue}>{user?.profilePicture || "Not provided"}</p>
                </div>
              </div>
            </div>
          )}

          {user?.role === "employer" && (
            <div style={{
              ...styles.profileSection,
              borderColor: isDarkMode ? "#333" : "#f0f0f0",
              backgroundColor: isDarkMode ? "#0f0f0f" : "#ffffff",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h2 style={{
                  ...styles.sectionTitle,
                  color: isDarkMode ? "#ffffff" : "#000",
                  margin: 0,
                }}>
                  Employer Profile
                </h2>
                {isOwnProfile && (
                  <button
                    style={styles.smallEditButton}
                    onClick={() => navigate("/create/employer")}
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              <div style={styles.detailsGrid}>
                <div style={styles.detailItem}>
                  <label style={styles.detailLabel}>Company</label>
                  <p style={styles.detailValue}>{user.companyName || "Not provided"}</p>
                </div>
                <div style={styles.detailItem}>
                  <label style={styles.detailLabel}>Industry</label>
                  <p style={styles.detailValue}>{user.industry || "Not provided"}</p>
                </div>
                <div style={styles.detailItem}>
                  <label style={styles.detailLabel}>Company Size</label>
                  <p style={styles.detailValue}>{user.companySize || "Not provided"}</p>
                </div>
                <div style={styles.detailItem}>
                  <label style={styles.detailLabel}>Website</label>
                  <p style={styles.detailValue}>{user.website || "Not provided"}</p>
                </div>
                <div style={styles.detailItem}>
                  <label style={styles.detailLabel}>Contact</label>
                  <p style={styles.detailValue}>{user.contactNumber || "Not provided"}</p>
                </div>
                <div style={styles.detailItem}>
                  <label style={styles.detailLabel}>Established</label>
                  <p style={styles.detailValue}>{user.dateEstablished ? new Date(user.dateEstablished).toLocaleDateString() : "Not provided"}</p>
                </div>
                <div style={styles.detailItem}>
                  <label style={styles.detailLabel}>Location</label>
                  <p style={styles.detailValue}>{`${user.companyLocation?.region || ""}${user.companyLocation?.city ? ", " + user.companyLocation.city : ""}${user.companyLocation?.barangay ? ", " + user.companyLocation.barangay : ""}${user.companyLocation?.otherDetails ? ", " + user.companyLocation.otherDetails : ""}` || "Not provided"}</p>
                </div>
                <div style={styles.detailItem}>
                  <label style={styles.detailLabel}>Status</label>
                  <p style={styles.detailValue}>{user.approvalStatus || "Pending"}</p>
                </div>
              </div>
            </div>
          )}

          {user?.role === "employer" && (
            <div style={{
              ...styles.profileSection,
              borderColor: isDarkMode ? "#333" : "#f0f0f0",
              backgroundColor: isDarkMode ? "#0f0f0f" : "#ffffff",
            }}>
              <h2 style={{
                ...styles.sectionTitle,
                color: isDarkMode ? "#ffffff" : "#000",
              }}>
                Employer Job Activity
              </h2>

              {metricsLoading ? (
                <p style={styles.loadingText}>Loading job activity...</p>
              ) : employerJobs.length ? (
                <div style={styles.jobList}>
                  {employerJobs.map((job) => (
                    <div key={job._id} style={styles.jobCard}>
                      <div style={styles.jobHeader}>
                        <div>
                          <p style={styles.jobTitle}>{job.title}</p>
                          <p style={styles.jobMeta}>{job.companyName}</p>
                        </div>
                        <div style={styles.jobActionsRow}>
                          <button
                            style={styles.interactionButton}
                            onClick={() =>
                              setSelectedJobId(
                                selectedJobId === job._id ? null : job._id
                              )
                            }
                          >
                            {selectedJobId === job._id
                              ? "Hide details"
                              : "Manage applicants"}
                          </button>
                          <button
                            style={styles.deleteJobButton}
                            onClick={() => handleJobDelete(job._id)}
                          >
                            Delete job
                          </button>
                        </div>
                      </div>

                      <div style={styles.jobStatsRow}>
                        <span style={styles.jobStatItem}>
                          <EyeIcon size={16} />
                          <span>{job.views?.length || 0} views</span>
                        </span>
                        <span style={styles.jobStatItem}>
                          <HeartIcon size={16} />
                          <span>{job.likes?.length || 0} likes</span>
                        </span>
                        <span style={styles.jobStatItem}>
                          <BriefcaseIcon size={16} />
                          <span>{job.applicants?.length || 0} applicants</span>
                        </span>
                        <span style={styles.jobStatItem}>
                          <ClockIcon size={16} />
                          <span>{job.applicants?.filter((application) => (application.status || 'pending') === 'pending').length || 0} pending</span>
                        </span>
                      </div>

                      {selectedJobId === job._id && (
                        <div style={styles.interactionPanel}>
                          <div style={styles.interactionGroup}>
                            <p style={styles.interactionLabel}>Viewed by</p>
                            {job.views?.length ? (
                              job.views.map((viewer) => (
                                <p key={viewer._id} style={styles.interactionText}>
                                  {viewer.firstName} {viewer.lastName} • {viewer.email}
                                </p>
                              ))
                            ) : (
                              <p style={styles.interactionText}>No jobseeker views yet.</p>
                            )}
                          </div>

                          <div style={styles.interactionGroup}>
                            <p style={styles.interactionLabel}>Liked by</p>
                            {job.likes?.length ? (
                              job.likes.map((liker) => (
                                <p key={liker._id} style={styles.interactionText}>
                                  {liker.firstName} {liker.lastName} • {liker.email}
                                </p>
                              ))
                            ) : (
                              <p style={styles.interactionText}>No likes yet.</p>
                            )}
                          </div>

                          <div style={styles.interactionGroup}>
                            <p style={styles.interactionLabel}>Applicants</p>
                            {job.applicants?.length ? (
                              job.applicants.map((applicant) => {
                                const user = applicant.user || applicant;
                                const status = applicant.status || "pending";
                                return (
                                  <div key={user._id} style={styles.applicantRow}>
                                    <div style={styles.applicantDetails}>
                                      {user.profilePicture && (
                                        <img
                                          src={user.profilePicture}
                                          alt={`${user.firstName} avatar`}
                                          style={styles.applicantAvatar}
                                        />
                                      )}
                                      <div>
                                        <p style={styles.interactionText}>
                                          {user.firstName} {user.lastName} • {user.email}
                                        </p>
                                        <p style={styles.applicantStatus}>{status}</p>
                                      </div>
                                    </div>
                                    <div style={styles.applicantActions}>
                                      <button
                                        style={styles.viewProfileButton}
                                        onClick={() => openApplicantModal(applicant, job._id)}
                                      >
                                        View profile
                                      </button>
                                      {status !== "accepted" && (
                                        <button
                                          style={styles.statusButton}
                                          onClick={() => handleApplicantStatusChange(job._id, user._id, "accepted")}
                                        >
                                          Accept
                                        </button>
                                      )}
                                      {status !== "rejected" && (
                                        <button
                                          style={styles.statusButtonSecondary}
                                          onClick={() => handleApplicantStatusChange(job._id, user._id, "rejected")}
                                        >
                                          Reject
                                        </button>
                                      )}
                                      {status !== "reviewing" && (
                                        <button
                                          style={styles.statusButtonSecondary}
                                          onClick={() => handleApplicantStatusChange(job._id, user._id, "reviewing")}
                                        >
                                          Reviewing
                                        </button>
                                      )}
                                      <button
                                        style={styles.statusButtonSecondary}
                                        onClick={() => handleApplicantRemove(job._id, user._id)}
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <p style={styles.interactionText}>No applicants yet.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.noJobsText}>You have not posted any jobs yet.</p>
              )}
            </div>
          )}

          {showApplicantModal && selectedApplicant && (
            <div style={styles.modalOverlay} onClick={closeApplicantModal}>
              <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                  <div style={styles.modalTitleRow}>
                    {selectedApplicantInfo?.profilePicture ? (
                      <img
                        src={selectedApplicantInfo.profilePicture}
                        alt="Applicant profile"
                        style={styles.modalAvatar}
                      />
                    ) : null}
                    <h2 style={styles.modalTitle}>{selectedApplicant.user?.firstName || selectedApplicant.firstName} {selectedApplicant.user?.lastName || selectedApplicant.lastName}</h2>
                  </div>
                  <button style={styles.modalClose} onClick={closeApplicantModal}>✕</button>
                </div>
                <div style={styles.modalBody}>
                  <p style={styles.modalLabel}>Email</p>
                  <p style={styles.modalValue}>{selectedApplicantInfo?.email}</p>
                  <p style={styles.modalLabel}>Status</p>
                  <p style={styles.modalValue}>{selectedApplicant.status || "pending"}</p>
                  {selectedApplicant.jobId && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                      {selectedApplicant.status !== 'accepted' && (
                        <button
                          style={styles.statusButton}
                          onClick={() => handleApplicantStatusChange(selectedApplicant.jobId, selectedApplicant.user?._id || selectedApplicant._id, 'accepted')}
                        >
                          Accept
                        </button>
                      )}
                      {selectedApplicant.status !== 'rejected' && (
                        <button
                          style={styles.statusButtonSecondary}
                          onClick={() => handleApplicantStatusChange(selectedApplicant.jobId, selectedApplicant.user?._id || selectedApplicant._id, 'rejected')}
                        >
                          Reject
                        </button>
                      )}
                      {selectedApplicant.status !== 'reviewing' && (
                        <button
                          style={styles.statusButtonSecondary}
                          onClick={() => handleApplicantStatusChange(selectedApplicant.jobId, selectedApplicant.user?._id || selectedApplicant._id, 'reviewing')}
                        >
                          Reviewing
                        </button>
                      )}
                      <button
                        style={styles.statusButtonSecondary}
                        onClick={() => handleApplicantRemove(selectedApplicant.jobId, selectedApplicant.user?._id || selectedApplicant._id)}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {selectedApplicantInfo?.phoneNumber && (
                    <>
                      <p style={styles.modalLabel}>Phone</p>
                      <p style={styles.modalValue}>{selectedApplicantInfo.phoneNumber}</p>
                    </>
                  )}
                  {selectedApplicantInfo?.bio && (
                    <>
                      <p style={styles.modalLabel}>Bio</p>
                      <p style={styles.modalValue}>{selectedApplicantInfo.bio}</p>
                    </>
                  )}
                  {selectedApplicantInfo?.experience && (
                    <>
                      <p style={styles.modalLabel}>Experience</p>
                      <p style={styles.modalValue}>{selectedApplicantInfo.experience}</p>
                    </>
                  )}
                  {selectedApplicantInfo?.education && (
                    <>
                      <p style={styles.modalLabel}>Education</p>
                      <p style={styles.modalValue}>{selectedApplicantInfo.education}</p>
                    </>
                  )}
                  {selectedApplicantInfo?.citizenShip && (
                    <>
                      <p style={styles.modalLabel}>Citizenship</p>
                      <p style={styles.modalValue}>{selectedApplicantInfo.citizenShip}</p>
                    </>
                  )}
                  {selectedApplicantInfo?.location && (
                    <>
                      <p style={styles.modalLabel}>Location</p>
                      <p style={styles.modalValue}>
                        {selectedApplicantInfo.location.region}, {selectedApplicantInfo.location.city}, {selectedApplicantInfo.location.barangay}
                        {selectedApplicantInfo.location.otherDetails ? ` • ${selectedApplicantInfo.location.otherDetails}` : ""}
                      </p>
                    </>
                  )}
                  {selectedApplicantInfo?.resume && (
                    <>
                      <p style={styles.modalLabel}>Resume</p>
                      <p style={styles.modalValue}>{selectedApplicantInfo.resume}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {showImageModal && (
            <div style={styles.modalOverlay} onClick={closeImageModal}>
              <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                  <h2 style={styles.modalTitle}>
                    {user?.role === "employer"
                      ? "Upload company logo"
                      : "Upload profile picture"}
                  </h2>
                  <button style={styles.modalClose} onClick={closeImageModal}>
                    ✕
                  </button>
                </div>
                <div style={styles.modalBody}>
                  <div style={{ display: 'grid', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div
                        style={{
                          width: PREVIEW,
                          height: PREVIEW,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          background: '#e6eef9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                        }}
                        onMouseDown={onMouseDown}
                        onTouchStart={onTouchStart}
                      >
                        {selectedImagePreview || user?.profilePicture || user?.companyLogo ? (
                          <img
                            src={selectedImagePreview || user.profilePicture || user.companyLogo}
                            alt="Crop preview"
                            style={{
                              position: 'absolute',
                              left: offset.x,
                              top: offset.y,
                              width: renderWidth,
                              height: renderHeight,
                              userSelect: 'none',
                              touchAction: 'none',
                            }}
                            draggable={false}
                          />
                        ) : (
                          <div style={styles.uploadPlaceholderModal}>
                            Choose an image to preview
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 700 }}>Zoom</label>
                        <input
                          type="range"
                          min={0.5}
                          max={3}
                          step={0.01}
                          value={zoom}
                          onChange={(e) => {
                            const newZoom = Number(e.target.value);
                            // adjust offset to keep center
                            const prevW = renderWidth;
                            const prevH = renderHeight;
                            const newW = naturalSize.w * initialScale * newZoom;
                            const newH = naturalSize.h * initialScale * newZoom;
                            const dx = (prevW - newW) / 2;
                            const dy = (prevH - newH) / 2;
                            setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
                            setZoom(newZoom);
                          }}
                          style={{ width: '100%' }}
                        />
                        <div style={{ height: 12 }} />
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          style={styles.modalFileInput}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div style={styles.modalActions}>
                  <button
                    style={styles.cancelButton}
                    onClick={closeImageModal}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    style={styles.uploadButton}
                    onClick={handleImageUpload}
                    type="button"
                    disabled={!(selectedImagePreview || user?.profilePicture || user?.companyLogo) || uploadingAvatar}
                  >
                    {uploadingAvatar ? "Uploading..." : "Upload image"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{
            ...styles.profileSection,
            borderColor: isDarkMode ? "#333" : "#f0f0f0",
            backgroundColor: isDarkMode ? "#0f0f0f" : "#ffffff",
          }}>
            <h2 style={{
              ...styles.sectionTitle,
              color: isDarkMode ? "#ffffff" : "#000",
            }}>
              Profile Status
            </h2>

            <div style={styles.statusContainer}>
              {(completion < 100) && (
              <div style={styles.statusItem}>
                <span style={{
                  ...styles.statusLabel,
                  color: isDarkMode ? "#fff" : "#333",
                }}>
                  Profile Completion
                </span>
                <div style={{
                  ...styles.progressBar,
                  backgroundColor: isDarkMode ? "#333" : "#e0e0e0",
                }}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${completion}%`,
                      backgroundColor: completion === 100 ? "#22c55e" : "#3b82f6",
                    }}
                  ></div>
                </div>
                <span style={{
                  ...styles.statusValue,
                  color: isDarkMode ? "#999" : "#666",
                }}>
                  {completion}% complete
                </span>
              </div>
              )}
            </div>
          </div>

          {myPosts.length > 0 && (
            <div style={{
              ...styles.profileSection,
              borderColor: isDarkMode ? "#333" : "#f0f0f0",
              backgroundColor: isDarkMode ? "#0f0f0f" : "#ffffff",
            }}>
              <h2 style={{
                ...styles.sectionTitle,
                color: isDarkMode ? "#ffffff" : "#000",
              }}>
                Your Posts
              </h2>

              <div style={{ display: 'grid', gap: 16 }}>
                {myPosts.map((post) => (
                  <div 
                    key={post._id} 
                    onClick={() => openPostModal(post)}
                    style={{ padding: 16, borderRadius: 18, border: isDarkMode ? '1px solid #1f2937' : '1px solid #e6eef9', background: isDarkMode ? '#071022' : '#fff', cursor: 'pointer', transition: 'all 0.3s ease', }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = isDarkMode ? '#3f3f46' : '#d1d5db'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = isDarkMode ? '#1f2937' : '#e6eef9'}
                  >
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: '#2563eb', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        {post.authorAvatar ? (
                          <img src={post.authorAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          user?.firstName?.charAt(0) || 'U'
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                          <strong style={{ color: isDarkMode ? '#fff' : '#0f172a' }}>{post.authorName}</strong>
                          <span style={{ color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>{new Date(post.createdAt).toLocaleString()}</span>
                        </div>
                        {post.tags?.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                            {post.tags.map((tag, index) => (
                              <span key={`${post._id}-tag-${index}`} style={{ fontSize: 12, color: '#2563eb', background: isDarkMode ? 'rgba(37,99,235,0.12)' : 'rgba(37,99,235,0.1)', padding: '4px 10px', borderRadius: 999 }}>{`#${tag}`}</span>
                            ))}
                          </div>
                        )}
                        <p style={{ margin: '12px 0 0 0', color: isDarkMode ? '#cbd5e1' : '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{post.content}</p>
                        {post.media?.data && (
                          <div style={{ marginTop: 14, borderRadius: 16, overflow: 'hidden', background: '#000' }}>
                            <img src={post.media.data} alt="Post media" style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: 320 }} />
                          </div>
                        )}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 14, color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12, alignItems: 'center' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><HeartIcon size={16} filled={post.likes?.length > 0} />{post.likes?.length || 0}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><CommentIcon size={16} />{post.comments?.length || 0}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><RepostIcon size={16} />{post.reposts?.length || 0}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><ShareIcon size={16} />{post.shares?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showPostModal && selectedPost && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={closePostModal}>
              <div 
                style={{ 
                  background: isDarkMode ? '#0f172a' : '#fff', 
                  borderRadius: 18, 
                  maxWidth: 600, 
                  width: '90%', 
                  maxHeight: '85vh', 
                  display: 'flex', 
                  flexDirection: 'column',
                  overflow: 'hidden',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
                }} 
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, borderBottom: isDarkMode ? '1px solid #1f2937' : '1px solid #e6eef9', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0, color: isDarkMode ? '#fff' : '#000', fontSize: 18 }}>Post details</h2>
                    <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 13 }}>
                      {selectedPost.authorName || 'Unknown author'} · {selectedPost.authorRole || 'User'}
                    </p>
                  </div>
                  <button style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: isDarkMode ? '#cbd5e1' : '#334155' }} onClick={closePostModal}>✕</button>
                </div>

                {/* Modal Action Buttons (Edit, Archive, Delete) - only show for post owner */}
                {isOwnProfile && (
                  <div style={{ display: 'flex', gap: 8, padding: '0 20px', paddingTop: 8, borderBottom: isDarkMode ? '1px solid #1f2937' : '1px solid #e6eef9' }}>
                    <button style={{ padding: '8px 12px', fontSize: 13, background: isDarkMode ? '#1f2937' : '#f1f5f9', border: 'none', borderRadius: 8, color: isDarkMode ? '#e2e8f0' : '#334155', cursor: 'pointer' }}>Edit</button>
                    <button style={{ padding: '8px 12px', fontSize: 13, background: isDarkMode ? '#1f2937' : '#f1f5f9', border: 'none', borderRadius: 8, color: isDarkMode ? '#e2e8f0' : '#334155', cursor: 'pointer' }}>Archive</button>
                    <button style={{ padding: '8px 12px', fontSize: 13, background: '#fee2e2', border: 'none', borderRadius: 8, color: '#991b1b', cursor: 'pointer' }}>Delete</button>
                  </div>
                )}

                {/* Modal Body - Scrollable */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 20, color: isDarkMode ? '#e2e8f0' : '#334155' }}>
                  {/* Post Header with Avatar and Time */}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
                    <div 
                      style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: '#2563eb', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, cursor: 'pointer' }}
                      onClick={() => { closePostModal(); navigate(`/profile/${selectedPost.author}`); }}
                    >
                      {selectedPost.authorAvatar ? (
                        <img src={selectedPost.authorAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        selectedPost.authorName?.charAt(0) || 'U'
                      )}
                    </div>
                    <div>
                      <p style={{ margin: 0, color: isDarkMode ? '#cbd5e1' : '#64748b', fontSize: 13 }}>
                        {new Date(selectedPost.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Post Content */}
                  <p style={{ margin: '0 0 16px 0', color: isDarkMode ? '#e2e8f0' : '#334155', lineHeight: 1.7 }}>{selectedPost.content}</p>

                  {/* Post Media */}
                  {selectedPost.media?.data && (
                    <div style={{ marginBottom: 16, borderRadius: 14, overflow: 'hidden' }}>
                      <img src={selectedPost.media.data} alt="post media" style={{ width: '100%', maxHeight: 320, objectFit: 'cover' }} />
                    </div>
                  )}

                  {/* Post Tags */}
                  {selectedPost.tags?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                      {selectedPost.tags.map((tag, index) => (
                        <span key={`${selectedPost._id}-modal-tag-${index}`} style={{ fontSize: 12, color: '#2563eb', background: isDarkMode ? 'rgba(37,99,235,0.12)' : 'rgba(37,99,235,0.1)', padding: '4px 10px', borderRadius: 999 }}>#{tag}</span>
                      ))}
                    </div>
                  )}

                  {/* Comments Section */}
                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: isDarkMode ? '1px solid #1f2937' : '1px solid #e6eef9' }}>
                    <h3 style={{ margin: '0 0 12px', fontSize: 16, color: isDarkMode ? '#e2e8f0' : '#334155' }}>Comments</h3>
                    {selectedPost.comments?.length > 0 ? (
                      <div style={{ display: 'grid', gap: 14, maxHeight: 360, overflowY: 'auto', paddingRight: 6, marginBottom: 16 }}>
                        {selectedPost.comments.map((comment) => (
                          <div key={comment._id}>
                            {/* Comment */}
                            <div style={{ display: 'flex', gap: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: '#2563eb', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 12 }}>
                                {comment.authorAvatar ? (
                                  <img src={comment.authorAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  comment.authorName?.charAt(0) || 'U'
                                )}
                              </div>
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontWeight: 600, color: isDarkMode ? '#e2e8f0' : '#334155' }}>{comment.authorName || 'Commenter'}</p>
                                <p style={{ margin: '4px 0 0', fontSize: 12, color: isDarkMode ? '#94a3b8' : '#64748b' }}>{new Date(comment.createdAt).toLocaleString()}</p>
                                <p style={{ margin: '6px 0 8px', color: isDarkMode ? '#cbd5e1' : '#475569', lineHeight: 1.6 }}>{comment.content}</p>
                                <button 
                                  onClick={() => setReplyingToCommentId(replyingToCommentId === comment._id ? null : comment._id)}
                                  style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 12, fontWeight: 500, padding: 0 }}
                                >
                                  {replyingToCommentId === comment._id ? 'Cancel' : 'Reply'}
                                </button>
                              </div>
                            </div>

                            {/* Reply Input for this Comment */}
                            {replyingToCommentId === comment._id && (
                              <div style={{ marginLeft: 46, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <textarea
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Write a reply..."
                                  style={{
                                    width: '100%',
                                    minHeight: 60,
                                    padding: 10,
                                    borderRadius: 8,
                                    border: isDarkMode ? '1px solid #1f2937' : '1px solid #e6eef9',
                                    background: isDarkMode ? '#1a202c' : '#f8fafc',
                                    color: isDarkMode ? '#e2e8f0' : '#334155',
                                    fontSize: 12,
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                  }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                  <button
                                    onClick={() => { setReplyText(''); setReplyingToCommentId(null); }}
                                    style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: isDarkMode ? '#1f2937' : '#f1f5f9', color: isDarkMode ? '#e2e8f0' : '#334155', cursor: 'pointer', fontSize: 12 }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => submitReply(comment._id)}
                                    style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 12, opacity: replyLoading || !replyText.trim() ? 0.6 : 1 }}
                                    disabled={replyLoading || !replyText.trim()}
                                  >
                                    {replyLoading ? 'Replying...' : 'Reply'}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Replies */}
                            {comment.replies?.length > 0 && (
                              <div style={{ marginLeft: 46, marginTop: 12, display: 'grid', gap: 10, borderLeft: isDarkMode ? '2px solid #1f2937' : '2px solid #e6eef9', paddingLeft: 12 }}>
                                {comment.replies.map((reply) => (
                                  <div key={reply._id} style={{ display: 'flex', gap: 8 }}>
                                    <div style={{ width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', background: '#10b981', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 11 }}>
                                      {reply.authorAvatar ? (
                                        <img src={reply.authorAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      ) : (
                                        reply.authorName?.charAt(0) || 'U'
                                      )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: isDarkMode ? '#e2e8f0' : '#334155' }}>{reply.authorName || 'Replier'}</p>
                                      <p style={{ margin: '2px 0 0', fontSize: 11, color: isDarkMode ? '#94a3b8' : '#64748b' }}>{new Date(reply.createdAt).toLocaleString()}</p>
                                      <p style={{ margin: '4px 0 0', fontSize: 13, color: isDarkMode ? '#cbd5e1' : '#475569', lineHeight: 1.5 }}>{reply.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: '#64748b', margin: '0 0 16px 0', fontSize: 13 }}>No comments yet. Be the first to add one.</p>
                    )}

                    {/* Comment Input */}
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      style={{ 
                        width: '100%', 
                        minHeight: 80, 
                        padding: 12, 
                        borderRadius: 12, 
                        border: isDarkMode ? '1px solid #1f2937' : '1px solid #e6eef9', 
                        background: isDarkMode ? '#1a202c' : '#f8fafc',
                        color: isDarkMode ? '#e2e8f0' : '#334155',
                        fontSize: 13,
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                      <button
                        style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: isDarkMode ? '#1f2937' : '#f1f5f9', color: isDarkMode ? '#e2e8f0' : '#334155', cursor: 'pointer', fontSize: 13 }}
                        onClick={() => setCommentText('')}
                      >
                        Cancel
                      </button>
                      <button
                        style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 13, opacity: commentLoading || !commentText.trim() ? 0.6 : 1 }}
                        onClick={submitComment}
                        disabled={commentLoading || !commentText.trim()}
                      >
                        {commentLoading ? 'Posting...' : 'Post comment'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Modal Footer - Stats and Actions */}
                <div style={{ display: 'flex', gap: 16, padding: 16, borderTop: isDarkMode ? '1px solid #1f2937' : '1px solid #e6eef9', background: isDarkMode ? '#0a0f1a' : '#f8fafc', flexWrap: 'wrap' }}>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: isDarkMode ? '#cbd5e1' : '#64748b', cursor: 'pointer', fontSize: 13 }}>
                    <HeartIcon size={16} filled={selectedPost.likes?.length > 0} />
                    <span>{selectedPost.likes?.length || 0}</span>
                  </button>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: isDarkMode ? '#cbd5e1' : '#64748b', cursor: 'pointer', fontSize: 13 }}>
                    <CommentIcon size={16} />
                    <span>{selectedPost.comments?.length || 0}</span>
                  </button>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: isDarkMode ? '#cbd5e1' : '#64748b', cursor: 'pointer', fontSize: 13 }}>
                    <RepostIcon size={16} />
                    <span>{selectedPost.reposts?.length || 0}</span>
                  </button>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: isDarkMode ? '#cbd5e1' : '#64748b', cursor: 'pointer', fontSize: 13 }}>
                    <ShareIcon size={16} />
                    <span>{selectedPost.shares?.length || 0}</span>
                  </button>
                  <button style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: 8, border: 'none', background: isDarkMode ? '#1f2937' : '#f1f5f9', color: isDarkMode ? '#e2e8f0' : '#334155', cursor: 'pointer', fontSize: 13 }} onClick={closePostModal}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={styles.actionsContainer}>
            <button
              style={styles.secondaryButton}
              onClick={() => navigate("/")}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  navbar: {
    backgroundColor: "#ffffff",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },

  navContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "16px 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
  },

  logoImage: {
    width: "40px",
    height: "40px",
  },

  logoText: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#2563eb",
  },

  navLinks: {
    display: "flex",
    gap: "40px",
    flex: 1,
    marginLeft: "60px",
  },

  navLink: {
    textDecoration: "none",
    color: "#666",
    fontWeight: "600",
    fontSize: "14px",
  },

  navActions: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },

  profileMenu: {
    position: "relative",
  },

  profileButton: {
    background:
      "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
    border: "none",
    borderRadius: "50%",
    width: "44px",
    height: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  profileIcon: {
    color: "#ffffff",
    fontSize: "22px",
  },

  dropdown: {
    position: "absolute",
    top: "54px",
    right: 0,
    backgroundColor: "#ffffff",
    border: "1px solid #e0e0e0",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    minWidth: "180px",
    overflow: "hidden",
  },

  dropdownItem: {
    width: "100%",
    padding: "12px 16px",
    background: "none",
    border: "none",
    borderBottom: "1px solid #f0f0f0",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "14px",
    color: "#333",
  },

  mainContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 30px",
  },

  profileContainer: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    overflow: "hidden",
  },

  profileHeader: {
    padding: "40px",
    background:
      "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    gap: "30px",
  },

  profileImageContainer: {
    flex: "0 0 auto",
  },

  hiddenInput: {
    display: "none",
  },

  profileImageLabel: {
    display: "inline-block",
    cursor: "pointer",
  },

  profileImage: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    backgroundColor:
      "rgba(255,255,255,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "48px",
    fontWeight: "800",
    border: "3px solid rgba(255,255,255,0.5)",
    overflow: "hidden",
  },
  profileHeaderImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  profileInfo: {
    flex: 1,
  },

  profileName: {
    fontSize: "32px",
    fontWeight: "800",
    margin: "0 0 8px 0",
  },

  profileEmail: {
    fontSize: "16px",
    margin: "0 0 4px 0",
    opacity: 0.9,
  },

  profileRole: {
    fontSize: "14px",
    opacity: 0.8,
    margin: 0,
  },

  editButton: {
    padding: "12px 28px",
    border: "2px solid rgba(255,255,255,0.5)",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.15)",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "14px",
  },

  profileSection: {
    padding: "40px",
    borderBottom: "1px solid #f0f0f0",
  },

  sectionTitle: {
    fontSize: "24px",
    fontWeight: "700",
    marginBottom: "24px",
    color: "#000",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "30px",
  },

  detailItem: {
    display: "flex",
    flexDirection: "column",
  },

  detailLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#2563eb",
    textTransform: "uppercase",
    marginBottom: "8px",
  },

  detailValue: {
    fontSize: "16px",
    color: "#333",
    margin: 0,
  },

  profileImagePreview: {
    marginBottom: "24px",
    maxWidth: "180px",
    borderRadius: "18px",
    overflow: "hidden",
    border: "1px solid #cbd5e1",
  },

  profileImagePreviewImg: {
    width: "100%",
    display: "block",
  },

  uploadPreviewContainer: {
    width: "100%",
    minHeight: "220px",
    borderRadius: "20px",
    border: "1px dashed #cbd5e1",
    backgroundColor: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  uploadPreviewImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },

  uploadPlaceholderModal: {
    color: "#64748b",
    fontSize: "0.95rem",
    textAlign: "center",
    padding: "24px",
  },

  modalFileInput: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "16px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#ffffff",
    fontSize: "0.95rem",
    cursor: "pointer",
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "20px",
  },

  cancelButton: {
    padding: "12px 22px",
    borderRadius: "14px",
    backgroundColor: "#f8fafc",
    border: "1px solid #cbd5e1",
    color: "#334155",
    cursor: "pointer",
    fontWeight: "700",
  },

  uploadButton: {
    padding: "12px 22px",
    borderRadius: "14px",
    backgroundColor: "#2563eb",
    border: "none",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "700",
  },

  statusContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  statusItem: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  statusLabel: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#333",
  },

  progressBar: {
    width: "100%",
    height: "8px",
    backgroundColor: "#e0e0e0",
    borderRadius: "4px",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    width: "75%",
    background:
      "linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)",
    borderRadius: "4px",
  },

  statusValue: {
    fontSize: "14px",
    color: "#666",
  },

  smallEditButton: {
    padding: "8px 14px",
    borderRadius: "10px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "13px",
  },

  loadingText: {
    fontSize: "15px",
    color: "#64748b",
    margin: 0,
  },

  jobList: {
    display: "grid",
    gap: "18px",
  },

  jobCard: {
    backgroundColor: "#111827",
    border: "1px solid #1f2937",
    borderRadius: "20px",
    padding: "22px",
    color: "#f8fafc",
  },

  jobHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "14px",
  },

  jobTitle: {
    fontSize: "18px",
    fontWeight: "700",
    margin: 0,
    color: "#f8fafc",
  },

  jobMeta: {
    margin: "4px 0 0 0",
    fontSize: "14px",
    color: "#cbd5e1",
  },

  interactionButton: {
    padding: "10px 18px",
    borderRadius: "14px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
  },

  jobActionsRow: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },

  deleteJobButton: {
    padding: "10px 18px",
    borderRadius: "14px",
    backgroundColor: "#1e40af",
    color: "#ffffff",
    border: "none",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
  },

  jobStatsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "14px",
    color: "#cbd5e1",
    fontSize: "14px",
    marginBottom: "18px",
  },

  jobStatItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    borderRadius: "14px",
    backgroundColor: "#1f2937",
    color: "#e2e8f0",
  },

  interactionPanel: {
    display: "grid",
    gap: "16px",
    padding: "18px",
    borderRadius: "18px",
    backgroundColor: "#0f172a",
    border: "1px solid #1f2937",
  },

  interactionGroup: {
    display: "grid",
    gap: "8px",
  },

  interactionLabel: {
    margin: 0,
    fontWeight: "700",
    color: "#cbd5e1",
  },

  interactionText: {
    margin: 0,
    color: "#e2e8f0",
    fontSize: "14px",
  },

  noJobsText: {
    fontSize: "15px",
    color: "#64748b",
    margin: 0,
  },

  applicantRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "12px 14px",
    borderRadius: "14px",
    backgroundColor: "#0f172a",
    border: "1px solid #1f2937",
    flexWrap: "wrap",
  },

  applicantStatus: {
    margin: "6px 0 0",
    padding: "4px 10px",
    borderRadius: "999px",
    backgroundColor: "#1f2937",
    color: "#e2e8f0",
    fontSize: "12px",
    fontWeight: "700",
    display: "inline-flex",
    alignItems: "center",
  },

  applicantActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    alignItems: "center",
  },

  applicantDetails: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  applicantAvatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "1px solid #e2e8f0",
  },

  modalTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  modalAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "1px solid #e2e8f0",
  },

  statusButton: {
    padding: "10px 14px",
    borderRadius: "12px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "12px",
  },

  statusButtonSecondary: {
    padding: "10px 14px",
    borderRadius: "12px",
    backgroundColor: "transparent",
    color: "#2563eb",
    border: "1px solid #2563eb",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "12px",
  },

  viewProfileButton: {
    border: "1px solid #2563eb",
    borderRadius: "12px",
    background: "#111827",
    color: "#ffffff",
    cursor: "pointer",
    padding: "10px 14px",
    fontWeight: "700",
    fontSize: "13px",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },

  modalCard: {
    width: "min(620px, 90vw)",
    maxHeight: "90vh",
    overflowY: "auto",
    backgroundColor: "#ffffff",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 28px 70px rgba(15, 23, 42, 0.2)",
    border: "1px solid #e2e8f0",
  },

  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "18px",
  },

  modalTitle: {
    margin: 0,
    fontSize: "1.75rem",
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
    gap: "12px",
    color: "#334155",
  },

  modalLabel: {
    margin: 0,
    fontWeight: "700",
    color: "#0f172a",
  },

  modalValue: {
    margin: 0,
    color: "#475569",
    lineHeight: "1.6",
  },

  actionsContainer: {
    padding: "40px",
    display: "flex",
    gap: "16px",
    justifyContent: "flex-end",
  },

  secondaryButton: {
    padding: "12px 28px",
    border: "2px solid #2563eb",
    borderRadius: "12px",
    background: "transparent",
    color: "#2563eb",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "14px",
  },
};
