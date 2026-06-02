import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useLanguage } from "../../contexts/LanguageContext";
import "./BrowseJob.css";
import { useTranslate } from "../../hooks/useTranslate";
import PostDetailsModal from "../../components/PostDetailsModal";
import PresenceAvatar from "../../components/PresenceAvatar";

const getUserId = (user) => {
  if (!user) return null;
  return typeof user === 'object' ? user._id || user.id || null : user;
};

const sameId = (a, b) => {
  if (a == null || b == null) return false;
  return a.toString() === b.toString();
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

const getCompanyDisplayName = (job) => {
  return job?.createdBy?.companyName || job?.companyName || job?.company || job?.employerName || 'Hiring Manager';
};

const getResumeKeywords = (user) => {
  if (!user) return [];
  const text = [
    user.experience,
    user.education,
    user.bio,
    user.citizenShip,
    user.location?.region,
    user.location?.city,
    user.location?.barangay,
    user.location?.otherDetails,
    user.resume?.split('/').pop(),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const tokens = text.match(/\b[a-z0-9]{4,}\b/g) || [];
  return Array.from(new Set(tokens));
};

const getResumeMatchScore = (job, user) => {
  const tokens = getResumeKeywords(user);
  if (!tokens.length) return 0;

  const jobText = [
    job.role,
    job.company,
    job.location,
    job.description,
    job.details?.join(' '),
    job.tags?.join(' '),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return tokens.reduce((score, token) => {
    if (!jobText.includes(token)) return score;
    const occurrences = jobText.split(token).length - 1;
    return score + Math.min(occurrences, 2);
  }, 0);
};

const getUserProfileSummary = (user) => {
  if (!user) return [];
  const items = [];
  if (user.bio) items.push({ label: 'Bio', value: user.bio });
  if (user.experience) items.push({ label: 'Experience', value: user.experience });
  if (user.education) items.push({ label: 'Education', value: user.education });
  const location = [user.location?.region, user.location?.city, user.location?.barangay, user.location?.otherDetails]
    .filter(Boolean)
    .join(', ');
  if (location) items.push({ label: 'Location', value: location });
  if (user.resume) {
    const display = user.resume.split('/').pop()?.split('?')[0]?.split('#')[0] || user.resume;
    items.push({ label: 'Resume', value: display, link: /^https?:\/\//i.test(user.resume) ? user.resume : null });
  }
  return items;
};

const generateCoverLetterTemplate = (job, user) => {
  if (!job) return '';
  const companyName = getCompanyDisplayName(job);
  const jobTitle = job.title || job.role || 'the position';
  const userIntro = user?.experience || user?.bio || 'relevant experience';
  const requirementList = splitTextIntoListItems(job.requirements || (job.details?.join('\n') || ''));
  const highlights = [];

  if (requirementList.length) {
    highlights.push(`- ${requirementList[0]}`);
    if (requirementList[1]) highlights.push(`- ${requirementList[1]}`);
  } else {
    highlights.push('- Proven ability to deliver strong results in a fast-paced environment.');
    highlights.push('- Collaborative approach and strong communication skills.');
  }

  const educationSentence = user?.education ? `I also bring ${user.education} training and a strong foundation in the skills needed for this role.` : '';
  const closingName = user?.firstName || user?.email || 'Applicant';

  return [
    `Dear ${companyName},`,
    `I am excited to apply for the ${jobTitle} role at ${companyName}. With ${userIntro}, I believe I can contribute meaningfully to your team and support your goals in this position.`,
    `My most relevant qualifications include:\n${highlights.join('\n')}`,
    educationSentence,
    `My resume is attached for additional details on my background and accomplishments. I would welcome the opportunity to discuss how I can help ${companyName} succeed.`,
    `Thank you for your time and consideration.\n\nSincerely,\n${closingName}`
  ]
    .filter(Boolean)
    .join('\n\n');
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

const IconBox = ({ color = '#eefdf0', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="7" width="18" height="11" rx="2" fill={color} stroke="currentColor" strokeWidth="0.8" />
    <path d="M3 7l9 5 9-5" stroke="currentColor" strokeWidth="0.9" fill="none" />
  </svg>
);

const IconChart = ({ color = '#fff7ed', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="4" height="14" rx="1" fill={color} stroke="currentColor" strokeWidth="0.8" />
    <rect x="9" y="8" width="4" height="10" rx="1" fill={color} stroke="currentColor" strokeWidth="0.8" />
    <rect x="15" y="12" width="4" height="6" rx="1" fill={color} stroke="currentColor" strokeWidth="0.8" />
  </svg>
);

const IconHeart = ({ color = '#fff0f6', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.1 20.6l-1.1-1c-4.6-4.2-7.6-6.9-7.6-10.1 0-2.5 2-4.5 4.5-4.5 1.6 0 3.1.9 3.9 2.2.8-1.3 2.3-2.2 3.9-2.2 2.5 0 4.5 2 4.5 4.5 0 3.2-3 5.9-7.6 10.1l-1.1 1z" fill={color} stroke="currentColor" strokeWidth="0.7" />
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
  const [serverUser, setServerUser] = useState(null);
  const effectiveUser = serverUser || currentUser;
  const currentUserId = effectiveUser?.id || effectiveUser?._id || null;
  const currentRole = effectiveUser?.role;
  const isEmployer = currentRole === 'employer';
  const isJobseeker = currentRole === 'jobseeker';
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarKeyword, setSidebarKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [companyFilter, setCompanyFilter] = useState("All");
  const [employmentTypes, setEmploymentTypes] = useState(["All Types", "Full-time", "Part-time", "Internship", "Freelance", "Contract"]);
  const [salaryRange, setSalaryRange] = useState([10000, 100000]);
  const [remoteOptions, setRemoteOptions] = useState(["All"]);
  const [appliedSidebarKeyword, setAppliedSidebarKeyword] = useState("");
  const [appliedSelectedCategory, setAppliedSelectedCategory] = useState("All");
  const [appliedLocationFilter, setAppliedLocationFilter] = useState("All");
  const [appliedCompanyFilter, setAppliedCompanyFilter] = useState("All");
  const [appliedEmploymentTypes, setAppliedEmploymentTypes] = useState(["All Types", "Full-time", "Part-time", "Internship", "Freelance", "Contract"]);
  const [appliedSalaryRange, setAppliedSalaryRange] = useState([10000, 100000]);
  const [appliedRemoteOptions, setAppliedRemoteOptions] = useState(["All"]);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [resumeMatchEnabled, setResumeMatchEnabled] = useState(true);
  const [premiumAIAccess, setPremiumAIAccess] = useState(!!effectiveUser?.premiumAIAccess);
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
  const [applyStep, setApplyStep] = useState(1);
  const [applyError, setApplyError] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [coverLetterStyle, setCoverLetterStyle] = useState('professional');
  const [rephraseCount, setRephraseCount] = useState(0);
  const [translateCount, setTranslateCount] = useState(0);
  const [isAutoCorrecting, setIsAutoCorrecting] = useState(false);
  const [isRephrasing, setIsRephrasing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [userLikes, setUserLikes] = useState(new Set());
  const [profileLoading, setProfileLoading] = useState(false);

  const formatSalaryText = (job) => {
    const min = job.salaryMin;
    const max = job.salaryMax;
    const freq = job.salaryFrequency;

    if (min != null && max != null && !isNaN(min) && !isNaN(max)) {
      const range = `₱${Number(min).toLocaleString()} - ₱${Number(max).toLocaleString()}`;
      return `${range}${freq ? ` / ${freq}` : ''}`;
    }

    if (min != null && !isNaN(min)) {
      return `₱${Number(min).toLocaleString()}${freq ? ` / ${freq}` : ''}`;
    }

    const salaryValue = job.salary;
    if (salaryValue != null && !isNaN(salaryValue) && Number(salaryValue) > 0) {
      return `₱${Number(salaryValue).toLocaleString()}`;
    }

    return 'Negotiable';
  };

  const refreshAuthenticatedUser = async () => {
    if (!token) return null;
    try {
      setProfileLoading(true);
      const response = await axios.get("http://localhost:8000/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const freshUser = response.data?.data;
      if (freshUser) {
        setServerUser(freshUser);
        localStorage.setItem("user", JSON.stringify(freshUser));
        return freshUser;
      }
    } catch (err) {
      console.warn("Could not refresh authenticated user profile", err?.response?.data || err.message);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth");
      }
    } finally {
      setProfileLoading(false);
    }
    return null;
  };

  useEffect(() => {
    if (!token) return;
    if (serverUser) return;

    let isCanceled = false;
    const refreshProfile = async () => {
      const freshUser = await refreshAuthenticatedUser();
      if (isCanceled || !freshUser) return;
    };

    refreshProfile();
    return () => {
      isCanceled = true;
    };
  }, [token, serverUser]);

  useEffect(() => {
    setPremiumAIAccess(!!effectiveUser?.premiumAIAccess);
  }, [effectiveUser]);

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

  const getResumeDisplayName = () => {
    const resume = effectiveUser?.resume;
    if (!resume) return t('browse.noResumeFound') || 'No resume found';
    return resume.split('/').pop()?.split('?')[0]?.split('#')[0] || resume;
  };

  const handleAutoCorrectCoverLetter = async () => {
    const text = coverLetter?.trim();
    if (!text) return;

    setIsAutoCorrecting(true);
    try {
      const response = await axios.post('http://localhost:8000/api/translate/cover-letter', {
        text,
        action: 'correct'
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 20000
      });

      const corrected = response.data?.data?.trim();
      if (corrected) {
        setCoverLetter(corrected);
      } else {
        setCoverLetter(text.replace(/\s+/g, ' ').replace(/\bi\b/g, 'I'));
      }
    } catch (error) {
      console.error('Auto-correct failed:', error?.message || error);
      const fallback = text
        .replace(/\s+/g, ' ')
        .replace(/\bi\b/g, 'I')
        .replace(/([.!?])\s*(?=[A-Za-z])/g, '$1 ')
        .replace(/(^|[.!?]\s+)([a-z])/g, (match, prefix, char) => `${prefix}${char.toUpperCase()}`)
        .replace(/\s+([.,!?;:])/g, '$1');
      setCoverLetter(/[.!?]$/.test(fallback) ? fallback : `${fallback}.`);
    } finally {
      setIsAutoCorrecting(false);
    }
  };

  const handleRephraseCoverLetter = async () => {
    const text = coverLetter?.trim();
    const style = coverLetterStyle || 'professional';
    if (!text) return;

    setIsRephrasing(true);
    try {
      const response = await axios.post('http://localhost:8000/api/translate/cover-letter', {
        text,
        action: 'rephrase',
        style,
        rephraseRound: rephraseCount + 1,
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 20000
      });

      const paraphrased = response.data?.data?.trim();
      if (paraphrased) {
        setCoverLetter(paraphrased);
      } else {
        setCoverLetter(text);
      }
      setRephraseCount((count) => count + 1);
    } catch (error) {
      console.error('Rephrase failed:', error?.message || error);

      const fallbackWords = [
        { regex: /\bI have\b/gi, value: 'My experience includes' },
        { regex: /\bI would like to\b/gi, value: 'I am eager to' },
        { regex: /\bI am a\b/gi, value: 'As a' },
        { regex: /\bI am an\b/gi, value: 'As an' },
        { regex: /\bI'm a\b/gi, value: 'As a' },
        { regex: /\bI'm an\b/gi, value: 'As an' },
        { regex: /\bI'm\b/gi, value: 'I am' },
        { regex: /\bI want to\b/gi, value: 'I seek to' },
        { regex: /\bIn my previous role\b/gi, value: 'Previously,' },
        { regex: /\bhelped\b/gi, value: 'supported' },
        { regex: /\bworked on\b/gi, value: 'contributed to' },
        { regex: /\bbuilt\b/gi, value: 'developed' },
        { regex: /\bcreated\b/gi, value: 'developed' },
        { regex: /\bresponsible for\b/gi, value: 'accountable for' },
        { regex: /\bmanage(?:d|s|r)?\b/gi, value: 'oversee' },
        { regex: /\bexperience with\b/gi, value: 'experience in' },
        { regex: /\bgood\b/gi, value: 'strong' },
        { regex: /\bgreat\b/gi, value: 'excellent' },
        { regex: /\bbest\b/gi, value: 'strongest' },
        { regex: /\bvery\b/gi, value: 'extremely' },
        { regex: /\busing\b/gi, value: 'leveraging' },
        { regex: /\buse\b/gi, value: 'leverage' },
        { regex: /\bsuccessfully\b/gi, value: 'effectively' },
        { regex: /\bstrong\b/gi, value: 'proven' }
      ];

      if (style === 'formal') {
        fallbackWords.push(
          { regex: /\bI would like to\b/gi, value: 'I respectfully wish to' },
          { regex: /\bI want to\b/gi, value: 'I aspire to' },
          { regex: /\bI have\b/gi, value: 'I possess' },
          { regex: /\bplease\b/gi, value: 'kindly' }
        );
      }

      const alternate = text
        .split(/([.!?]+)/)
        .map((chunk, index, parts) => {
          let result = chunk.trim();
          if (!result) return '';
          fallbackWords.forEach(({ regex, value }) => {
            result = result.replace(regex, value);
          });
          if (index % 2 === 0 && parts.length > 3) {
            result = result.replace(/\bI am\b/gi, 'As someone who is');
            result = result.replace(/\bMy experience includes\b/gi, 'With experience in');
            result = result.replace(/\bI seek to\b/gi, 'I am seeking to');
          }
          return result;
        })
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      const finalText = alternate || text;
      setCoverLetter(finalText);
      setRephraseCount((count) => count + 1);
    } finally {
      setIsRephrasing(false);
    }
  };

  const handleTranslateCoverLetter = async () => {
    const text = coverLetter?.trim();
    if (!text) return;

    setIsTranslating(true);
    try {
      const response = await axios.post('http://localhost:8000/api/translate/cover-letter', {
        text,
        action: 'translate',
        translateRound: translateCount + 1
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 20000
      });

      const translated = response.data?.data?.trim();
      if (translated) {
        setCoverLetter(translated);
      }
      setTranslateCount((count) => count + 1);
    } catch (error) {
      console.error('Translate to English failed:', error?.message || error);
    } finally {
      setIsTranslating(false);
    }
  };

  const openApplyModal = async (job) => {
    if (!token) {
      navigate("/auth");
      return;
    }

    const freshUser = await refreshAuthenticatedUser();
    const activeUser = freshUser || effectiveUser;
    const activeRole = activeUser?.role;

    if (activeRole !== 'jobseeker') {
      alert(activeRole === 'employer'
        ? t('browse.employerCannotApply')
        : 'Please switch to a jobseeker account to apply.');
      return;
    }

    setApplyJobInfo(job);
    setApplyStep(1);
    setApplyError("");
    setCoverLetter("");
    setCoverLetterStyle('professional');
    setRephraseCount(0);
    setTranslateCount(0);
    setShowApplyModal(true);
  };

  const closeApplyModal = () => {
    setShowApplyModal(false);
    setApplyJobInfo(null);
    setApplyError("");
    setApplyStep(1);
    setCoverLetter("");
    setCoverLetterStyle('professional');
    setRephraseCount(0);
    setTranslateCount(0);
    setIsAutoCorrecting(false);
    setIsRephrasing(false);
    setIsTranslating(false);
  };

  const goToCoverLetterStep = () => {
    if (!coverLetter.trim()) {
      setCoverLetter(generateCoverLetterTemplate(applyJobInfo, effectiveUser));
    }
    setApplyStep(2);
  };
  const goToReviewStep = () => setApplyStep(1);

  const confirmApply = async () => {
    if (!applyJobInfo) return;

    const freshUser = await refreshAuthenticatedUser();
    const activeUser = freshUser || effectiveUser;
    const activeRole = activeUser?.role;

    if (activeRole !== 'jobseeker') {
      setApplyError(activeRole === 'employer'
        ? t('browse.employerCannotApply')
        : 'Please switch to a jobseeker account to apply.');
      return;
    }

    const jobId = applyJobInfo._id || applyJobInfo.id;
    if (!jobId) {
      setApplyError(t('browse.jobNotFound'));
      return;
    }

    try {
      setJobActionLoading(true);
        const response = await axios.post(
        `http://localhost:8000/api/jobs/${jobId}/apply`,
        { coverLetter: coverLetter?.trim() || '' },
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
      if (error.response?.status === 403) {
        setApplyError(
          currentRole === 'employer'
            ? t('browse.employerCannotApply')
            : 'Only jobseeker accounts can apply for jobs. Please verify your profile or select the jobseeker role.'
        );
      } else {
        const backendMessage = error.response?.data?.message?.toString() || "";
        const isResumeError = /resume/i.test(backendMessage);
        setApplyError(
          backendMessage
            ? isResumeError
              ? t('browse.applyErrorResume')
              : backendMessage
            : t('browse.applyErrorSubmit')
        );
      }
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
    if (!isJobseeker) {
      alert(currentUser?.role === 'employer'
        ? t('browse.employerCannotApply')
        : 'Only jobseekers can like jobs.');
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
      if (error.response?.status === 403) {
        alert(currentRole === 'employer'
          ? t('browse.employerCannotApply')
          : 'Only jobseeker accounts may like jobs.');
      } else {
        alert("Hindi ma-update ang like ngayon.");
      }
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
        const fetched = response.data.data || [];
        setJobs(fetched);

        // Merge any optimistic jobs created locally (optimistic cache)
        try {
          const key = "applica:optimisticJobs";
          const optimistic = JSON.parse(localStorage.getItem(key) || "[]");
          if (Array.isArray(optimistic) && optimistic.length > 0) {
            const existingIds = new Set(fetched.map((j) => j._id));
            const toAdd = optimistic.filter((j) => !existingIds.has(j._id));
            if (toAdd.length > 0) {
              setJobs((prev) => [...toAdd, ...prev]);
            }
            // Clear optimistic cache after merging
            localStorage.removeItem(key);
          }
        } catch (mergeErr) {
          console.error('Failed to merge optimistic jobs', mergeErr);
        }
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

  // Listen for optimistic new job events from other parts of the app
  useEffect(() => {
    const onNewJob = (e) => {
      const job = e?.detail || (e && e.detail) || null;
      if (!job || !job._id) return;

      setJobs((prev) => {
        if (prev.some((j) => j._id === job._id)) return prev;
        return [job, ...prev];
      });
    };

    window.addEventListener("applica:newJob", onNewJob);
    return () => window.removeEventListener("applica:newJob", onNewJob);
  }, []);

  const tabs = ["forYou", "following", "job", "post", "saved"];
  const [activeTab, setActiveTab] = useState("forYou");
  const [sortMode, setSortMode] = useState("recent"); // 'recent' or 'relevant'

  const isForYou = activeTab === "forYou";
  const showJobSection = ["job", "saved"].includes(activeTab);
  const showPostSection = ["following", "post"].includes(activeTab);
  const showCombinedForYouFeed = isForYou;
  const showJobFilter = activeTab === "job";
  const showPostComposer = (showCombinedForYouFeed || showPostSection) && currentUser?.role === "jobseeker";
  const feedSectionStyle = {
    ...styles.feedSection,
    gridTemplateColumns: showJobFilter ? "280px 1.5fr 1fr" : "1.5fr 1fr",
  };

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
      employmentType: job.employmentType || job.jobType || "Full-time",
      remoteType: job.remoteType || (job.location?.toLowerCase().includes("remote") ? "Remote" : "On-site"),
      salaryValue: job.salaryMax || job.salary || job.salaryMin || 0,
      postedAt: job.createdAt
        ? new Date(job.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "Recently",
      description: job.description,
      details: [
        `Requirements: ${job.requirements}`,
        `Salary: ${formatSalaryText(job)}`,
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
      createdAt: job.createdAt,
      createdById: job.createdBy?._id,
      employerEmail: job.createdBy?.email,
      employerAvatar: job.createdBy?.role === 'employer' ? job.createdBy?.companyLogo : job.createdBy?.profilePicture,
      employerName: `${job.createdBy?.firstName || ""} ${job.createdBy?.lastName || ""}`.trim() || job.createdBy?.email,
      resumeScore: getResumeMatchScore(job, effectiveUser),
    };
  });

  // Helper: get Date from document (prefer `createdAt`, fallback to ObjectId timestamp)
  const getDocTimestamp = (doc) => {
    try {
      if (!doc) return new Date(0);
      if (doc.createdAt) return new Date(doc.createdAt);
      const id = doc._id || doc.id;
      if (!id || typeof id !== 'string') return new Date(0);
      const ts = parseInt(id.substring(0, 8), 16) * 1000;
      return new Date(ts);
    } catch (err) {
      return new Date(0);
    }
  };

  // Helper: compute displayed social posts (extracted from inline IIFE)
  const getDisplayedSocial = () => {
    const source = activeTab === "following" ? followingPostItems : socialPosts;
    if (!Array.isArray(source)) return [];

    if (sortMode === 'recent') {
      return [...source].sort((a, b) => getDocTimestamp(b) - getDocTimestamp(a));
    }

    return [...source].sort((a, b) => {
      const scoreA = (a.likes?.length || a.likes || 0) * 2 + (a.views || 0) * 1 + (a.comments?.length || 0) * 1.5;
      const scoreB = (b.likes?.length || b.likes || 0) * 2 + (b.views || 0) * 1 + (b.comments?.length || 0) * 1.5;
      return scoreB - scoreA;
    });
  };

  const formatCurrency = (value) => {
    try {
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 0,
      }).format(value);
    } catch {
      return `₱${value.toLocaleString()}`;
    }
  };

  const toggleEmploymentType = (type) => {
    setEmploymentTypes((current) => {
      if (type === "All Types") {
        return ["All Types", "Full-time", "Part-time", "Internship", "Freelance", "Contract"];
      }
      const hasType = current.includes(type);
      const next = hasType ? current.filter((item) => item !== type) : [...current.filter((item) => item !== "All Types"), type];
      const allSelected = ["Full-time", "Part-time", "Internship", "Freelance", "Contract"].every((option) => next.includes(option));
      return allSelected ? ["All Types", "Full-time", "Part-time", "Internship", "Freelance", "Contract"] : next;
    });
  };

  const toggleRemoteOption = (option) => {
    setRemoteOptions((current) => {
      if (option === "All") {
        return ["All"];
      }
      const next = current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current.filter((item) => item !== "All"), option];
      return next.length === 0 ? ["All"] : next;
    });
  };

  const clearJobFilters = () => {
    setSidebarKeyword("");
    setSelectedCategory("All");
    setLocationFilter("All");
    setCompanyFilter("All");
    setEmploymentTypes(["All Types", "Full-time", "Part-time", "Internship", "Freelance", "Contract"]);
    setSalaryRange([10000, 100000]);
    setRemoteOptions(["All"]);
    setAppliedSidebarKeyword("");
    setAppliedSelectedCategory("All");
    setAppliedLocationFilter("All");
    setAppliedCompanyFilter("All");
    setAppliedEmploymentTypes(["All Types", "Full-time", "Part-time", "Internship", "Freelance", "Contract"]);
    setAppliedSalaryRange([10000, 100000]);
    setAppliedRemoteOptions(["All"]);
  };

  const applyJobFilters = () => {
    setAppliedSidebarKeyword(sidebarKeyword);
    setAppliedSelectedCategory(selectedCategory);
    setAppliedLocationFilter(locationFilter);
    setAppliedCompanyFilter(companyFilter);
    setAppliedEmploymentTypes(employmentTypes);
    setAppliedSalaryRange(salaryRange);
    setAppliedRemoteOptions(remoteOptions);
  };

  const rankedJobPosts = resumeMatchEnabled
    ? [...jobPosts].sort((a, b) => (b.resumeScore || 0) - (a.resumeScore || 0))
    : jobPosts;

  // Apply sort mode: recent (newest first) or relevant (popularity by views/likes/applicants)
  const scoredAndSorted = (() => {
    const arr = [...rankedJobPosts];
    if (sortMode === 'recent') {
      return arr.sort((a, b) => getDocTimestamp(b) - getDocTimestamp(a));
    }

    // relevance score: weighted sum of likes and views and applicants
    return arr.sort((a, b) => {
      const scoreA = (a.likes || 0) * 2 + (a.views || 0) * 1 + (a.applicants || 0) * 1.5;
      const scoreB = (b.likes || 0) * 2 + (b.views || 0) * 1 + (b.applicants || 0) * 1.5;
      return scoreB - scoreA;
    });
  })();

  const feedItemsToShow = jobs.length ? scoredAndSorted : samplePosts;
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
    const matchesKeyword =
      !appliedSidebarKeyword.trim() ||
      searchText.includes(appliedSidebarKeyword.toLowerCase());
    const matchesCategory =
      appliedSelectedCategory === "All" ||
      post.tags?.some((tag) =>
        tag.toLowerCase().includes(appliedSelectedCategory.toLowerCase())
      ) ||
      post.role.toLowerCase().includes(appliedSelectedCategory.toLowerCase());
    const matchesLocation =
      appliedLocationFilter === "All" || post.location === appliedLocationFilter;
    const matchesCompany =
      appliedCompanyFilter === "All" || post.company === appliedCompanyFilter;
    const matchesEmployment =
      appliedEmploymentTypes.includes("All Types") ||
      appliedEmploymentTypes.includes(post.employmentType) ||
      appliedEmploymentTypes.includes(post.jobType);
    const salaryMinValue = appliedSalaryRange[0];
    const salaryMaxValue = appliedSalaryRange[1];
    const salaryValue = post.salaryValue || 0;
    const matchesSalary =
      salaryValue === 0 ||
      (salaryValue >= salaryMinValue && salaryValue <= salaryMaxValue);
    const matchesRemote =
      appliedRemoteOptions.includes("All") ||
      appliedRemoteOptions.some((option) =>
        post.remoteType?.toLowerCase().includes(option.toLowerCase())
      );

    return (
      matchesSearch &&
      matchesKeyword &&
      matchesCategory &&
      matchesLocation &&
      matchesCompany &&
      matchesEmployment &&
      matchesSalary &&
      matchesRemote
    );
  });

  const forYouFeedItems = (() => {
    if (!isForYou) return [];
    const lowerSearch = searchTerm.trim().toLowerCase();

    const matchesSearch = (item) => {
      if (!lowerSearch) return true;
      const searchText = [
        item.role,
        item.company,
        item.location,
        item.description,
        item.tags?.join(" "),
        item.content,
        item.authorName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchText.includes(lowerSearch);
    };

    const feedSource = [
      ...getDisplayedSocial().map((post) => ({ ...post, __feedType: "post" })),
      ...jobPosts.map((job) => ({ ...job, __feedType: "job" })),
    ].filter(matchesSearch);

    return feedSource.sort((a, b) => {
      if (sortMode === "recent") {
        return getDocTimestamp(b) - getDocTimestamp(a);
      }

      const scoreA =
        (a.likes?.length || a.likes || 0) * 2 +
        (a.views || 0) * 1 +
        (a.applicants || 0) * 1.5 +
        (a.comments?.length || 0) * 1.2;
      const scoreB =
        (b.likes?.length || b.likes || 0) * 2 +
        (b.views || 0) * 1 +
        (b.applicants || 0) * 1.5 +
        (b.comments?.length || 0) * 1.2;
      return scoreB - scoreA;
    });
  })();

  const trendingJobs = jobs.length
    ? [...jobPosts].sort((a, b) => b.views - a.views)
    : samplePosts;

  return (
    <div className="page-container" style={styles.container}>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Sort:</div>
          <button
            onClick={() => setSortMode('recent')}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: sortMode === 'recent' ? '1px solid var(--primary)' : '1px solid var(--border)',
              background: sortMode === 'recent' ? 'var(--surface-alt)' : 'transparent',
              cursor: 'pointer'
            }}
          >
            Recent
          </button>
          <button
            onClick={() => setSortMode('relevant')}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: sortMode === 'relevant' ? '1px solid var(--primary)' : '1px solid var(--border)',
              background: sortMode === 'relevant' ? 'var(--surface-alt)' : 'transparent',
              cursor: 'pointer'
            }}
          >
            Relevant
          </button>
        </div>

        {/* Filters are shown in the left sidebar when Job tab is active */}
        <div style={styles.aiHintRow}>
          {currentUser?.role === 'jobseeker' && (
            <span style={styles.aiHintText}>
              {resumeMatchEnabled
                ? 'Resume-based personalization is active.'
                : 'Enable resume match to surface the best roles for your profile.'}
              {!effectiveUser?.resume && ' Upload your resume under Profile to improve results.'}
            </span>
          )}
        </div>

          {/* Category chips are available in the job filter sidebar */}
      </div>

      <section style={feedSectionStyle}>
        {showJobFilter && (
          <aside style={styles.jobFilterColumn}>
            <div style={styles.jobFilterCard}>
              <div style={styles.filterHeaderRow}>
                <div>
                  <h3 style={styles.jobFilterTitle}>{t("browse.filters")}</h3>
                  <p style={styles.filterSubtitle}>Refine job posts on this tab only</p>
                </div>
                <button style={styles.clearFiltersButton} onClick={clearJobFilters}>
                  Clear all
                </button>
              </div>

              <div style={styles.jobFilterSection}>
                <label style={styles.jobFilterLabel}>Keyword</label>
                <input
                  type="text"
                  value={sidebarKeyword}
                  onChange={(e) => setSidebarKeyword(e.target.value)}
                  placeholder="Job title, skills, or company"
                  style={styles.jobFilterInput}
                />
              </div>

              <div style={styles.jobFilterSection}>
                <label style={styles.jobFilterLabel}>{t("browse.location")}</label>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  style={styles.jobFilterSelect}
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
              </div>

              <div style={styles.jobFilterSection}>
                <label style={styles.jobFilterLabel}>Job Category</label>
                <div style={styles.filterPillRow}>
                  {["All", ...categories].map((category) => {
                    const isActive = selectedCategory === category;
                    return (
                      <button
                        type="button"
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        style={{
                          ...styles.filterPill,
                          ...(isActive ? styles.filterPillActive : {}),
                        }}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={styles.jobFilterSection}>
                <label style={styles.jobFilterLabel}>Employment Type</label>
                <div style={styles.filterPillRow}>
                  {["All Types", "Full-time", "Part-time", "Internship", "Freelance", "Contract"].map((type) => {
                    const isSelected = employmentTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleEmploymentType(type)}
                        style={{
                          ...styles.filterPill,
                          ...styles.filterPillCompact,
                          ...(isSelected ? styles.filterPillActive : {}),
                        }}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={styles.jobFilterSection}>
                <label style={styles.jobFilterLabel}>Salary Range</label>
                <div style={styles.salaryRow}>
                  <span style={styles.salaryValue}>{formatCurrency(salaryRange[0])}</span>
                  <span style={styles.salaryValue}>{formatCurrency(salaryRange[1])}+</span>
                </div>
                <input
                  type="range"
                  min={10000}
                  max={100000}
                  step={5000}
                  value={salaryRange[1]}
                  onChange={(e) => setSalaryRange([salaryRange[0], Number(e.target.value)])}
                  style={styles.salarySlider}
                />
              </div>

              <div style={styles.jobFilterSection}>
                <label style={styles.jobFilterLabel}>Remote</label>
                <div style={styles.filterPillRow}>
                  {["All", "Remote", "On-site", "Hybrid"].map((option) => {
                    const isSelected = remoteOptions.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggleRemoteOption(option)}
                        style={{
                          ...styles.filterPill,
                          ...styles.filterPillCompact,
                          ...(isSelected ? styles.filterPillActive : {}),
                        }}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={applyJobFilters}
                style={styles.applyFiltersButton}
              >
                See results
              </button>
              <button
                type="button"
                onClick={() => setShowMoreFilters((prev) => !prev)}
                style={styles.moreFiltersButton}
              >
                More Filters
              </button>
            </div>
          </aside>
        )}

        <div style={styles.feedColumn}>
          {showPostComposer && (
            <div style={styles.postComposerCard}>
              <div style={styles.composerTop}>
                <div style={styles.composerAvatar}>
                  <PresenceAvatar
                    src={effectiveUser?.profilePicture || effectiveUser?.companyLogo}
                    alt={effectiveUser?.firstName || effectiveUser?.email || 'User'}
                    userId={effectiveUser?._id || effectiveUser?.id}
                    presenceMode={effectiveUser?.presenceMode || (effectiveUser?.isOnline ? 'online' : 'offline')}
                    initialIsOnline={!!effectiveUser?.isOnline}
                    lastActive={effectiveUser?.lastActive}
                    size={48}
                    style={{ width: '100%', height: '100%' }}
                    showLastActive={false}
                  />
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

          {showCombinedForYouFeed && (
            <>
              {forYouFeedItems.map((post) => (
                post.__feedType === "job" ? (
                  <div key={`job-${post.id}`} style={styles.xPostCard}>
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
                        <PresenceAvatar
                          src={post.employerAvatar}
                          alt={post.employerName || post.company || 'Employer'}
                          userId={post.createdById || getUserId(post.createdBy)}
                          presenceMode={post.employerPresenceMode || post.createdBy?.presenceMode || (post.createdBy?.isOnline ? 'online' : undefined)}
                          initialIsOnline={sameId(post.createdById || getUserId(post.createdBy), currentUserId) ? !!effectiveUser?.isOnline : !!post.createdBy?.isOnline}
                          lastActive={post.authorLastActive || post.createdBy?.lastActive}
                          size={48}
                          style={{ width: '100%', height: '100%' }}
                          showLastActive={false}
                        />
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
                        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                          {post.employmentType && (
                            <span style={{ fontSize: 12, padding: '4px 8px', borderRadius: 999, background: 'var(--surface-alt)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 600 }}>
                              {post.employmentType}
                            </span>
                          )}
                          {post.remoteType && (
                            <span style={{ fontSize: 12, padding: '4px 8px', borderRadius: 999, background: 'var(--surface-alt)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 600 }}>
                              {post.remoteType}
                            </span>
                          )}
                        </div>
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
                ) : (
                  <div key={`post-${post._id}`} style={styles.socialPostCard}>
                    <div style={styles.socialPostHeader}>
                      <div
                        style={{ ...styles.postAvatar, cursor: post.author ? 'pointer' : 'default' }}
                        onClick={() => {
                          const authorId = getUserId(post.author);
                          if (authorId) navigate(`/profile/${authorId}`);
                        }}
                      >
                        <PresenceAvatar
                          src={post.authorAvatar}
                          alt={post.authorName || 'User'}
                          userId={getUserId(post.author)}
                          presenceMode={post.authorPresenceMode || post.author?.presenceMode || (post.author?.isOnline ? 'online' : undefined)}
                          initialIsOnline={sameId(getUserId(post.author), currentUserId) ? !!effectiveUser?.isOnline : !!post.author?.isOnline}
                          lastActive={post.authorLastActive || post.author?.lastActive}
                          size={48}
                          style={{ width: '100%', height: '100%' }}
                          showLastActive={false}
                        />
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
                          <p style={{ ...styles.postMeta, margin: '2px 0 6px 0', color: '#1892aa', fontSize: '12px', textAlign: 'left' }}>
                            {post.authorEmail}
                          </p>
                        )}
                      </div>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                        {sameId(post.author, currentUserId) && (
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
                )
              ))}
            </>
          )}

          {!showCombinedForYouFeed && showPostSection && (
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

              {getDisplayedSocial().map((post) => (
                <div key={post._id} style={styles.socialPostCard}>
                  <div style={styles.socialPostHeader}>
                    <div
                      style={{ ...styles.postAvatar, cursor: post.author ? 'pointer' : 'default' }}
                      onClick={() => {
                        const authorId = getUserId(post.author);
                        if (authorId) navigate(`/profile/${authorId}`);
                      }}
                    >
                      <PresenceAvatar
                        src={post.authorAvatar}
                        alt={post.authorName || 'User'}
                        userId={getUserId(post.author)}
                        presenceMode={post.authorPresenceMode || post.author?.presenceMode || (post.author?.isOnline ? 'online' : undefined)}
                        initialIsOnline={sameId(getUserId(post.author), currentUserId) ? !!effectiveUser?.isOnline : !!post.author?.isOnline}
                        lastActive={post.authorLastActive || post.author?.lastActive}
                        size={48}
                        style={{ width: '100%', height: '100%' }}
                        showLastActive={false}
                      />
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
                        <p style={{ ...styles.postMeta, margin: '2px 0 6px 0', color: '#1892aa', fontSize: '12px', textAlign: 'left' }}>
                          {post.authorEmail}
                        </p>
                      )}
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                      {sameId(post.author, currentUserId) && (
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

          {!showCombinedForYouFeed && showJobSection && filteredPosts.map((post) => (
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
                  <PresenceAvatar
                    src={post.employerAvatar}
                    alt={post.employerName || post.company || 'Employer'}
                    userId={post.createdById || getUserId(post.createdBy)}
                    presenceMode={post.employerPresenceMode || post.createdBy?.presenceMode || (post.createdBy?.isOnline ? 'online' : undefined)}
                    initialIsOnline={sameId(post.createdById || getUserId(post.createdBy), currentUserId) ? !!effectiveUser?.isOnline : !!post.createdBy?.isOnline}
                    lastActive={post.authorLastActive || post.createdBy?.lastActive}
                    size={48}
                    style={{ width: '100%', height: '100%' }}
                    showLastActive={false}
                  />
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
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                    {post.employmentType && (
                      <span style={{ fontSize: 12, padding: '4px 8px', borderRadius: 999, background: 'var(--surface-alt)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 600 }}>
                        {post.employmentType}
                      </span>
                    )}
                    {post.remoteType && (
                      <span style={{ fontSize: 12, padding: '4px 8px', borderRadius: 999, background: 'var(--surface-alt)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 600 }}>
                        {post.remoteType}
                      </span>
                    )}
                  </div>
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
              <h3 style={styles.sidebarTitle}>Recommended for you</h3>
              <p style={styles.sidebarSubtitle}>Personalized picks and quick links</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
              <button style={styles.recoRow} onClick={() => navigate('/companies') }>
                <div style={styles.recoIconWrapper}><IconBox color="#dcfce7" /></div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700 }}>Top companies hiring</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Check out top companies hiring now</div>
                </div>
                <div style={styles.recoChevron}><ChevronRightIcon size={16} /></div>
              </button>

              <button style={styles.recoRow} onClick={() => navigate('/recommended-jobs') }>
                <div style={styles.recoIconWrapper}><BriefcaseIcon size={20} /></div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700 }}>Jobs you might like</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Personalized picks just for you</div>
                </div>
                <div style={styles.recoChevron}><ChevronRightIcon size={16} /></div>
              </button>

              <button style={styles.recoRow} onClick={() => navigate('/skills') }>
                <div style={styles.recoIconWrapper}><IconChart color="#fff7ed" /></div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700 }}>Skills in demand</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Explore most in-demand skills</div>
                </div>
                <div style={styles.recoChevron}><ChevronRightIcon size={16} /></div>
              </button>

              <button style={styles.recoRow} onClick={() => navigate('/saved-searches') }>
                <div style={styles.recoIconWrapper}><IconHeart color="#fff0f6" /></div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700 }}>Saved searches</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Quick access to your saved searches</div>
                </div>
                <div style={styles.recoChevron}><ChevronRightIcon size={16} /></div>
              </button>
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
          aria-label="Post Job"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14.06 4.94l3.75 3.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <span style={styles.fabText}>Post job</span>
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
        <div className="modal-overlay" style={styles.modalOverlay} onClick={closeJobModal}>
          <div className="modal-card" style={{ ...styles.modalCard, position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...styles.modalHeader, alignItems: 'center', justifyContent: 'flex-start', position: 'relative' }}>
              <h2 style={{ margin: 0, color: 'var(--text-h)', fontSize: 18, fontWeight: 800, textAlign: 'left', flex: 1 }}>{translatingModalTitle ? modalJob.title : (translatedModalTitle || modalJob.title)}</h2>
              <button style={{ ...styles.modalClose, position: 'absolute', right: 12, top: 8 }} onClick={closeJobModal}>✕</button>
            </div>

            {/* Author row like social post modal */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
              <div
                style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, cursor: modalJob.createdBy?._id ? 'pointer' : 'default' }}
                onClick={() => { const authorId = getUserId(modalJob.createdBy); if (authorId) navigate(`/profile/${authorId}`); }}
              >
                <PresenceAvatar
                  src={modalJob.createdBy?.companyLogo && modalJob.createdBy?.role === 'employer' ? modalJob.createdBy.companyLogo : modalJob.createdBy?.profilePicture}
                  alt={modalJob.createdBy?.companyName || modalJob.createdBy?.firstName || 'Employer'}
                  userId={modalJob.createdBy?._id || modalJob.createdBy?.id}
                  presenceMode={modalJob.createdBy?.presenceMode || (modalJob.createdBy?.isOnline ? 'online' : undefined)}
                  initialIsOnline={sameId(getUserId(modalJob.createdBy), currentUserId) ? !!effectiveUser?.isOnline : !!modalJob.createdBy?.isOnline}
                  lastActive={modalJob.createdBy?.lastActive}
                  size={44}
                  style={{ width: '100%', height: '100%' }}
                  showLastActive={false}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-h)' }}>{modalJob.createdBy?.companyName || modalJob.companyName || modalJob.createdBy?.firstName || 'Employer'}</div>
                  {modalJob.createdBy?.role && <div style={{ fontSize: 12, color: 'var(--text)', padding: '2px 8px', borderRadius: 12, background: 'var(--surface-alt)' }}>{modalJob.createdBy.role}</div>}
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ color: '#1892aa', fontSize: 13 }}>{modalJob.createdBy?.email || modalJob.employerEmail || 'No email'}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>{formatDateMonthDay(modalJob.createdAt)}</div>
                </div>
              </div>
            </div>

            <div style={{ ...styles.modalBody, color: 'var(--text)', textAlign: 'left' }}>
              <p style={{ ...styles.postText, color: 'var(--text)', marginBottom: '18px' }}>{translatingModalDescription ? modalJob.description : (translatedModalDescription || modalJob.description)}</p>
              {modalJob.media?.data && (
                <div style={{ marginBottom: 18, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
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
                      background: 'var(--surface-alt)',
                      color: 'var(--primary)',
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Buksan ang link ng trabaho
                  </a>
                </div>
              )}
              {modalJob.location && (
                <div style={{ marginBottom: 18, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <iframe
                    title="Mapa ng lokasyon"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(modalJob.location)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                    style={{ width: '100%', height: 260, border: 0 }}
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              )}
              <h4 style={{ color: 'var(--text-h)', marginBottom: '12px', marginTop: 0 }}>Mga Kailangan</h4>
              {renderBulletList(modalJob.requirements, { color: 'var(--text)', marginBottom: '18px' }) || (
                <p style={{ ...styles.postText, color: 'var(--text)', marginBottom: '18px' }}>
                  Walang ibinigay na requirements.
                </p>
              )}

              <h4 style={{ color: 'var(--text-h)', marginBottom: '12px', marginTop: 0 }}>Detalye</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: 'var(--text)' }}>
                <li style={{ marginBottom: '10px' }}>Sahod: {formatSalaryText(modalJob)}</li>
                {modalJob.employmentType && <li style={{ marginBottom: '10px' }}>Uri ng trabaho: {modalJob.employmentType}</li>}
                {modalJob.remoteType && <li style={{ marginBottom: '10px' }}>Work setup: {modalJob.remoteType}</li>}
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
                style={!isJobseeker ? { display: 'flex', alignItems: 'center', gap: '6px', ...styles.actionButton, opacity: 0.5, cursor: 'not-allowed' } : { display: 'flex', alignItems: 'center', gap: '6px', ...styles.actionButton }}
                onClick={() => handleToggleLike(modalJob._id)}
                disabled={jobActionLoading || !isJobseeker}
                title={!isJobseeker ? 'Only jobseekers can like jobs' : t('browse.likeJobTitle')}
              >
                <HeartIcon filled={modalJob.likes?.some((id) => id.toString() === currentUserId?.toString())} size={16} />
                <span>{modalJob.likes?.length || 0}</span>
              </button>
              <button
                style={!isJobseeker ? { ...styles.actionButton, opacity: 0.5, cursor: 'not-allowed' } : styles.actionButton}
                onClick={() => openApplyModal(modalJob)}
                disabled={jobActionLoading || !isJobseeker}
                title={!isJobseeker
                  ? currentUser?.role === 'employer'
                    ? t('browse.applyButtonTitleEmployer')
                    : 'Switch to a jobseeker account to apply.'
                  : t('browse.applyNow')}
              >
                {!isJobseeker ? t('browse.applyButtonTitleEmployer') : t('browse.applyNow')}
              </button>
              <button style={styles.actionButton} onClick={() => { navigator.share ? navigator.share({ title: modalJob.title, text: modalJob.description }) : alert(modalJob.title + '\n' + modalJob.description); }}>
                {t('browse.share')}
              </button>
            </div>
            {/* Bottom comment input bar */}
            <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center', background: 'transparent' }}>
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
                style={{ flex: 1, padding: '10px 14px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface-alt)', color: 'var(--text)' }}
              />
              <button
                onClick={handleJobComment}
                disabled={!commentText.trim()}
                style={{ background: 'transparent', border: 'none', color: commentText.trim() ? 'var(--primary)' : 'var(--muted)', fontSize: 18, cursor: commentText.trim() ? 'pointer' : 'not-allowed' }}
                title={t('browse.postAnswerTitle')}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}

      {showApplyModal && applyJobInfo && (
        <div className="modal-overlay" style={styles.modalOverlay} onClick={closeApplyModal}>
          <div className="modal-card" style={{ ...styles.modalCard, ...styles.applyModalCard, maxWidth: '760px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              ...styles.modalHeader,
              background: 'linear-gradient(135deg, var(--primary) 0%, rgba(var(--primary-rgb), 0.8) 100%)',
              borderBottom: 'none',
              paddingBottom: '24px',
              paddingTop: '24px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{
                  margin: 0,
                  color: 'var(--primary)',
                  fontSize: '22px',
                  fontWeight: '800'
                }}>
                  {applyStep === 1 ? (t('browse.applicationReviewTitle') || 'Review Job Details') : (t('browse.applicationCoverLetterTitle') || 'Write Your Cover Letter')}
                </h2>
                <p style={{
                  color: 'var(--text-muted)',
                  marginTop: '8px',
                  marginBottom: '0',
                  fontSize: '13px',
                  fontWeight: '500',
                  letterSpacing: '0.3px'
                }}>
                  {applyJobInfo.companyName || applyJobInfo.company || applyJobInfo.employerName || t('browse.company')} · {applyJobInfo.location || t('browse.remote')}
                </p>
                <div style={{ marginTop: '10px', display: 'inline-flex', gap: '8px', padding: '6px 12px', borderRadius: '999px', background: 'rgba(var(--primary-rgb),0.12)', color: 'var(--primary)', fontSize: '12px', fontWeight: 700 }}>
                  <span>{applyStep === 1 ? 'Step 1 of 2' : 'Step 2 of 2'}</span>
                </div>
              </div>
            </div>

            <div style={styles.modalBody}>
              {applyStep === 1 ? (
                <div style={styles.applyVerticalGrid}>
                  <div style={{
                    background: 'var(--surface-alt)',
                    borderRadius: '14px',
                    padding: '20px',
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
                      <div style={{ width: '58px', height: '58px', borderRadius: '16px', overflow: 'hidden', background: 'var(--primary)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: '24px', fontWeight: 800 }}>
                        {applyJobInfo?.createdBy?.companyLogo ? (
                          <img src={applyJobInfo.createdBy.companyLogo} alt={getCompanyDisplayName(applyJobInfo)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span>{(applyJobInfo.companyName || applyJobInfo.company || applyJobInfo.employerName || 'E').charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-h)' }}>{applyJobInfo.title || applyJobInfo.role || t('browse.applyModalDefaultTitle')}</p>
                        <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>{applyJobInfo.companyName || applyJobInfo.company || applyJobInfo.employerName || t('browse.company')} · {applyJobInfo.location || t('browse.remote')}</p>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.8, color: 'var(--text)' }}>{applyJobInfo.description || t('browse.noDescriptionProvided')}</p>
                  </div>

                  <div style={{
                    background: 'var(--surface-alt)',
                    borderRadius: '14px',
                    padding: '20px',
                    border: '1px solid var(--border)',
                  }}>
                    <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-h)', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: '0.9' }}>{t('browse.requirements')}</p>
                    {renderBulletList(applyJobInfo.requirements, { color: 'var(--text)' }) || (
                      <p style={{ margin: 0, lineHeight: 1.8, color: 'var(--text)' }}>{applyJobInfo.details?.join(', ') || t('browse.noRequirementsProvided')}</p>
                    )}
                  </div>

                  <div style={{
                    background: 'var(--surface-alt)',
                    borderRadius: '14px',
                    padding: '20px',
                    border: '1px solid var(--border)',
                  }}>
                    <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-h)', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: '0.9' }}>{t('browse.companyInformation')}</p>
                    <div style={{ display: 'grid', gap: '10px', color: 'var(--text)' }}>
                      <div><strong>{t('browse.employer') || 'Employer'}:</strong> {applyJobInfo.createdBy?.firstName ? `${applyJobInfo.createdBy.firstName} ${applyJobInfo.createdBy.lastName}` : applyJobInfo.companyName || applyJobInfo.company || t('browse.employer')}</div>
                      <div><strong>{t('browse.email') || 'Email'}:</strong> {applyJobInfo.createdBy?.email || applyJobInfo.employerEmail || t('browse.notProvided')}</div>
                      {applyJobInfo.createdBy?.companyName && <div><strong>{t('browse.company') || 'Company'}:</strong> {applyJobInfo.createdBy.companyName}</div>}
                      <div><strong>{t('browse.location') || 'Location'}:</strong> {applyJobInfo.location || t('browse.remote')}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={styles.applyVerticalGrid}>
                  <div style={{
                    background: 'var(--surface-alt)',
                    borderRadius: '14px',
                    padding: '20px',
                    border: '1px solid var(--border)',
                  }}>
                    <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-h)', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: '0.9' }}>{t('browse.yourProfile') || 'Your Profile'}</p>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '52px', height: '52px', borderRadius: '50%', overflow: 'hidden', background: 'var(--primary)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: '18px' }}>
                        {effectiveUser?.profilePicture ? (
                          <img src={effectiveUser.profilePicture} alt={effectiveUser?.firstName || 'Profile'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span>{effectiveUser?.firstName?.charAt(0) || effectiveUser?.email?.charAt(0) || 'U'}</span>
                        )}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-h)' }}>{effectiveUser?.firstName || effectiveUser?.email ? `${effectiveUser?.firstName || ''} ${effectiveUser?.lastName || ''}`.trim() : (t('browse.jobseeker') || 'Jobseeker')}</p>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>{effectiveUser?.email || t('browse.notProvided')}</p>
                      </div>
                    </div>

                    <div style={{ marginTop: '18px', background: 'var(--surface)', borderRadius: '14px', padding: '14px', border: '1px solid var(--border)' }}>
                      <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '700', color: 'var(--text-h)' }}>{t('browse.resumePreview') || 'Resume Preview'}</p>
                      {getUserProfileSummary(effectiveUser).length ? (
                        <div style={{ display: 'grid', gap: '10px' }}>
                          {getUserProfileSummary(effectiveUser).map((item) => (
                            <div key={item.label} style={{ color: 'var(--text)', fontSize: '14px', lineHeight: 1.6 }}>
                              <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-h)' }}>{item.label}</span>
                              {item.link ? (
                                <a href={item.link} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>{item.value}</a>
                              ) : (
                                <span>{item.value}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text)', fontSize: '14px', lineHeight: 1.6 }}>{t('browse.noResumeFound') || 'No resume found'}</div>
                      )}
                    </div>
                  </div>

                  <div style={{
                    background: 'var(--surface-alt)',
                    borderRadius: '14px',
                    padding: '20px',
                    border: '1px solid var(--border)',
                  }}>
                    <label htmlFor="coverLetter" style={{ display: 'block', marginBottom: '12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-h)' }}>{t('browse.coverLetter') || 'Cover Letter'}</label>
                    <textarea
                      id="coverLetter"
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder={t('browse.coverLetterPlaceholder') || 'Write a few lines about why this role is a strong fit for you...'}
                      style={{ width: '100%', minHeight: '160px', borderRadius: '16px', border: '1px solid var(--border)', padding: '16px', fontSize: '14px', color: 'var(--text)', background: 'var(--surface)', resize: 'vertical', outline: 'none' }}
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '14px', alignItems: 'center' }}>
                      <label htmlFor="coverLetterStyle" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-h)', whiteSpace: 'nowrap' }}>
                        {t('browse.coverLetterStyleLabel') || 'Rephrase style:'}
                      </label>
                      <select
                        id="coverLetterStyle"
                        value={coverLetterStyle}
                        onChange={(e) => setCoverLetterStyle(e.target.value)}
                        style={{ borderRadius: '12px', border: '1px solid var(--border)', padding: '10px 14px', minWidth: '180px', background: 'var(--surface)', color: 'var(--text)' }}
                      >
                        <option value="professional">{t('browse.professional') || 'Professional'}</option>
                        <option value="formal">{t('browse.formal') || 'Formal'}</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '14px', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={handleAutoCorrectCoverLetter}
                        disabled={isAutoCorrecting || isRephrasing || isTranslating || !coverLetter.trim()}
                        style={{
                          borderRadius: '10px',
                          border: '1px solid var(--primary)',
                          background: isAutoCorrecting ? 'rgba(var(--primary-rgb),0.12)' : 'var(--surface)',
                          color: 'var(--primary)',
                          padding: '12px 18px',
                          fontWeight: 700,
                          cursor: coverLetter.trim() && !isAutoCorrecting && !isRephrasing && !isTranslating ? 'pointer' : 'not-allowed'
                        }}
                      >
                        {isAutoCorrecting ? (t('browse.correcting') || 'Correcting...') : (t('browse.autoCorrect') || 'Auto-correct')}
                      </button>
                      <button
                        type="button"
                        onClick={handleRephraseCoverLetter}
                        disabled={isAutoCorrecting || isRephrasing || isTranslating || !coverLetter.trim()}
                        style={{
                          borderRadius: '10px',
                          border: '1px solid var(--primary)',
                          background: isRephrasing ? 'rgba(var(--primary-rgb),0.12)' : 'var(--surface)',
                          color: 'var(--primary)',
                          padding: '12px 18px',
                          fontWeight: 700,
                          cursor: coverLetter.trim() && !isAutoCorrecting && !isRephrasing && !isTranslating ? 'pointer' : 'not-allowed'
                        }}
                      >
                        {isRephrasing ? (t('browse.rephrasing') || 'Rephrasing...') : (t('browse.rephrase') || 'Rephrase')}
                      </button>
                      <button
                        type="button"
                        onClick={handleTranslateCoverLetter}
                        disabled={isAutoCorrecting || isRephrasing || isTranslating || !coverLetter.trim()}
                        style={{
                          borderRadius: '10px',
                          border: '1px solid var(--primary)',
                          background: isTranslating ? 'rgba(var(--primary-rgb),0.12)' : 'var(--surface)',
                          color: 'var(--primary)',
                          padding: '12px 18px',
                          fontWeight: 700,
                          cursor: coverLetter.trim() && !isAutoCorrecting && !isRephrasing && !isTranslating ? 'pointer' : 'not-allowed'
                        }}
                      >
                        {isTranslating ? (t('browse.translating') || 'Translating...') : (t('browse.translateToEnglish') || 'Translate to English')}
                      </button>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px', flex: '1 1 240px' }}>{t('browse.coverLetterHelp') || 'Auto-correct grammar or rephrase the letter before sending.'}</span>
                    </div>
                  </div>
                </div>
              )}

              {applyError && <p style={{ color: '#b91c1c', margin: '14px 0 0' }}>{applyError}</p>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', margin: '20px 20px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <button
                style={{
                  ...styles.secondaryButton,
                  borderRadius: '8px',
                  padding: '12px 28px',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.3s',
                  border: '1.5px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-h)',
                  cursor: 'pointer'
                }}
                onClick={applyStep === 1 ? closeApplyModal : goToReviewStep}
              >
                {applyStep === 1 ? (t('browse.cancel') || 'Cancel') : (t('browse.back') || 'Back')}
              </button>
              <button
                style={{
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--primary)',
                  color: '#ffffff',
                  padding: '12px 32px',
                  fontWeight: '700',
                  cursor: jobActionLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  opacity: jobActionLoading ? '0.7' : '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  minWidth: '160px',
                  boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.3)',
                  letterSpacing: '0.3px'
                }}
                onClick={applyStep === 1 ? goToCoverLetterStep : confirmApply}
                disabled={applyStep === 2 ? jobActionLoading : false}
              >
                {applyStep === 1
                  ? (t('browse.next') || 'Next')
                  : (jobActionLoading ? '⏳ Applying...' : `✓ ${t('browse.confirmApplication') || 'Confirm Application'}`)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="modal-overlay" style={styles.modalOverlay} onClick={() => setShowLocationModal(false)}>
          <div className="modal-card" style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
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
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "800",
    marginBottom: "2px",
    letterSpacing: "-0.5px",
    textAlign: "center",
  },
  subtitle: {
    fontSize: "12px",
    lineHeight: "1.4",
    maxWidth: "760px",
    color: "var(--text-muted)",
    marginBottom: "8px",
    textAlign: "center",
  },
  tabs: {
    display: "flex",
    gap: "0",
    flexWrap: "nowrap",
    marginBottom: "0",
    borderBottom: "1px solid var(--border)",
    marginLeft: "0",
    marginRight: "0",
    paddingLeft: "0",
    overflowX: "auto",
    justifyContent: "center",
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
    display: "flex",
    justifyContent: "center",
  },
  searchInput: {
    width: "640px",
    maxWidth: "100%",
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
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
    gap: "8px",
    marginTop: "12px",
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
  premiumButton: {
    padding: "8px 14px",
    borderRadius: "20px",
    border: "1px solid var(--primary)",
    background: "var(--surface-alt)",
    color: "var(--primary)",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
    flexShrink: 0,
  },
  premiumActiveButton: {
    padding: "8px 14px",
    borderRadius: "20px",
    border: "1px solid #0f766e",
    background: "rgba(15, 118, 110, 0.12)",
    color: "#0f766e",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "default",
    flexShrink: 0,
  },
  aiHintRow: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    width: "100%",
    gap: "4px",
    marginTop: "6px",
    paddingLeft: "4px",
  },
  aiHintText: {
    fontSize: "11px",
    color: "var(--text-muted)",
  },
  aiErrorText: {
    fontSize: "11px",
    color: "#dc2626",
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
  jobFilterColumn: {
    display: "grid",
    gap: "16px",
    maxWidth: "320px",
    paddingRight: "20px",
    position: "sticky",
    top: "24px",
    alignSelf: "flex-start",
  },
  jobFilterCard: {
    background: "var(--surface-alt)",
    borderRadius: "28px",
    padding: "24px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    display: "grid",
    gap: "18px",
    boxShadow: "0 24px 60px rgba(0, 0, 0, 0.08)",
    minWidth: 0,
  },
  filterHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  filterSubtitle: {
    margin: "6px 0 0 0",
    fontSize: "12px",
    color: "var(--text-muted)",
  },
  clearFiltersButton: {
    border: "none",
    background: "transparent",
    color: "var(--primary)",
    fontWeight: "700",
    cursor: "pointer",
    padding: "8px 10px",
    borderRadius: "12px",
    fontSize: "13px",
  },
  jobFilterTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "800",
    color: "var(--text)",
  },
  jobFilterSection: {
    display: "grid",
    gap: "10px",
  },
  jobFilterLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  jobFilterInput: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "18px",
    border: "1px solid var(--border)",
    background: "var(--surface-alt)",
    color: "var(--text)",
    fontSize: "14px",
    outline: "none",
  },
  jobFilterSelect: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "18px",
    border: "1px solid var(--border)",
    background: "var(--surface-alt)",
    color: "var(--text)",
    fontSize: "14px",
    outline: "none",
    cursor: "pointer",
  },
  checkboxGrid: {
    display: "grid",
    gap: "10px",
  },
  filterPillRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  filterPill: {
    borderRadius: "999px",
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--text)",
    padding: "10px 14px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    outline: "none",
    transition: "all 0.2s ease",
  },
  filterPillCompact: {
    padding: "8px 12px",
  },
  filterPillActive: {
    background: "var(--primary)",
    color: "#ffffff",
    borderColor: "transparent",
    boxShadow: "0 10px 24px rgba(79, 110, 255, 0.16)",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
    color: "var(--text)",
    fontWeight: "600",
    cursor: "pointer",
  },
  checkboxInput: {
    width: "16px",
    height: "16px",
    accentColor: "var(--primary)",
  },
  salaryRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    fontSize: "12px",
    color: "var(--text-muted)",
  },
  salaryValue: {
    fontWeight: "700",
    color: "var(--text)",
  },
  salarySlider: {
    width: "100%",
    marginTop: "8px",
    accentColor: "var(--primary)",
  },
  applyFiltersButton: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "18px",
    border: "none",
    background: "var(--primary)",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
    transition: "transform 0.2s, opacity 0.2s",
  },
  moreFiltersButton: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "16px",
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--text)",
    fontWeight: "700",
    cursor: "pointer",
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
  secondaryButton: {
    borderRadius: "8px",
    border: "1px solid var(--border)",
    background: "var(--surface-alt)",
    color: "var(--text)",
    padding: "10px 20px",
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
  recoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 12px',
    borderRadius: 12,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
  },
  recoIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 10,
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
  },
  recoChevron: {
    marginLeft: 'auto',
    color: 'var(--text-muted)'
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
    maxHeight: "calc(90vh - 160px)",
    overflowY: "auto",
    padding: "24px",
    flex: 1,
    background: 'var(--surface)',
  },
  modalActions: {
    display: "flex",
    gap: "10px",
    padding: "12px 20px",
    borderTop: "1px solid var(--border)",
    flexShrink: 0,
  },
  applyModalCard: {
    width: "min(800px, 90vw)",
    maxWidth: "100%",
    maxHeight: "90vh",
    borderRadius: "20px",
    padding: "0",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    border: "1px solid var(--border)",
  },
  applyVerticalGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "20px",
    alignItems: "start",
  },
  applySectionHeader: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
  },
  applyProfileSection: {
    display: "flex",
    gap: "18px",
    alignItems: "flex-start",
    paddingBottom: "0",
    borderBottom: "none",
  },
  applyProfileInfo: {
    display: "grid",
    gap: "6px",
    minWidth: 0,
  },
  companyBadge: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "var(--primary)",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    fontSize: "18px",
    flexShrink: 0,
    boxShadow: "0 4px 12px rgba(var(--primary-rgb), 0.2)",
  },
  applyInfoSection: {
    background: "linear-gradient(135deg, rgba(var(--primary-rgb), 0.05) 0%, rgba(var(--primary-rgb), 0.02) 100%)",
    borderRadius: "12px",
    padding: "18px",
    display: "grid",
    gap: "0",
    border: "1px solid var(--border)",
  },
  applyInfoTitle: {
    margin: 0,
    fontSize: "13px",
    fontWeight: "700",
    color: "var(--text-h)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    opacity: "0.8",
  },
  applyInfoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    color: "var(--text-muted)",
    fontSize: "13px",
    lineHeight: 1.6,
  },
  "applyInfoRow:last-child": {
    borderBottom: "none",
    paddingBottom: "0",
  },
  applySidebar: {
    display: "grid",
    gap: "18px",
  },
  fab: {
    position: "fixed",
    right: "24px",
    bottom: "24px",
    minWidth: "170px",
    height: "54px",
    padding: "0 18px",
    borderRadius: "999px",
    background: "linear-gradient(135deg, #4f6cff, #19c6ff)",
    color: "#ffffff",
    border: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 18px 40px rgba(44, 104, 255, 0.24)",
    zIndex: 2000,
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  fabText: {
    display: "inline-block",
    lineHeight: 1,
    letterSpacing: "0.01em",
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
    background: "linear-gradient(135deg, #1892aa 0%, #1892aa 100%)",
    color: "white",
    padding: "14px 16px",
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(29, 78, 216, 0.4)",
    animation: "slideIn 0.3s ease-out",
    border: "1px solid rgba(255,255,255,0.1)",
  },
};

