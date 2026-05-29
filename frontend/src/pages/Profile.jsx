import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ThemeContext } from "../contexts/ThemeContext";
import ThemeSwitch from "../components/ThemeSwitch";
import PostDetailsModal from "../components/PostDetailsModal";
import axios from "axios";
import PresenceAvatar from '../components/PresenceAvatar';
import { useNotification } from '../contexts/NotificationContext';

const getUserId = (user) => {
  if (!user) return null;
  return typeof user === 'object' ? user._id || user.id || null : user;
};

const getSnippet = (text, max = 200) => {
  if (!text) return '';
  const normalized = text.trim().replace(/\s+/g, ' ');
  return normalized.length <= max ? normalized : `${normalized.slice(0, max).trim()}...`;
};

const getTopRequirements = (requirements, max = 3) => {
  if (!requirements) return [];
  const lines = requirements
    .split(/\r?\n|\.|;/)
    .map((item) => item.trim())
    .filter(Boolean);

  return lines.slice(0, max);
};

const getApplicantStatusStyle = (status) => {
  const normalized = String(status || 'pending').toLowerCase();
  const variants = {
    pending: {
      backgroundColor: '#fef3c7',
      color: '#92400e',
      border: '1px solid #fde68a',
    },
    reviewing: {
      backgroundColor: '#dbeafe',
      color: '#1d4ed8',
      border: '1px solid #bfdbfe',
    },
    interview: {
      backgroundColor: '#ede9fe',
      color: '#5b21b6',
      border: '1px solid #ddd6fe',
    },
    accepted: {
      backgroundColor: '#dcfce7',
      color: '#166534',
      border: '1px solid #bbf7d0',
    },
    rejected: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fecaca',
    },
  };

  return variants[normalized] || variants.pending;
};

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

const FollowIcon = ({ followed = false, size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {followed ? (
      <path d="M5 13l4 4L19 7" />
    ) : (
      <path d="M12 5v14M5 12h14" />
    )}
  </svg>
);

const BlockIcon = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="8" />
    <line x1="7" y1="7" x2="17" y2="17" />
  </svg>
);

