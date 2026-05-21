import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useLanguage } from "../../contexts/LanguageContext";
import "./BrowseJob.css";
import { useTranslate } from "../../hooks/useTranslate";
import PostDetailsModal from "../../components/PostDetailsModal";

const getUserId = (user) => {
  if (!user) return null;
  return typeof user === 'object' ? user._id || user.id || null : user;
};

const formatRelativeTimeShort = (dateValue) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}sec`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}hr`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}day`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month}month`;
  const year = Math.floor(month / 12);
  return `${year}yr`;
};

const formatDateMonthDay = (dateValue) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const mergePostData = (existing = {}, updated = {}) => {
  const result = { ...existing, ...updated };

  const authorFields = ['author', 'authorName', 'authorAvatar', 'authorRole', 'authorEmail', 'authorCompanyName'];
  authorFields.forEach((field) => {
    if (updated[field] === undefined || updated[field] === null) {
      result[field] = existing[field];
    }
  });

  if ((updated.media === undefined || updated.media === null) && existing.media) {
    result.media = existing.media;
  }

  return result;
};

const splitTextIntoListItems = (text) => {
  if (!text) return [];
  const trimmed = text.trim();
  if (!trimmed) return [];

  const lines = trimmed.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length > 1) {
    return lines.map((line) => line.replace(/^[-*]\s*/, '').trim()).filter(Boolean);
  }

  if (trimmed.includes(' - ')) {
    return trimmed.split(/\s*-\s*/).map((part) => part.trim()).filter(Boolean);
  }

  if (/^[-*]\s*/.test(trimmed)) {
    return trimmed.split(/[-*]\s*/).map((part) => part.trim()).filter(Boolean);
  }

  return [trimmed];
};

const renderBulletList = (text, style = {}) => {
  const items = splitTextIntoListItems(text);
  if (!items.length) return null;

  return (
    <ul style={{ margin: 0, paddingLeft: 20, color: 'inherit', ...style }}>
      {items.map((item, index) => (
        <li key={index} style={{ marginBottom: 8, lineHeight: 1.6 }}>
          {item}
        </li>
      ))}
    </ul>
  );
};

