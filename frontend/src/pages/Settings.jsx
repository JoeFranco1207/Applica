import { useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../contexts/ThemeContext";
import "./Settings.css";

// API base URL fallback if Vite env var is not set
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Icon Components
const AccountIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SecurityIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const PaletteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a9.5 9.5 0 0 1 8.11 4.73" />
    <path d="M20 12a8 8 0 0 1-2.27 5.54" />
    <path d="M14 20a9.5 9.5 0 0 1-7.27-1.36" />
    <path d="M4 14a8 8 0 0 1 2.27-5.54" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const LinkIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const FileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <polyline points="13 2 13 9 20 9" />
  </svg>
);

const CreditCardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const HelpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

const CrownIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const Settings = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState("account");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState(isDarkMode ? "dark" : "light");
  const [language, setLanguage] = useState("en");
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockUserEmail, setBlockUserEmail] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] = useState("free");
  const [resumes, setResumes] = useState([]);
  const [resumeFile, setResumeFile] = useState(null);
  const [supportTickets, setTickets] = useState([]);
  const [originalPrivacyData, setOriginalPrivacyData] = useState({});
  const [privacyChanged, setPrivacyChanged] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [notificationData, setNotificationData] = useState({
    jobAlerts: true,
    applicationUpdates: true,
    jobRecommendations: true,
    interviewRequests: true,
    messages: true,
    marketingTips: false,
    pushNotifications: true,
    soundEffects: true,
    vibration: true,
    emailDigest: 'weekly',
  });
  const [originalNotificationData, setOriginalNotificationData] = useState(notificationData);
  const [notificationChanged, setNotificationChanged] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [appearanceData, setAppearanceData] = useState({
    themePreference: isDarkMode ? 'dark' : 'light',
    compactView: false,
    fontSize: 'normal',
    animationsEnabled: true,
  });
  const [originalAppearanceData, setOriginalAppearanceData] = useState(appearanceData);
  const [appearanceChanged, setAppearanceChanged] = useState(false);
  const [savingAppearance, setSavingAppearance] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState({
    linkedin: false,
    github: false,
    google: false,
    facebook: false,
  });
  const [savingConnections, setSavingConnections] = useState(false);
  const [billingHistory, setBillingHistory] = useState([]);
  const [billingPlan, setBillingPlan] = useState('free');
  const [savingBilling, setSavingBilling] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [helpSubject, setHelpSubject] = useState('');
  const [helpMessage, setHelpMessage] = useState('');
  const [savingTicket, setSavingTicket] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    profession: "",
    location: "",
    profileVisibility: "public",
    showActivityStatus: true,
    allowMessages: true,
    showProfileInSearch: true,
    jobAlerts: true,
    applicationUpdates: true,
    messages: true,
    marketingTips: false,
    pushNotifications: true,
    emailDigest: "weekly",
  });

  const formatPeso = (amountCents) => {
    try {
      const amount = Number(amountCents || 0) / 100;
      return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
    } catch (err) {
      return `₱${(amountCents/100).toFixed(2)}`;
    }
  };

  // Helper function to format location from object
  const formatLocation = (location) => {
    if (typeof location === "string") return location;
    if (typeof location === "object" && location) {
      const parts = [];
      if (location.city) parts.push(location.city);
      if (location.region) parts.push(location.region);
      if (location.country) parts.push(location.country);
      return parts.join(", ");
    }
    return "";
  };

  const splitFullName = (fullName = "") => {
    const name = String(fullName || "").trim();
    if (!name) return { firstName: "", lastName: "" };
    const parts = name.split(/\s+/);
    return {
      firstName: parts.shift() || "",
      lastName: parts.join(" ") || "",
    };
  };


  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        
        // Set initial data from localStorage
        setUser(storedUser);
        const formattedLocation = formatLocation(storedUser.location);
        
        setFormData((prev) => ({
          ...prev,
          fullName: storedUser.firstName && storedUser.lastName 
            ? `${storedUser.firstName} ${storedUser.lastName}` 
            : storedUser.fullName || "",
          email: storedUser.email || "",
          profession: storedUser.profession || "",
          location: formattedLocation || "",
          profileVisibility: storedUser.profileVisibility || "public",
          showActivityStatus: storedUser.showActivityStatus !== false,
          allowMessages: storedUser.allowMessages !== false,
          showProfileInSearch: storedUser.showProfileInSearch !== false,
          jobAlerts: storedUser.jobAlerts !== false,
          applicationUpdates: storedUser.applicationUpdates !== false,
          messages: storedUser.messages !== false,
          marketingTips: storedUser.marketingTips || false,
          pushNotifications: storedUser.pushNotifications !== false,
          emailDigest: storedUser.emailDigest || "weekly",
        }));

        setLanguage(storedUser.languagePreference || "en");
        setTheme(storedUser.themePreference || (isDarkMode ? "dark" : "light"));
        setAppearanceData((prev) => ({
          ...prev,
          themePreference: storedUser.themePreference || (isDarkMode ? "dark" : "light"),
          compactView: storedUser.compactView || false,
          fontSize: storedUser.fontSize || "normal",
          animationsEnabled: storedUser.animationsEnabled !== false,
        }));
        setOriginalAppearanceData((prev) => ({
          ...prev,
          themePreference: storedUser.themePreference || (isDarkMode ? "dark" : "light"),
          compactView: storedUser.compactView || false,
          fontSize: storedUser.fontSize || "normal",
          animationsEnabled: storedUser.animationsEnabled !== false,
        }));

        setNotificationData({
          jobAlerts: storedUser.jobAlerts !== false,
          applicationUpdates: storedUser.applicationUpdates !== false,
          jobRecommendations: storedUser.jobRecommendations !== false,
          interviewRequests: storedUser.interviewRequests !== false,
          messages: storedUser.messages !== false,
          marketingTips: storedUser.marketingTips || false,
          pushNotifications: storedUser.pushNotifications !== false,
          soundEffects: storedUser.soundEffects !== false,
          vibration: storedUser.vibration !== false,
          emailDigest: storedUser.emailDigest || "weekly",
        });
        setOriginalNotificationData({
          jobAlerts: storedUser.jobAlerts !== false,
          applicationUpdates: storedUser.applicationUpdates !== false,
          jobRecommendations: storedUser.jobRecommendations !== false,
          interviewRequests: storedUser.interviewRequests !== false,
          messages: storedUser.messages !== false,
          marketingTips: storedUser.marketingTips || false,
          pushNotifications: storedUser.pushNotifications !== false,
          soundEffects: storedUser.soundEffects !== false,
          vibration: storedUser.vibration !== false,
          emailDigest: storedUser.emailDigest || "weekly",
        });

        setConnectedAccounts({
          linkedin: storedUser.connectedAccounts?.linkedin || false,
          github: storedUser.connectedAccounts?.github || false,
          google: storedUser.connectedAccounts?.google || false,
          facebook: storedUser.connectedAccounts?.facebook || false,
        });
        setBillingPlan(storedUser.premiumPlan || "free");
        setBillingHistory(storedUser.billingHistory || []);
        setResumes(storedUser.resumes || (storedUser.resume ? [{
          id: storedUser.resume,
          fileName: storedUser.resume.split('/').pop(),
          url: storedUser.resume,
          uploadedAt: new Date().toLocaleDateString(),
          default: true,
        }] : []));
        setTickets(storedUser.supportTickets || []);

        // Try to fetch fresh data from API
        if (token) {
          try {
            const response = await axios.get(
              `${API_BASE}/api/auth/profile`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            
            // Update with API response if available
            if (response.data && (response.data.user || response.data.data)) {
              const userData = response.data.user || response.data.data;
              setUser(userData);
              const apiFormattedLocation = formatLocation(userData.location);
              
              setFormData((prev) => ({
                ...prev,
                fullName: userData.firstName && userData.lastName 
                  ? `${userData.firstName} ${userData.lastName}` 
                  : userData.fullName || prev.fullName,
                email: userData.email || prev.email,
                profession: userData.profession || prev.profession,
                location: apiFormattedLocation || prev.location,
                profileVisibility: userData.profileVisibility || prev.profileVisibility,
                showActivityStatus: userData.showActivityStatus !== false,
                allowMessages: userData.allowMessages !== false,
                showProfileInSearch: userData.showProfileInSearch !== false,
                jobAlerts: userData.jobAlerts !== false,
                applicationUpdates: userData.applicationUpdates !== false,
                messages: userData.messages !== false,
                marketingTips: userData.marketingTips || false,
                pushNotifications: userData.pushNotifications !== false,
                emailDigest: userData.emailDigest || prev.emailDigest,
              }));
              
              setLanguage(userData.languagePreference || "en");
              setTheme(userData.themePreference || (isDarkMode ? "dark" : "light"));
              setAppearanceData({
                themePreference: userData.themePreference || (isDarkMode ? "dark" : "light"),
                compactView: userData.compactView || false,
                fontSize: userData.fontSize || "normal",
                animationsEnabled: userData.animationsEnabled !== false,
              });
              setOriginalAppearanceData({
                themePreference: userData.themePreference || (isDarkMode ? "dark" : "light"),
                compactView: userData.compactView || false,
                fontSize: userData.fontSize || "normal",
                animationsEnabled: userData.animationsEnabled !== false,
              });

              setNotificationData({
                jobAlerts: userData.jobAlerts !== false,
                applicationUpdates: userData.applicationUpdates !== false,
                jobRecommendations: userData.jobRecommendations !== false,
                interviewRequests: userData.interviewRequests !== false,
                messages: userData.messages !== false,
                marketingTips: userData.marketingTips || false,
                pushNotifications: userData.pushNotifications !== false,
                soundEffects: userData.soundEffects !== false,
                vibration: userData.vibration !== false,
                emailDigest: userData.emailDigest || prev.emailDigest,
              });
              setOriginalNotificationData({
                jobAlerts: userData.jobAlerts !== false,
                applicationUpdates: userData.applicationUpdates !== false,
                jobRecommendations: userData.jobRecommendations !== false,
                interviewRequests: userData.interviewRequests !== false,
                messages: userData.messages !== false,
                marketingTips: userData.marketingTips || false,
                pushNotifications: userData.pushNotifications !== false,
                soundEffects: userData.soundEffects !== false,
                vibration: userData.vibration !== false,
                emailDigest: userData.emailDigest || prev.emailDigest,
              });

              setConnectedAccounts({
                linkedin: userData.connectedAccounts?.linkedin || false,
                github: userData.connectedAccounts?.github || false,
                google: userData.connectedAccounts?.google || false,
                facebook: userData.connectedAccounts?.facebook || false,
              });
              setBillingPlan(userData.premiumPlan || "free");
              setBillingHistory(userData.billingHistory || []);
              setResumes(userData.resumes || (userData.resume ? [{
                id: userData.resume,
                fileName: userData.resume.split('/').pop(),
                url: userData.resume,
                uploadedAt: new Date().toLocaleDateString(),
                default: true,
              }] : []));
              setTickets(userData.supportTickets || []);

              // If the user is a jobseeker, default the active tab to Resume
              if (userData.role === 'jobseeker') {
                setActiveTab('resume');
              }

              // Store original privacy settings for comparison
              setOriginalPrivacyData({
                profileVisibility: userData.profileVisibility || "public",
                showActivityStatus: userData.showActivityStatus !== false,
                allowMessages: userData.allowMessages !== false,
                showProfileInSearch: userData.showProfileInSearch !== false,
                jobAlerts: userData.jobAlerts !== false,
                applicationUpdates: userData.applicationUpdates !== false,
                messages: userData.messages !== false,
                marketingTips: userData.marketingTips || false,
                pushNotifications: userData.pushNotifications !== false,
                emailDigest: userData.emailDigest || "weekly",
              });
            }
          } catch (error) {
            console.error("Error fetching fresh user data:", error);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggle = (field) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [field]: !prev[field],
      };
      
      // Check if any privacy setting has changed from original
      const privacyFields = [
        "profileVisibility",
        "showActivityStatus",
        "allowMessages",
        "showProfileInSearch",
        "jobAlerts",
        "applicationUpdates",
        "messages",
        "marketingTips",
        "pushNotifications",
        "emailDigest",
      ];
      
      const hasChanges = privacyFields.some(
        (privacyField) => updated[privacyField] !== originalPrivacyData[privacyField]
      );
      setPrivacyChanged(hasChanges);
      
      return updated;
    });
  };

  // helper to save any user settings to backend (resilient to missing storedUser._id)
  const saveUserSettings = async (updateData) => {
    const token = localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const id = storedUser?._id;
    const payload = { ...updateData };

    if (typeof payload.fullName === "string") {
      const { firstName, lastName } = splitFullName(payload.fullName);
      delete payload.fullName;
      payload.firstName = firstName;
      payload.lastName = lastName;
    }

    const url = `${API_BASE}/api/auth/profile${id ? `/${id}` : ""}`;
    return axios.put(url, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  const handleSavePrivacySettings = async () => {
    try {
      setSavingPrivacy(true);
      const token = localStorage.getItem("token");
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      
      const privacyData = {
        profileVisibility: formData.profileVisibility,
        showActivityStatus: formData.showActivityStatus,
        allowMessages: formData.allowMessages,
        // Jobseekers should never appear in employer searches via this toggle
        showProfileInSearch: user?.role === 'jobseeker' ? false : formData.showProfileInSearch,
        jobAlerts: formData.jobAlerts,
        applicationUpdates: formData.applicationUpdates,
        messages: formData.messages,
        marketingTips: formData.marketingTips,
        pushNotifications: formData.pushNotifications,
        emailDigest: formData.emailDigest,
      };
      
      const response = await saveUserSettings(privacyData);
      if (response?.data?.data) {
        localStorage.setItem("user", JSON.stringify(response.data.data));
      }
      
      setOriginalPrivacyData({
        profileVisibility: formData.profileVisibility,
        showActivityStatus: formData.showActivityStatus,
        allowMessages: formData.allowMessages,
        showProfileInSearch: formData.showProfileInSearch,
        jobAlerts: formData.jobAlerts,
        applicationUpdates: formData.applicationUpdates,
        messages: formData.messages,
        marketingTips: formData.marketingTips,
        pushNotifications: formData.pushNotifications,
        emailDigest: formData.emailDigest,
      });
      
      setPrivacyChanged(false);
      alert("Privacy settings saved successfully!");
    } catch (error) {
        console.error("Error saving privacy settings:", error);
        alert(error.response?.data?.message || error.message || "Failed to save privacy settings");
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleCancelPrivacyChanges = () => {
    setFormData((prev) => ({
      ...prev,
      ...originalPrivacyData,
    }));
    setPrivacyChanged(false);
  };

  const handlePrivacyChange = (field, value) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };
      
      // Check if any privacy setting has changed from original
      const privacyFields = [
        "profileVisibility",
        "showActivityStatus",
        "allowMessages",
        "showProfileInSearch",
        "jobAlerts",
        "applicationUpdates",
        "messages",
        "marketingTips",
        "pushNotifications",
        "emailDigest",
      ];
      
      const hasChanges = privacyFields.some(
        (privacyField) => updated[privacyField] !== originalPrivacyData[privacyField]
      );
      setPrivacyChanged(hasChanges);
      
      return updated;
    });
  };

  const handleNotificationChange = (field, value) => {
    setNotificationData((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };
      const hasChanges = Object.keys(updated).some(
        (key) => updated[key] !== originalNotificationData[key]
      );
      setNotificationChanged(hasChanges);
      return updated;
    });
  };

  const handleSaveNotificationSettings = async () => {
    try {
      setSavingNotifications(true);
      // send full notificationData to backend
      const response = await saveUserSettings({ ...notificationData });

      if (response?.data?.data) {
        const updatedUser = response.data.data;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setOriginalNotificationData({ ...notificationData });
        setNotificationChanged(false);
        alert('Notification settings saved successfully!');
      }
    } catch (error) {
        console.error('Error saving notification settings:', error);
        alert(error.response?.data?.message || error.message || 'Failed to save notification settings');
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleCancelNotificationSettings = () => {
    setNotificationData({ ...originalNotificationData });
    setNotificationChanged(false);
  };

  const handleAppearanceChange = (field, value) => {
    setAppearanceData((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };
      const hasChanges = Object.keys(updated).some(
        (key) => updated[key] !== originalAppearanceData[key]
      );
      setAppearanceChanged(hasChanges);
      return updated;
    });
  };

  const handleSaveAppearanceSettings = async () => {
    try {
      setSavingAppearance(true);
      const response = await saveUserSettings({
        themePreference: appearanceData.themePreference,
        compactView: appearanceData.compactView,
        fontSize: appearanceData.fontSize,
        animationsEnabled: appearanceData.animationsEnabled,
        languagePreference: language,
      });

      if (response?.data?.data) {
        setUser(response.data.data);
        setOriginalAppearanceData({ ...appearanceData });
        setAppearanceChanged(false);
        alert('Appearance settings saved successfully!');
      }
    } catch (error) {
        console.error('Error saving appearance settings:', error);
        alert(error.response?.data?.message || error.message || 'Failed to save appearance settings');
    } finally {
      setSavingAppearance(false);
    }
  };

  const handleCancelAppearanceChanges = () => {
    setAppearanceData({ ...originalAppearanceData });
    setTheme(originalAppearanceData.themePreference);
    setLanguage(user?.languagePreference || 'en');
    setAppearanceChanged(false);
  };

  const handleConnectedAccountToggle = (platform) => {
    setConnectedAccounts((prev) => ({
      ...prev,
      [platform]: !prev[platform],
    }));
  };

  const handleSaveConnectedAccounts = async () => {
    try {
      setSavingConnections(true);
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE}/api/auth/connected-accounts`,
        connectedAccounts,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response?.data?.data) {
        setUser((prev) => ({ ...prev, connectedAccounts: response.data.data }));
        alert('Connected accounts updated successfully!');
      }
    } catch (error) {
        console.error('Error saving connected accounts:', error);
        alert(error.response?.data?.message || error.message || 'Failed to update connected accounts');
    } finally {
      setSavingConnections(false);
    }
  };

  const handleFileChange = (event) => {
    setResumeFile(event.target.files[0]);
  };

  const handleUploadResume = async () => {
    if (!resumeFile) {
      alert('Please select a resume file to upload.');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('resume', resumeFile);

      const response = await axios.post(
        `${API_BASE}/api/jobseeker/upload-resume`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response?.data?.url) {
        const newResume = {
          id: response.data.fileName,
          name: response.data.fileName,
          uploadedAt: new Date().toLocaleDateString(),
          url: response.data.url,
          default: true,
        };
        setResumes((prev) => prev.map((item) => ({ ...item, default: false })).concat(newResume));
        setUser((prev) => ({ ...prev, resume: response.data.url }));
        setResumeFile(null);
        alert('Resume uploaded successfully!');
      }
    } catch (error) {
        console.error('Error uploading resume:', error);
        alert(error.response?.data?.message || error.message || 'Failed to upload resume');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefaultResume = async (id) => {
    setResumes((prev) => prev.map((resume) => ({
      ...resume,
      default: resume.id === id,
    })));
    alert('Default resume updated!');
  };

  const handleDeleteResume = async (id) => {
    setResumes((prev) => prev.filter((r) => r.id !== id));
    alert('Resume deleted!');
  };

  const handleBillingPlanChange = (plan) => {
    setBillingPlan(plan);
  };

  const handleSaveBillingPlan = async () => {
    try {
      setSavingBilling(true);
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE}/api/auth/billing`,
        { premiumPlan: billingPlan, amountCents: billingPlan === 'monthly' ? 999 : billingPlan === 'annual' ? 1999 : 0 },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response?.data?.data) {
        setUser((prev) => ({ ...prev, premiumPlan: response.data.data.premiumPlan }));
        setBillingHistory(response.data.data.billingHistory || []);
        alert('Billing plan updated successfully!');
      }
    } catch (error) {
      console.error('Error saving billing plan:', error);
      alert('Failed to save billing plan');
    } finally {
      setSavingBilling(false);
    }
  };

  const handleSubmitTicket = async () => {
    if (!helpSubject.trim()) {
      alert('Please enter a ticket subject.');
      return;
    }

    try {
      setSavingTicket(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE}/api/auth/support/tickets`,
        { subject: helpSubject, message: helpMessage },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response?.data?.data) {
        setTickets((prev) => [...prev, response.data.data]);
        setHelpSubject('');
        setHelpMessage('');
        alert('Support ticket created successfully!');
      }
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      alert('Failed to submit support ticket');
    } finally {
      setSavingTicket(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const updateData = {
        fullName: formData.fullName,
        email: formData.email,
        profession: formData.profession,
        location: formData.location,
        profileVisibility: formData.profileVisibility,
        showActivityStatus: formData.showActivityStatus,
        allowMessages: formData.allowMessages,
        showProfileInSearch: formData.showProfileInSearch,
        jobAlerts: formData.jobAlerts,
        applicationUpdates: formData.applicationUpdates,
        messages: formData.messages,
        marketingTips: formData.marketingTips,
        pushNotifications: formData.pushNotifications,
        emailDigest: formData.emailDigest,
      };

      const response = await saveUserSettings(updateData);
      if (response?.data?.data) {
        const updatedUser = response.data.data;
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setFormData((prev) => ({
          ...prev,
          fullName:
            updatedUser.firstName && updatedUser.lastName
              ? `${updatedUser.firstName} ${updatedUser.lastName}`
              : updatedUser.fullName || prev.fullName,
        }));
        alert("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleEditProfile = () => {
    navigate("/profile");
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert("Please fill in all password fields");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      alert("New password must be at least 8 characters long");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      
      await axios.put(
        `${API_BASE}/api/auth/change-password/${storedUser._id}`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      alert("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordForm(false);
    } catch (error) {
      console.error("Error changing password:", error);
      alert(error.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivateAccount = async () => {
    if (window.confirm("Are you sure you want to deactivate your account? This action is temporary and you can reactivate anytime.")) {
      try {
        setSaving(true);
        const token = localStorage.getItem("token");
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        
        await axios.put(
          `${API_BASE}/api/auth/deactivate/${storedUser._id}`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        alert("Account deactivated successfully. You'll be logged out now.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth");
      } catch (error) {
        console.error("Error deactivating account:", error);
        alert(error.response?.data?.message || error.message || "Failed to deactivate account");
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost.")) {
      if (window.confirm("This is your final warning. Delete your account?")) {
        try {
          setSaving(true);
          const token = localStorage.getItem("token");
          const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
          
          await axios.delete(
            `${API_BASE}/api/auth/profile`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          
          alert("Account deleted permanently.");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/auth");
        } catch (error) {
          console.error("Error deleting account:", error);
          alert(error.response?.data?.message || error.message || "Failed to delete account");
        } finally {
          setSaving(false);
        }
      }
    }
  };

  // Privacy & Security Handlers
  const handleBlockUser = async () => {
    if (!blockUserEmail.trim()) {
      alert("Please enter an email address");
      return;
    }

    try {
      setSaving(true);
      setBlockedUsers([...blockedUsers, { email: blockUserEmail, blockedAt: new Date().toLocaleDateString() }]);
      setBlockUserEmail("");
      setShowBlockForm(false);
      alert(`${blockUserEmail} has been blocked`);
    } catch (error) {
      console.error("Error blocking user:", error);
      alert("Failed to block user");
    } finally {
      setSaving(false);
    }
  };

  const handleUnblockUser = (email) => {
    setBlockedUsers(blockedUsers.filter(user => user.email !== email));
    alert(`${email} has been unblocked`);
  };

  const handleDownloadData = async () => {
    try {
      setSaving(true);
      alert("Your data export will be sent to your email shortly. Check your inbox!");
      // API call would go here
    } catch (error) {
      alert("Failed to download data");
    } finally {
      setSaving(false);
    }
  };

  // Appearance Handler
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    alert(`Theme changed to ${newTheme}`);
  };

  // Language Handler
  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    alert(`Language changed to ${e.target.value === "en" ? "English" : e.target.value === "es" ? "Spanish" : "Filipino"}`);
  };

  // Connected Accounts Handler
  const handleConnectAccount = (platform) => {
    alert(`Connecting to ${platform}... You'll be redirected to their login page.`);
  };

  // Resume & Support handlers are defined above with API-backed implementations.

  const getMenuItems = () => {
    // Jobseekers should only see Resume & Documents in settings
    if (user?.role === 'jobseeker') {
      return [
        { id: 'resume', label: 'Resume & Documents', icon: <FileIcon /> },
      ];
    }

    // Employers and other roles see the full settings menu (without resume)
    return [
      { id: 'account', label: 'Account Settings', icon: <AccountIcon /> },
      { id: 'privacy', label: 'Privacy & Security', icon: <SecurityIcon /> },
      { id: 'notifications', label: 'Notifications', icon: <BellIcon /> },
      { id: 'appearance', label: 'Appearance', icon: <PaletteIcon /> },
      { id: 'language', label: 'Language', icon: <GlobeIcon /> },
      { id: 'connected', label: 'Connected Accounts', icon: <LinkIcon /> },
      { id: 'billing', label: 'Billing & Subscription', icon: <CreditCardIcon /> },
      { id: 'help', label: 'Help & Support', icon: <HelpIcon /> },
    ];
  };

  return (
    <div className={`settings-container ${isDarkMode ? "dark-mode" : ""}`}>
      <div className="settings-wrapper">
        {/* Sidebar */}
        <aside className="settings-sidebar">
          <nav className="settings-menu">
            {getMenuItems().map((item) => (
              <button
                key={item.id}
                className={`menu-item ${activeTab === item.id ? "active" : ""}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-label">{item.label}</span>
              </button>
            ))}
          </nav>

            <div className="premium-banner">
            <div className="premium-icon"><CrownIcon /></div>
            <h3>Upgrade to Premium</h3>
            <p>Unlock all features, premium insights, and more to boost your career.</p>
            <button className="upgrade-btn" onClick={() => navigate('/ai-premium')}>Upgrade Now</button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="settings-main">
          {/* Account Settings Tab */}
          {activeTab === "account" && (
            <>
              <div className="settings-section">
                <h2>Account Settings</h2>
                <p>Manage your personal information and account preferences.</p>
              </div>

              <div className="settings-section">
                <h3>Profile Information</h3>
                <p>Update your personal details and how others see you.</p>
                
                <div className="profile-info-grid">
                  <div className="profile-avatar">
                    <div className="avatar-circle">
                      {user?.profilePicture ? (
                        <img 
                          src={user.profilePicture} 
                          alt="Profile" 
                          onError={(e) => {
                            console.error("Profile picture failed to load:", user.profilePicture);
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <span>
                          {(formData.fullName || "U")
                            .split(" ")
                            .map((word) => word[0])
                            .join("")
                            .toUpperCase()
                            .substring(0, 2)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="form-fields">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="john@example.com"
                        disabled
                      />
                      <span className="verified-badge"><CheckIcon /> Verified</span>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Profession</label>
                        <input
                          type="text"
                          name="profession"
                          value={formData.profession}
                          onChange={handleInputChange}
                          placeholder="Full Stack Developer"
                        />
                      </div>
                      <div className="form-group">
                        <label>Location</label>
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          placeholder="San Fernando, Pampanga, Philippines"
                        />
                      </div>
                    </div>

                    <button className="btn-primary" onClick={handleSaveProfile} disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button className="btn-secondary" onClick={handleEditProfile}>
                      Edit Full Profile
                    </button>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>Privacy & Visibility</h3>
                <p>Choose who can see your profile and activity.</p>

                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Profile Visibility</h4>
                    <p>Choose who can view your full profile</p>
                  </div>
                  <select
                    value={formData.profileVisibility}
                    onChange={(e) =>
                      handlePrivacyChange("profileVisibility", e.target.value)
                    }
                    className="select-dropdown"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="connections">Connections Only</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Show Activity Status</h4>
                    <p>Let others see when you're active</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={formData.showActivityStatus}
                      onChange={() => handleToggle("showActivityStatus")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Allow Messages</h4>
                    <p>Allow recruiters and companies to message you</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={formData.allowMessages}
                      onChange={() => handleToggle("allowMessages")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {user?.role !== 'jobseeker' && (
                  <div className="setting-item">
                    <div className="setting-label">
                      <h4>Show Profile in Search Results</h4>
                      <p>Allow your profile to appear in search results</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={formData.showProfileInSearch}
                        onChange={() => handleToggle("showProfileInSearch")}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                )}

                <div className="setting-item">
                  <button className="btn-link">Manage Privacy</button>
                </div>

                {privacyChanged && (
                  <div className="settings-actions">
                    <button 
                      className="btn-primary" 
                      onClick={handleSavePrivacySettings}
                      disabled={savingPrivacy}
                    >
                      {savingPrivacy ? "Saving..." : "Save Changes"}
                    </button>
                    <button 
                      className="btn-secondary" 
                      onClick={handleCancelPrivacyChanges}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="settings-section">
                <h3>Email Notifications</h3>
                <p>Control what emails you receive from Applica.</p>

                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Job Alerts</h4>
                    <p>Receive emails about new job matches</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={formData.jobAlerts}
                      onChange={() => handleToggle("jobAlerts")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Application Updates</h4>
                    <p>Get updates on your job applications</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={formData.applicationUpdates}
                      onChange={() => handleToggle("applicationUpdates")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Messages</h4>
                    <p>Receive messages and chat notifications</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={formData.messages}
                      onChange={() => handleToggle("messages")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Marketing & Tips</h4>
                    <p>Receive tips, resources, and product updates</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={formData.marketingTips}
                      onChange={() => handleToggle("marketingTips")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <button className="btn-link">Manage Notifications</button>
                </div>
              </div>

              <div className="settings-section">
                <h3>Security</h3>
                <p>Keep your account safe and secure.</p>

                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Password</h4>
                    <p>Last changed 2 months ago</p>
                  </div>
                  <button 
                    className="btn-secondary" 
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                  >
                    {showPasswordForm ? "Cancel" : "Change Password"}
                  </button>
                </div>

                {showPasswordForm && (
                  <div className="password-form">
                    <div className="form-group">
                      <label>Current Password</label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter your current password"
                      />
                    </div>

                    <div className="form-group">
                      <label>New Password</label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter new password (min 8 characters)"
                      />
                    </div>

                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Confirm new password"
                      />
                    </div>

                    <div className="form-actions">
                      <button 
                        className="btn-primary" 
                        onClick={handleChangePassword}
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save Password"}
                      </button>
                      <button 
                        className="btn-secondary" 
                        onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Two-Factor Authentication</h4>
                    <p>Add an extra layer of security to your account</p>
                  </div>
                  <div className="flex-center">
                    <button className="btn-link">Enable 2FA</button>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Login Activity</h4>
                    <p>See recent login activity to your account</p>
                  </div>
                  <button className="btn-link">View Activity</button>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Sessions</h4>
                    <p>Manage your active sessions</p>
                  </div>
                  <button className="btn-link">Manage Sessions</button>
                </div>
              </div>

              <div className="settings-section danger-zone">
                <h3>Danger Zone</h3>
                <p>These actions are permanent and cannot be undone.</p>

                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Deactivate Account</h4>
                    <p>Temporarily hide your profile and pause your account</p>
                  </div>
                  <button className="btn-danger" onClick={handleDeactivateAccount} disabled={saving}>
                    {saving ? "Processing..." : "Deactivate"}
                  </button>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Delete Account</h4>
                    <p>Permanently delete your account and all data</p>
                  </div>
                  <button className="btn-danger" onClick={handleDeleteAccount} disabled={saving}>
                    {saving ? "Processing..." : "Delete Account"}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Privacy & Security Tab */}
          {activeTab === "privacy" && (
            <>
              <div className="settings-section">
                <h2>Privacy & Security</h2>
                <p>Manage your privacy settings and security options.</p>
              </div>

              <div className="settings-section">
                <h3>Blocked Users</h3>
                <p>Manage users you've blocked.</p>

                {blockedUsers.length > 0 && (
                  <div className="blocked-users-list">
                    {blockedUsers.map((user) => (
                      <div key={user.email} className="user-item">
                        <div className="user-info">
                          <p className="user-email">{user.email}</p>
                          <p className="user-date">Blocked on {user.blockedAt}</p>
                        </div>
                        <button 
                          className="btn-secondary" 
                          onClick={() => handleUnblockUser(user.email)}
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {!showBlockForm ? (
                  <button 
                    className="btn-primary" 
                    onClick={() => setShowBlockForm(true)}
                  >
                    Block New User
                  </button>
                ) : (
                  <div className="form-section">
                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        value={blockUserEmail}
                        onChange={(e) => setBlockUserEmail(e.target.value)}
                        placeholder="user@example.com"
                      />
                    </div>
                    <div className="form-actions">
                      <button 
                        className="btn-primary" 
                        onClick={handleBlockUser}
                        disabled={saving}
                      >
                        {saving ? "Blocking..." : "Block User"}
                      </button>
                      <button 
                        className="btn-secondary" 
                        onClick={() => {
                          setShowBlockForm(false);
                          setBlockUserEmail("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="settings-section">
                <h3>Data & Privacy</h3>
                <p>Download your data or delete your information.</p>

                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Download Your Data</h4>
                    <p>Get a copy of your profile, applications, and messages</p>
                  </div>
                  <button 
                    className="btn-secondary" 
                    onClick={handleDownloadData}
                    disabled={saving}
                  >
                    {saving ? "Processing..." : "Download"}
                  </button>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Delete Inactive Data</h4>
                    <p>Automatically delete your data after 2 years of inactivity</p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked={false} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <>
              <div className="settings-section">
                <h2>Notifications</h2>
                <p>Control when and how you receive notifications.</p>
              </div>

              <div className="settings-section">
                <h3>Push Notifications</h3>
                <p>Receive notifications on your devices.</p>

                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Enable Push Notifications</h4>
                    <p>Receive real-time alerts and updates</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notificationData.pushNotifications}
                      onChange={() => handleNotificationChange('pushNotifications', !notificationData.pushNotifications)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Job Recommendations</h4>
                    <p>Get notified about jobs matching your profile</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notificationData.jobRecommendations}
                      onChange={() => handleNotificationChange('jobRecommendations', !notificationData.jobRecommendations)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Interview Requests</h4>
                    <p>Get notified when employers request an interview</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notificationData.interviewRequests}
                      onChange={() => handleNotificationChange('interviewRequests', !notificationData.interviewRequests)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Messages</h4>
                    <p>Get notified about new messages</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notificationData.messages}
                      onChange={() => handleNotificationChange('messages', !notificationData.messages)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="settings-section">
                <h3>Email Digest</h3>
                <p>Choose how often you receive email summaries.</p>

                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Email Digest Frequency</h4>
                    <p>How often you want to receive summary emails</p>
                  </div>
                  <select
                    value={notificationData.emailDigest}
                    onChange={(e) => handleNotificationChange('emailDigest', e.target.value)}
                    className="select-dropdown"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="never">Never</option>
                  </select>
                </div>
              </div>

              <div className="settings-section">
                <h3>Notification Sounds</h3>
                <p>Customize notification sounds.</p>

                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Sound Effects</h4>
                    <p>Play a sound when you receive notifications</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notificationData.soundEffects}
                      onChange={() => handleNotificationChange('soundEffects', !notificationData.soundEffects)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Vibration</h4>
                    <p>Vibrate when you receive notifications</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notificationData.vibration}
                      onChange={() => handleNotificationChange('vibration', !notificationData.vibration)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="settings-section settings-actions">
                <button className="secondary-btn" onClick={handleCancelNotificationSettings}>Cancel</button>
                <button className="primary-btn" onClick={handleSaveNotificationSettings}>Save Changes</button>
              </div>
            </>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <>
              <div className="settings-section">
                <h2>Appearance</h2>
                <p>Customize how Applica looks.</p>
              </div>

              <div className="settings-section">
                <h3>Theme</h3>
                <p>Choose your preferred color theme.</p>

                <div className="theme-options">
                  <div 
                    className={`theme-card ${theme === "light" ? "active" : ""}`}
                    onClick={() => handleThemeChange("light")}
                  >
                    <div className="theme-preview light"></div>
                    <h4>Light</h4>
                    <p>Bright and clean interface</p>
                  </div>

                  <div 
                    className={`theme-card ${theme === "dark" ? "active" : ""}`}
                    onClick={() => handleThemeChange("dark")}
                  >
                    <div className="theme-preview dark"></div>
                    <h4>Dark</h4>
                    <p>Easy on the eyes at night</p>
                  </div>

                  <div 
                    className={`theme-card ${theme === "auto" ? "active" : ""}`}
                    onClick={() => handleThemeChange("auto")}
                  >
                    <div className="theme-preview auto"></div>
                    <h4>Auto</h4>
                    <p>Follow system settings</p>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>Display</h3>
                <p>Adjust display settings.</p>

                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Compact View</h4>
                    <p>Use a more condensed layout</p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked={false} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Font Size</h4>
                    <p>Adjust text size for readability</p>
                  </div>
                  <select className="select-dropdown">
                    <option value="small">Small</option>
                    <option value="normal" selected>Normal</option>
                    <option value="large">Large</option>
                    <option value="extra-large">Extra Large</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Animations</h4>
                    <p>Enable smooth transitions and animations</p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked={true} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="settings-section">
                <h3>Language</h3>
                <p>Choose your language preference.</p>

                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Interface Language</h4>
                    <p>Select the language for the interface</p>
                  </div>
                  <select 
                    value={language}
                    onChange={handleLanguageChange}
                    className="select-dropdown"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fil">Filipino</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Connected Accounts Tab */}
          {activeTab === "connected" && (
            <>
              <div className="settings-section">
                <h2>Connected Accounts</h2>
                <p>Manage your third-party integrations.</p>
              </div>

              <div className="settings-section">
                <h3>Connect Your Accounts</h3>
                <p>Link your professional accounts to enhance your profile.</p>

                <div className="connected-accounts-grid">
                  <div className="account-card">
                    <div className="account-header">
                      <h4>LinkedIn</h4>
                      <span className="status-badge">Not Connected</span>
                    </div>
                    <p>Connect your LinkedIn profile to import your work experience</p>
                    <button 
                      className="btn-primary"
                      onClick={() => handleConnectAccount("LinkedIn")}
                    >
                      Connect LinkedIn
                    </button>
                  </div>

                  <div className="account-card">
                    <div className="account-header">
                      <h4>GitHub</h4>
                      <span className="status-badge">Not Connected</span>
                    </div>
                    <p>Showcase your coding projects and contributions</p>
                    <button 
                      className="btn-primary"
                      onClick={() => handleConnectAccount("GitHub")}
                    >
                      Connect GitHub
                    </button>
                  </div>

                  <div className="account-card">
                    <div className="account-header">
                      <h4>Google</h4>
                      <span className="status-badge">Not Connected</span>
                    </div>
                    <p>Use Google for quick sign-in</p>
                    <button 
                      className="btn-primary"
                      onClick={() => handleConnectAccount("Google")}
                    >
                      Connect Google
                    </button>
                  </div>

                  <div className="account-card">
                    <div className="account-header">
                      <h4>Facebook</h4>
                      <span className="status-badge">Not Connected</span>
                    </div>
                    <p>Connect your Facebook account</p>
                    <button 
                      className="btn-primary"
                      onClick={() => handleConnectAccount("Facebook")}
                    >
                      Connect Facebook
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Resume & Documents Tab */}
          {activeTab === "resume" && (
            <>
              <div className="settings-section">
                <h2>Resume & Documents</h2>
                <p>Manage your resumes and documents.</p>
              </div>

              <div className="settings-section">
                <h3>Your Resumes</h3>
                <p>Upload and manage your resumes.</p>

                {resumes.length > 0 && (
                  <div className="resumes-list">
                    {resumes.map((resume) => (
                      <div key={resume.id} className="resume-item">
                        <div className="resume-info">
                          <p className="resume-name">{resume.name}</p>
                          <p className="resume-date">Uploaded on {resume.uploadedAt}</p>
                          {resume.default && <span className="default-badge">Default</span>}
                        </div>
                        <div className="resume-actions">
                          {!resume.default && (
                            <button 
                              className="btn-link"
                              onClick={() => handleSetDefaultResume(resume.id)}
                            >
                              Set as Default
                            </button>
                          )}
                          <button 
                            className="btn-secondary"
                            onClick={() => handleDeleteResume(resume.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button 
                  className="btn-primary"
                  onClick={handleUploadResume}
                >
                  Upload New Resume
                </button>
              </div>

              <div className="settings-section">
                <h3>Cover Letters</h3>
                <p>Save and manage your cover letters.</p>
                <p style={{ marginTop: "12px", color: "var(--text)" }}>
                  You haven't saved any cover letters yet.
                </p>
                <button className="btn-primary">
                  Create Cover Letter
                </button>
              </div>
            </>
          )}

          {/* Billing & Subscription Tab */}
          {activeTab === "billing" && (
            <>
              <div className="settings-section">
                <h2>Billing & Subscription</h2>
                <p>Manage your subscription and billing information.</p>
              </div>

              <div className="settings-section">
                <h3>Current Plan</h3>
                {billingHistory && billingHistory.length > 0 ? (
                  <>
                    <p>You have an active subscription.</p>
                    <div className="subscription-card">
                      <div className="plan-details">
                        <h4>{billingPlan === 'free' ? 'Premium' : billingPlan}</h4>
                        <p>{formatPeso(billingHistory[billingHistory.length - 1].amountCents)} / month</p>
                        <ul>
                          <li>Browse all jobs</li>
                          <li>Unlimited applications (premium)</li>
                          <li>Priority profile</li>
                          <li>Premium support</li>
                        </ul>
                      </div>
                      <button className="btn-secondary" disabled>
                        Current Plan
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p>You are on the Free plan.</p>
                    <div className="subscription-card">
                      <div className="plan-details">
                        <h4>Free Plan</h4>
                        <p>₱0 / month</p>
                        <ul>
                          <li>Browse all jobs</li>
                          <li>Apply to 10 jobs per month</li>
                          <li>Basic profile</li>
                          <li>Standard support</li>
                        </ul>
                      </div>
                      <button className="btn-secondary" disabled>
                        Current Plan
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="settings-section">
                <h3>Upgrade to Premium</h3>
                <p>Get unlimited access and premium features.</p>

                <div className="plans-grid">
                  <div className="plan-card">
                    <h4>Premium</h4>
                    <p className="price">{formatPeso(999)} / month</p>
                    <ul>
                      <li>Unlimited job applications</li>
                      <li>Priority profile visibility</li>
                      <li>Interview prep tools</li>
                      <li>Premium support</li>
                    </ul>
                    <button className="btn-primary" onClick={() => navigate('/ai-premium')}>Upgrade Now</button>
                  </div>

                  <div className="plan-card featured">
                    <div className="featured-badge">Most Popular</div>
                    <h4>Premium Plus</h4>
                    <p className="price">{formatPeso(1999)} / month</p>
                    <ul>
                      <li>Everything in Premium</li>
                      <li>AI Resume Review</li>
                      <li>Profile optimization</li>
                      <li>Dedicated account manager</li>
                    </ul>
                    <button className="btn-primary" onClick={() => navigate('/ai-premium')}>Upgrade Now</button>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>Billing History</h3>
                <p>View your past transactions.</p>
                <p style={{ marginTop: "12px", color: "var(--text)" }}>
                  No billing history yet.
                </p>
              </div>
            </>
          )}

          {/* Help & Support Tab */}
          {activeTab === "help" && (
            <>
              <div className="settings-section">
                <h2>Help & Support</h2>
                <p>Get help with your account and find answers to common questions.</p>
              </div>

              <div className="settings-section">
                <h3>Frequently Asked Questions</h3>

                <div className="faq-list">
                  <div className="faq-item">
                    <h4>How do I apply to a job?</h4>
                    <p>Browse jobs on the Explore page and click "Apply Now". Fill in your details and submit your application.</p>
                  </div>

                  <div className="faq-item">
                    <h4>Can I edit my profile after creating it?</h4>
                    <p>Yes! Go to your Profile page anytime to update your information, skills, and experience.</p>
                  </div>

                  <div className="faq-item">
                    <h4>How do I prepare for an interview?</h4>
                    <p>Check our Interview Prep section for tips, practice questions, and video recording tools.</p>
                  </div>

                  <div className="faq-item">
                    <h4>What payment methods do you accept?</h4>
                    <p>We accept credit cards, debit cards, and digital wallets for premium subscriptions.</p>
                  </div>

                  <div className="faq-item">
                    <h4>How do I cancel my subscription?</h4>
                    <p>You can cancel anytime from your Billing settings. No questions asked!</p>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>Support</h3>
                <p>Need help? Get in touch with our support team.</p>

                {supportTickets.length > 0 && (
                  <div className="tickets-list">
                    <h4>Your Support Tickets</h4>
                    {supportTickets.map((ticket) => (
                      <div key={ticket.id} className="ticket-item">
                        <div className="ticket-info">
                          <p className="ticket-id">{ticket.id}</p>
                          <p className="ticket-subject">{ticket.subject}</p>
                          <p className="ticket-date">Created on {ticket.createdAt}</p>
                        </div>
                        <span className={`ticket-status ${ticket.status}`}>{ticket.status}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button 
                  className="btn-primary"
                  onClick={handleSubmitTicket}
                >
                  Create Support Ticket
                </button>

                <div style={{ marginTop: "20px" }}>
                  <p><strong>Email Support:</strong> support@applica.com</p>
                  <p><strong>Response Time:</strong> Within 24 hours</p>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Settings;