const ReportIcon = ({ filled = false, size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 3h14a1 1 0 0 1 1 1v16l-7-4-7 4V4a1 1 0 0 1 1-1z" />
  </svg>
);

const EyeIcon = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const CheckIcon = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const TrashIcon = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

const ReviewIcon = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <path d="M8 9h8" />
    <path d="M8 13h4" />
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

const LocationIcon = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const SalaryIcon = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v2" />
    <circle cx="12" cy="14" r="1" />
    <path d="M12 11v6" />
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
  const [showJobModal, setShowJobModal] = useState(false);
  const [modalJob, setModalJob] = useState(null);
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
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { setPresence, createInterview } = useNotification();
  const storedUser = localStorage.getItem("user");
  const [authUser, setAuthUser] = useState(storedUser ? JSON.parse(storedUser) : null);
  const currentUserId = authUser?.id || authUser?._id || null;
  const isOwnProfile = !profileId || profileId === currentUserId;
  const [followingIds, setFollowingIds] = useState(() => authUser?.following || []);
  const [blockedIds, setBlockedIds] = useState(() => authUser?.blockedUsers || []);
  const [reportedIds, setReportedIds] = useState(() => authUser?.reportedUsers || []);

  useEffect(() => {
    const refreshAuthUserProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token || !currentUserId) return;
      try {
        const response = await axios.get('http://localhost:8000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const latestUser = response.data?.data;
        if (latestUser && latestUser._id) {
          setAuthUser(latestUser);
          localStorage.setItem('user', JSON.stringify(latestUser));
        }
      } catch (err) {
        console.error('Failed to refresh auth user profile:', err);
      }
    };

    refreshAuthUserProfile();
  }, [currentUserId]);

  useEffect(() => {
    setFollowingIds(authUser?.following || []);
    setBlockedIds(authUser?.blockedUsers || []);
    setReportedIds(authUser?.reportedUsers || []);
  }, [authUser]);

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
    if (!isOwnProfile || !currentUserId) return;

    const handlePresenceUpdate = (e) => {
      const payload = e?.detail;
      if (!payload) return;
      const updatedUserId = (payload.userId || payload.user || payload.userID || '').toString();
      if (updatedUserId !== currentUserId?.toString()) return;

      const mode = payload.presenceMode || (payload.isOnline ? 'online' : 'offline');
      const lastActive = payload.lastActive || null;

      setUser((prev) => prev ? {
        ...prev,
        presenceMode: mode,
        isOnline: mode === 'online',
        lastActive,
      } : prev);
      setAuthUser((prev) => prev ? {
        ...prev,
        presenceMode: mode,
        isOnline: mode === 'online',
        lastActive,
      } : prev);
    };

    window.addEventListener('app:userPresenceUpdated', handlePresenceUpdate);
    return () => window.removeEventListener('app:userPresenceUpdated', handlePresenceUpdate);
  }, [currentUserId, isOwnProfile]);

  const openJobModal = (job) => {
    setModalJob(job);
    setShowJobModal(true);
  };

  const closeJobModal = () => {
    setShowJobModal(false);
    setModalJob(null);
  };

  useEffect(() => {
    const fetchEmployerJobs = async () => {
      if (!user?.role || user.role !== "employer") return;

      setMetricsLoading(true);
      try {
        if (!profileId || profileId === currentUserId) {
          const token = localStorage.getItem("token");
          if (!token) return;

          const response = await axios.get("http://localhost:8000/api/employer/my-jobs", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          setEmployerJobs(response.data.data || []);
        } else {
          const response = await axios.get("http://localhost:8000/api/jobs");
          const allJobs = response.data.data || [];
          const filteredJobs = allJobs.filter((job) => {
            const creatorId = job.createdBy?._id || job.createdBy;
            return creatorId?.toString() === profileId?.toString();
          });
          setEmployerJobs(filteredJobs);
        }
      } catch (error) {
        console.error("Error fetching employer jobs:", error);
      } finally {
        setMetricsLoading(false);
      }
    };

    fetchEmployerJobs();
  }, [user, profileId, currentUserId]);

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
        const posts = Array.isArray(res.data?.data?.posts)
          ? res.data.data.posts
          : res.data?.data || [];
        setMyPosts(posts);
      } catch (err) {
        console.error('Error fetching my posts', err);
      }
    };

    fetchMyPosts();
  }, [user, profileId]);

  const handleLogout = () => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          await axios.post(
            'http://localhost:8000/api/auth/logout',
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      } catch (err) {
        console.error('Logout failed:', err);
      } finally {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUserMenuOpen(false);
        navigate("/");
        window.location.reload();
      }
    })();
  };

  const saveAuthUser = (updatedUser) => {
    if (!updatedUser) return;
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setAuthUser(updatedUser);
  };

  const profileUserId = user?._id || user?.id || profileId;
  const isFollowingProfile = profileUserId ? followingIds.includes(profileUserId) : false;
  const isBlockedProfile = profileUserId ? blockedIds.includes(profileUserId) : false;
  const hasReportedProfile = profileUserId ? reportedIds.includes(profileUserId) : false;
  const [requestSent, setRequestSent] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [connectionModalType, setConnectionModalType] = useState('');
  const [connectionModalMessage, setConnectionModalMessage] = useState('');
  const [connectionModalLoading, setConnectionModalLoading] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const connectionRequest = searchParams.get('connectionRequest') === 'true';
  const connectionNotificationId = searchParams.get('notificationId');

  const isConnectedProfile = !!profileUserId && !!authUser?.connections && authUser.connections.some(
    (connection) => connection === profileUserId || connection?._id === profileUserId
  );

  useEffect(() => {
    if (connectionRequest && !isOwnProfile && connectionNotificationId && !isConnectedProfile) {
      setShowConnectionModal(true);
      setConnectionModalType('incoming');
      setConnectionModalMessage('This user sent you a connection request.');
    }
  }, [connectionRequest, connectionNotificationId, isOwnProfile, isConnectedProfile]);

  const handleToggleFollow = () => {
    if (!authUser || !profileUserId || isOwnProfile) return;
    if (isBlockedProfile) {
      alert("Unblock this user before following.");
      return;
    }

    const nextFollowing = isFollowingProfile
      ? followingIds.filter((id) => id !== profileUserId)
      : [...followingIds, profileUserId];

    setFollowingIds(nextFollowing);
    saveAuthUser({
      ...authUser,
      following: nextFollowing,
    });
  };

  const handleSendConnectionRequest = async () => {
    if (!authUser || !profileUserId || isOwnProfile || isConnectedProfile) return;
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
      return;
    }

    try {
      await axios.post('http://localhost:8000/api/notifications/connect', { recipient: profileUserId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequestSent(true);
      setConnectionModalType('requestSent');
      setConnectionModalMessage('Connection request sent. The user will be notified and can accept it to connect with you.');
      setShowConnectionModal(true);
    } catch (err) {
      console.error('Failed to send connection request', err);
      setConnectionModalType('error');
      setConnectionModalMessage('Could not send connection request. Please try again later.');
      setShowConnectionModal(true);
    }
  };

  const handleRemoveConnection = async () => {
    if (!authUser || !profileUserId || isOwnProfile || !isConnectedProfile) return;
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
      return;
    }

    try {
      await axios.delete(`http://localhost:8000/api/chat/connections/${encodeURIComponent(profileUserId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const nextConnections = Array.isArray(authUser.connections) ? authUser.connections.filter(
        (connection) => connection !== profileUserId && connection?._id !== profileUserId
      ) : [];
      const updatedUser = { ...authUser, connections: nextConnections };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setAuthUser(updatedUser);
      setRequestSent(false);
      setConnectionModalType('requestCancelled');
      setConnectionModalMessage('Connection removed. You can send a new request if needed.');
      setShowConnectionModal(true);
    } catch (err) {
      console.error('Failed to remove connection', err);
      setConnectionModalType('error');
      setConnectionModalMessage('Could not remove connection. Please try again later.');
      setShowConnectionModal(true);
    }
  };

  const handleReportUser = () => {
    if (!authUser || !profileUserId || isOwnProfile) return;
    if (hasReportedProfile) {
      alert("You have already reported this user.");
      return;
    }

    const nextReported = [...reportedIds, profileUserId];
    setReportedIds(nextReported);
    saveAuthUser({
      ...authUser,
      reportedUsers: nextReported,
    });
    alert("User reported. Our team will review this account.");
  };

  const handleToggleBlock = () => {
    if (!authUser || !profileUserId || isOwnProfile) return;

    let nextBlocked = [...blockedIds];
    let nextFollowing = [...followingIds];

    if (isBlockedProfile) {
      nextBlocked = nextBlocked.filter((id) => id !== profileUserId);
    } else {
      nextBlocked.push(profileUserId);
      nextFollowing = nextFollowing.filter((id) => id !== profileUserId);
    }

    setBlockedIds(nextBlocked);
    setFollowingIds(nextFollowing);
    saveAuthUser({
      ...authUser,
      blockedUsers: nextBlocked,
      following: nextFollowing,
    });
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

  const handleApplicantInterview = async (jobId, applicantId, applicantUser, jobTitle) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth");
      return;
    }

    try {
      const payload = {
        employer: authUser?._id || authUser?.id,
        title: `Interview with ${applicantUser?.firstName || ''} ${applicantUser?.lastName || ''}`.trim() || 'Interview',
        description: `Interview for ${jobTitle || 'application'}`,
        participants: [
          { user: applicantId, role: 'applicant' },
          { user: authUser?._id || authUser?.id, role: 'employer' },
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

  const mergePostData = (existing = {}, updated = {}) => {
    const result = { ...existing, ...updated };
    const authorFields = ['author', 'authorName', 'authorAvatar', 'authorRole'];
    authorFields.forEach((f) => {
      if (updated[f] === undefined || updated[f] === null) {
        result[f] = existing[f];
      }
    });
    if ((updated.media === undefined || updated.media === null) && existing.media) {
      result.media = existing.media;
    }
    return result;
  };

  const handleUpdatedPost = (updatedPost) => {
    if (!updatedPost) return;
    const updatedId = updatedPost._id || updatedPost.id;

    setSelectedPost((prev) => mergePostData(prev || {}, updatedPost || {}));
    setMyPosts((prev) =>
      prev.map((post) => {
        const postId = post._id || post.id;
        return postId === updatedId ? mergePostData(post, updatedPost) : post;
      })
    );
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
        const updatedData = response.data.data || {};
        const merged = mergePostData(selectedPost, updatedData);
        setSelectedPost(merged);
        const selectedId = selectedPost._id || selectedPost.id;
        const updatedPosts = myPosts.map((p) => {
          const postId = p._id || p.id;
          return postId === selectedId ? mergePostData(p, updatedData) : p;
        });
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
        const updatedData = response.data.data || {};
        const merged = mergePostData(selectedPost, updatedData);
        setSelectedPost(merged);
        setReplyText("");
        setReplyingToCommentId(null);
        const selectedId = selectedPost._id || selectedPost.id;
        const updatedPosts = myPosts.map((p) => {
          const postId = p._id || p.id;
          return postId === selectedId ? mergePostData(p, updatedData) : p;
        });
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
    if (!user) {
      alert('Unable to upload image: no user loaded.');
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert('Your session has expired. Please sign in again.');
      return;
    }

    setUploadingAvatar(true);

    try {
      let url;
      let payload;

      if (user.role === "jobseeker") {
        url = "http://localhost:8000/api/jobseeker/update-profile";
      } else if (user.role === "employer") {
        url = "http://localhost:8000/api/employer/profile";
      }

      if (!url) {
        alert('Invalid user role for uploading image.');
        return;
      }

      const PREVIEW = 360;
      let finalDataUrl = selectedImagePreview || user?.profilePicture || user?.companyLogo || "";
      let img = imgRef.current;

      if (!img && finalDataUrl) {
        img = new Image();
        await new Promise((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = finalDataUrl;
        });
        imgRef.current = img;
        if (!naturalSize.w && img.width) {
          setNaturalSize({ w: img.width, h: img.height });
        }
      }

      if (img && img.width && img.height) {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = PREVIEW;
          canvas.height = PREVIEW;
          const ctx = canvas.getContext("2d");

          const safeZoom = Number.isFinite(zoom) ? zoom : 1;
          const safeScale = Number.isFinite(initialScale) ? initialScale : 1;
          const renderW = img.width * safeScale * safeZoom;
          const renderH = img.height * safeScale * safeZoom;
          const safeOffsetX = Number.isFinite(offset.x) ? offset.x : 0;
          const safeOffsetY = Number.isFinite(offset.y) ? offset.y : 0;

          ctx.save();
          ctx.beginPath();
          ctx.arc(PREVIEW / 2, PREVIEW / 2, PREVIEW / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, safeOffsetX, safeOffsetY, renderW, renderH);
          ctx.restore();

          finalDataUrl = canvas.toDataURL("image/png");
        } catch (cropError) {
          console.warn('Image crop failed, using original image preview:', cropError);
        }
      }

      payload = user.role === "jobseeker"
        ? { profilePicture: finalDataUrl }
        : { companyLogo: finalDataUrl };

      const method = user.role === "jobseeker" ? axios.patch : axios.put;
      console.debug('Uploading profile image', { userId: user._id || user.id, url, payloadSummary: { profilePicture: payload.profilePicture?.slice(0, 40), companyLogo: payload.companyLogo?.slice(0, 40) } });
      const response = await method(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response?.data) {
        throw new Error('Unexpected server response: no response.data');
      }

      const returnedUser = response.data.data;
      if (returnedUser && typeof returnedUser !== 'object') {
        console.warn('Unexpected upload response data shape:', returnedUser);
      }

      const mergedUser = {
        ...user,
        ...(returnedUser && typeof returnedUser === 'object' ? returnedUser : {}),
        ...payload,
      };

      const normalizedUser = {
        ...mergedUser,
        id: mergedUser._id || mergedUser.id,
        _id: mergedUser._id || mergedUser.id,
      };

      setUser(normalizedUser);
      setAuthUser(normalizedUser);
      localStorage.setItem("user", JSON.stringify(normalizedUser));

      try {
        const dispatched = {
          ...normalizedUser,
          id: normalizedUser._id || normalizedUser.id,
          _id: normalizedUser._id || normalizedUser.id,
          firstName: normalizedUser.firstName,
          lastName: normalizedUser.lastName,
          email: normalizedUser.email,
          profilePicture: normalizedUser.profilePicture,
          companyLogo: normalizedUser.companyLogo,
        };
        window.dispatchEvent(new CustomEvent('app:profileUpdated', { detail: dispatched }));
      } catch (e) {
        console.warn('Profile update event failed:', e);
      }

      setMyPosts((prev) =>
        Array.isArray(prev)
          ? prev.map((p) => {
              try {
                const authorId = typeof p.author === 'object' ? (p.author._id || p.author) : p.author;
                if (authorId && authorId.toString() === normalizedUser._id?.toString()) {
                  return { ...p, authorAvatar: normalizedUser.profilePicture || normalizedUser.companyLogo };
                }
              } catch (e) {
                // ignore
              }
              return p;
            })
          : prev
      );

      setSelectedPost((prev) => {
        if (!prev) return prev;
        try {
          const authorId = typeof prev.author === 'object' ? (prev.author._id || prev.author) : prev.author;
          if (authorId && authorId.toString() === normalizedUser._id?.toString()) {
            return { ...prev, authorAvatar: normalizedUser.profilePicture || normalizedUser.companyLogo };
          }
        } catch (e) {
          // ignore
        }
        return prev;
      });

      if (fileInputRef.current) fileInputRef.current.value = null;
      closeImageModal();
    } catch (error) {
      const details = error.response?.data || error.message || error;
      console.error("Image upload failed:", details);
      alert(`Image update failed. ${typeof details === 'string' ? details : JSON.stringify(details)}`);
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
    <div className="page-container" style={{
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
              : "linear-gradient(135deg, #275791 0%, #275791 100%)",
          }}>
            <div style={styles.profileImageContainer}>
              <div
                style={styles.profileImageLabel}
                onClick={isOwnProfile ? handleHeaderCircleClick : () => navigate(`/profile/${userId}`)}
                title={
                  isOwnProfile
                    ? (user?.role === "jobseeker"
                      ? "Click to upload profile picture"
                      : "Click to upload company logo")
                    : "Click to view profile"
                }
              >
                <div style={{
                  ...styles.profileImage,
                  backgroundColor: isDarkMode
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(255,255,255,0.3)",
                }}>
                  <PresenceAvatar
                    src={user?.profilePicture || user?.companyLogo}
                    alt={(user?.firstName || user?.companyName || user?.email) || 'User'}
                    size={120}
                    userId={user?._id || user?.id}
                    initialIsOnline={!!user?.isOnline}
                    lastActive={user?.lastActive || null}
                    presenceMode={user?.presenceMode || (user?.isOnline ? 'online' : 'offline')}
                    showLastActive={false}
                  />
                </div>
              </div>
            </div>

            <div style={styles.profileInfo}>
              <h1 
                style={{
                  ...styles.profileName,
                  color: "#ffffff",
                  cursor: isOwnProfile ? "default" : "pointer",
                }}
                onClick={() => !isOwnProfile && navigate(`/profile/${userId}`)}
              >
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
              {isOwnProfile && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ color: '#d1d5db', fontSize: 14 }}>Online status is automatic while Applica is open.</span>
                  <button
                    onClick={() => setPresence(user?.presenceMode === 'dnd' ? 'online' : 'dnd')}
                    style={{ background: user?.presenceMode === 'dnd' ? '#f59e0b' : '#ef4444', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 8 }}
                  >
                    {user?.presenceMode === 'dnd' ? 'Turn Off DND' : 'Do Not Disturb'}
                  </button>
                </div>
              )}
            </div>

            {!isOwnProfile ? (
              <>
                <div style={styles.profileActionRow}>
                  {isConnectedProfile ? (
                    <>
                      <button
                        style={styles.followButton}
                        onClick={() => navigate(`/chat?user=${profileUserId}`)}
                        aria-label="Message connected user"
                        title="Message"
                      >
                        Message
                      </button>
                      <button
                        style={styles.deleteJobButton}
                        onClick={handleRemoveConnection}
                        aria-label="Remove connection"
                        title="Remove connection"
                      >
                        Remove Connection
                      </button>
                    </>
                  ) : (
                    <button
                      style={styles.followButton}
                      onClick={handleSendConnectionRequest}
                      aria-label={requestSent ? "Request sent" : "Connect"}
                      title={requestSent ? "Request sent" : "Connect"}
                      disabled={requestSent}
                    >
                      {requestSent ? 'Requested' : 'Connect'}
                    </button>
                  )}
                  <button
                    style={isFollowingProfile ? styles.followingButton : styles.followButton}
                    onClick={handleToggleFollow}
                    aria-label={isFollowingProfile ? "Unfollow user" : "Follow user"}
                    title={isFollowingProfile ? "Following" : "Follow"}
                  >
                    <FollowIcon followed={isFollowingProfile} size={18} />
                  </button>
                  <button
                    style={styles.reportButton}
                    onClick={handleReportUser}
                    aria-label={hasReportedProfile ? "Reported user" : "Report user"}
                    title={hasReportedProfile ? "Reported" : "Report"}
                  >
                    <ReportIcon size={18} filled={hasReportedProfile} />
                  </button>
                  <button
                    style={isBlockedProfile ? styles.unblockButton : styles.blockButton}
                    onClick={handleToggleBlock}
                    aria-label={isBlockedProfile ? "Unblock user" : "Block user"}
                    title={isBlockedProfile ? "Unblock" : "Block"}
                  >
                    <BlockIcon size={18} />
                  </button>
                </div>
                {isBlockedProfile && (
                  <p style={styles.blockedNotice}>
                    You have blocked this user. Unblock to restore follow and interaction.
                  </p>
                )}
              </>
            ) : (
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
                  color: "#1892aa",
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
              {showConnectionModal && (
                <div style={styles.connectionModalBackdrop}>
                  <div style={styles.connectionModal}>
                    <h3 style={styles.connectionModalTitle}>
                      {connectionModalType === 'incoming' && 'Connection Request'}
                      {connectionModalType === 'requestSent' && 'Request Sent'}
                      {connectionModalType === 'connected' && 'Connected'}
                      {connectionModalType === 'requestCancelled' && 'Request Removed'}
                      {connectionModalType === 'error' && 'Connection Error'}
                    </h3>
                    <p style={styles.connectionModalMessage}>{connectionModalMessage}</p>

                    {connectionModalType === 'incoming' && (
                      <div style={styles.connectionModalActions}>
                        <button
                          style={styles.interactionButton}
                          disabled={connectionModalLoading}
                          onClick={async () => {
                            const token = localStorage.getItem('token');
                            if (!token) { navigate('/auth'); return; }
                            setConnectionModalLoading(true);
                            try {
                              await axios.post(`http://localhost:8000/api/notifications/connect/${encodeURIComponent(connectionNotificationId)}/accept`, {}, { headers: { Authorization: `Bearer ${token}` } });
                              setConnectionModalType('connected');
                              setConnectionModalMessage('Connection accepted. You are now connected.');
                              setRequestSent(false);
                              if (authUser) {
                                const nextConnections = Array.isArray(authUser.connections) ? authUser.connections : [];
                                if (!nextConnections.some((id) => id === profileUserId || id?._id === profileUserId)) {
                                  const updatedUser = { ...authUser, connections: [...nextConnections, profileUserId] };
                                  localStorage.setItem('user', JSON.stringify(updatedUser));
                                  setAuthUser(updatedUser);
                                }
                              }
                            } catch (err) {
                              console.error(err);
                              setConnectionModalType('error');
                              setConnectionModalMessage('Could not accept connection. Please try again.');
                            } finally {
                              setConnectionModalLoading(false);
                            }
                          }}
                        >
                          Accept
                        </button>
                        <button
                          style={styles.deleteJobButton}
                          disabled={connectionModalLoading}
                          onClick={async () => {
                            const token = localStorage.getItem('token');
                            if (!token) { navigate('/auth'); return; }
                            setConnectionModalLoading(true);
                            try {
                              await axios.delete(`http://localhost:8000/api/notifications/${encodeURIComponent(connectionNotificationId)}`, { headers: { Authorization: `Bearer ${token}` } });
                              setConnectionModalType('requestCancelled');
                              setConnectionModalMessage('Connection request removed.');
                            } catch (err) {
                              console.error(err);
                              setConnectionModalType('error');
                              setConnectionModalMessage('Could not remove request. Please try again.');
                            } finally {
                              setConnectionModalLoading(false);
                            }
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {connectionModalType === 'requestSent' && (
                      <div style={styles.connectionModalActions}>
                        <button style={styles.interactionButton} onClick={() => setShowConnectionModal(false)}>
                          Close
                        </button>
                      </div>
                    )}

                    {connectionModalType === 'connected' && (
                      <div style={styles.connectionModalActions}>
                        <button style={styles.interactionButton} onClick={() => setShowConnectionModal(false)}>
                          Close
                        </button>
                      </div>
                    )}

                    {['requestCancelled', 'error'].includes(connectionModalType) && (
                      <div style={styles.connectionModalActions}>
                        <button style={styles.interactionButton} onClick={() => setShowConnectionModal(false)}>
                          Close
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={styles.detailItem}>
                <label style={{
                  ...styles.detailLabel,
                  color: "var(--primary)",
                }}>
                  Email
                </label>
                <p style={{
                  ...styles.detailValue,
                  color: "var(--text)",
                }}>
                  {user?.email || "Not provided"}
                </p>
              </div>

              <div style={styles.detailItem}>
                <label style={{
                  ...styles.detailLabel,
                  color: "var(--primary)",
                }}>
                  Account Type
                </label>
                <p style={{
                  ...styles.detailValue,
                  color: "var(--text)",
                }}>
                  {user?.role === "employer"
                    ? "Employer"
                    : "Job Seeker"}
                </p>
              </div>

              <div style={styles.detailItem}>
                <label style={{
                  ...styles.detailLabel,
                  color: "var(--primary)",
                }}>
                  Member Since
                </label>
                <p style={{
                  ...styles.detailValue,
                  color: "var(--text)",
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
                  {user?.resume ? (
                    <a 
                      href={user.resume} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        color: '#1892aa',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        fontWeight: 500,
                        fontSize: 14
                      }}
                      onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                      onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                    >
                      View Resume
                    </a>
                  ) : (
                    <p style={styles.detailValue}>Not provided</p>
                  )}
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
                    <div
                      key={job._id}
                      style={{
                        ...styles.jobCard,
                        backgroundColor: isDarkMode ? "#111827" : "#ffffff",
                        border: isDarkMode ? "1px solid #1f2937" : "1px solid #e5e7eb",
                        color: isDarkMode ? "#f8fafc" : "#111827",
                      }}
                    >
                      <div style={styles.jobHeader}>
                        <div>
                          <p
                            style={{
                              ...styles.jobTitle,
                              color: isDarkMode ? "#f8fafc" : "#111827",
                            }}
                          >
                            {job.title}
                          </p>
                          <p
                            style={{
                              ...styles.jobMeta,
                              color: isDarkMode ? "#cbd5e1" : "#64748b",
                            }}
                          >
                            {job.companyName}
                          </p>
                        </div>
                        <div style={styles.jobActionsRow}>
                          <button
                            style={styles.interactionButton}
                            onClick={() =>
                              isOwnProfile
                                ? setSelectedJobId(
                                    selectedJobId === job._id ? null : job._id
                                  )
                                : openJobModal(job)
                            }
                          >
                            {selectedJobId === job._id
                              ? "Hide details"
                              : "View post"}
                          </button>
                          {isOwnProfile && (
                            <button
                              style={styles.deleteJobButton}
                              onClick={() => handleJobDelete(job._id)}
                            >
                              Delete job
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={styles.jobOverview}>
                        <div style={styles.jobMetaRow}>
                          {job.location && (
                            <span
                              style={{
                                ...styles.jobBadge,
                                backgroundColor: isDarkMode
                                  ? "rgba(255,255,255,0.08)"
                                  : "#eef2ff",
                                color: isDarkMode ? "#e2e8f0" : "#1e3a8a",
                                border: isDarkMode
                                  ? "1px solid rgba(255,255,255,0.1)"
                                  : "1px solid #dbeafe",
                              }}
                            >
                              {job.location}
                            </span>
                          )}
                          {(job.salaryMin || job.salaryMax) && (
                            <span
                              style={{
                                ...styles.jobBadge,
                                backgroundColor: isDarkMode
                                  ? "rgba(255,255,255,0.08)"
                                  : "#eef2ff",
                                color: isDarkMode ? "#e2e8f0" : "#1e3a8a",
                                border: isDarkMode
                                  ? "1px solid rgba(255,255,255,0.1)"
                                  : "1px solid #dbeafe",
                              }}
                            >
                              {job.salaryMin || job.salaryMax
                                ? `${job.salaryMin || '₱0'} - ${job.salaryMax || '₱0'} ${job.salaryFrequency || ''}`.trim()
                                : "Salary info"}
                            </span>
                          )}
                          {job.salaryFrequency && (
                            <span style={styles.jobBadge}>{job.salaryFrequency}</span>
                          )}
                          {job.employmentType && (
                            <span style={styles.jobBadge}>{job.employmentType}</span>
                          )}
                        </div>

                        {job.description && (
                          <p
                            style={{
                              ...styles.jobDescription,
                              color: isDarkMode ? "#d1d5db" : "#475569",
                            }}
                          >
                            {getSnippet(job.description, 260)}
                          </p>
                        )}

                        {job.requirements && (
                          <div style={styles.jobReqList}>
                            <p
                              style={{
                                margin: 0,
                                fontWeight: 700,
                                color: isDarkMode ? "#f8fafc" : "#1f2937",
                              }}
                            >
                              Top requirements
                            </p>
                            {getTopRequirements(job.requirements, 3).map((line, index) => (
                              <div key={index} style={styles.jobReqItem}>
                                <span style={styles.jobReqBullet} />
                                <span>{line}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {job.externalLink && (
                          <a
                            style={styles.jobExternalLink}
                            href={job.externalLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            External application link
                          </a>
                        )}
                      </div>

                      <div
                        style={{
                          ...styles.jobStatsRow,
                          color: isDarkMode ? "#cbd5e1" : "#334155",
                        }}
                      >
                        <span
                          style={{
                            ...styles.jobStatItem,
                            backgroundColor: isDarkMode ? "#1f2937" : "#f8fafc",
                            color: isDarkMode ? "#e2e8f0" : "#334155",
                          }}
                        >
                          <EyeIcon size={16} />
                          <span>{job.views?.length || 0} views</span>
                        </span>
                        <span
                          style={{
                            ...styles.jobStatItem,
                            backgroundColor: isDarkMode ? "#1f2937" : "#f8fafc",
                            color: isDarkMode ? "#e2e8f0" : "#334155",
                          }}
                        >
                          <HeartIcon size={16} />
                          <span>{job.likes?.length || 0} likes</span>
                        </span>
                        {isOwnProfile && (
                          <>
                            <span
                              style={{
                                ...styles.jobStatItem,
                                backgroundColor: isDarkMode ? "#1f2937" : "#f8fafc",
                                color: isDarkMode ? "#e2e8f0" : "#334155",
                              }}
                            >
                              <BriefcaseIcon size={16} />
                              <span>{job.applicants?.length || 0} applicants</span>
                            </span>
                            <span
                              style={{
                                ...styles.jobStatItem,
                                backgroundColor: isDarkMode ? "#1f2937" : "#f8fafc",
                                color: isDarkMode ? "#e2e8f0" : "#334155",
                              }}
                            >
                              <ClockIcon size={16} />
                              <span>{job.applicants?.filter((application) => (application.status || 'pending') === 'pending').length || 0} pending</span>
                            </span>
                          </>
                        )}
                      </div>

                      {selectedJobId === job._id && (
                        <div style={{
                          ...styles.interactionPanel,
                          backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
                          border: isDarkMode ? "1px solid #1f2937" : "1px solid #e2e8f0",
                        }}>
                          <div style={styles.jobMetricGrid}>
                            <div style={styles.interactionGroup}>
                              <p style={{
                                ...styles.interactionLabel,
                                color: isDarkMode ? "#cbd5e1" : "#334155",
                              }}>Viewed</p>
                              <p style={{
                                ...styles.interactionText,
                                color: isDarkMode ? "#e2e8f0" : "#0f172a",
                              }}>{job.views?.length || 0} views</p>
                            </div>
                            <div style={styles.interactionGroup}>
                              <p style={{
                                ...styles.interactionLabel,
                                color: isDarkMode ? "#cbd5e1" : "#334155",
                              }}>Liked</p>
                              <p style={{
                                ...styles.interactionText,
                                color: isDarkMode ? "#e2e8f0" : "#0f172a",
                              }}>{job.likes?.length || 0} likes</p>
                            </div>
                            {isOwnProfile && (
                              <div style={styles.interactionGroup}>
                                <p style={{
                                  ...styles.interactionLabel,
                                  color: isDarkMode ? "#cbd5e1" : "#334155",
                                }}>Applicants</p>
                                <p style={{
                                  ...styles.interactionText,
                                  color: isDarkMode ? "#e2e8f0" : "#0f172a",
                                }}>{job.applicants?.length || 0} applications</p>
                              </div>
                            )}
                            {isOwnProfile && (
                              <div style={styles.interactionGroup}>
                                <p style={{
                                  ...styles.interactionLabel,
                                  color: isDarkMode ? "#cbd5e1" : "#334155",
                                }}>Pending</p>
                                <p style={{
                                  ...styles.interactionText,
                                  color: isDarkMode ? "#e2e8f0" : "#0f172a",
                                }}>{job.applicants?.filter((application) => (application.status || 'pending') === 'pending').length || 0} pending</p>
                              </div>
                            )}
                          </div>

                          <div style={{
                            ...styles.jobPreviewCard,
                            backgroundColor: isDarkMode ? "#111827" : "#f8fafc",
                            border: isDarkMode ? "1px solid #1f2937" : "1px solid #e2e8f0",
                          }}>
                            <div style={styles.jobPreviewHeader}>
                              <div>
                                <p style={{
                                  ...styles.jobPreviewTitle,
                                  color: isDarkMode ? "#e2e8f0" : "#0f172a",
                                }}>{job.title}</p>
                                <p style={{
                                  ...styles.jobPreviewMeta,
                                  color: isDarkMode ? "#94a3b8" : "#64748b",
                                  display: "flex",
                                  gap: "12px",
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                }}>
                                  {job.location && (
                                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                      <LocationIcon size={16} />
                                      {job.location}
                                    </span>
                                  )}
                                  {job.salary && (
                                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                      <SalaryIcon size={16} />
                                      {job.salary}
                                    </span>
                                  )}
                                </p>
                              </div>
                              <div style={styles.jobPreviewStats}>
                                <div style={styles.jobPreviewStat}>
                                  <p style={{
                                    ...styles.jobPreviewStatNumber,
                                    color: isDarkMode ? "#e2e8f0" : "#0f172a",
                                  }}>{job.applicants?.length || 0}</p>
                                  <p style={{
                                    ...styles.jobPreviewStatLabel,
                                    color: isDarkMode ? "#94a3b8" : "#64748b",
                                  }}>Applicants</p>
                                </div>
                                <div style={styles.jobPreviewStat}>
                                  <p style={{
                                    ...styles.jobPreviewStatNumber,
                                    color: isDarkMode ? "#e2e8f0" : "#0f172a",
                                  }}>{job.views?.length || 0}</p>
                                  <p style={{
                                    ...styles.jobPreviewStatLabel,
                                    color: isDarkMode ? "#94a3b8" : "#64748b",
                                  }}>Views</p>
                                </div>
                              </div>
                            </div>

                            {job.description && (
                              <div style={styles.jobPreviewContent}>
                                <p style={{
                                  ...styles.jobPreviewDesc,
                                  color: isDarkMode ? "#cbd5e1" : "#475569",
                                }}>{getSnippet(job.description, 220)}</p>
                              </div>
                            )}

                            {job.requirements && (
                              <div style={styles.jobPreviewRequirements}>
                                <p style={{
                                  ...styles.jobPreviewReqTitle,
                                  color: isDarkMode ? "#e2e8f0" : "#0f172a",
                                }}>Top requirements</p>
                                {getTopRequirements(job.requirements, 3).map((req, idx) => (
                                  <p key={idx} style={{
                                    ...styles.jobPreviewReqItem,
                                    color: isDarkMode ? "#ffffff" : "#000000",
                                  }}>• {req}</p>
                                ))}
                              </div>
                            )}

                            {job.externalLink && (
                              <a
                                style={{
                                  ...styles.jobExternalLink,
                                  color: isDarkMode ? "#ffffff" : "#000000",
                                }}
                                href={job.externalLink}
                                target="_blank"
                                rel="noreferrer"
                              >
                                External application link
                              </a>
                            )}

                            <div style={styles.jobPreviewFooter}>
                              <button
                                style={styles.jobPreviewButton}
                                onClick={() => navigate(`/explore?jobId=${encodeURIComponent(job._id)}`, { state: { openJobId: job._id } })}
                              >
                                View post
                              </button>
                            </div>
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
            <div className="modal-overlay" style={styles.modalOverlay} onClick={closeApplicantModal}>
              <div className="modal-card" style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
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
                  <p style={styles.modalValue}>{selectedApplicantInfo?.email}</p>
                  <p style={styles.modalLabel}>Status</p>
                  <p style={styles.modalValue}>{selectedApplicant.status || "pending"}</p>
                  {selectedApplicant.jobId && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                      {selectedApplicant.status === 'pending' && (
                        <button
                          style={styles.statusButton}
                          onClick={() => handleApplicantStatusChange(selectedApplicant.jobId, selectedApplicant.user?._id || selectedApplicant._id, 'reviewing')}
                        >
                          Review
                        </button>
                      )}
                      {selectedApplicant.status === 'reviewing' && (
                        <button
                          style={styles.statusButton}
                          onClick={() => handleApplicantInterview(selectedApplicant.jobId, selectedApplicant.user?._id || selectedApplicant._id, selectedApplicantInfo, selectedApplicant.jobTitle)}
                        >
                          Interview
                        </button>
                      )}
                      {selectedApplicant.status === 'interview' && (
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

          {showJobModal && modalJob && (
            <div className="modal-overlay" style={styles.modalOverlay} onClick={closeJobModal}>
              <div className="modal-card" style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                  <h2 style={{ margin: 0 }}>{modalJob.title}</h2>
                  <button style={styles.modalClose} onClick={closeJobModal}>✕</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: '#1892aa',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#fff',
                      fontWeight: '800',
                      fontSize: '18px',
                      flexShrink: 0,
                    }}
                  >
                    {modalJob.createdBy?.companyLogo && modalJob.createdBy?.role === 'employer' ? (
                      <img src={modalJob.createdBy.companyLogo} alt="employer" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    ) : modalJob.createdBy?.profilePicture ? (
                      <img src={modalJob.createdBy.profilePicture} alt="author" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    ) : (
                      (modalJob.createdBy?.firstName?.charAt(0) || modalJob.companyName?.charAt(0) || 'E')
                    )}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>{modalJob.companyName} · {modalJob.location || 'Remote'}</p>
                    {modalJob.createdBy?.email && (
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>{modalJob.createdBy.email}</p>
                    )}
                  </div>
                </div>
                <div style={styles.modalBody}>
                  {modalJob.description && (
                    <>
                      <p style={styles.modalLabel}>Job description</p>
                      <p style={styles.modalValue}>{modalJob.description}</p>
                    </>
                  )}
                  {modalJob.requirements && (
                    <>
                      <p style={styles.modalLabel}>Requirements</p>
                      <p style={styles.modalValue}>{modalJob.requirements}</p>
                    </>
                  )}
                  <div>
                    <p style={styles.modalLabel}>Metrics</p>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: '#475569' }}>
                      <span>{modalJob.views?.length || 0} views</span>
                      <span>{modalJob.likes?.length || 0} likes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showImageModal && (
            <div className="modal-overlay" style={styles.modalOverlay} onClick={closeImageModal}>
              <div className="modal-card" style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
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
                      backgroundColor: completion === 100 ? "#22c55e" : "#275791",
                    }}
                  ></div>
                </div>
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
                    style={{
                      ...styles.profilePostCard,
                      background: isDarkMode ? '#071022' : '#ffffff',
                      borderColor: isDarkMode ? '#1f2937' : '#e6eef9',
                    }}
                  >
                    <div style={styles.profilePostHeader}>
                      <div style={styles.profilePostAvatar}>
                        <PresenceAvatar
                          userId={getUserId(post.author)}
                          src={post.authorAvatar}
                          alt={post.authorName || user?.firstName || 'User'}
                          size={48}
                          presenceMode={post.authorPresenceMode || (post.author?.isOnline ? 'online' : undefined)}
                          initialIsOnline={post.authorIsOnline || post.author?.isOnline || (getUserId(post.author) === currentUserId ? user?.isOnline : false)}
                          lastActive={post.authorLastActive || post.author?.lastActive}
                          style={{ width: '100%', height: '100%' }}
                        />
                      </div>
                      <div style={styles.profilePostHeading}>
                        <div style={styles.profilePostCompanyRow}>
                          <strong style={{
                            ...styles.profilePostCompany,
                            color: isDarkMode ? '#ffffff' : '#0f172a',
                          }}>
                            {post.authorName || user?.firstName || 'You'}
                          </strong>
                          <span style={styles.profilePostDot}>·</span>
                          <span style={styles.profilePostMeta}>{user?.role || 'member'}</span>
                        </div>
                        <span style={styles.profilePostMeta}>{new Date(post.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div style={styles.profilePostBody}>
                      <p style={{
                        ...styles.profilePostText,
                        color: isDarkMode ? '#cbd5e1' : '#334155',
                      }}>
                        {post.content}
                      </p>
                      {post.location && (
                        <p style={{
                          ...styles.profilePostMeta,
                          marginTop: 8,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}>
                          {post.location.city || post.location || ''}{post.location?.city && post.location?.region ? ', ' : ''}{post.location?.region || ''}
                        </p>
                      )}
                    </div>

                    {post.media?.data && (
                      <div style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden' }}>
                        <img src={post.media.data} alt="Post media" style={{ width: '100%', maxHeight: 300, objectFit: 'cover' }} />
                      </div>
                    )}

                    {post.tags?.length > 0 && (
                      <div style={styles.profilePostTags}>
                        {post.tags.map((tag, index) => (
                          <span key={`${post._id}-tag-${index}`} style={styles.profileTag}>#{tag}</span>
                        ))}
                      </div>
                    )}

                    <div style={styles.profilePostEngagementDivider} />
                    <div style={styles.profilePostEngagementBar}>
                      <button style={{ ...styles.profileEngagementButton, color: post.likes?.length ? 'var(--primary)' : 'var(--text-muted)' }}>
                        <HeartIcon size={16} filled={post.likes?.length > 0} />
                        <span>{post.likes?.length || 0}</span>
                      </button>
                      <button style={styles.profileEngagementButton}>
                        <CommentIcon size={16} />
                        <span>{post.comments?.length || 0}</span>
                      </button>
                      <button style={styles.profileEngagementButton}>
                        <RepostIcon size={16} />
                        <span>{post.reposts?.length || 0}</span>
                      </button>
                      <button style={styles.profileEngagementButton}>
                        <ShareIcon size={16} />
                        <span>{post.shares?.length || 0}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showPostModal && selectedPost && (
            <PostDetailsModal
              post={selectedPost}
              isOpen={showPostModal}
              onClose={closePostModal}
              onUpdate={handleUpdatedPost}
              currentUserId={currentUserId}
              userName={authUser?.firstName || 'You'}
              userAvatar={authUser?.profilePicture || authUser?.companyLogo}
            />
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
    color: "#1892aa",
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
      "linear-gradient(135deg, #1892aa 0%, #275791 100%)",
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
      "linear-gradient(135deg, #275791 0%, #275791 100%)",
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

  profileActionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "16px",
  },

  followButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px",
    minWidth: "44px",
    minHeight: "44px",
    borderRadius: "999px",
    border: "1px solid rgba(148,163,184,0.35)",
    background: "rgba(148,163,184,0.18)",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "700",
  },

  connectedButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 16px",
    minWidth: "120px",
    minHeight: "44px",
    borderRadius: "999px",
    border: "1px solid rgba(16,185,129,0.35)",
    background: "rgba(16,185,129,0.18)",
    color: "#ffffff",
    cursor: "default",
    fontWeight: "700",
  },

  connectionModalBackdrop: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px",
  },

  connectionModal: {
    width: "100%",
    maxWidth: "520px",
    borderRadius: "20px",
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    padding: "28px",
    boxShadow: "0 30px 80px rgba(15, 23, 42, 0.55)",
    textAlign: "center",
  },

  connectionModalTitle: {
    fontSize: "22px",
    fontWeight: "800",
    marginBottom: "18px",
  },

  connectionModalMessage: {
    fontSize: "15px",
    lineHeight: 1.7,
    color: "#cbd5e1",
    marginBottom: "24px",
  },

  connectionModalActions: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    flexWrap: "wrap",
  },

  followingButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px",
    minWidth: "44px",
    minHeight: "44px",
    borderRadius: "999px",
    border: "1px solid rgba(96,165,250,0.35)",
    background: "rgba(96,165,250,0.18)",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "700",
  },

  reportButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px",
    minWidth: "44px",
    minHeight: "44px",
    borderRadius: "999px",
    border: "1px solid rgba(148,163,184,0.35)",
    background: "rgba(148,163,184,0.18)",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "700",
  },

  blockButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px",
    minWidth: "44px",
    minHeight: "44px",
    borderRadius: "999px",
    border: "1px solid rgba(148,163,184,0.35)",
    background: "rgba(148,163,184,0.18)",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "700",
  },

  unblockButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px",
    minWidth: "44px",
    minHeight: "44px",
    borderRadius: "999px",
    border: "1px solid rgba(148,163,184,0.35)",
    background: "rgba(148,163,184,0.18)",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "700",
  },

  blockedNotice: {
    marginTop: "12px",
    padding: "12px 16px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "14px",
    color: "#f8fafc",
    border: "1px solid rgba(255,255,255,0.18)",
    maxWidth: "500px",
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
    color: "var(--primary)",
    textTransform: "uppercase",
    marginBottom: "8px",
  },

  detailValue: {
    fontSize: "16px",
    color: "var(--text)",
    margin: 0,
    lineHeight: 1.65,
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
    backgroundColor: "#1892aa",
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
      "linear-gradient(90deg, #1892aa 0%, #275791 100%)",
    borderRadius: "4px",
  },

  statusValue: {
    fontSize: "14px",
    color: "#666",
  },

  smallEditButton: {
    padding: "8px 14px",
    borderRadius: "10px",
    backgroundColor: "#1892aa",
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

  jobOverview: {
    display: "grid",
    gap: "14px",
    paddingBottom: "14px",
    marginBottom: "18px",
  },

  jobMetaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },

  jobBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
    backgroundColor: "rgba(255,255,255,0.08)",
    color: "#e2e8f0",
    border: "1px solid rgba(255,255,255,0.12)",
  },

  jobDescription: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "1.75",
    color: "#d1d5db",
  },

  jobReqList: {
    display: "grid",
    gap: "10px",
  },

  jobReqItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    color: "#e2e8f0",
    fontSize: "14px",
  },

  jobReqBullet: {
    width: "6px",
    height: "6px",
    borderRadius: "999px",
    marginTop: "8px",
    backgroundColor: "#38bdf8",
    flexShrink: 0,
  },

  jobExternalLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    fontWeight: "700",
    color: "#38bdf8",
    textDecoration: "none",
  },

  jobCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "22px",
    color: "#111827",
    boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
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
    backgroundColor: "#1892aa",
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
    backgroundColor: "#275791",
    color: "#ffffff",
    border: "none",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
  },

  connectionModalBackdrop: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px",
  },

  connectionModal: {
    width: "100%",
    maxWidth: "520px",
    borderRadius: "20px",
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    padding: "28px",
    boxShadow: "0 30px 80px rgba(15, 23, 42, 0.55)",
    textAlign: "center",
  },

  connectionModalTitle: {
    fontSize: "22px",
    fontWeight: "800",
    marginBottom: "18px",
  },

  connectionModalMessage: {
    fontSize: "15px",
    lineHeight: 1.7,
    color: "#cbd5e1",
    marginBottom: "24px",
  },

  connectionModalActions: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    flexWrap: "wrap",
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

  profilePostCard: {
    borderRadius: "18px",
    padding: "20px",
    border: "1px solid",
    transition: "all 0.2s ease",
    cursor: "pointer",
  },
  profilePostHeader: {
    display: "flex",
    gap: "12px",
    marginBottom: "14px",
    alignItems: "center",
  },
  profilePostAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "#1892aa",
    color: "#ffffff",
    display: "grid",
    placeItems: "center",
    fontWeight: "800",
    fontSize: "18px",
    flexShrink: 0,
  },
  profilePostHeading: {
    minWidth: 0,
    flex: 1,
  },
  profilePostCompanyRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
  },
  profilePostCompany: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#0f172a",
  },
  profilePostDot: {
    color: "#64748b",
    fontSize: "12px",
  },
  profilePostMeta: {
    color: "#64748b",
    fontSize: "12px",
  },
  profilePostBody: {
    marginBottom: "12px",
  },
  profilePostText: {
    fontSize: "14px",
    lineHeight: "1.6",
    margin: 0,
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
  },
  profilePostTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "12px",
    marginBottom: "12px",
  },
  profileTag: {
    color: "#1892aa",
    fontWeight: "700",
    fontSize: "12px",
  },
  profilePostEngagementDivider: {
    height: "1px",
    background: "#e6eef9",
    margin: "12px -20px 0",
    marginRight: "-20px",
  },
  profilePostEngagementBar: {
    display: "flex",
    justifyContent: "space-around",
    gap: "0",
    paddingTop: "12px",
    paddingBottom: "12px",
    color: "#64748b",
    fontSize: "13px",
    marginLeft: "-20px",
    marginRight: "-20px",
    paddingLeft: "20px",
    paddingRight: "20px",
  },
  profileEngagementButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    padding: "8px 12px",
    borderRadius: "999px",
    transition: "color 0.2s, background 0.2s",
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

  noteText: {
    margin: 0,
    color: "#94a3b8",
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
    alignItems: "flex-start",
    gap: "16px",
    padding: "18px",
    borderRadius: "22px",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
    flexWrap: "wrap",
  },

  jobPreviewCard: {
    display: "grid",
    gap: "16px",
    padding: "20px",
    borderRadius: "22px",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
  },

  jobPreviewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
  },

  jobPreviewTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
  },

  jobPreviewMeta: {
    margin: "8px 0 0",
    fontSize: "13px",
    color: "#64748b",
  },

  jobPreviewStats: {
    display: "flex",
    gap: "16px",
  },

  jobPreviewStat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },

  jobPreviewStatNumber: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
  },

  jobPreviewStatLabel: {
    margin: 0,
    fontSize: "12px",
    color: "#64748b",
  },

  jobPreviewContent: {
    display: "grid",
    gap: "8px",
  },

  jobPreviewDesc: {
    margin: 0,
    fontSize: "14px",
    color: "#475569",
    lineHeight: "1.5",
  },

  jobPreviewRequirements: {
    display: "grid",
    gap: "8px",
  },

  jobPreviewReqTitle: {
    margin: 0,
    fontSize: "13px",
    fontWeight: "700",
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  jobPreviewReqItem: {
    margin: 0,
    fontSize: "13px",
    color: "#475569",
  },

  jobPreviewFooter: {
    display: "flex",
    justifyContent: "flex-end",
    paddingTop: "8px",
  },

  jobPreviewButton: {
    padding: "12px 16px",
    borderRadius: "16px",
    backgroundColor: "#1892aa",
    color: "#ffffff",
    border: "none",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
    transition: "all 0.2s ease",
  },

  jobMetricGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "16px",
    marginBottom: "18px",
  },

  applicantStatus: {
    margin: "8px 0 0",
    padding: "6px 14px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
    display: "inline-flex",
    alignItems: "center",
    textTransform: "capitalize",
    letterSpacing: "0.02em",
  },

  applicantActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  applicantDetails: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "8px",
    flex: 1,
    minWidth: "220px",
  },

  actionIconButton: {
    width: "44px",
    height: "44px",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 10px rgba(15, 23, 42, 0.06)",
  },

  applicantText: {
    margin: 0,
    color: "#0f172a",
    fontSize: "15px",
    fontWeight: "700",
  },

  applicantMeta: {
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
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
    backgroundColor: "#1892aa",
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
    color: "#1892aa",
    border: "1px solid #1892aa",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "12px",
  },

  viewProfileButton: {
    border: "1px solid #1892aa",
    borderRadius: "12px",
    background: "transparent",
    color: "#1892aa",
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
    border: "2px solid #1892aa",
    borderRadius: "12px",
    background: "transparent",
    color: "#1892aa",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "14px",
  },
};