const HeartIcon = ({ filled = false, size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const ImageIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const LocationIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const SmilieIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

const CommentIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ShareIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const RepostIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <polyline points="17 2 21 6 17 10" />
    <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
    <polyline points="7 22 3 18 7 14" />
    <path d="M21 13v1a4 4 0 0 1-4 4H3" />
  </svg>
);

const BookmarkIcon = ({ filled = false, size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const BriefcaseIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  </svg>
);

const ChevronRightIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const samplePosts = [
  {
    id: 1,
    company: "Tech Innovations Inc.",
    role: "Senior React Developer",
    location: "Manila, NCR",
    postedAt: "2h ago",
    description:
      "Hinahanap namin ang isang senior React developer na mamumuno sa aming front-end squad, magtatayo ng modernong web experience, at makikipagtulungan sa produkto at disenyo.",
    details: [
      "Hybrid role",
      "Full-time",
      "PHP/React stack",
      "High-growth team",
    ],
    tags: ["#React", "#WebDevelopment", "#Frontend"],
    applicants: 64,
    views: 182,
  },
  {
    id: 2,
    company: "Creative Labs",
    role: "Product Designer",
    location: "Quezon City, NCR",
    postedAt: "5h ago",
    description:
      "Sumali sa aming design team para lumikha ng magagandang product experience at makipagtulungan sa mga engineer, researcher, at brand team.",
    details: ["Remote friendly", "Design system", "Team of 8", "Health benefits"],
    tags: ["#UX", "#UI", "#Design"],
    applicants: 38,
    views: 107,
  },
  {
    id: 3,
    company: "Analytics Pro",
    role: "Data Analyst",
    location: "Makati, NCR",
    postedAt: "1d ago",
    description:
      "Tutulungan mo ang analytics team na gawing aksyon ang data para sa finance at operations. Mas gusto ang malakas na SQL at storytelling skills.",
    details: ["Office first", "Data team", "BI tools", "Career growth"],
    tags: ["#Data", "#Analytics", "#SQL"],
    applicants: 51,
    views: 143,
  },
];

const feedItems = [
  {
    title: "Tampok na Kumpanya: Web Solutions Ltd",
    text: "Tuklasin ang bagong bukas para sa full stack development at back-end engineering.",
  },
  {
    title: "Career Tip",
    text: "I-update ang iyong profile nang regular para manatiling nakikita ng mga recruiter.",
  },
  {
    title: "Pinakamahusay na Kasanayan",
    text: "Mataas ang demand sa React, UX design, at data storytelling ngayong season.",
  },
];

const categories = ["Lahat", "Inhenyeriya", "Disenyo", "Data"];

export default function BrowseJob() {
  const navigate = useNavigate();
  const { translate: t } = useLanguage();
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const currentUserId = currentUser?.id || currentUser?._id || null;
  const isEmployer = currentUser?.role === 'employer';
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [companyFilter, setCompanyFilter] = useState("All");
  const [savedJobIds, setSavedJobIds] = useState(() => {
    const saved = localStorage.getItem("savedJobs");
    return saved ? JSON.parse(saved) : [];
  });
  const [jobs, setJobs] = useState([]);
  const [socialPosts, setSocialPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostTags, setNewPostTags] = useState("");
  const [newPostLocation, setNewPostLocation] = useState(null);
  const [newPostMedia, setNewPostMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [editingTags, setEditingTags] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobError, setJobError] = useState("");
  const [jobActionLoading, setJobActionLoading] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [modalJob, setModalJob] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyJobInfo, setApplyJobInfo] = useState(null);
  const [applyError, setApplyError] = useState("");
  const [userLikes, setUserLikes] = useState(new Set());

  // Listen for profile updates and update displayed social posts and job employer avatars/names
  useEffect(() => {
    const handler = (e) => {
      const updatedUser = e?.detail;
      if (!updatedUser) return;

      setSocialPosts((prev) =>
        prev.map((p) => {
          try {
            const authorId = typeof p.author === 'object' ? (p.author._id || p.author) : p.author;
            const updatedUserId = updatedUser._id || updatedUser.id;
            if (authorId && updatedUserId && authorId.toString() === updatedUserId.toString()) {
              return {
                ...p,
                authorAvatar: updatedUser.profilePicture || updatedUser.companyLogo || p.authorAvatar,
                authorName: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim() || updatedUser.email || p.authorName,
              };
            }
          } catch (err) {
            // ignore
          }
          return p;
        })
      );

      setSelectedPost((prev) => {
        if (!prev) return prev;
        try {
          const authorId = typeof prev.author === 'object' ? (prev.author._id || prev.author) : prev.author;
          const updatedUserId = updatedUser._id || updatedUser.id;
          if (authorId && updatedUserId && authorId.toString() === updatedUserId.toString()) {
            return {
              ...prev,
              authorAvatar: updatedUser.profilePicture || updatedUser.companyLogo || prev.authorAvatar,
              authorName: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim() || updatedUser.email || prev.authorName,
            };
          }
        } catch (err) {
          // ignore
        }
        return prev;
      });

      setJobs((prev) =>
        prev.map((job) => {
          try {
            const creatorId = job.createdBy?._id || job.createdBy;
            const updatedUserId = updatedUser._id || updatedUser.id;
            if (creatorId && updatedUserId && creatorId.toString() === updatedUserId.toString()) {
              return {
                ...job,
                createdBy: {
                  ...job.createdBy,
                  profilePicture: updatedUser.profilePicture || job.createdBy?.profilePicture,
                  companyLogo: updatedUser.companyLogo || job.createdBy?.companyLogo,
                  firstName: updatedUser.firstName || job.createdBy?.firstName,
                  lastName: updatedUser.lastName || job.createdBy?.lastName,
                },
              };
            }
          } catch (err) {
            // ignore
          }
          return job;
        })
      );
    };

    window.addEventListener('app:profileUpdated', handler);
    return () => window.removeEventListener('app:profileUpdated', handler);
  }, []);

  // Translated modal/apply texts (auto-translate based on LanguageContext)
  const { translated: translatedModalTitle, loading: translatingModalTitle } = useTranslate(modalJob?.title || '');
  const { translated: translatedModalDescription, loading: translatingModalDescription } = useTranslate(modalJob?.description || '');
  const { translated: translatedApplyTitle, loading: translatingApplyTitle } = useTranslate(applyJobInfo?.title || '');

  const openApplyModal = (job) => {
    if (!token) {
      navigate("/auth");
      return;
    }
    if (isEmployer) {
      alert(t('browse.employerCannotApply'));
      return;
    }
    setApplyJobInfo(job);
    setApplyError("");
    setShowApplyModal(true);
  };

  const closeApplyModal = () => {
    setShowApplyModal(false);
    setApplyJobInfo(null);
    setApplyError("");
  };

  const confirmApply = async () => {
    if (!applyJobInfo) return;

    const jobId = applyJobInfo._id || applyJobInfo.id;
    if (!jobId) {
      setApplyError(t('browse.jobNotFound'));
      return;
    }

    try {
      setJobActionLoading(true);
        const response = await axios.post(
        `http://localhost:8000/api/jobs/${jobId}/apply`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedJob = response.data.data;
      setJobs((prevJobs) =>
        prevJobs.map((job) => (job._id === updatedJob._id ? updatedJob : job))
      );
      if (modalJob && (modalJob._id === updatedJob._id || modalJob.id === updatedJob._id)) {
        setModalJob(updatedJob);
      }

      setShowApplyModal(false);
      setApplyJobInfo(null);
      alert(`${t('browse.applicationSuccess')}: ${applyJobInfo.title}`);
    } catch (error) {
      console.error("Apply error", error);
      const backendMessage = error.response?.data?.message?.toString() || "";
      const isResumeError = /resume/i.test(backendMessage);
      setApplyError(
        backendMessage
          ? isResumeError
            ? t('browse.applyErrorResume')
            : backendMessage
          : t('browse.applyErrorSubmit')
      );
    } finally {
      setJobActionLoading(false);
    }
  };

  const handleViewJob = async (jobId) => {
    if (!token) {
      navigate("/auth");
      return;
    }

    try {
      setJobActionLoading(true);
      const response = await axios.post(
        `http://localhost:8000/api/jobs/${jobId}/view`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedJob = response.data.data;
      setJobs((prevJobs) =>
        prevJobs.map((job) => (job._id === updatedJob._id ? updatedJob : job))
      );
      // update modal if open
      if (modalJob && modalJob._id === updatedJob._id) setModalJob(updatedJob);
    } catch (error) {
      console.error("View error", error);
    } finally {
      setJobActionLoading(false);
    }
  };

  const openJobModal = async (jobId) => {
    let full = jobs.find((j) => j._id === jobId) || null;

    if (!full) {
      try {
        const response = await axios.get(`http://localhost:8000/api/jobs/${jobId}`);
        full = response.data.data;
      } catch (error) {
        console.error("Failed to fetch job details", error);
alert("Hindi ma-load ang detalye ng trabaho ngayon.");
        return;
      }
    }

    setModalJob(full);
    setShowJobModal(true);

    if (currentUser?.role === "jobseeker") {
      handleViewJob(jobId);
    }
  };

  const closeJobModal = () => {
    setShowJobModal(false);
    setModalJob(null);
  };

  // Open job modal if navigation provided an openJobId state or query param
  const location = useLocation();
  useEffect(() => {
    try {
      const jobIdFromState = location?.state?.openJobId;
      const params = new URLSearchParams(location.search || '');
      const jobIdFromQuery = params.get('jobId') || params.get('job_id');
      const jobIdToOpen = jobIdFromState || jobIdFromQuery;
      if (jobIdToOpen) {
        openJobModal(jobIdToOpen);
        // clear history state/query to avoid reopening repeatedly
        if (window && window.history && window.history.replaceState) {
          try { window.history.replaceState({}, document.title, window.location.pathname); } catch (e) { /* ignore */ }
        }
      }
    } catch (err) {
      // ignore
    }
  }, [location?.state, location?.search]);

  const handleToggleLike = async (jobId) => {
    if (!token) {
      navigate("/auth");
      return;
    }

    try {
      setJobActionLoading(true);
      const response = await axios.post(
        `http://localhost:8000/api/jobs/${jobId}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedJob = response.data.data;
      setJobs((prevJobs) =>
        prevJobs.map((job) => (job._id === updatedJob._id ? updatedJob : job))
      );
      if (modalJob && modalJob._id === updatedJob._id) {
        setModalJob(updatedJob);
      }
    } catch (error) {
      console.error("Like error", error);
      alert("Hindi ma-update ang like ngayon.");
    } finally {
      setJobActionLoading(false);
    }
  };

  const handleSave = (jobId) => {
    setSavedJobIds((current) => {
      const updated = current.includes(jobId)
        ? current.filter((id) => id !== jobId)
        : [...current, jobId];
      localStorage.setItem("savedJobs", JSON.stringify(updated));
      return updated;
    });
  };

  const handleShareJob = (role) => {
    const message = `Check out this job: ${role} on Applica.`;
    if (navigator.share) {
      navigator.share({ title: role, text: message }).catch(() => {});
    } else {
      alert(message);
    }
  };

  const handleCreatePost = async () => {
    if (!token) {
      navigate("/auth");
      return;
    }

    if (!newPostContent.trim()) {
      alert(t('browse.postContentRequired'));
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8000/api/posts",
        {
          content: newPostContent.trim(),
          tags: newPostTags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          media: newPostMedia,
          location: newPostLocation,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSocialPosts((prev) => [response.data.data, ...prev]);
      setNewPostContent("");
      setNewPostTags("");
      setNewPostLocation(null);
      setNewPostMedia(null);
      setMediaPreview(null);
    } catch (error) {
      console.error("Create post error", error);
      alert("Hindi makalikha ng post ngayon. Subukang muli.");
    }
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Ang laki ng file ay dapat mas mababa sa 10MB");
      return;
    }

    setUploadingMedia(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result;
        const fileType = file.type.startsWith('video') ? 'video' : 'image';
        
        setNewPostMedia({
          type: fileType,
          data: base64Data,
          contentType: file.type,
          fileName: file.name,
        });
        setMediaPreview(base64Data);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Media upload error", error);
      alert("Nabigo ang pag-upload ng media");
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleLocationSelect = (region, city) => {
    setNewPostLocation({ region, city });
    setShowLocationModal(false);
  };

  const removeMediaPreview = () => {
    setNewPostMedia(null);
    setMediaPreview(null);
  };

  const startEditPost = (post) => {
    setEditingPostId(post._id);
    setEditingContent(post.content || "");
    setEditingTags((post.tags || []).join(", "));
  };

  const cancelEdit = () => {
    setEditingPostId(null);
    setEditingContent("");
    setEditingTags("");
  };

  const saveEditPost = async () => {
    if (!editingPostId) return;
    const token = localStorage.getItem("token");
    try {
      const response = await axios.patch(
        `http://localhost:8000/api/posts/${editingPostId}`,
        {
          content: editingContent,
          tags: editingTags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSocialPosts((prev) => prev.map((p) => (p._id === response.data.data._id ? response.data.data : p)));
      cancelEdit();
    } catch (err) {
      console.error('Edit post error', err);
      alert('Hindi maisave ang pagbabago sa post.');
    }
  };

  const archivePost = async (postId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.patch(
        `http://localhost:8000/api/posts/${postId}`,
        { archived: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSocialPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      console.error('Archive error', err);
      alert('Hindi ma-archive ang post.');
    }
  };

  const deletePost = async (postId) => {
    const token = localStorage.getItem('token');
    if (!confirm('Tanggalin ba ang post nang permanente?')) return;
    try {
      await axios.delete(`http://localhost:8000/api/posts/${postId}`, { headers: { Authorization: `Bearer ${token}` } });
      setSocialPosts((prev) => prev.filter((p) => p._id !== postId));
      if (selectedPost?._id === postId) {
        closePostModal();
      }
    } catch (err) {
      console.error('Delete post error', err);
      alert('Hindi matatanggal ang post.');
    }
  };

  const openPostModal = (post) => {
    setSelectedPost(post);
    setShowPostModal(true);
  };

  const closePostModal = () => {
    setShowPostModal(false);
    setSelectedPost(null);
  };


  const submitComment = async () => {
    if (!token) {
      navigate('/auth');
      return;
    }
    if (!commentText.trim() || !selectedPost) {
      alert('Pakiusap magsulat ng komento.');
      return;
    }

    setCommentLoading(true);
    try {
      const response = await axios.post(
        `http://localhost:8000/api/posts/${selectedPost._id}/comment`,
        { content: commentText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedPost = response.data.data;
      setSocialPosts((prev) => prev.map((p) =>
        p._id === updatedPost._id ? mergePostData(p, updatedPost) : p
      ));
      if (selectedPost?._id === updatedPost._id) {
        setSelectedPost((prev) => mergePostData(prev || selectedPost, updatedPost));
      }
      setCommentText('');
    } catch (error) {
      console.error('Comment post error', error);
      alert('Nabigong mag-post ng komento. Subukan muli.');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleJobComment = async () => {
    if (!token) {
      navigate('/auth');
      return;
    }
    if (!commentText.trim()) return;
    // Job comments not supported yet — placeholder behavior
    alert('Hindi pa suportado ang pag-post ng mga sagot sa mga job post.');
    setCommentText('');
  };

  const submitReply = async (commentId) => {
    if (!token) {
      navigate('/auth');
      return;
    }
    if (!replyText.trim() || !selectedPost) {
      alert('Pakiusap magsulat ng sagot.');
      return;
    }

    setReplyLoading(true);
    try {
      const response = await axios.post(
        `http://localhost:8000/api/posts/${selectedPost._id}/comment/${commentId}/reply`,
        { content: replyText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedPost = response.data.data;
      setSocialPosts((prev) => prev.map((p) =>
        p._id === updatedPost._id ? mergePostData(p, updatedPost) : p
      ));
      if (selectedPost?._id === updatedPost._id) {
        setSelectedPost((prev) => mergePostData(prev || selectedPost, updatedPost));
      }
      setReplyText('');
      setReplyingToCommentId(null);
    } catch (error) {
      console.error('Reply post error', error);
      alert('Nabigong mag-post ng sagot. Subukan muli.');
    } finally {
      setReplyLoading(false);
    }
  };

  const togglePostLike = async (postId) => {
    if (!token) {
      navigate('/auth');
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:8000/api/posts/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedPost = response.data.data;
      setSocialPosts((prev) => prev.map((p) =>
        p._id === updatedPost._id ? mergePostData(p, updatedPost) : p
      ));
      if (selectedPost?._id === updatedPost._id) {
        setSelectedPost((prev) => mergePostData(prev || selectedPost, updatedPost));
      }

      const isLiked = updatedPost.likes?.some((id) => id.toString() === currentUserId?.toString());
      if (isLiked) {
        setUserLikes((prev) => new Set([...prev, postId]));
      } else {
        setUserLikes((prev) => {
          const updated = new Set(prev);
          updated.delete(postId);
          return updated;
        });
      }
    } catch (err) {
      console.error('Toggle post like error', err);
    }
  };

  const openPostOrJob = (post) => {
    if (post.jobId) {
      openJobModal(post.jobId);
    } else {
      openPostModal(post);
    }
  };

  const handleRepost = async (postId) => {
    if (!token) {
      navigate('/auth');
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:8000/api/posts/${postId}/repost`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedPost = response.data.data;
      setSocialPosts((prev) => prev.map((p) =>
        p._id === updatedPost._id ? mergePostData(p, updatedPost) : p
      ));
      if (selectedPost?._id === updatedPost._id) {
        setSelectedPost((prev) => mergePostData(prev || selectedPost, updatedPost));
      }
      alert('Matagumpay na na-repost ang post!');
    } catch (error) {
      console.error('Repost error', error);
      alert(error.response?.data?.message || 'Hindi ma-repost ang post na ito.');
    }
  };

  const handleSharePost = (postId) => {
    const post = socialPosts.find((p) => p._id === postId);
    if (!post) return;
    
    const message = `${post.authorName}: ${post.content}`;
    if (navigator.share) {
      navigator.share({ title: 'Applica Post', text: message }).catch(() => {});
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(message).then(() => {
        alert('Kopyado na ang link ng post sa clipboard!');
      });
    }
  };

  useEffect(() => {
    const fetchJobs = async () => {
      setJobLoading(true);
      setJobError("");

      try {
        const response = await axios.get("http://localhost:8000/api/jobs");
        setJobs(response.data.data || []);
      } catch (error) {
        console.error("Job fetch error", error);
        setJobError("Hindi mai-load ang mga job ngayon.");
      } finally {
        setJobLoading(false);
      }
    };

    const fetchSocialPosts = async () => {
      if (!token) return;
      try {
        const response = await axios.get("http://localhost:8000/api/posts", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setSocialPosts(response.data.data || []);
      } catch (error) {
        console.error("Social posts fetch error", error);
      }
    };

    fetchJobs();
    fetchSocialPosts();
  }, [token]);

  const tabs = ["forYou", "following", "job", "post", "saved"];
  const [activeTab, setActiveTab] = useState("forYou");

  const showJobSection = ["forYou", "job", "saved"].includes(activeTab);
  const showPostSection = ["forYou", "following", "post"].includes(activeTab);

  const followingPostItems = socialPosts.filter((post) => {
    const authorId = getUserId(post.author);
    return authorId && Array.isArray(currentUser?.following) && currentUser.following.includes(authorId);
  });

  const jobPosts = jobs.map((job) => {
    const viewsCount = Array.isArray(job.views) ? job.views.length : 0;
    const likesCount = Array.isArray(job.likes) ? job.likes.length : 0;
    const applicantsCount = Array.isArray(job.applicants) ? job.applicants.length : 0;
    const userLiked = job.likes?.some(
      (like) => like.toString() === currentUserId?.toString()
    );

    return {
      _id: job._id,
      id: job._id,
      company: job.companyName,
      role: job.title,
      location: job.location || "Remote",
      postedAt: job.createdAt
        ? new Date(job.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "Recently",
      description: job.description,
      details: [
        `Requirements: ${job.requirements}`,
        job.salary ? `Salary: ₱${job.salary.toLocaleString()}` : "Salary: Negotiable",
        `Employer: ${job.createdBy?.companyName || `${job.createdBy?.firstName || ""} ${job.createdBy?.lastName || ""}`}`,
        `Job ID: ${job._id}`,
      ],
      tags: [
        job.category ? `#${job.category.replace(/\s+/g, "")}` : `#${job.title.split(" ").slice(0, 2).join("")}`,
        job.location ? `#${job.location.split(",")[0].replace(/\s+/g, "")}` : "#Remote",
      ],
      applicants: applicantsCount,
      views: viewsCount,
      likes: likesCount,
      userLiked,
      externalLink: job.externalLink,
      media: job.media,
      createdBy: job.createdBy,
      createdById: job.createdBy?._id,
      employerEmail: job.createdBy?.email,
      employerAvatar: job.createdBy?.role === 'employer' ? job.createdBy?.companyLogo : job.createdBy?.profilePicture,
      employerName: `${job.createdBy?.firstName || ""} ${job.createdBy?.lastName || ""}`.trim() || job.createdBy?.email,
    };
  });

  const feedItemsToShow = jobs.length ? jobPosts : samplePosts;
  const filteredPosts = feedItemsToShow.filter((post) => {
    if (activeTab === "saved" && !savedJobIds.includes(post.id)) {
      return false;
    }

    const searchText = [
      post.role,
      post.company,
      post.location,
      post.description,
      post.tags?.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchText.includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" ||
      post.tags?.some((tag) =>
        tag.toLowerCase().includes(selectedCategory.toLowerCase())
      ) ||
      post.role.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesLocation =
      locationFilter === "All" || post.location === locationFilter;
    const matchesCompany =
      companyFilter === "All" || post.company === companyFilter;

    return matchesSearch && matchesCategory && matchesLocation && matchesCompany;
  });

  const trendingJobs = jobs.length
    ? [...jobPosts].sort((a, b) => b.views - a.views)
    : samplePosts;

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.title}>{t("browse.feedTitle")}</h1>
          <p style={styles.subtitle}>
            {t("browse.feedSubtitle")}
          </p>
        </div>

        <div style={styles.tabs}> 
          {tabs.map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setActiveTab(tabKey)}
              style={
                activeTab === tabKey ? styles.activeTab : styles.tab
              }
            >
              {t(`browse.${tabKey}`)}
            </button>
          ))}
        </div>

        <div style={styles.searchBarRow}>
          <input
            type="text"
            placeholder={t("browse.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterRow}>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="All">{t("browse.allLocations")}</option>
            {[...new Set(jobs.map((job) => job.location || "Remote"))]
              .filter(Boolean)
              .map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
          </select>

          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="All">{t("browse.allCompanies")}</option>
            {[...new Set(jobs.map((job) => job.companyName || "Unknown"))]
              .filter(Boolean)
              .map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={styles.filterSelect}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.categoryChips}>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={
                selectedCategory === category
                  ? styles.activeChip
                  : styles.chip
              }
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <section style={styles.feedSection}>
        <div style={styles.feedColumn}>
          {showPostSection && currentUser?.role === "jobseeker" && (
            <div style={styles.postComposerCard}>
              <div style={styles.composerTop}>
                <div style={styles.composerAvatar}>
                  {currentUser?.profilePicture || currentUser?.companyLogo ? (
                    <img src={currentUser.profilePicture || currentUser.companyLogo} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    currentUser?.firstName?.charAt(0) || "U"
                  )}
                </div>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder={t("browse.composerPlaceholder")}
                  style={styles.composerTextarea}
                />
              </div>

              {mediaPreview && (
                <div style={styles.mediaPreviewContainer}>
                  {newPostMedia?.type === 'video' ? (
                    <video src={mediaPreview} style={styles.mediaPreviewItem} controls />
                  ) : (
                    <img src={mediaPreview} alt="preview" style={styles.mediaPreviewItem} />
                  )}
                  <button onClick={removeMediaPreview} style={styles.removeMediaButton}>✕</button>
                </div>
              )}

              {newPostLocation && (
                <div style={styles.locationTagComposer}>
                  <LocationIcon size={14} />
                  {newPostLocation.city}, {newPostLocation.region}
                  <button onClick={() => setNewPostLocation(null)} style={{ marginLeft: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
                </div>
              )}

              <input
                value={newPostTags}
                onChange={(e) => setNewPostTags(e.target.value)}
                placeholder="Mga tag (hiwalayin ng kuwit)"
                style={styles.composerTagsInput}
              />

              <div style={styles.composerDivider} />
              <div style={styles.composerBottom}>
                <div style={styles.composerActionButtons}>
                  <label style={styles.composerActionIcon} title="Mag-attach ng media">
                    <ImageIcon size={18} />
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleMediaUpload}
                      disabled={uploadingMedia}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <button
                    style={styles.composerActionIcon}
                    onClick={() => setShowLocationModal(true)}
                    title="Magdagdag ng lokasyon"
                  >
                    <LocationIcon size={18} />
                  </button>
                  <button
                    style={styles.composerActionIcon}
                    title="Magdagdag ng emoji"
                  >
                    <SmilieIcon size={18} />
                  </button>
                </div>
                <button
                  style={styles.composerPostButton}
                  onClick={handleCreatePost}
                  disabled={uploadingMedia || !newPostContent.trim()}
                >
                  {uploadingMedia ? t("browse.uploading") : t("browse.createPost")}
                </button>
              </div>
            </div>
          )}

          {showPostSection && (
            <>
              {socialPosts.length > 0 && (
                <div style={styles.socialFeedHeading}>
                  <h3 style={styles.sidebarTitle}>
                    {activeTab === "following" ? t("browse.followingUpdates") : t("browse.jobseekerUpdates")}
                  </h3>
                  {activeTab === "following" && !followingPostItems.length && (
                    <p style={{ marginTop: 8, color: "var(--text-muted)", fontSize: 13 }}>
                      {t("browse.followUsersHere")}
                    </p>
                  )}
                </div>
              )}

              {(activeTab === "following" ? followingPostItems : socialPosts).map((post) => (
                <div key={post._id} style={styles.socialPostCard}>
                  <div style={styles.socialPostHeader}>
                    <div
                      style={{ ...styles.postAvatar, cursor: post.author ? 'pointer' : 'default' }}
                      onClick={() => {
                        const authorId = getUserId(post.author);
                        if (authorId) navigate(`/profile/${authorId}`);
                      }}
                    >
                      {post.authorAvatar ? (
                        <img src={post.authorAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      ) : (
                        post.authorName?.charAt(0) || "U"
                      )}
                    </div>
                    <div style={styles.postHeading}>
                      <div style={styles.postCompanyRow}>
                        <span
                          style={{ ...styles.postCompany, cursor: post.author ? 'pointer' : 'default' }}
                          onClick={() => {
                            const authorId = getUserId(post.author);
                            if (authorId) navigate(`/profile/${authorId}`);
                          }}
                        >
                          {post.authorName || "Jobseeker"}
                        </span>
                        <span style={styles.postDot}>·</span>
                        <span style={styles.postMeta}>{post.authorRole}</span>
                        <span style={styles.postDot}>·</span>
                        <span style={styles.postMeta}>{formatDateMonthDay(post.createdAt)}</span>
                      </div>
                      {post.authorEmail && (
                        <p style={{ ...styles.postMeta, margin: '2px 0 6px 0', color: '#10766E', fontSize: '12px', textAlign: 'left' }}>
                          {post.authorEmail}
                        </p>
                      )}
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                      {post.author === currentUserId && (
                        <>
                          <button style={styles.actionButton} onClick={() => startEditPost(post)}>I-edit</button>
                          <button style={styles.actionButton} onClick={() => archivePost(post._id)}>I-archive</button>
                          <button style={{ ...styles.actionButton, background: '#ffefef', color: '#b91c1c' }} onClick={() => deletePost(post._id)}>Tanggalin</button>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={styles.postBody} onClick={() => openPostOrJob(post)}>
                    <p style={styles.postText}>{post.content}</p>
                    {post.location && (
                      <p style={{ ...styles.postMeta, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <LocationIcon size={14} />
                        {post.location.city}, {post.location.region}
                      </p>
                    )}
                  </div>

                  {post.media?.data && (
                    <div style={{ marginTop: '12px', borderRadius: '12px', overflow: 'hidden' }}>
                      {post.media.type === 'video' ? (
                        <video src={post.media.data} style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }} controls />
                      ) : (
                        <img src={post.media.data} alt="post media" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }} />
                      )}
                    </div>
                  )}

                  {post.tags?.length > 0 && (
                    <div style={styles.postTags}>
                      {post.tags.map((tag, index) => (
                        <span key={`${post._id || post.id}-social-tag-${index}`} style={styles.postTag}>#{tag}</span>
                      ))}
                    </div>
                  )}

                  <div style={styles.postEngagementDivider} />
                  
                  <div style={styles.postEngagementBar}>
                    <button
                      style={{
                        ...styles.engagementButton,
                        color: post.likes?.some((id) => id.toString() === currentUserId?.toString()) ? 'var(--primary)' : 'var(--text-muted)',
                      }}
                      onClick={() => togglePostLike(post._id)}
                      title={t('browse.likePostTitle')}
                    >
                      <HeartIcon 
                        filled={post.likes?.some((id) => id.toString() === currentUserId?.toString())} 
                        size={16} 
                      />
                      <span>{post.likes?.length || 0}</span>
                    </button>
                    <button
                      style={styles.engagementButton}
                      title={t('browse.commentPostTitle')}
                      onClick={() => openPostModal(post)}
                    >
                      <CommentIcon size={16} />
                      <span>{post.comments?.length || 0}</span>
                    </button>
                    <button 
                      style={styles.engagementButton} 
                      title={t('browse.repostPostTitle')}
                      onClick={() => handleRepost(post._id)}
                    >
                      <RepostIcon size={16} />
                      <span>{post.reposts?.length || 0}</span>
                    </button>
                    <button 
                      style={styles.engagementButton} 
                      title={t('browse.sharePostTitle')}
                      onClick={() => handleSharePost(post._id)}
                    >
                      <ShareIcon size={16} />
                    </button>
                  </div>

                  {editingPostId === post._id && (
                    <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                      <textarea value={editingContent} onChange={(e) => setEditingContent(e.target.value)} style={{ width: '100%', minHeight: 80 }} />
                      <input value={editingTags} onChange={(e) => setEditingTags(e.target.value)} placeholder="Mga tag (hiwalayin ng kuwit)" />
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={cancelEdit} style={styles.actionButton}>Kanselahin</button>
                        <button onClick={saveEditPost} style={styles.postComposerButton}>I-save</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {showJobSection && filteredPosts.map((post) => (
            <div key={post.id} style={styles.xPostCard}>
              <div style={styles.postHeaderRow}>
                <div
                  style={{
                    ...styles.postAvatar,
                    cursor: post.createdById ? 'pointer' : 'default',
                  }}
                  onClick={() => {
                    if (post.createdById) navigate(`/profile/${post.createdById}`);
                  }}
                >
                  {post.employerAvatar ? (
                    <img src={post.employerAvatar} alt="employer" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    post.employerName?.charAt(0) || post.company.charAt(0)
                  )}
                </div>
                <div style={styles.postHeading}>
                  <div style={styles.postCompanyRow}>
                    <span style={styles.postCompany}>{post.company}</span>
                    <span style={styles.postDot}>·</span>
                    <span style={styles.postMeta}>{post.postedAt}</span>
                  </div>
                  {post.employerEmail && (
                    <p style={{ ...styles.postMeta, margin: '2px 0 6px 0', color: '#0f766e', fontSize: '12px', fontWeight: '500', textAlign: 'left' }}>
                      {post.employerEmail}
                    </p>
                  )}
                  <p style={{ ...styles.postTagline, textAlign: 'left' }}>{post.location}</p>
                </div>
              </div>

              <div style={styles.postBody}>
                <h2 style={styles.postRole}>{post.role}</h2>
                <p style={styles.postText}>{post.description}</p>
              </div>

              {post.media?.data && (
                <div style={styles.jobMediaPreview}>
                  {post.media.type === "video" ? (
                    <video src={post.media.data} style={styles.jobMediaItem} controls />
                  ) : (
                    <img src={post.media.data} alt="Job media" style={styles.jobMediaItem} />
                  )}
                </div>
              )}

              <div style={styles.postTags}>
                {post.tags.map((tag, index) => (
                  <span key={`${post.id}-tag-${index}`} style={styles.postTag}>{tag}</span>
                ))}
              </div>

              {post.externalLink && (
                <div style={styles.jobCardLink}>
                  <a
                    href={post.externalLink.startsWith("http") ? post.externalLink : `https://${post.externalLink}`}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.jobLink}
                  >
                    View application link
                  </a>
                </div>
              )}

              <div style={styles.postStatsRow}>
                  <span style={styles.postStatItem}> {post.applicants} {t('browse.applicants')}</span>
                  <span style={styles.postStatItem}> {post.views} {t('browse.views')}</span>
                  <span style={styles.postStatItem}> {post.likes} {t('browse.likes')}</span>
              </div>

              <div style={styles.postActionRow}>
                <button
                  style={savedJobIds.includes(post.id) ? { ...styles.actionButton, color: 'var(--primary)' } : styles.actionButton}
                  onClick={() => handleSave(post.id)}
                  title={savedJobIds.includes(post.id) ? "Alisin mula sa nai-save" : "I-save ang trabaho"}
                >
                  <BookmarkIcon filled={savedJobIds.includes(post.id)} size={18} />
                </button>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    ...(post.userLiked ? { ...styles.actionButton, color: 'var(--primary)' } : styles.actionButton),
                  }}
                  onClick={() => handleToggleLike(post.id)}
                  disabled={jobActionLoading}
                  title={t('browse.likePostTitle')}
                >
                  <HeartIcon filled={post.userLiked} size={16} />
                  <span>{post.likes}</span>
                </button>
                <button
                  style={isEmployer ? { ...styles.actionButton, opacity: 0.5, cursor: 'not-allowed' } : styles.actionButton}
                  onClick={() => openApplyModal(post)}
                  disabled={jobActionLoading || isEmployer}
                  title={isEmployer ? "Hindi makaka-apply ang employer" : "Mag-apply sa trabahong ito"}
                >
                  <BriefcaseIcon size={18} />
                </button>
                <button
                  style={styles.actionButton}
                  onClick={() => openJobModal(post.id)}
                  title="Tingnan ang buong detalye ng trabaho"
                >
                  <ChevronRightIcon size={18} />
                </button>
              </div>
            </div>
          ))}
          {/* Update avatars when profile changes */}
          
        </div>

        <aside style={styles.sidebarColumn}>
          <div style={styles.sidebarCard}>
            <div style={styles.sidebarHeader}>
              <h3 style={styles.sidebarTitle}>Trending ngayon</h3>
              <p style={styles.sidebarSubtitle}>Mga mainit na paksa sa trabaho at kasanayan</p>
            </div>
            <div style={styles.trendingList}>
              <button style={styles.trendingItem}>#RemoteWork</button>
              <button style={styles.trendingItem}>#ReactJobs</button>
              <button style={styles.trendingItem}>#DesignOpenings</button>
              <button style={styles.trendingItem}>#DataAnalytics</button>
            </div>
          </div>

          <div style={styles.sidebarCard}>
            <h3 style={styles.sidebarTitle}>Mga trending na kumpanya</h3>
            <ul style={styles.companyList}>
              <li style={styles.companyItem}>Tech Innovations Inc.</li>
              <li style={styles.companyItem}>Creative Labs</li>
              <li style={styles.companyItem}>Analytics Pro</li>
              <li style={styles.companyItem}>Web Solutions Ltd</li>
            </ul>
          </div>

          <div style={{ ...styles.sidebarCard, marginTop: "24px" }}>
            <h3 style={styles.sidebarTitle}>Mga shortcut sa trabaho</h3>
            <button
              style={styles.shortcutButton}
              onClick={() => navigate("/profile")}
            >
              Tingnan ang profile
            </button>
            <button
              style={styles.shortcutButton}
              onClick={() => navigate("/create")}
            >
              Kumpletuhin ang iyong profile
            </button>
          </div>
        </aside>
      </section>

      {isEmployer && (
        <button
          style={styles.fab}
          onClick={() => navigate("/create/job")}
          title="Post Job"
        >
          +
        </button>
      )}

      {showPostModal && selectedPost && (
          <PostDetailsModal
            post={selectedPost}
            isOpen={showPostModal}
            onClose={closePostModal}
            onUpdate={(updatedPost) => {
              setSocialPosts((prev) =>
                prev.map((p) =>
                  p._id === updatedPost._id ? mergePostData(p, updatedPost) : p
                )
              );
              setSelectedPost((prev) => mergePostData(prev || {}, updatedPost));
            }}
            currentUserId={currentUserId}
            userName={currentUser?.firstName || 'Ikaw'}
            userAvatar={currentUser?.profilePicture || currentUser?.companyLogo}
          />
      )}
      {/* Job Modal */}
      {showJobModal && modalJob && (
        <div style={styles.modalOverlay} onClick={closeJobModal}>
          <div style={{ ...styles.modalCard, background: '#0f172a', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...styles.modalHeader, alignItems: 'center', justifyContent: 'flex-start', position: 'relative' }}>
              <h2 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 800, textAlign: 'left', flex: 1 }}>{translatingModalTitle ? modalJob.title : (translatedModalTitle || modalJob.title)}</h2>
              <button style={{ ...styles.modalClose, position: 'absolute', right: 12, top: 8 }} onClick={closeJobModal}>✕</button>
            </div>

            {/* Author row like social post modal */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div
                style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, cursor: modalJob.createdBy?._id ? 'pointer' : 'default' }}
                onClick={() => { const authorId = getUserId(modalJob.createdBy); if (authorId) navigate(`/profile/${authorId}`); }}
              >
                {modalJob.createdBy?.companyLogo && modalJob.createdBy?.role === 'employer' ? (
                  <img src={modalJob.createdBy.companyLogo} alt="employer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : modalJob.createdBy?.profilePicture ? (
                  <img src={modalJob.createdBy.profilePicture} alt="employer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: 'var(--primary)', color: '#fff', fontWeight: 800 }}>{(modalJob.createdBy?.firstName?.charAt(0) || modalJob.companyName?.charAt(0) || 'E')}</div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{modalJob.createdBy?.companyName || modalJob.companyName || modalJob.createdBy?.firstName || 'Employer'}</div>
                  {modalJob.createdBy?.role && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', padding: '2px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}>{modalJob.createdBy.role}</div>}
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ color: '#10766E', fontSize: 13 }}>{modalJob.createdBy?.email || modalJob.employerEmail || 'No email'}</div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>{formatDateMonthDay(modalJob.createdAt)}</div>
                </div>
              </div>
            </div>

            <div style={{ ...styles.modalBody, color: '#fff', textAlign: 'left' }}>
              <p style={{ ...styles.postText, color: '#fff', marginBottom: '18px' }}>{translatingModalDescription ? modalJob.description : (translatedModalDescription || modalJob.description)}</p>
              {modalJob.media?.data && (
                <div style={{ marginBottom: 18, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>
                  {modalJob.media.type === 'video' ? (
                    <video src={modalJob.media.data} style={{ width: '100%', maxHeight: 360, objectFit: 'cover' }} controls />
                  ) : (
                    <img src={modalJob.media.data} alt="Job media" style={{ width: '100%', maxHeight: 360, objectFit: 'cover' }} />
                  )}
                </div>
              )}
              {modalJob.externalLink && (
                <div style={{ marginBottom: 18 }}>
                  <a
                    href={modalJob.externalLink.startsWith("http") ? modalJob.externalLink : `https://${modalJob.externalLink}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.06)',
                      color: '#93c5fd',
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Buksan ang link ng trabaho
                  </a>
                </div>
              )}
              {modalJob.location && (
                <div style={{ marginBottom: 18, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <iframe
                    title="Mapa ng lokasyon"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(modalJob.location)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                    style={{ width: '100%', height: 260, border: 0 }}
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              )}
              <h4 style={{ color: '#f8fafc', marginBottom: '12px', marginTop: 0 }}>Mga Kailangan</h4>
              {renderBulletList(modalJob.requirements, { color: '#e2e8f0', marginBottom: '18px' }) || (
                <p style={{ ...styles.postText, color: '#e2e8f0', marginBottom: '18px' }}>
                  Walang ibinigay na requirements.
                </p>
              )}

              <h4 style={{ color: '#f8fafc', marginBottom: '12px', marginTop: 0 }}>Detalye</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#e2e8f0' }}>
                {modalJob.salary !== undefined && <li style={{ marginBottom: '10px' }}>Sahod: {modalJob.salary ? `₱${modalJob.salary.toLocaleString()}` : 'Negoasyable'}</li>}
                {modalJob.category && <li style={{ marginBottom: '10px' }}>Kategorya: {modalJob.category}</li>}
                {modalJob.jobType && <li style={{ marginBottom: '10px' }}>Uri: {modalJob.jobType}</li>}
                {modalJob.experienceLevel && <li style={{ marginBottom: '0' }}>Karanasan: {modalJob.experienceLevel}</li>}
              </ul>

              <div style={{ marginTop: 12 }}>
                <strong>Mga Sukatan:</strong>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <span>{modalJob.views?.length || 0} tingin</span>
                  <span> {modalJob.likes?.length || 0} gusto</span>
                  <span>{modalJob.applicants?.length || 0} aplikante</span>
                </div>
              </div>
            </div>

            <div style={styles.modalActions}>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  ...styles.actionButton,
                }}
                onClick={() => handleToggleLike(modalJob._id)}
                disabled={jobActionLoading}
                title={t('browse.likeJobTitle')}
              >
                <HeartIcon filled={modalJob.likes?.some((id) => id.toString() === currentUserId?.toString())} size={16} />
                <span>{modalJob.likes?.length || 0}</span>
              </button>
              <button
                style={isEmployer ? { ...styles.actionButton, opacity: 0.5, cursor: 'not-allowed' } : styles.actionButton}
                onClick={() => openApplyModal(modalJob)}
                disabled={jobActionLoading || isEmployer}
                title={isEmployer ? t('browse.applyButtonTitleEmployer') : t('browse.applyNow')}
              >
                {isEmployer ? t('browse.applyButtonTitleEmployer') : t('browse.applyNow')}
              </button>
              <button style={styles.actionButton} onClick={() => { navigator.share ? navigator.share({ title: modalJob.title, text: modalJob.description }) : alert(modalJob.title + '\n' + modalJob.description); }}>
                {t('browse.share')}
              </button>
            </div>
            {/* Bottom comment input bar */}
            <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 12, alignItems: 'center', background: 'transparent' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                {currentUser?.profilePicture || currentUser?.companyLogo ? (
                  <img src={currentUser.profilePicture || currentUser.companyLogo} alt="ikaw" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: 'var(--primary)', color: '#fff', fontWeight: 700 }}>{(currentUser?.firstName?.charAt(0) || 'U')}</div>
                )}
              </div>
              <input
                type="text"
                placeholder={t('browse.commentPlaceholder')}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)', color: '#fff' }}
              />
              <button
                onClick={handleJobComment}
                disabled={!commentText.trim()}
                style={{ background: 'transparent', border: 'none', color: commentText.trim() ? '#60a5fa' : 'rgba(255,255,255,0.2)', fontSize: 18, cursor: commentText.trim() ? 'pointer' : 'not-allowed' }}
                title={t('browse.postAnswerTitle')}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}

      {showApplyModal && applyJobInfo && (
        <div style={styles.modalOverlay} onClick={closeApplyModal}>
          <div style={{ ...styles.modalCard, ...styles.applyModalCard }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                  <h2 style={{ margin: 0 }}>
                    {translatingApplyTitle
                      ? (applyJobInfo.title || applyJobInfo.role || t('browse.applyModalDefaultTitle'))
                      : (translatedApplyTitle || applyJobInfo.title || applyJobInfo.role || t('browse.applyModalDefaultTitle'))}
                  </h2>
                  <p style={styles.modalCompany}>
                    {applyJobInfo.companyName || applyJobInfo.company || applyJobInfo.employerName || t('browse.company')} · {applyJobInfo.location || t('browse.remote')}
                  </p>
                </div>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.applyVerticalGrid}>
                <div style={styles.applyProfileSection}>
                  <div style={styles.companyBadge}>
                    {(applyJobInfo.createdBy?.companyLogo || applyJobInfo.employerAvatar) ? (
                      <img
                        src={applyJobInfo.createdBy?.companyLogo || applyJobInfo.createdBy?.profilePicture || applyJobInfo.employerAvatar}
                        alt="company logo"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      />
                    ) : (
                      <span style={{ fontWeight: 700 }}>{(applyJobInfo.companyName || applyJobInfo.company || applyJobInfo.employerName || 'Employer').charAt(0)}</span>
                    )}
                  </div>
                  <div style={styles.applyProfileInfo}>
                    <p style={styles.applyInfoTitle}>{t('browse.postedBy')}</p>
                    <p style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-h)' }}>
                      {applyJobInfo.createdBy?.firstName ? `${applyJobInfo.createdBy.firstName} ${applyJobInfo.createdBy.lastName}` : applyJobInfo.createdBy?.companyName || applyJobInfo.companyName || applyJobInfo.company || applyJobInfo.employerName || t('browse.employer')}
                    </p>
                    <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                      {applyJobInfo.createdBy?.email || applyJobInfo.employerEmail || t('browse.notProvided')}
                    </p>
                    <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                      {applyJobInfo.createdBy?.role || t('browse.employer')} · {applyJobInfo.location || t('browse.remote')}
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 700 }}>{t('browse.jobDescription')}</p>
                  <p style={{ margin: '0 0 14px', lineHeight: 1.7, color: 'var(--text-muted)' }}>
                    {applyJobInfo.description || applyJobInfo.postedAt || t('browse.noDescriptionProvided')}
                  </p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 700 }}>{t('browse.requirements')}</p>
                  {renderBulletList(applyJobInfo.requirements, { color: 'var(--text-muted)' }) || (
                    <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--text-muted)' }}>
                      {applyJobInfo.details?.join(', ') || t('browse.noRequirementsProvided')}
                    </p>
                  )}
                </div>

                <div style={styles.applyInfoSection}>
                  <p style={styles.applyInfoTitle}>{t('browse.jobDetails')}</p>
                  <div style={styles.applyInfoRow}><span>{t('browse.salary')}</span><span>{applyJobInfo.salary ? `₱${applyJobInfo.salary.toLocaleString()}` : t('browse.negotiable')}</span></div>
                  <div style={styles.applyInfoRow}><span>{t('browse.location')}</span><span>{applyJobInfo.location || t('browse.remote')}</span></div>
                  {applyJobInfo.category && <div style={styles.applyInfoRow}><span>{t('browse.category')}</span><span>{applyJobInfo.category}</span></div>}
                  {applyJobInfo.jobType && <div style={styles.applyInfoRow}><span>{t('browse.type')}</span><span>{applyJobInfo.jobType}</span></div>}
                  {applyJobInfo.experienceLevel && <div style={styles.applyInfoRow}><span>{t('browse.experience')}</span><span>{applyJobInfo.experienceLevel}</span></div>}
                  <div style={styles.applyInfoRow}><span>{t('browse.applicantsCount')}</span><span>{applyJobInfo.applicants?.length || 0}</span></div>
                  <div style={styles.applyInfoRow}><span>{t('browse.posted')}</span><span>{applyJobInfo.createdAt ? formatDateMonthDay(applyJobInfo.createdAt) : applyJobInfo.postedAt || t('browse.unknown')}</span></div>
                </div>

                <div style={styles.applyInfoSection}>
                  <p style={styles.applyInfoTitle}>{t('browse.companyInformation')}</p>
                  <div style={styles.applyInfoRow}><span>{t('browse.employer')}</span><span>{applyJobInfo.createdBy?.firstName ? `${applyJobInfo.createdBy.firstName} ${applyJobInfo.createdBy.lastName}` : applyJobInfo.companyName || applyJobInfo.company || t('browse.employer')}</span></div>
                  <div style={styles.applyInfoRow}><span>{t('browse.email')}</span><span>{applyJobInfo.createdBy?.email || applyJobInfo.employerEmail || t('browse.notProvided')}</span></div>
                  {applyJobInfo.createdBy?.companyName && <div style={styles.applyInfoRow}><span>{t('browse.company')}</span><span>{applyJobInfo.createdBy.companyName}</span></div>}
                  {applyJobInfo.companyLocation?.region && <div style={styles.applyInfoRow}><span>{t('browse.location')}</span><span>{`${applyJobInfo.companyLocation.region}, ${applyJobInfo.companyLocation.city}`}</span></div>}
                </div>
              </div>

              {applyError && <p style={{ color: '#b91c1c', margin: '14px 0 0' }}>{applyError}</p>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', margin: '24px 20px 20px' }}>
              <button style={styles.secondaryButton} onClick={closeApplyModal}>{t('browse.cancel')}</button>
              <button style={styles.actionButton} onClick={confirmApply} disabled={jobActionLoading}>{t('browse.confirmApplication')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div style={styles.modalOverlay} onClick={() => setShowLocationModal(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={{ margin: 0 }}>{t('browse.chooseLocation')}</h2>
              <button style={styles.modalClose} onClick={() => setShowLocationModal(false)}>✕</button>
            </div>

            <input
              type="text"
              placeholder="Maghanap ng lungsod o rehiyon..."
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              style={{ ...styles.postComposerInput, marginBottom: '12px' }}
            />

            <div style={{ display: 'grid', gap: '8px', maxHeight: '400px', overflow: 'auto' }}>
              {['Manila', 'Quezon City', 'Makati', 'Cavite', 'Laguna', 'Cebu', 'Davao', 'Iloilo', 'Cagayan de Oro', 'Bacolod'].map((city) => (
                ['NCR', 'Calabarzon', 'Visayas', 'Mindanao'].map((region) => (
                  <button
                    key={`${city}-${region}`}
                    onClick={() => handleLocationSelect(region, city)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: 'var(--text)',
                    }}
                  >
                    {city}, {region}
                  </button>
                ))
              ))}
            </div>

            <div style={{marginTop: '20px'}}>
              <iframe
                title="Location Map"
                width="100%"
                height="300"
                style={{ borderRadius: '12px', border: 'none' }}
                src="https://maps.google.com/maps?q=Philippines&t=&z=7&ie=UTF8&iwloc=&output=embed"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "var(--bg)",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    paddingBottom: "60px",
    color: "var(--text)",
  },
  pageHeader: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "12px 20px 8px",
    borderBottom: "1px solid var(--border)",
  },
  title: {
    fontSize: "28px",
    fontWeight: "800",
    marginBottom: "2px",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "12px",
    lineHeight: "1.4",
    maxWidth: "760px",
    color: "var(--text-muted)",
    marginBottom: "8px",
  },
  tabs: {
    display: "flex",
    gap: "0",
    flexWrap: "nowrap",
    marginBottom: "0",
    borderBottom: "1px solid var(--border)",
    marginLeft: "-20px",
    marginRight: "-20px",
    paddingLeft: "20px",
    overflowX: "auto",
  },
  tab: {
    padding: "12px 16px",
    borderRadius: "0",
    border: "none",
    borderBottom: "2px solid transparent",
    background: "transparent",
    color: "var(--text-muted)",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  },
  activeTab: {
    padding: "12px 16px",
    borderRadius: "0",
    border: "none",
    borderBottom: "2px solid var(--primary)",
    background: "transparent",
    color: "var(--primary)",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "14px",
    whiteSpace: "nowrap",
  },
  searchBarRow: {
    marginBottom: "8px",
    paddingTop: "8px",
  },
  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 14px",
    borderRadius: "24px",
    border: "1px solid var(--border)",
    background: "var(--surface-alt)",
    color: "var(--text)",
    fontSize: "13px",
    outline: "none",
    transition: "all 0.2s",
  },
  categoryChips: {
    display: "none",
  },
  chip: {
    padding: "6px 12px",
    borderRadius: "20px",
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--text)",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
    transition: "all 0.2s",
  },
  filterRow: {
    display: "flex",
    flexWrap: "nowrap",
    gap: "8px",
    marginBottom: "0",
    overflowX: "auto",
    paddingBottom: "2px",
  },
  filterSelect: {
    padding: "8px 12px",
    borderRadius: "20px",
    border: "1px solid var(--border)",
    background: "var(--surface-alt)",
    color: "var(--text)",
    fontSize: "11px",
    outline: "none",
    minWidth: "115px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  activeChip: {
    padding: "6px 12px",
    borderRadius: "20px",
    border: "1px solid var(--primary)",
    background: "rgba(29, 78, 216, 0.1)",
    color: "var(--primary)",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "12px",
  },
  feedSection: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr",
    gap: "0",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0",
    minHeight: "calc(100vh - 200px)",
  },
  feedColumn: {
    display: "grid",
    gap: "0",
    borderRight: "1px solid var(--border)",
  },
  postComposerCard: {
    background: "var(--surface)",
    borderRadius: "0",
    padding: "16px",
    border: "none",
    borderBottom: "1px solid var(--border)",
    boxShadow: "none",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  composerTop: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
  },
  composerAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "var(--primary)",
    color: "#ffffff",
    display: "grid",
    placeItems: "center",
    fontWeight: "800",
    fontSize: "18px",
    flexShrink: 0,
    marginTop: "8px",
  },
composerTextarea: {
  width: "100%",
  minHeight: "60px",
  borderRadius: "12px",
  border: "1px solid var(--border)",
  padding: "12px 14px",
  fontSize: "15px",
  color: "var(--text)",
  background: "var(--surface-alt)",
  outline: "none",
  overflow: "hidden",
  fontFamily: "inherit",
  transition: "border-color 0.2s, box-shadow 0.2s",
  resize: "none",
  lineHeight: "1.5",
},
  locationTagComposer: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 10px",
    borderRadius: "6px",
    background: "rgba(29, 78, 216, 0.1)",
    color: "var(--primary)",
    fontSize: "12px",
    fontWeight: "600",
    marginLeft: "60px",
    width: "fit-content",
  },
 composerTagsInput: {
  width: "100%",
  borderRadius: "12px",
  border: "1px solid var(--border)",
  padding: "10px 12px",
  fontSize: "12px",
  color: "var(--text)",
  background: "var(--surface-alt)",
  outline: "none",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
},
  composerDivider: {
    height: "1px",
    background: "var(--border)",
    marginLeft: "-16px",
    marginRight: "-16px",
    marginTop: "8px",
    marginBottom: "8px",
  },
  composerBottom: {

    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
   width: "100%",
  boxSizing: "border-box",
  paddingLeft: "60px",
    gap: "12px",
  },
  composerActionButtons: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  composerActionIcon: {
    fontSize: "18px",
    cursor: "pointer",
    padding: "8px 10px",
    borderRadius: "6px",
    background: "transparent",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s",
    color: "var(--primary)",
  },
  composerPostButton: {
    padding: "10px 24px",
    borderRadius: "20px",
    border: "none",
    background: "var(--primary)",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "14px",
    transition: "opacity 0.2s",
    minWidth: "80px",
  },
  postComposerTitle: {
    fontSize: "18px",
    fontWeight: "700",
    margin: 0,
    color: "var(--text-h)",
  },
  postComposerSubtitle: {
    margin: 0,
    color: "var(--text-muted)",
    fontSize: "13px",
    lineHeight: "1.4",
  },
  mediaPreviewContainer: {
    position: "relative",
    borderRadius: "12px",
    overflow: "hidden",
    marginTop: "8px",
    backgroundColor: "var(--surface-alt)",
  },
  mediaPreviewItem: {
    width: "100%",
    maxHeight: "250px",
    objectFit: "cover",
    borderRadius: "12px",
  },
  removeMediaButton: {
    position: "absolute",
    top: "8px",
    right: "8px",
    background: "rgba(0, 0, 0, 0.6)",
    color: "#ffffff",
    border: "none",
    borderRadius: "50%",
    width: "32px",
    height: "32px",
    cursor: "pointer",
    fontWeight: "700",
    transition: "background 0.2s",
  },
  locationTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 10px",
    borderRadius: "6px",
    background: "rgba(29, 78, 216, 0.1)",
    color: "var(--primary)",
    fontSize: "12px",
    fontWeight: "600",
    marginTop: "0",
    marginLeft: "60px",
  },
  composerActions: {
    display: "flex",
    gap: "8px",
    justifyContent: "flex-start",
  },
  actionIcon: {
    fontSize: "18px",
    cursor: "pointer",
    padding: "8px 10px",
    borderRadius: "6px",
    background: "transparent",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s",
    color: "var(--primary)",
  },
  socialFeedHeading: {
    marginTop: "0",
    marginBottom: "0",
    padding: "16px 20px",
    borderBottom: "1px solid var(--border)",
  },
  socialPostCard: {
    background: "var(--surface)",
    borderRadius: "0",
    padding: "16px 20px",
    border: "none",
    borderBottom: "1px solid var(--border)",
    boxShadow: "none",
    transition: "background 0.2s",
    "&:hover": {
      background: "rgba(255,255,255,0.02)",
    },
  },
  socialPostHeader: {
    display: "flex",
    gap: "12px",
    marginBottom: "12px",
    alignItems: "center",
  },
  sidebarColumn: {
    display: "grid",
    gap: "0",
    paddingLeft: "20px",
  },
  xPostCard: {
    background: "var(--surface)",
    borderRadius: "0",
    padding: "16px 20px",
    boxShadow: "none",
    border: "none",
    borderBottom: "1px solid var(--border)",
    transition: "background 0.2s",
  },
  postHeaderRow: {
    display: "flex",
    gap: "12px",
    marginBottom: "12px",
  },
  postAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "var(--primary)",
    color: "#ffffff",
    display: "grid",
    placeItems: "center",
    fontWeight: "800",
    fontSize: "18px",
    flexShrink: 0,
  },
  postHeading: {
    minWidth: 0,
    flex: 1,
  },
  postCompanyRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
  },
  postCompany: {
    fontSize: "14px",
    fontWeight: "800",
    color: "var(--text-h)",
  },
  postDot: {
    color: "var(--text-muted)",
    fontSize: "12px",
  },
  postMeta: {
    color: "var(--text-muted)",
    fontSize: "13px",
  },
  postTagline: {
    margin: "4px 0 0 0",
    color: "var(--text-muted)",
    fontSize: "13px",
  },
  postBody: {
    marginBottom: "12px",
    cursor: "pointer",
  },
  jobMediaPreview: {
    marginBottom: "12px",
    borderRadius: "16px",
    overflow: "hidden",
    border: "1px solid var(--border)",
    background: "var(--surface-alt)",
  },
  jobMediaItem: {
    width: "100%",
    display: "block",
    maxHeight: "280px",
    objectFit: "cover",
  },
  jobCardLink: {
    marginBottom: "12px",
  },
  jobLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    borderRadius: "12px",
    border: "1px solid var(--border)",
    backgroundColor: "var(--surface-alt)",
    color: "var(--primary)",
    textDecoration: "none",
    fontWeight: "700",
    fontSize: "13px",
  },
  postRole: {
    fontSize: "20px",
    fontWeight: "800",
    margin: "0 0 8px 0",
    lineHeight: "1.3",
    color: "var(--text-h)",
  },
  postText: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "var(--text)",
    margin: 0,
    wordWrap: "break-word",
    overflowWrap: "break-word",
    textAlign: "left",
  },
  postTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "12px",
  },
  postTag: {
    color: "var(--primary)",
    fontWeight: "700",
    fontSize: "12px",
  },
  commentRow: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    padding: "14px",
    borderRadius: "18px",
    background: "var(--surface-alt)",
    width: "100%",
    boxSizing: "border-box",
  },
  commentAvatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "var(--primary)",
    color: "#ffffff",
    display: "grid",
    placeItems: "center",
    fontWeight: "700",
    flexShrink: 0,
  },
  commentBody: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    textAlign: "left",
    minWidth: 0,
  },
  commentAuthor: {
    margin: 0,
    fontSize: "13px",
    fontWeight: "700",
    color: "var(--text)",
    textAlign: "left",
  },
  commentTime: {
    margin: "4px 0 10px",
    fontSize: "11px",
    color: "var(--text-muted)",
    textAlign: "left",
  },
  commentText: {
    margin: 0,
    whiteSpace: "pre-wrap",
    color: "var(--text)",
    fontSize: "14px",
    lineHeight: "1.6",
    textAlign: "left",
  },
  postEngagementDivider: {
    height: "1px",
    background: "var(--border)",
    margin: "12px -20px 0",
    marginRight: "-20px",
  },
  postEngagementBar: {
    display: "flex",
    justifyContent: "space-around",
    gap: "0",
    paddingTop: "12px",
    paddingBottom: "12px",
    color: "var(--text-muted)",
    fontSize: "13px",
    marginLeft: "-20px",
    marginRight: "-20px",
    paddingLeft: "20px",
    paddingRight: "20px",
  },
  engagementButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    padding: "8px 12px",
    borderRadius: "50%",
    transition: "color 0.2s, background 0.2s",
    "&:hover": {
      background: "rgba(29, 78, 216, 0.1)",
      color: "var(--primary)",
    },
  },
  postStatsRow: {
    display: "flex",
    gap: "14px",
    flexWrap: "wrap",
    color: "var(--text-muted)",
    fontSize: "13px",
    marginBottom: "12px",
    paddingBottom: "12px",
    borderBottom: "1px solid var(--border)",
  },
  postStatItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },
  postActionRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "8px",
  },
  actionButton: {
    borderRadius: "6px",
    border: "1px solid transparent",
    background: "transparent",
    color: "var(--text-muted)",
    padding: "8px 12px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "13px",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  },
  profileLinkButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "999px",
    border: "1px solid var(--primary)",
    background: "transparent",
    color: "var(--primary)",
    padding: "8px 14px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "12px",
    transition: "all 0.2s",
    minWidth: "120px",
    textAlign: "center",
  },
  savedButton: {
    borderRadius: "6px",
    border: "1px solid transparent",
    background: "rgba(29, 78, 216, 0.1)",
    color: "var(--primary)",
    padding: "8px 12px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "13px",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  },
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    display: "grid",
    placeItems: "center",
    padding: "24px",
    zIndex: 1000,
  },
  modalContent: {
    width: "100%",
    maxWidth: "520px",
    background: "var(--surface)",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 24px 60px rgba(0, 0, 0, 0.15)",
    color: "var(--text)",
  },
  sidebarCard: {
    background: "transparent",
    borderRadius: "0",
    padding: "16px 0",
    boxShadow: "none",
    border: "none",
    borderBottom: "1px solid var(--border)",
  },
  sidebarHeader: {
    marginBottom: "12px",
  },
  sidebarTitle: {
    fontSize: "16px",
    fontWeight: "800",
    margin: 0,
    color: "var(--text-h)",
  },
  sidebarSubtitle: {
    margin: "6px 0 0 0",
    fontSize: "13px",
    color: "var(--text-muted)",
  },
  trendingList: {
    display: "grid",
    gap: "0",
  },
  trendingItem: {
    width: "100%",
    textAlign: "left",
    padding: "12px 0",
    borderRadius: "0",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid var(--border)",
    color: "var(--primary)",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "13px",
    transition: "background 0.2s",
  },
  companyList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "grid",
    gap: "0",
  },
  companyItem: {
    padding: "12px 0",
    borderRadius: "0",
    background: "transparent",
    color: "var(--text)",
    fontWeight: "600",
    fontSize: "13px",
    borderBottom: "1px solid var(--border)",
  },
  shortcutButton: {
    width: "100%",
    padding: "12px 0",
    borderRadius: "0",
    border: "none",
    borderBottom: "1px solid var(--border)",
    background: "transparent",
    color: "var(--text)",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "13px",
    transition: "opacity 0.2s",
    marginBottom: "0",
    textAlign: "left",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "grid",
    placeItems: "center",
    zIndex: 2000,
    padding: "20px",
    backdropFilter: "blur(5px)",
  },
  modalCard: {
    width: "100%",
    maxWidth: "600px",
    background: "var(--surface)",
    color: "var(--text)",
    borderRadius: "16px",
    padding: "0",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    border: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    maxHeight: "90vh",
    overflow: "hidden",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
  },
  modalClose: {
    background: "transparent",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "var(--text-muted)",
    padding: "4px 8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.2s",
  },
  modalCompany: {
    color: "var(--text-muted)",
    marginTop: 0,
    marginBottom: "12px",
    fontSize: "13px",
  },
  modalBody: {
    maxHeight: "calc(90vh - 120px)",
    overflowY: "auto",
    padding: "20px",
    flex: 1,
  },
  modalActions: {
    display: "flex",
    gap: "10px",
    padding: "12px 20px",
    borderTop: "1px solid var(--border)",
    flexShrink: 0,
  },
  applyModalCard: {
    width: "min(760px, 90vw)",
    maxWidth: "100%",
    maxHeight: "90vh",
    borderRadius: "24px",
    padding: "0",
    overflow: "hidden",
  },
  applyVerticalGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "18px",
    alignItems: "start",
  },
  applySectionHeader: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
  },
  applyProfileSection: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
    paddingBottom: "18px",
    borderBottom: "1px solid var(--border)",
  },
  applyProfileInfo: {
    display: "grid",
    gap: "6px",
    minWidth: 0,
  },
  companyBadge: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    background: "var(--primary)",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    fontSize: "18px",
    flexShrink: 0,
  },
  applyInfoSection: {
    background: "rgba(15, 23, 42, 0.03)",
    borderRadius: "18px",
    padding: "18px",
    display: "grid",
    gap: "12px",
  },
  applyInfoTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
  },
  applyInfoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    color: "#334155",
    fontSize: "13px",
    lineHeight: 1.6,
  },
  applySidebar: {
    display: "grid",
    gap: "18px",
  },
  fab: {
    position: "fixed",
    right: "24px",
    bottom: "24px",
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    backgroundColor: "#9ca3af",
    color: "#ffffff",
    border: "none",
    display: "grid",
    placeItems: "center",
    fontSize: "28px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 16px 36px rgba(0, 0, 0, 0.18)",
    zIndex: 2000,
  },
  notificationToastContainer: {
    position: "fixed",
    bottom: "80px",
    left: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxWidth: "320px",
    zIndex: 999,
  },
  notificationToast: {
    background: "linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)",
    color: "white",
    padding: "14px 16px",
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(29, 78, 216, 0.4)",
    animation: "slideIn 0.3s ease-out",
    border: "1px solid rgba(255,255,255,0.1)",
  },
};
