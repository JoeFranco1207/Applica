import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ThemeContext } from "../contexts/ThemeContext";
import ThemeSwitch from "../components/ThemeSwitch";
import axios from "axios";

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
        navigate("/");
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

  const openApplicantModal = (applicant) => {
    setSelectedApplicant(applicant);
    setShowApplicantModal(true);
  };

  const closeApplicantModal = () => {
    setSelectedApplicant(null);
    setShowApplicantModal(false);
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
      {/* Navbar */}
      <nav style={{
        ...styles.navbar,
        backgroundColor: isDarkMode ? "#0f0f0f" : "#ffffff",
      }}>
        <div style={styles.navContent}>
          <div
            style={styles.logo}
            onClick={() => navigate("/")}
          >
            <img
              src="/src/assets/Applica_Logo.png"
              alt="Applica"
              style={styles.logoImage}
            />
            <span style={styles.logoText}>
              Applica
            </span>
          </div>

          <div style={styles.navLinks}>
            <a
              href="#"
              style={{
                ...styles.navLink,
                color: isDarkMode ? "#ccc" : "#666",
              }}
            >
              Browse Jobs
            </a>
            <a
              href="#"
              style={{
                ...styles.navLink,
                color: isDarkMode ? "#ccc" : "#666",
              }}
            >
              Companies
            </a>
            <a
              href="#"
              style={{
                ...styles.navLink,
                color: isDarkMode ? "#ccc" : "#666",
              }}
            >
              Resources
            </a>
          </div>

          <div style={styles.navActions}>
            <ThemeSwitch 
              isDarkMode={isDarkMode} 
              toggleTheme={toggleTheme} 
            />

            <div style={styles.profileMenu}>
              <button
                style={styles.profileButton}
                onClick={() =>
                  setUserMenuOpen(!userMenuOpen)
                }
              >
                <span style={styles.profileIcon}>
                  ⋯
                </span>
              </button>

              {userMenuOpen && (
                <div style={{
                  ...styles.dropdown,
                  backgroundColor: isDarkMode ? "#2a2a2a" : "#ffffff",
                  borderColor: isDarkMode ? "#444" : "#e0e0e0",
                }}>
                  <button
                    style={{
                      ...styles.dropdownItem,
                      color: isDarkMode ? "#ccc" : "#333",
                      borderColor: isDarkMode ? "#444" : "#f0f0f0",
                    }}
                    onClick={() =>
                      navigate("/profile")
                    }
                  >
                    My Profile
                  </button>
                  <button
                    style={{
                      ...styles.dropdownItem,
                      color: isDarkMode ? "#ccc" : "#333",
                      borderColor: isDarkMode ? "#444" : "#f0f0f0",
                    }}
                  >
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    style={{
                      ...styles.dropdownItem,
                      color: "#ff4757",
                      borderBottom: "none",
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

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
                    user?.firstName
                      ? user.firstName.charAt(0).toUpperCase()
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
                {user ? `${user.firstName} ${user.lastName}` : "User Profile"}
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
              <h2 style={{
                ...styles.sectionTitle,
                color: isDarkMode ? "#ffffff" : "#000",
              }}>
                Employer Profile
              </h2>

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
                            : "View interactions"}
                        </button>
                      </div>

                      <div style={styles.jobStatsRow}>
                        <span style={styles.jobStatItem}>👀 {job.views?.length || 0} views</span>
                        <span style={styles.jobStatItem}>❤️ {job.likes?.length || 0} likes</span>
                        <span style={styles.jobStatItem}>💼 {job.applicants?.length || 0} applicants</span>
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
                              job.applicants.map((applicant) => (
                                <div key={applicant._id} style={styles.applicantRow}>
                                  <div>
                                    <p style={styles.interactionText}>
                                      {applicant.firstName} {applicant.lastName} • {applicant.email}
                                    </p>
                                  </div>
                                  <button
                                    style={styles.viewProfileButton}
                                    onClick={() => openApplicantModal(applicant)}
                                  >
                                    View profile
                                  </button>
                                </div>
                              ))
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
                  <h2 style={styles.modalTitle}>{selectedApplicant.firstName} {selectedApplicant.lastName}</h2>
                  <button style={styles.modalClose} onClick={closeApplicantModal}>✕</button>
                </div>
                <div style={styles.modalBody}>
                  <p style={styles.modalLabel}>Email</p>
                  <p style={styles.modalValue}>{selectedApplicant.email}</p>
                  {selectedApplicant.phoneNumber && (
                    <>
                      <p style={styles.modalLabel}>Phone</p>
                      <p style={styles.modalValue}>{selectedApplicant.phoneNumber}</p>
                    </>
                  )}
                  {selectedApplicant.bio && (
                    <>
                      <p style={styles.modalLabel}>Bio</p>
                      <p style={styles.modalValue}>{selectedApplicant.bio}</p>
                    </>
                  )}
                  {selectedApplicant.experience && (
                    <>
                      <p style={styles.modalLabel}>Experience</p>
                      <p style={styles.modalValue}>{selectedApplicant.experience}</p>
                    </>
                  )}
                  {selectedApplicant.education && (
                    <>
                      <p style={styles.modalLabel}>Education</p>
                      <p style={styles.modalValue}>{selectedApplicant.education}</p>
                    </>
                  )}
                  {selectedApplicant.citizenShip && (
                    <>
                      <p style={styles.modalLabel}>Citizenship</p>
                      <p style={styles.modalValue}>{selectedApplicant.citizenShip}</p>
                    </>
                  )}
                  {selectedApplicant.location && (
                    <>
                      <p style={styles.modalLabel}>Location</p>
                      <p style={styles.modalValue}>
                        {selectedApplicant.location.region}, {selectedApplicant.location.city}, {selectedApplicant.location.barangay}
                        {selectedApplicant.location.otherDetails ? ` • ${selectedApplicant.location.otherDetails}` : ""}
                      </p>
                    </>
                  )}
                  {selectedApplicant.resume && (
                    <>
                      <p style={styles.modalLabel}>Resume</p>
                      <p style={styles.modalValue}>{selectedApplicant.resume}</p>
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

              <div style={{ display: 'grid', gap: 12 }}>
                {myPosts.map((post) => (
                  <div key={post._id} style={{ padding: 12, borderRadius: 12, border: '1px solid #e6eef9', background: isDarkMode ? '#071022' : '#fff' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: '#2563eb', color: '#fff', display: 'grid', placeItems: 'center' }}>
                        {post.authorAvatar ? <img src={post.authorAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (user?.firstName?.charAt(0) || 'U')}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ color: isDarkMode ? '#fff' : '#0f172a' }}>{post.authorName}</strong>
                          <span style={{ color: '#64748b', fontSize: 12 }}>{new Date(post.createdAt).toLocaleString()}</span>
                        </div>
                        <p style={{ margin: '8px 0 0 0', color: isDarkMode ? '#cbd5e1' : '#334155' }}>{post.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
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
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    padding: "22px",
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
  },

  jobMeta: {
    margin: "4px 0 0 0",
    fontSize: "14px",
    color: "#475569",
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

  jobStatsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "14px",
    color: "#475569",
    fontSize: "14px",
    marginBottom: "18px",
  },

  jobStatItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },

  interactionPanel: {
    display: "grid",
    gap: "16px",
    padding: "18px",
    borderRadius: "18px",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
  },

  interactionGroup: {
    display: "grid",
    gap: "8px",
  },

  interactionLabel: {
    margin: 0,
    fontWeight: "700",
    color: "#0f172a",
  },

  interactionText: {
    margin: 0,
    color: "#475569",
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
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
  },

  viewProfileButton: {
    border: "1px solid #2563eb",
    borderRadius: "12px",
    background: "#ffffff",
    color: "#2563eb",
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
