import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const regions = [
  "NCR",
  "Calabarzon",
  "Central Luzon",
  "Central Visayas",
  "Cordillera",
  "Davao",
  "Eastern Visayas",
  "Ilocos",
  "Mimaropa",
  "Mindanao",
  "Soccsksargen",
  "Zamboanga",
];

const socialNetworks = ["github", "facebook", "instagram", "linkedin", "twitter"];

const getSocialIcon = (type) => {
  const iconProps = {
    viewBox: '0 0 24 24',
    width: 20,
    height: 20,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  switch (type) {
    case 'github':
      return (
        <svg {...iconProps}>
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.167 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.604-3.369-1.343-3.369-1.343-.454-1.155-1.11-1.463-1.11-1.463-.907-.62.069-.608.069-.608 1.003.071 1.53 1.031 1.53 1.031.892 1.528 2.341 1.086 2.91.831.091-.647.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.944 0-1.091.39-1.984 1.03-2.682-.103-.254-.447-1.272.098-2.65 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.91-1.294 2.748-1.025 2.748-1.025.547 1.378.203 2.396.1 2.65.64.698 1.028 1.591 1.028 2.682 0 3.843-2.339 4.688-4.566 4.935.36.31.68.918.68 1.852 0 1.336-.012 2.415-.012 2.742 0 .268.18.58.688.481C19.137 20.165 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
        </svg>
      );
    case 'facebook':
      return (
        <svg {...iconProps}>
          <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3V2z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg {...iconProps}>
          <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
          <path d="M16 11.37a4 4 0 11-4.63-4.63 4 4 0 014.63 4.63z" />
          <path d="M17.5 6.5h.01" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg {...iconProps}>
          <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6z" />
          <path d="M2 9h4v12H2z" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      );
    case 'twitter':
      return (
        <svg {...iconProps}>
          <path d="M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0012 7.5v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
        </svg>
      );
    default:
      return (
        <svg {...iconProps}>
          <path d="M7 12h10" />
          <path d="M11 8l4 4-4 4" />
        </svg>
      );
  }
};

const normalizeArrayField = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/\r?\n|[,;]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const CreateJobseekerProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    bio: "",
    citizenShip: "",
    location: {
      region: "",
      city: "",
      barangay: "",
      otherDetails: "",
      coords: null,
    },
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    socialLinks: [],
    resume: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editable, setEditable] = useState(true);

  const [profilePicture, setProfilePicture] =
    useState("");
  const [profilePicturePreview, setProfilePicturePreview] =
    useState("");

  const [resumeFile, setResumeFile] =
    useState(null);
  const [newExperienceItem, setNewExperienceItem] = useState("");
  const [newEducationItem, setNewEducationItem] = useState("");
  const [newSkillItem, setNewSkillItem] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState("");

  const [existingResumeName, setExistingResumeName] = useState("");
  const [existingProfilePicture, setExistingProfilePicture] = useState("");

  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [mapUrl, setMapUrl] = useState("");

  // Check authorization on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth");
    }
  }, [navigate]);


  // preload profile when logged in
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await axios.get("http://localhost:8000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const user = response.data?.data;
        if (user && user.role === "jobseeker") {
          const hasData = Boolean(
            user.bio ||
            user.citizenShip ||
            user.experience ||
            user.education ||
            user.skills ||
            user.resume ||
            user.profilePicture ||
            user.location?.region ||
            user.location?.city ||
            user.location?.barangay ||
            user.location?.otherDetails
          );

          setFormData({
            bio: user.bio || "",
            citizenShip: user.citizenShip || "",
            location: {
              region: user.location?.region || "",
              city: user.location?.city || "",
              barangay: user.location?.barangay || "",
              otherDetails: user.location?.otherDetails || "",
              coords: user.location?.coords || null,
            },
            experience: normalizeArrayField(user.experience),
            education: normalizeArrayField(user.education),
            skills: normalizeArrayField(user.skills),
            certifications: normalizeArrayField(user.certifications || user.certification),
            socialLinks: (() => {
              const links = [];
              if (user.socialLinks) {
                ['github', 'facebook', 'instagram', 'linkedin', 'twitter'].forEach((type) => {
                  const url = user.socialLinks[type];
                  if (url) {
                    links.push({ type, url });
                  }
                });
              }
              if (user.github && !links.some((item) => item.type === 'github')) {
                links.push({ type: 'github', url: user.github });
              }
              if (user.linkedin && !links.some((item) => item.type === 'linkedin')) {
                links.push({ type: 'linkedin', url: user.linkedin });
              }
              if (user.twitter && !links.some((item) => item.type === 'twitter')) {
                links.push({ type: 'twitter', url: user.twitter });
              }
              return links;
            })(),
            resume: user.resume || "",
          });

          if (user.resume) setExistingResumeName(user.resume);
          if (user.profilePicture) {
            setExistingProfilePicture(user.profilePicture);
            setProfilePicturePreview(user.profilePicture);
          }

          setIsEditing(hasData);
          setEditable(!hasData);
        }
      } catch {
        // ignore
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const location = `
      ${formData.location.otherDetails}
      ${formData.location.barangay}
      ${formData.location.city}
      ${formData.location.region}
    `;

    const encodedLocation = encodeURIComponent(location.trim());
    setMapUrl(`https://maps.google.com/maps?q=${encodedLocation}&t=&z=15&ie=UTF8&iwloc=&output=embed`);
  }, [formData.location]);

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3000);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setProfilePicture(reader.result);
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      showMessage(
        "Please select a valid image file",
        "error"
      );
    }
  };

  const handleResumeChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setResumeFile(file);
      setFormData((prev) => ({
        ...prev,
        resume: file.name,
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("location.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          [field]: value,
        },
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleListItemChange = (field, index, value) => {
    setFormData((prev) => {
      const next = [...(prev[field] || [])];
      next[index] = value;
      return {
        ...prev,
        [field]: next,
      };
    });
  };

  const addListItem = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), ""],
    }));
  };

  const removeListItem = (field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, idx) => idx !== index),
    }));
  };

  const handleSocialLinkChange = (index, field, value) => {
    setFormData((prev) => {
      const next = [...(prev.socialLinks || [])];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return {
        ...prev,
        socialLinks: next,
      };
    });
  };

  const addSocialLinkItem = () => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: [...(prev.socialLinks || []), { type: 'github', url: '' }],
    }));
  };

  const removeSocialLinkItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: (prev.socialLinks || []).filter((_, idx) => idx !== index),
    }));
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse`,
        {
          params: {
            format: 'jsonv2',
            lat,
            lon: lng,
            addressdetails: 1,
          },
        }
      );

      return response.data;
    } catch (err) {
      console.error('Reverse geocode failed', err);
      return null;
    }
  };

  const fillLocationFromCoords = async () => {
    if (!navigator.geolocation) {
      showMessage('Geolocation is not supported by your browser.', 'error');
      return;
    }

    setLocationLoading(true);
    setLocationMessage('Getting your location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const data = await reverseGeocode(latitude, longitude);
        if (!data || !data.address) {
          showMessage('Unable to determine your address from location.', 'error');
          setLocationLoading(false);
          setLocationMessage('Unable to fill location automatically. Please enter it manually.');
          return;
        }

        const address = data.address;
        const region = address.state || address.region || address.county || '';
        const city = address.city || address.town || address.village || address.suburb || address.county || '';
        const barangay = address.hamlet || address.neighbourhood || address.suburb || '';
        const country = address.country || '';
        const otherDetails = [address.road, address.house_number, address.building, address.neighbourhood].filter(Boolean).join(', ');

        setFormData((prev) => ({
          ...prev,
          citizenShip: country.toLowerCase().includes('philippine') ? 'Filipino' : 'Foreign',
          location: {
            region: region || prev.location.region,
            city: city || prev.location.city,
            barangay: barangay || prev.location.barangay,
            otherDetails: otherDetails || prev.location.otherDetails,
            coords: {
              lat: latitude,
              lng: longitude,
            },
          },
        }));

        setLocationMessage('Location filled from your current GPS position.');
        setLocationLoading(false);
      },
      (error) => {
        console.error(error);
        setLocationLoading(false);
        showMessage('Please allow location access to fill address automatically.', 'error');
        setLocationMessage('Location access denied or unavailable. Enter location manually below.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  const hasLocationData = (location) => {
    if (!location) return false;
    const hasCoords = location.coords?.lat != null && location.coords?.lng != null;
    const hasManualFields = location.region && location.city && location.barangay;
    return hasCoords || hasManualFields;
  };

  const computeCompletion = (data) => {
    const isFilled = (v) => {
      if (v == null) return false;
      if (typeof v === "string") return v.trim().length > 0;
      if (typeof v === "number") return !Number.isNaN(v);
      if (typeof v === "boolean") return v;
      if (Array.isArray(v)) return v.length > 0;
      return !!v;
    };

    const fields = [
      data?.bio,
      data?.citizenShip,
      data?.experience,
      data?.education,
      data?.location?.region,
      data?.location?.city,
      data?.location?.barangay,
      data?.location?.otherDetails,
      // profilePicture is stored in separate state `profilePicture` (or existingProfilePicture)
      profilePicture || existingProfilePicture,
    ];

    const filled = fields.reduce((count, value) => count + (isFilled(value) ? 1 : 0), 0);
    return Math.round((filled / fields.length) * 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const token =
        localStorage.getItem("token");

      if (!token) {
        showMessage(
          "Please login first",
          "error"
        );

        setLoading(false);
        return;
      }

      if (!hasLocationData(formData.location)) {
        showMessage(
          "Please complete your location either by using location permission or entering it manually.",
          "error"
        );

        setLoading(false);
        return;
      }

      let resumeUrlToSave = existingResumeName || "";
      // If user selected a new resume file, upload it first
      if (resumeFile) {
        try {
          const fd = new FormData();
          fd.append('resume', resumeFile);

          const uploadResp = await axios.post('http://localhost:8000/api/jobseeker/upload-resume', fd, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          });

          resumeUrlToSave = uploadResp.data?.url || resumeUrlToSave || resumeFile.name;
          setExistingResumeName(resumeUrlToSave);
        } catch (err) {
          console.error('Resume upload failed', err);
          showMessage('Failed to upload resume. Please try again.', 'error');
          setLoading(false);
          return;
        }
      }

      const body = {
        bio: formData.bio,
        citizenShip: formData.citizenShip,
        location: formData.location,
        experience: formData.experience,
        education: formData.education,
certifications: formData.certifications,
      socialLinks: (formData.socialLinks || []).reduce((acc, item) => {
        if (item?.type && item?.url?.trim()) {
          acc[item.type] = item.url.trim();
        }
        return acc;
      }, {}),
      skills: formData.skills,
        resume: resumeUrlToSave,
        profilePicture: profilePicture || existingProfilePicture || "",
      };

      const response = await axios.put(
        "http://localhost:8000/api/jobseeker/profile",
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedProfile = response.data?.data || body;

      const storedUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...storedUser,
          ...updatedProfile,
          profilePicture: updatedProfile.profilePicture,
          location: updatedProfile.location,
          resume: updatedProfile.resume,
        })
      );

      if (updatedProfile.profilePicture) {
        setExistingProfilePicture(updatedProfile.profilePicture);
        setProfilePicturePreview(updatedProfile.profilePicture);
      }

      if (updatedProfile.resume) {
        setExistingResumeName(updatedProfile.resume);
      }

      setIsEditing(true);
      setEditable(false);

      showMessage(
        isEditing
          ? "Profile updated successfully!"
          : "Profile created successfully!",
        "success"
      );

      setTimeout(() => {
        navigate("/profile");
      }, 1500);
    } catch (error) {
      showMessage(
        error.response?.data?.message ||
          "Error creating profile",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={styles.container}>
      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
        <button style={styles.backBtn} onClick={() => navigate("/profile")}>← Back</button>
      </div>

      <div style={styles.main}>
        <div style={styles.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h1 style={styles.title}>{isEditing ? "Edit Jobseeker Profile" : "Create Jobseeker Profile"}</h1>
              <p style={styles.subtitle}>Complete your profile and update your current information.</p>
            </div>
            {isEditing && (
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                {!editable && (
                  <button
                    onClick={() => setEditable(true)}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 10,
                      border: "none",
                      background: "#275791",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                )}
                {editable && (
                  <button
                    onClick={() => setEditable(false)}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "transparent",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={{ marginTop: 24, marginBottom: 24 }}>
            {(() => {
              const completion = computeCompletion(formData);
              // debug log to help identify why the percent might be 0
              // eslint-disable-next-line no-console
              console.debug("Profile completion computed:", completion, {
                bio: formData.bio,
                citizenShip: formData.citizenShip,
                profilePicture: !!(profilePicture || existingProfilePicture),
                resume: !!(formData.resume || existingResumeName),
              });

              return (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 13, color: "#cbd5e1" }}>Profile Completion</span>
                  </div>
                  <div style={{ height: 10, background: "rgba(255,255,255,0.08)", borderRadius: 6, overflow: "hidden", marginTop: 10 }}>
                    <div style={{ height: 10, width: `${completion}%`, background: completion === 100 ? "#22c55e" : "#275791" }} />
                  </div>
                </>
              );
            })()}
          </div>

          {message && (
            <div
              style={{
                ...styles.message,
                backgroundColor: messageType === "error" ? "#ffe5e5" : "#e5ffe8",
                color: messageType === "error" ? "#c0392b" : "#27ae60",
              }}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Profile Picture</label>
              <input
                id="jobseekerProfilePictureInput"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={styles.hiddenInput}
                disabled={!editable}
              />
              <label htmlFor="jobseekerProfilePictureInput" style={styles.imageUploadCircle}>
                {(profilePicturePreview || existingProfilePicture) ? (
                  <img
                    src={profilePicturePreview || existingProfilePicture}
                    alt="Profile preview"
                    style={styles.imageUploadPreview}
                  />
                ) : (
                  <div style={styles.uploadPlaceholder}>
                    <span style={styles.uploadIcon}>📷</span>
                    <span style={styles.uploadText}>Choose image</span>
                  </div>
                )}
              </label>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Write a short bio"
                style={styles.textarea}
                disabled={!editable}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Experience</label>
              {editable ? (
                <>
                  {(formData.experience || []).map((item, index) => (
                    <div key={`experience-${index}`} style={styles.listItem}>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleListItemChange("experience", index, e.target.value)}
                        placeholder="Add an experience item"
                        style={styles.listInput}
                      />
                      <button
                        type="button"
                        style={styles.removeButton}
                        onClick={() => removeListItem("experience", index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    style={styles.addButton}
                    onClick={() => addListItem("experience")}
                  >
                    + Add experience
                  </button>
                </>
              ) : (
                <ul style={styles.bulletList}>
                  {formData.experience.map((item, index) => (
                    <li key={`experience-view-${index}`}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Education</label>
              {editable ? (
                <>
                  {(formData.education || []).map((item, index) => (
                    <div key={`education-${index}`} style={styles.listItem}>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleListItemChange("education", index, e.target.value)}
                        placeholder="Add education background"
                        style={styles.listInput}
                      />
                      <button
                        type="button"
                        style={styles.removeButton}
                        onClick={() => removeListItem("education", index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    style={styles.addButton}
                    onClick={() => addListItem("education")}
                  >
                    + Add education background
                  </button>
                </>
              ) : (
                <ul style={styles.bulletList}>
                  {formData.education.map((item, index) => (
                    <li key={`education-view-${index}`}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Skills</label>
              {editable ? (
                <>
                  {(formData.skills || []).map((item, index) => (
                    <div key={`skills-${index}`} style={styles.listItem}>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleListItemChange("skills", index, e.target.value)}
                        placeholder="Add a skill"
                        style={styles.listInput}
                      />
                      <button
                        type="button"
                        style={styles.removeButton}
                        onClick={() => removeListItem("skills", index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    style={styles.addButton}
                    onClick={() => addListItem("skills")}
                  >
                    + Add skill
                  </button>
                </>
              ) : (
                <ul style={styles.bulletList}>
                  {formData.skills.map((item, index) => (
                    <li key={`skills-view-${index}`}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Certifications (optional)</label>
              {editable ? (
                <>
                  {(formData.certifications || []).map((item, index) => (
                    <div key={`certification-${index}`} style={styles.listItem}>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleListItemChange("certifications", index, e.target.value)}
                        placeholder="Add a certification"
                        style={styles.listInput}
                      />
                      <button
                        type="button"
                        style={styles.removeButton}
                        onClick={() => removeListItem("certifications", index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    style={styles.addButton}
                    onClick={() => addListItem("certifications")}
                  >
                    + Add certification
                  </button>
                </>
              ) : (
                <ul style={{ paddingLeft: 18, margin: 0, color: 'var(--text)' }}>
                  {(formData.certifications || []).map((item, index) => (
                    <li key={`certification-view-${index}`}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Social Links (optional)</label>
              {editable ? (
                <>
                  {(formData.socialLinks || []).map((item, index) => (
                    <div key={`social-${index}`} style={{ display: 'grid', gap: 10, marginBottom: 12, gridTemplateColumns: '70px 1fr auto', alignItems: 'center' }}>
                      <button
                        type="button"
                        aria-label={item.type || 'Social'}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 70,
                          height: 48,
                          borderRadius: 12,
                          border: '1px solid var(--border)',
                          background: 'var(--surface-alt)',
                          cursor: 'default',
                        }}
                      >
                        {getSocialIcon(item.type)}
                      </button>
                      <div style={{ display: 'grid', gap: 10 }}>
                        <select
                          value={item.type || 'github'}
                          onChange={(e) => handleSocialLinkChange(index, 'type', e.target.value)}
                          style={styles.input}
                        >
                          {socialNetworks.map((network) => (
                            <option key={network} value={network}>
                              {network.charAt(0).toUpperCase() + network.slice(1)}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={item.url || ''}
                          onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                          placeholder="Enter profile link"
                          style={styles.input}
                        />
                      </div>
                      <button
                        type="button"
                        style={styles.removeButton}
                        onClick={() => removeSocialLinkItem(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    style={styles.addButton}
                    onClick={addSocialLinkItem}
                  >
                    + Add social
                  </button>
                </>
              ) : (
                <ul style={{ paddingLeft: 18, margin: 0, color: 'var(--text)' }}>
                  {(formData.socialLinks || []).map((item, index) => (
                    <li key={`social-view-${index}`}>{item.type}: {item.url}</li>
                  ))}
                </ul>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Citizenship</label>
              <select
                name="citizenShip"
                value={formData.citizenShip}
                onChange={handleInputChange}
                style={styles.input}
                disabled={!editable}
              >
                <option value="">Select citizenship</option>
                <option value="Filipino">Filipino</option>
                <option value="Foreign">Foreign</option>
              </select>
            </div>

            <h2 style={styles.locationTitle}>Location</h2>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={fillLocationFromCoords}
                disabled={!editable || locationLoading}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: 12,
                  border: "none",
                  background: "#1892aa",
                  color: "#fff",
                  cursor: editable ? "pointer" : "not-allowed",
                }}
              >
                {locationLoading ? "Locating…" : "Use my current location"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editable) return;
                }}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: 12,
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  color: "#111",
                  cursor: editable ? "pointer" : "not-allowed",
                }}
              >
                Enter location manually
              </button>
            </div>

            {locationMessage && <div style={{ color: "#facc15", fontSize: 13, marginTop: 8 }}>{locationMessage}</div>}

            <div style={styles.grid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Region</label>
                <select
                  name="location.region"
                  value={formData.location.region}
                  onChange={handleInputChange}
                  style={styles.input}
                  disabled={!editable}
                >
                  <option value="">Select Region</option>
                  {regions.map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>City</label>
                <input
                  type="text"
                  name="location.city"
                  value={formData.location.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  style={styles.input}
                  disabled={!editable}
                />
              </div>
            </div>

            <div style={styles.grid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Barangay</label>
                <input
                  type="text"
                  name="location.barangay"
                  value={formData.location.barangay}
                  onChange={handleInputChange}
                  placeholder="Barangay"
                  style={styles.input}
                  disabled={!editable}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Other Details</label>
                <input
                  type="text"
                  name="location.otherDetails"
                  value={formData.location.otherDetails}
                  onChange={handleInputChange}
                  placeholder="Street / Landmark"
                  style={styles.input}
                  disabled={!editable}
                />
              </div>
            </div>

            <div style={styles.mapContainer}>
              <iframe
                title="Google Map"
                width="100%"
                height="300"
                style={styles.map}
                loading="lazy"
                allowFullScreen
                src={mapUrl}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Resume / CV (optional)</label>
              <input
                id="jobseekerResumeInput"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeChange}
                style={styles.hiddenInput}
                disabled={!editable}
              />
              <label
                htmlFor="jobseekerResumeInput"
                style={{
                  ...styles.input,
                  cursor: editable ? "pointer" : "not-allowed",
                  display: "inline-block",
                }}
              >
                {formData.resume ? `Selected: ${formData.resume}` : "Choose resume (.pdf, .doc, .docx)"}
              </label>
              <div style={styles.hintText}>Uploading a resume is optional. You can continue without one.</div>
              {existingResumeName && !resumeFile && (
                <div style={styles.hintText}>Current resume: {existingResumeName}</div>
              )}
            </div>

            <div style={styles.buttonContainer}>
              <button
                type="button"
                style={styles.cancelBtn}
                onClick={() => navigate("/profile")}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={styles.submitBtn}
                disabled={loading || !editable}
              >
                {loading ? (isEditing ? "Saving..." : "Creating...") : (isEditing ? "Save Changes" : "Create Profile")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "var(--bg)",
    fontFamily: "Arial, sans-serif",
    color: "var(--text)",
  },

  navbar: {
    height: "70px",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(10px)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 40px",
    borderBottom: "1px solid var(--border)",
  },

  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  logo: {
    width: "45px",
  },

  logoText: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "var(--text-h)",
  },

  backBtn: {
    background: "transparent",
    color: "var(--text-h)",
    border: "1px solid var(--border)",
    padding: "10px 18px",
    borderRadius: "10px",
    cursor: "pointer",
  },

  main: {
    display: "flex",
    justifyContent: "center",
    padding: "40px 20px",
  },

  card: {
    width: "100%",
    maxWidth: "1000px",
    background: "var(--surface)",
    borderRadius: "24px",
    backdropFilter: "blur(12px)",
    padding: "40px",
    boxShadow: "var(--card-shadow)",
    border: "1px solid var(--border)",
  },

  title: {
    fontSize: "2.5rem",
    marginBottom: "10px",
    color: "var(--text-h)",
  },

  subtitle: {
    color: "var(--muted)",
    marginBottom: "30px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },

  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  label: {
    fontWeight: "600",
    fontSize: "0.95rem",
    color: "var(--text-h)",
  },

  input: {
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid var(--border)",
    background: "var(--surface-alt)",
    color: "var(--text)",
    fontSize: "1rem",
    outline: "none",
  },

  textarea: {
    minHeight: "120px",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid var(--border)",
    background: "var(--surface-alt)",
    color: "var(--text)",
    resize: "vertical",
    fontSize: "1rem",
    outline: "none",
  },

  locationTitle: {
    marginTop: "20px",
    fontSize: "1.5rem",
    color: "var(--text-h)",
  },

  mapContainer: {
    marginTop: "20px",
    borderRadius: "20px",
    overflow: "hidden",
    border: "2px solid var(--border)",
  },

  map: {
    border: "none",
  },

  buttonContainer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "15px",
    marginTop: "20px",
  },

  cancelBtn: {
    padding: "14px 24px",
    borderRadius: "12px",
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--text-h)",
    cursor: "pointer",
    fontWeight: "600",
  },

  submitBtn: {
    padding: "14px 24px",
    borderRadius: "12px",
    border: "none",
    background: "var(--primary)",
    color: "var(--cta-text)",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "1rem",
  },

  message: {
    padding: "14px",
    borderRadius: "12px",
    fontWeight: "600",
    marginBottom: "10px",
  },
  hiddenInput: {
    display: "none",
  },
  listItem: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  listInput: {
    flex: 1,
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid var(--border)",
    background: "var(--surface-alt)",
    color: "var(--text)",
    fontSize: "1rem",
    outline: "none",
    minWidth: "200px",
  },
  addButton: {
    marginTop: "10px",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--text-h)",
    cursor: "pointer",
    alignSelf: "flex-start",
  },
  removeButton: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "transparent",
    color: "var(--text-h)",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  bulletList: {
    margin: 0,
    paddingLeft: "20px",
    color: "var(--text)",
  },
  imageUploadCircle: {
    marginTop: "12px",
    width: "150px",
    height: "150px",
    borderRadius: "50%",
    border: "2px dashed var(--border)",
    backgroundColor: "var(--surface-alt)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    overflow: "hidden",
  },
  imageUploadPreview: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  uploadPlaceholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    color: "#cbd5e1",
    fontSize: "0.95rem",
    textAlign: "center",
  },
  uploadIcon: {
    fontSize: "1.8rem",
  },
  uploadText: {
    fontSize: "0.9rem",
  },
  imagePreviewWrapper: {
    marginTop: "12px",
    maxWidth: "160px",
    borderRadius: "16px",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  imagePreview: {
    width: "100%",
    height: "auto",
    display: "block",
  },
  hintText: {
    marginTop: "8px",
    fontSize: "0.9rem",
    color: "#d1d5db",
  },
  progressContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
  },
  progressLabel: {
    fontSize: "14px",
    color: "#cbd5e1",
    minWidth: "140px",
  },
  progressBar: {
    flex: 1,
    height: "12px",
    background: "rgba(255,255,255,0.08)",
    borderRadius: "8px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #16a34a 0%, #275791 100%)",
  },
  progressPercent: {
    minWidth: "48px",
    textAlign: "right",
    color: "#cbd5e1",
    fontWeight: "700",
  },
};

export default CreateJobseekerProfile;
