import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  fetchAllRegions,
  fetchProvincesByRegion,
  fetchCitiesByRegion,
  fetchBarangaysByCity,
  getRegionDisplayName,
  getCityDisplayName,
  getBarangayDisplayName,
} from "../../utils/psgcApi";

const companySizes = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001+",
];

const industries = [
  "Agriculture & Fisheries",
  "Business Process Outsourcing (BPO)",
  "Construction",
  "Creative & Media",
  "Education",
  "Energy & Utilities",
  "Engineering",
  "Finance & Banking",
  "Food & Beverage",
  "Government & Public Administration",
  "Healthcare & Pharmaceuticals",
  "Hospitality & Tourism",
  "Information Technology",
  "Insurance",
  "Legal Services",
  "Logistics & Transportation",
  "Manufacturing",
  "Marketing & Advertising",
  "Property & Real Estate",
  "Retail & Wholesale",
  "Security & Safety",
  "Telecommunications",
  "Textiles & Apparel",
  "Transportation & Automotive",
  "Wellness & Personal Care",
  "E-commerce & Online Retail",
  "Mining & Natural Resources",
  "Professional Services",
  "Nonprofit / NGO",
  "Other",
];

const CreateEmployerProfile = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editable, setEditable] = useState(true);
  const [formData, setFormData] = useState({
    companyName: "",
    companyDescription: "",
    companyLocation: {
      region: "",
      province: "",
      city: "",
      barangay: "",
      otherDetails: "",
    },
    companySize: "",
    industry: "",
    website: "",
    contactNumber: "",
    dateEstablished: "",
  });

  const [companyLogo, setCompanyLogo] = useState("");
  const [companyLogoPreview, setCompanyLogoPreview] = useState("");
  const [existingCompanyLogo, setExistingCompanyLogo] = useState("");

  const [companyPictures, setCompanyPictures] = useState([]);
  const [companyPicturePreviews, setCompanyPicturePreviews] = useState([]);
  const [existingCompanyPictures, setExistingCompanyPictures] = useState([]);

  const [companyPicture, setCompanyPicture] = useState("");
  const [companyPicturePreview, setCompanyPicturePreview] = useState("");
  const [existingCompanyPicture, setExistingCompanyPicture] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const [mapUrl, setMapUrl] = useState("");
  const [regions, setRegions] = useState([]);
  const [availableProvinces, setAvailableProvinces] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [availableBarangays, setAvailableBarangays] = useState([]);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingBarangays, setLoadingBarangays] = useState(false);
  const previousRegionRef = useRef("");
  const previousProvinceRef = useRef("");
  const previousCityRef = useRef("");

  // Check authorization on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth");
    }
  }, [navigate]);

  // Fetch all regions on mount
  useEffect(() => {
    const loadRegions = async () => {
      try {
        setLoadingRegions(true);
        const regionsData = await fetchAllRegions();
        setRegions(regionsData);
      } catch (error) {
        console.error("Failed to load regions:", error);
        showMessage("Error loading regions. Please refresh the page.", "error");
      } finally {
        setLoadingRegions(false);
      }
    };

    loadRegions();
  }, []);

  // Update available provinces and cities when region changes
  useEffect(() => {
    const selectedRegion = regions.find(
      (region) => region.name === formData.companyLocation.region
    );

    if (selectedRegion) {
      const loadLocationData = async () => {
        try {
          setLoadingProvinces(true);
          setLoadingCities(true);

          const [provincesData, citiesData] = await Promise.all([
            fetchProvincesByRegion(selectedRegion.code),
            fetchCitiesByRegion(selectedRegion.code),
          ]);

          setAvailableProvinces(provincesData);
          setAvailableCities(citiesData);
          setAvailableBarangays([]);

          if (
            previousRegionRef.current &&
            previousRegionRef.current !== formData.companyLocation.region
          ) {
            setFormData((prev) => ({
              ...prev,
              companyLocation: {
                ...prev.companyLocation,
                province: "",
                city: "",
                barangay: "",
              },
            }));
          }

          previousRegionRef.current = formData.companyLocation.region;
        } catch (error) {
          console.error("Failed to load provinces or cities:", error);
          showMessage("Error loading location data. Please try again.", "error");
        } finally {
          setLoadingProvinces(false);
          setLoadingCities(false);
        }
      };

      loadLocationData();
    } else {
      setAvailableProvinces([]);
      setAvailableCities([]);
      setAvailableBarangays([]);
    }
  }, [formData.companyLocation.region, regions]);

  useEffect(() => {
    if (!formData.companyLocation.province) {
      if (
        previousProvinceRef.current &&
        previousProvinceRef.current !== formData.companyLocation.province
      ) {
        setFormData((prev) => ({
          ...prev,
          companyLocation: {
            ...prev.companyLocation,
            city: "",
            barangay: "",
          },
        }));
        setAvailableBarangays([]);
      }
      previousProvinceRef.current = formData.companyLocation.province;
      return;
    }

    if (availableProvinces.length > 0) {
      if (
        previousProvinceRef.current &&
        previousProvinceRef.current !== formData.companyLocation.province
      ) {
        setFormData((prev) => ({
          ...prev,
          companyLocation: {
            ...prev.companyLocation,
            city: "",
            barangay: "",
          },
        }));
        setAvailableBarangays([]);
      }
    }
    previousProvinceRef.current = formData.companyLocation.province;
  }, [formData.companyLocation.province, availableProvinces]);

  // Update available barangays when city changes
  useEffect(() => {
    if (
      formData.companyLocation.city &&
      formData.companyLocation.region &&
      availableCities.length > 0
    ) {
      const selectedProvince = availableProvinces.find(
        (province) => province.name === formData.companyLocation.province
      );
      const filteredCities = selectedProvince
        ? availableCities.filter(
            (city) => city.provinceCode === selectedProvince.code
          )
        : availableCities;

      const selectedCity = filteredCities.find(
        (c) => c.name === formData.companyLocation.city
      );

      if (selectedCity) {
        const loadBarangays = async () => {
          try {
            setLoadingBarangays(true);
            const barangaysData = await fetchBarangaysByCity(selectedCity.code);
            setAvailableBarangays(barangaysData);

            if (
              previousCityRef.current &&
              previousCityRef.current !== formData.companyLocation.city
            ) {
              setFormData((prev) => ({
                ...prev,
                companyLocation: {
                  ...prev.companyLocation,
                  barangay: "",
                },
              }));
            }
          } catch (error) {
            console.error("Failed to load barangays:", error);
            showMessage("Error loading barangays. Please try again.", "error");
          } finally {
            setLoadingBarangays(false);
          }
        };

        loadBarangays();
      }
    } else {
      setAvailableBarangays([]);
    }
  }, [formData.companyLocation.city, availableCities, formData.companyLocation.region, formData.companyLocation.province, availableProvinces]);

  useEffect(() => {
    const location = `
      ${formData.companyLocation.otherDetails}
      ${formData.companyLocation.barangay}
      ${formData.companyLocation.city}
      ${formData.companyLocation.province}
      ${formData.companyLocation.region}
    `;

    const encodedLocation = encodeURIComponent(location);

    setMapUrl(
      `https://maps.google.com/maps?q=${encodedLocation}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    );
  }, [formData.companyLocation]);

  useEffect(() => {
    const fetchEmployerProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await axios.get(
          "http://localhost:8000/api/auth/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.data && response.data.data) {
          const existing = response.data.data;
          if (existing.role === "employer") {
            const hasEmployerData = Boolean(
              existing.companyName ||
              existing.companyDescription ||
              existing.companySize ||
              existing.industry ||
              existing.website ||
              existing.contactNumber ||
              existing.dateEstablished ||
              existing.companyLogo ||
              existing.companyLocation?.region ||
              existing.companyLocation?.city ||
              existing.companyLocation?.barangay ||
              existing.companyLocation?.otherDetails
            );

            setFormData({
              companyName: existing.companyName || "",
              companyDescription: existing.companyDescription || "",
              companyLocation: existing.companyLocation || {
                region: "",
                city: "",
                barangay: "",
                otherDetails: "",
              },
              companySize: existing.companySize || "",
              industry: existing.industry || "",
              website: existing.website || "",
              contactNumber: existing.contactNumber || "",
              dateEstablished: existing.dateEstablished
                ? existing.dateEstablished.split("T")[0]
                : "",
            });
            if (existing.companyLogo) {
              setExistingCompanyLogo(existing.companyLogo);
              setCompanyLogoPreview(existing.companyLogo);
            }

            const picturesFromBackend = Array.isArray(existing.companyPictures)
              ? existing.companyPictures
              : existing.companyPicture
              ? [existing.companyPicture]
              : [];

            if (picturesFromBackend.length) {
              setExistingCompanyPictures(picturesFromBackend);
              setCompanyPicturePreviews(picturesFromBackend);
            } else if (existing.companyPicture) {
              setExistingCompanyPicture(existing.companyPicture);
              setCompanyPicturePreview(existing.companyPicture);
            }

            setIsEditing(hasEmployerData);
            setEditable(!hasEmployerData);
          }
        }
      } catch (error) {
        console.error("Unable to prefill employer profile:", error);
      }
    };

    fetchEmployerProfile();
  }, []);

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3000);
  };

  const computeCompletion = (data) => {
    const isFilled = (v) => {
      if (v == null) return false;
      if (typeof v === "string") return v.trim().length > 0;
      if (typeof v === "number") return !Number.isNaN(v);
      if (typeof v === "boolean") return v;
      return !!v;
    };

    const fields = [
      data?.companyName,
      data?.companyDescription,
      data?.companySize,
      data?.industry,
      data?.website,
      data?.contactNumber,
      data?.dateEstablished,
      data?.companyLocation?.region,
      data?.companyLocation?.province,
      data?.companyLocation?.city,
      data?.companyLocation?.barangay,
      data?.companyLocation?.otherDetails,
      // include the in-component `companyLogo` state as well
      companyLogo || existingCompanyLogo,
      // companyPicture is optional, don't count it towards completion
    ];

    const filled = fields.reduce((c, v) => c + (isFilled(v) ? 1 : 0), 0);
    return Math.round((filled / fields.length) * 100);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("companyLocation.")) {
      const locationField = name.split(".")[1];

      setFormData((prev) => ({
        ...prev,
        companyLocation: {
          ...prev.companyLocation,
          [locationField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];

    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setCompanyLogo(reader.result);
        setCompanyLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      showMessage("Please select a valid image file", "error");
    }
  };

  const handleCompanyPictureChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const invalidFile = files.find((file) => !file.type.startsWith("image/"));
    if (invalidFile) {
      showMessage("Please select only image files", "error");
      return;
    }

    const readers = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((results) => {
      setCompanyPictures((prev) => [...prev, ...results]);
      setCompanyPicturePreviews((prev) => [...prev, ...results]);
      // keep existingCompanyPictures intact so new photos are added, not replaced
      setCompanyPicture("");
      setCompanyPicturePreview("");
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        showMessage("Please login first", "error");
        setLoading(false);
        return;
      }

      const payload = {
        companyName: formData.companyName,
        companyDescription: formData.companyDescription,
        companyLocation: formData.companyLocation,
        companySize: formData.companySize,
        industry: formData.industry,
        website: formData.website,
        contactNumber: formData.contactNumber,
        dateEstablished: formData.dateEstablished,
        companyLogo: companyLogo || existingCompanyLogo || "",
        companyPictures: companyPictures.length
          ? companyPictures
          : existingCompanyPictures.length
          ? existingCompanyPictures
          : companyPicture
          ? [companyPicture]
          : [],
        companyPicture: companyPicture || existingCompanyPicture || "",
      };

      const response = await axios.put(
        "http://localhost:8000/api/employer/profile",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const storedUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      const updatedProfile = response.data?.data || payload;

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...storedUser,
          ...updatedProfile,
          companyLogo: updatedProfile.companyLogo,
          companyPicture: updatedProfile.companyPicture,
          companyLocation: updatedProfile.companyLocation,
          dateEstablished: updatedProfile.dateEstablished,
        })
      );

      setFormData((prev) => ({
        ...prev,
        ...updatedProfile,
        companyLocation: updatedProfile.companyLocation || prev.companyLocation,
        dateEstablished: updatedProfile.dateEstablished
          ? updatedProfile.dateEstablished.split("T")[0]
          : prev.dateEstablished,
      }));

      if (updatedProfile.companyLogo) {
        setExistingCompanyLogo(updatedProfile.companyLogo);
        setCompanyLogoPreview(updatedProfile.companyLogo);
      }

      const savedPictures = Array.isArray(updatedProfile.companyPictures)
        ? updatedProfile.companyPictures
        : updatedProfile.companyPicture
        ? [updatedProfile.companyPicture]
        : [];

      if (savedPictures.length) {
        setExistingCompanyPictures(savedPictures);
        setCompanyPicturePreviews(savedPictures);
        setExistingCompanyPicture("");
        setCompanyPicturePreview("");
      } else if (updatedProfile.companyPicture) {
        setExistingCompanyPicture(updatedProfile.companyPicture);
        setCompanyPicturePreview(updatedProfile.companyPicture);
      }

      setIsEditing(true);
      setEditable(false);

      showMessage(
        isEditing
          ? "Company profile updated successfully!"
          : "Company profile created successfully!",
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

  const selectedProvince = availableProvinces.find(
    (province) => province.name === formData.companyLocation.province
  );

  const filteredCities = selectedProvince
    ? availableCities.filter(
        (city) => city.provinceCode === selectedProvince.code
      )
    : availableCities;

  return (
    <div className="page-container" style={styles.container}>
      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
        <button style={styles.backBtn} onClick={() => navigate("/profile")}>← Back</button>
      </div>
      {/* MAIN */}
      <div style={styles.main}>
        <div style={styles.card}>
          {/* LEFT */}
          <div style={styles.leftSide}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h1 style={styles.title}>
                {isEditing ? "Edit Company Profile" : "Create Company Profile"}
              </h1>
              {isEditing && !editable && (
                <button
                  onClick={() => setEditable(true)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "none",
                    background: "#275791",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  Edit
                </button>
              )}
              {isEditing && editable && (
                <button
                  onClick={() => setEditable(false)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "transparent",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <p style={styles.subtitle}>
              Complete your employer information
            </p>

            <div style={{ marginBottom: 12 }}>
              {(() => {
                const completion = computeCompletion(formData);
                return (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: "#cbd5e1" }}>Profile Completion</span>
                    </div>
                    <div style={{ height: 10, background: "rgba(255,255,255,0.08)", borderRadius: 6, overflow: "hidden" }}>
                      <div style={{ height: 10, width: `${completion}%`, background: completion === 100 ? "#22c55e" : "#275791" }} />
                    </div>
                  </>
                );
              })() }
            </div>
            {message && (
              <div
                style={{
                  ...styles.message,
                  backgroundColor:
                    messageType === "error"
                      ? "#ffe5e5"
                      : "#e5ffe8",
                  color:
                    messageType === "error"
                      ? "#c0392b"
                      : "#27ae60",
                }}
              >
                {message}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              style={styles.form}
            >
              {/* Company Name */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Company Name
                </label>

                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="Enter company name"
                  style={styles.input}
                  required
                  disabled={!editable}
                />
              </div>

              {/* Company Logo */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Company Logo
                </label>

                <input
                  id="employerCompanyLogoInput"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  style={styles.hiddenInput}
                  disabled={!editable}
                />

                <label
                  htmlFor="employerCompanyLogoInput"
                  style={styles.imageUploadCircle}
                >
                  {(companyLogoPreview || existingCompanyLogo) ? (
                    <img
                      src={companyLogoPreview || existingCompanyLogo}
                      alt="Logo preview"
                      style={styles.imageUploadPreview}
                    />
                  ) : (
                    <div style={styles.uploadPlaceholder}>
                      <span style={styles.uploadIcon} aria-hidden>
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: 28, height: 28 }}>
                          <path d="M4 7h3l2-2h6l2 2h3v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                      </span>
                      <span style={styles.uploadText}>
                        Click to upload
                      </span>
                    </div>
                  )}
                </label>
              </div>

              {/* Company Picture (Building/Location) */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Company Building/Location Photo (Optional)
                </label>

                <input
                  id="employerCompanyPictureInput"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleCompanyPictureChange}
                  style={styles.hiddenInput}
                  disabled={!editable}
                />

                <label
                  htmlFor="employerCompanyPictureInput"
                  style={styles.imageUploadRectangle}
                >
                  {(companyPicturePreviews.length || existingCompanyPictures.length) ? (
                    <div style={styles.imageUploadGalleryPlaceholder}>
                      <span style={styles.uploadIcon} aria-hidden>
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: 28, height: 28 }}>
                          <path d="M3 7h3l2-2h6l2 2h3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                      </span>
                      <span style={styles.uploadText}>
                        Add more photos
                      </span>
                    </div>
                  ) : (
                    <div style={styles.uploadPlaceholder}>
                      <span style={styles.uploadIcon} aria-hidden>
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: 28, height: 28 }}>
                          <path d="M4 21V3h10v18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          <path d="M14 7h4v4h-4zM14 13h4v4h-4zM6 11h2v2H6zM6 7h2v2H6z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                      </span>
                      <span style={styles.uploadText}>
                        Upload photos
                      </span>
                    </div>
                  )}
                </label>

                {(companyPicturePreviews.length > 0 || existingCompanyPictures.length > 0) && (
                  <div style={styles.imageGallery}>
                    {([...(existingCompanyPictures || []), ...(companyPicturePreviews || [])]).map((pictureSrc, index) => (
                      <div key={index} style={styles.imageThumbnailWrapper}>
                        <img
                          src={pictureSrc}
                          alt={`Company picture ${index + 1}`}
                          style={styles.imageThumbnail}
                        />
                        <button
                          type="button"
                          style={styles.imageViewButton}
                          onClick={() => window.open(pictureSrc, '_blank', 'noopener')}
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Company Description
                </label>

                <textarea
                  name="companyDescription"
                  value={formData.companyDescription}
                  onChange={handleInputChange}
                  placeholder="Tell us about your company"
                  style={styles.textarea}
                  disabled={!editable}
                />
              </div>

              {/* Industry */}
              <div style={styles.grid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Industry
                  </label>

                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    style={{ ...styles.input, ...styles.selectInput }}
                    disabled={!editable}
                  >
                    <option value="">
                      Select Industry
                    </option>

                    {industries.map((industry) => (
                      <option
                        key={industry}
                        value={industry}
                      >
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Company Size
                  </label>

                  <select
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleInputChange}
                    style={{ ...styles.input, ...styles.selectInput }}
                    disabled={!editable}
                  >
                    <option value="">
                      Select Size
                    </option>

                    {companySizes.map((size) => (
                      <option
                        key={size}
                        value={size}
                      >
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Website */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Website
                </label>

                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  style={styles.input}
                  disabled={!editable}
                />
              </div>

              {/* Contact */}
              <div style={styles.grid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Contact Number
                  </label>

                  <input
                    type="text"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    placeholder="09xxxxxxxxx"
                    style={styles.input}
                    disabled={!editable}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Established
                  </label>

                  <input
                    type="date"
                    name="dateEstablished"
                    value={formData.dateEstablished}
                    onChange={handleInputChange}
                    style={styles.input}
                    disabled={!editable}
                  />
                </div>
              </div>

              {/* LOCATION */}
              <h2 style={styles.locationTitle}>
                Company Location
              </h2>

              <div style={styles.grid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Region
                  </label>

                  <select
                    name="companyLocation.region"
                    value={
                      formData.companyLocation.region
                    }
                    onChange={handleInputChange}
                    style={{ ...styles.input, ...styles.selectInput }}
                    disabled={!editable || loadingRegions}
                  >
                    <option value="">
                      {loadingRegions ? "Loading regions..." : "Select Region"}
                    </option>

                    {regions.map((region) => (
                      <option
                        key={region.code}
                        value={region.name}
                      >
                        {region.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Province
                  </label>

                  <select
                    name="companyLocation.province"
                    value={formData.companyLocation.province}
                    onChange={handleInputChange}
                    style={{ ...styles.input, ...styles.selectInput }}
                    disabled={!editable || !formData.companyLocation.region || loadingProvinces}
                  >
                    <option value="">
                      {loadingProvinces
                        ? "Loading provinces..."
                        : formData.companyLocation.region
                        ? "Select Province"
                        : "Please select a region first"}
                    </option>

                    {availableProvinces.map((province) => (
                      <option key={province.code} value={province.name}>
                        {province.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.grid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    City
                  </label>

                  <select
                    name="companyLocation.city"
                    value={formData.companyLocation.city}
                    onChange={handleInputChange}
                    style={{ ...styles.input, ...styles.selectInput }}
                    disabled={!editable || !formData.companyLocation.region || loadingCities}
                  >
                    <option value="">
                      {loadingCities
                        ? "Loading cities..."
                        : formData.companyLocation.region
                        ? "Select City"
                        : "Please select a region first"}
                    </option>

                    {filteredCities.map((city) => (
                      <option key={city.code} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Barangay
                  </label>

                  <select
                    name="companyLocation.barangay"
                    value={formData.companyLocation.barangay}
                    onChange={handleInputChange}
                    style={{ ...styles.input, ...styles.selectInput }}
                    disabled={!editable || !formData.companyLocation.city || loadingBarangays}
                  >
                    <option value="">
                      {loadingBarangays
                        ? "Loading barangays..."
                        : formData.companyLocation.city
                        ? "Select Barangay"
                        : "Please select a city first"}
                    </option>

                    {availableBarangays.map((barangay) => (
                      <option key={barangay.code} value={barangay.name}>
                        {barangay.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.grid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Other Details
                  </label>

                  <input
                    type="text"
                    name="companyLocation.otherDetails"
                    value={
                      formData.companyLocation
                        .otherDetails
                    }
                    onChange={handleInputChange}
                    placeholder="Street / Building"
                    style={styles.input}
                    disabled={!editable}
                  />
                </div>
              </div>

              {/* GOOGLE MAP */}
              <div style={styles.mapContainer}>
                <iframe
                  title="Google Map"
                  width="100%"
                  height="300"
                  style={styles.map}
                  loading="lazy"
                  allowFullScreen
                  src={mapUrl}
                ></iframe>
              </div>

              {/* BUTTONS */}
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
                  {loading
                    ? isEditing
                      ? "Saving..."
                      : "Creating..."
                    : isEditing
                    ? "Save Changes"
                    : "Create Profile"}
                </button>
              </div>
            </form>
          </div>
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
    maxWidth: "1100px",
    background: "var(--surface)",
    borderRadius: "24px",
    backdropFilter: "blur(12px)",
    padding: "40px",
    boxShadow: "var(--card-shadow)",
    border: "1px solid var(--border)",
  },

  leftSide: {
    width: "100%",
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
    boxShadow: "inset 0 0 0 1px var(--border)",
    background: "var(--surface-alt)",
    color: "var(--text)",
    fontSize: "1rem",
    outline: "none",
  },

  selectInput: {
    appearance: "none",
    paddingRight: "44px",
    backgroundImage:
      "linear-gradient(45deg, transparent 50%, #64748b 50%), linear-gradient(135deg, #64748b 50%, transparent 50%)",
    backgroundPosition: "calc(100% - 20px) calc(50% - 6px), calc(100% - 14px) calc(50% - 6px)",
    backgroundSize: "8px 8px, 8px 8px",
    backgroundRepeat: "no-repeat",
  },

  textarea: {
    minHeight: "120px",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid var(--border)",
    boxShadow: "inset 0 0 0 1px var(--border)",
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

  hiddenInput: {
    display: "none",
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
  imageUploadRectangle: {
    marginTop: "12px",
    width: "100%",
    height: "220px",
    borderRadius: "16px",
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
    maxWidth: "180px",
    borderRadius: "16px",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.15)",
  },

  imagePreview: {
    width: "100%",
    display: "block",
  },

  imageGallery: {
    marginTop: "16px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "12px",
    gridAutoRows: "160px",
  },

  imageThumbnailWrapper: {
    position: "relative",
    borderRadius: "16px",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  imageThumbnail: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  imageViewButton: {
    position: "absolute",
    bottom: "8px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "6px 12px",
    borderRadius: "999px",
    backgroundColor: "rgba(0,0,0,0.65)",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontSize: "0.85rem",
  },

  imageUploadGalleryPlaceholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    color: "#94a3b8",
    fontSize: "0.95rem",
    textAlign: "center",
  },

  message: {
    borderRadius: "12px",
    fontWeight: "600",
    marginBottom: "10px",
  },
};

export default CreateEmployerProfile;
