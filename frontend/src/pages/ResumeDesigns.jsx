import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ThemeContext } from '../contexts/ThemeContext';
import './ResumeDesigns.css';

const HeartIcon = ({ filled = false, size = 20 }) => (
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

const ArrowIcon = ({ size = 18 }) => (
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

const DocumentIcon = ({ size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="16" y2="17" />
  </svg>
);

// Sample resume designs
const RESUME_DESIGNS = [
  {
    id: 1,
    name: 'Classic Professional',
    description: 'Clean and professional design with a modern touch. Perfect for corporate roles.',
    color: '#275791',
    features: ['Two-column layout', 'Accent color bar', 'Clean typography'],
    preview: 'classic-professional'
  },
  {
    id: 2,
    name: 'Creative Minimal',
    description: 'Minimalist design with strategic use of whitespace. Great for creative fields.',
    color: '#0f766e',
    features: ['Minimal design', 'Icons for sections', 'Bold headings'],
    preview: 'creative-minimal'
  },
  {
    id: 3,
    name: 'Modern Tech',
    description: 'Tech-forward design with modern aesthetics. Ideal for IT and tech professionals.',
    color: '#6366f1',
    features: ['Technical layout', 'Skill bars', 'Project highlights'],
    preview: 'modern-tech'
  },
  {
    id: 4,
    name: 'Executive Premium',
    description: 'Premium design for executive and senior positions. Sophisticated and polished.',
    color: '#7c3aed',
    features: ['Premium layout', 'Achievement focus', 'Leadership emphasis'],
    preview: 'executive-premium'
  },
  {
    id: 5,
    name: 'Academic Scholar',
    description: 'Academic-focused design for researchers and educators. Research-oriented layout.',
    color: '#0891b2',
    features: ['Publication section', 'Research focus', 'Academic format'],
    preview: 'academic-scholar'
  },
  {
    id: 6,
    name: 'Creative Vibrant',
    description: 'Vibrant and colorful design. Perfect for designers and creative professionals.',
    color: '#dc2626',
    features: ['Colorful accents', 'Portfolio section', 'Visual hierarchy'],
    preview: 'creative-vibrant'
  },
];

export default function ResumeDesigns() {
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext);
  const [likedDesigns, setLikedDesigns] = useState(new Set());
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [step, setStep] = useState('confirm'); // 'confirm' or 'info'
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const progressIntervalRef = useRef(null);
  const [resumeUrl, setResumeUrl] = useState(null);
  
  // Additional info state
  const [references, setReferences] = useState([{ name: '', contact: '' }]);
  const [extracurricular, setExtracurricular] = useState(['']);

  const token = localStorage.getItem('token');
  const user = token ? JSON.parse(localStorage.getItem('user') || '{}') : null;

  // Load liked designs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('likedResumeDesigns');
    if (saved) {
      setLikedDesigns(new Set(JSON.parse(saved)));
    }
  }, []);

  // Check user role
  useEffect(() => {
    if (!token || user?.role !== 'jobseeker') {
      navigate('/');
    }
  }, [token, user, navigate]);

  const toggleLike = (designId) => {
    const updated = new Set(likedDesigns);
    if (updated.has(designId)) {
      updated.delete(designId);
    } else {
      updated.add(designId);
    }
    setLikedDesigns(updated);
    localStorage.setItem('likedResumeDesigns', JSON.stringify(Array.from(updated)));
  };

  const handleGenerateResume = (design) => {
    setSelectedDesign(design);
    setStep('info'); // Start with info form
    setShowPreview(true);
    setGenerating(false);
    setProgress(0);
    setResumeUrl(null);
    // Reset form
    setReferences([{ name: '', contact: '' }]);
    setExtracurricular(['']);
  };

  const handleAddReference = () => {
    setReferences([...references, { name: '', contact: '' }]);
  };

  const handleRemoveReference = (idx) => {
    setReferences(references.filter((_, i) => i !== idx));
  };

  const handleReferenceChange = (idx, field, value) => {
    const updated = [...references];
    updated[idx][field] = value;
    setReferences(updated);
  };

  const handleAddExtracurricular = () => {
    setExtracurricular([...extracurricular, '']);
  };

  const handleRemoveExtracurricular = (idx) => {
    setExtracurricular(extracurricular.filter((_, i) => i !== idx));
  };

  const handleExtracurricularChange = (idx, value) => {
    const updated = [...extracurricular];
    updated[idx] = value;
    setExtracurricular(updated);
  };

  const handleNextStep = () => {
    setStep('confirm');
  };

  const handleBackStep = () => {
    setStep('info');
  };

  const stopProgressAnimation = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const startProgressAnimation = () => {
    stopProgressAnimation();
    setProgressStatus('Preparing your resume...');
    setProgress(5);
    // Smooth deterministic increments to avoid big jumps in percent
    progressIntervalRef.current = setInterval(() => {
      setProgress((current) => {
        if (current >= 45) return current;
        // small steady increments early on
        const next = current + Math.ceil(Math.random() * 3);
        return next > 45 ? 45 : next;
      });
    }, 400);
  };

  useEffect(() => {
    return () => {
      stopProgressAnimation();
    };
  }, []);

  const confirmGenerateResume = async () => {
    if (!selectedDesign) return;
    if (user?.role === 'jobseeker' && !user?.premiumAIAccess) {
      alert('This feature is available to AI Premium members only. Please upgrade to continue.');
      navigate('/ai-premium');
      return;
    }
    setGenerating(true);
    startProgressAnimation();
    setProgress(10);
    setProgressStatus('Sending resume request...');

    try {
      const cleanReferences = references.filter(ref => ref.name.trim() || ref.contact.trim());
      const cleanExtracurricular = extracurricular.filter(e => e.trim());

      const response = await axios.post(
        'http://localhost:8000/api/jobseeker/resume',
        {
          designId: selectedDesign.id,
          designName: selectedDesign.name,
          template: selectedDesign.preview,
          color: selectedDesign.color,
          references: cleanReferences,
          extracurricular: cleanExtracurricular,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Advance to mid-progress once server accepted the job
      setProgress(55);
      setProgressStatus('Building your resume PDF...');

      const url = response?.data?.url || response?.data?.publicUrl;
      if (url) {
        setResumeUrl(url);
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            parsed.resume = url;
            localStorage.setItem('user', JSON.stringify(parsed));
          }
        } catch (e) {
          console.warn('Failed to update stored user resume URL', e);
        }
      }

      stopProgressAnimation();
      // Smoothly animate finalization
      setProgress(80);
      setProgressStatus('Finalizing PDF and preparing download...');
      // small delay to show finalization
      setTimeout(() => {
        setProgress(95);
        setProgressStatus('Almost done...');
        setTimeout(() => {
          setProgress(100);
          setProgressStatus('Resume generation complete!');
          setTimeout(() => {
            setGenerating(false);
          }, 400);
        }, 450);
      }, 450);
    } catch (error) {
      console.error('Error creating resume:', error);
      stopProgressAnimation();
      setProgress(0);
      setProgressStatus('');
      setGenerating(false);
      alert('Failed to create resume. Please try again.');
    }
  };

  return (
    <div className="page-container"
      style={{
        ...styles.container,
        backgroundColor: isDarkMode ? '#1a1a1a' : '#f8fafc',
        color: isDarkMode ? '#ffffff' : '#000',
      }}
    >
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Resume Design Gallery</h1>
        <p style={styles.subtitle}>
          Choose from professionally designed resume templates. Like your favorites and generate your resume!
        </p>
      </div>

      {/* Stats */}
      <div style={styles.statsBar}>
        <div style={styles.statItem}>
          <span style={styles.statNumber}>{RESUME_DESIGNS.length}</span>
          <span style={styles.statLabel}>Design Templates</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statNumber}>{likedDesigns.size}</span>
          <span style={styles.statLabel}>Liked Designs</span>
        </div>
      </div>

      {/* Designs Grid */}
      <div style={styles.grid}>
        {RESUME_DESIGNS.map((design) => (
          <div
            key={design.id}
            style={{
              ...styles.designCard,
              backgroundColor: isDarkMode ? '#0f0f0f' : '#ffffff',
              borderColor: isDarkMode ? '#333' : '#e5e7eb',
            }}
          >
            {/* Preview */}
            <div
              style={{
                ...styles.preview,
                backgroundColor: design.color,
              }}
            >
              <div style={styles.previewContent}>
                <div style={styles.previewName}>{design.name}</div>
                <div style={styles.previewIcon}><DocumentIcon size={28} /></div>
              </div>
            </div>

            {/* Content */}
            <div style={styles.content}>
              <h3 style={styles.designName}>{design.name}</h3>
              <p style={{
                ...styles.description,
                color: isDarkMode ? '#cbd5e1' : '#64748b',
              }}>
                {design.description}
              </p>

              {/* Features */}
              <div style={styles.features}>
                {design.features.map((feature, idx) => (
                  <span
                    key={idx}
                    style={{
                      ...styles.feature,
                      backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6',
                      color: isDarkMode ? '#e5e7eb' : '#374151',
                    }}
                  >
                    {feature}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div style={styles.actions}>
                <button
                  onClick={() => toggleLike(design.id)}
                  style={{
                    ...styles.likeButton,
                    backgroundColor: likedDesigns.has(design.id)
                      ? '#fee2e2'
                      : isDarkMode ? '#1f2937' : '#f3f4f6',
                    color: likedDesigns.has(design.id) ? '#dc2626' : isDarkMode ? '#e5e7eb' : '#374151',
                  }}
                  title={likedDesigns.has(design.id) ? 'Unlike' : 'Like'}
                >
                  <HeartIcon filled={likedDesigns.has(design.id)} size={18} />
                  <span>{likedDesigns.has(design.id) ? 'Liked' : 'Like'}</span>
                </button>
                <button
                  onClick={() => handleGenerateResume(design)}
                  style={styles.generateButton}
                >
                  <span>Generate</span>
                  <ArrowIcon size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedDesign && (
        <div
          className="modal-overlay"
          style={styles.modalOverlay}
          onClick={() => {
            if (generating) return;
            setShowPreview(false);
            setSelectedDesign(null);
            setProgress(0);
            setStep('confirm');
          }}
        >
          <div
            className="modal-card"
            style={{
              ...styles.modalCard,
              backgroundColor: isDarkMode ? '#0f0f0f' : '#ffffff',
              maxWidth: step === 'info' ? '800px' : '500px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Info Form Step */}
            {step === 'info' && !generating && !resumeUrl && (
              <>
                <h2 style={styles.modalTitle}>Add Additional Information</h2>
                <p style={{ ...styles.modalText, color: isDarkMode ? '#cbd5e1' : '#64748b', marginBottom: '24px' }}>
                  Add your references and extracurricular activities to enhance your resume.
                </p>

                {/* References Section */}
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: isDarkMode ? '#e5e7eb' : '#1f2937' }}>
                    References
                  </h3>
                  {references.map((ref, idx) => (
                    <div key={idx} style={{ marginBottom: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                      <input
                        type="text"
                        placeholder="Reference Name"
                        value={ref.name}
                        onChange={(e) => handleReferenceChange(idx, 'name', e.target.value)}
                        style={{
                          ...styles.input,
                          backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6',
                          color: isDarkMode ? '#e5e7eb' : '#111827',
                          borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Contact Number"
                        value={ref.contact}
                        onChange={(e) => handleReferenceChange(idx, 'contact', e.target.value)}
                        style={{
                          ...styles.input,
                          backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6',
                          color: isDarkMode ? '#e5e7eb' : '#111827',
                          borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                        }}
                      />
                      {references.length > 1 && (
                        <button
                          onClick={() => handleRemoveReference(idx)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={handleAddReference}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                      marginTop: '8px',
                    }}
                  >
                    + Add Reference
                  </button>
                </div>

                {/* Extracurricular Section */}
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: isDarkMode ? '#e5e7eb' : '#1f2937' }}>
                    Extracurricular Activities
                  </h3>
                  {extracurricular.map((activity, idx) => (
                    <div key={idx} style={{ marginBottom: '12px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'end' }}>
                      <input
                        type="text"
                        placeholder="Activity Name"
                        value={activity}
                        onChange={(e) => handleExtracurricularChange(idx, e.target.value)}
                        style={{
                          ...styles.input,
                          backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6',
                          color: isDarkMode ? '#e5e7eb' : '#111827',
                          borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                        }}
                      />
                      {extracurricular.length > 1 && (
                        <button
                          onClick={() => handleRemoveExtracurricular(idx)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={handleAddExtracurricular}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#275791',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                      marginTop: '8px',
                    }}
                  >
                    + Add Activity
                  </button>
                </div>

                {/* Buttons */}
                <div style={{ ...styles.modalActions, justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    style={{
                      ...styles.cancelButton,
                      backgroundColor: isDarkMode ? '#1f2937' : '#e5e7eb',
                      color: isDarkMode ? '#e5e7eb' : '#374151',
                    }}
                    onClick={() => {
                      setShowPreview(false);
                      setSelectedDesign(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    style={styles.confirmButton}
                    onClick={handleNextStep}
                  >
                    Next
                  </button>
                </div>
              </>
            )}

            {/* Confirm Step */}
            {step === 'confirm' && !generating && !resumeUrl && (
              <>
                <h2 style={styles.modalTitle}>Generate Resume</h2>
                <p style={{
                  ...styles.modalText,
                  color: isDarkMode ? '#cbd5e1' : '#64748b',
                }}>
                  You're about to create a new resume using the <strong>{selectedDesign.name}</strong> template.
                </p>

                <div style={{
                  ...styles.previewBox,
                  backgroundColor: selectedDesign.color,
                }}>
                  <div style={styles.previewBoxContent}>
                    <div style={styles.previewBoxName}>{selectedDesign.name}</div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 220, padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: '#fff' }}>
                        <div style={{ height: 12, width: '70%', background: 'rgba(255,255,255,0.18)', borderRadius: 6, marginBottom: 8 }} />
                        <div style={{ height: 8, width: '50%', background: 'rgba(255,255,255,0.12)', borderRadius: 6, marginBottom: 10 }} />
                        <div style={{ height: 8, width: '90%', background: 'rgba(255,255,255,0.08)', borderRadius: 6, marginBottom: 6 }} />
                        <div style={{ height: 8, width: '90%', background: 'rgba(255,255,255,0.08)', borderRadius: 6 }} />
                      </div>
                      <div style={styles.previewBoxIcon}><DocumentIcon size={32} /></div>
                    </div>
                  </div>
                </div>
                <p style={{
                  ...styles.modalDescription,
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                }}>
                  {selectedDesign.description}
                </p>

                <div style={styles.modalActions}>
                  <button
                    style={{
                      ...styles.cancelButton,
                      backgroundColor: isDarkMode ? '#1f2937' : '#e5e7eb',
                      color: isDarkMode ? '#e5e7eb' : '#374151',
                    }}
                    onClick={handleBackStep}
                  >
                    Back
                  </button>
                  {user?.role === 'jobseeker' ? (
                    user?.premiumAIAccess ? (
                      <button
                        style={styles.confirmButton}
                        onClick={confirmGenerateResume}
                      >
                        Generate Resume
                      </button>
                    ) : (
                      <button
                        style={{ ...styles.confirmButton, backgroundColor: '#10b981' }}
                        onClick={() => navigate('/ai-premium')}
                        title="Upgrade to Premium to unlock resume generation"
                      >
                        Upgrade to Premium
                      </button>
                    )
                  ) : (
                    <button
                      style={{ ...styles.confirmButton, opacity: 0.6, cursor: 'not-allowed' }}
                      disabled
                    >
                      Generate Resume
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Progress area */}
            {generating && (
              <div className="resume-loading-area">
                <div className="resume-loading-bar-wrap">
                  <div
                    className="resume-loading-bar"
                    style={{ width: `${Math.min(Math.max(Math.round(progress), 0), 100)}%` }}
                  />
                </div>
              </div>
            )}

            {!generating && resumeUrl && (
              <div style={{ marginBottom: 12 }}>
                <div style={styles.resumeReadyCard}>
                  <div style={styles.resumeReadyHeader}>
                    <div style={styles.checkCircle}>✓</div>
                    <div>
                      <div style={styles.resumeReadyTitle}>Resume ready</div>
                      <div style={styles.resumeReadySubtitle}>Your resume is ready to download.</div>
                    </div>
                  </div>
                  <div style={styles.resumeReadyActions}>
                    <a href={resumeUrl} target="_blank" rel="noreferrer" style={styles.viewButton}>View Resume</a>
                    <button
                      style={styles.closeButton}
                      onClick={() => {
                        setShowPreview(false);
                        setSelectedDesign(null);
                        setProgress(0);
                        setStep('confirm');
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    padding: '40px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: {
    maxWidth: '1200px',
    margin: '0 auto 40px',
    textAlign: 'center',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 800,
    margin: '0 0 12px 0',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#64748b',
    margin: 0,
  },
  statsBar: {
    maxWidth: '1200px',
    margin: '0 auto 40px',
    display: 'flex',
    gap: '40px',
    justifyContent: 'center',
    padding: '24px',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderRadius: '16px',
  },
  statItem: {
    textAlign: 'center',
  },
  statNumber: {
    display: 'block',
    fontSize: '2rem',
    fontWeight: 800,
    color: '#6366f1',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '0.9rem',
    color: '#64748b',
  },
  grid: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px',
  },
  designCard: {
    borderRadius: '16px',
    border: '1px solid',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
  },
  preview: {
    height: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  previewContent: {
    textAlign: 'center',
    color: '#ffffff',
    zIndex: 1,
  },
  previewName: {
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '12px',
  },
  previewIcon: {
    fontSize: '48px',
  },
  content: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    flex: 1,
  },
  designName: {
    fontSize: '18px',
    fontWeight: 700,
    margin: 0,
  },
  description: {
    fontSize: '14px',
    margin: 0,
    lineHeight: '1.5',
  },
  features: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  feature: {
    fontSize: '12px',
    fontWeight: 500,
    padding: '6px 12px',
    borderRadius: '8px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: 'auto',
  },
  likeButton: {
    flex: 1,
    padding: '12px 16px',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
  },
  generateButton: {
    flex: 1,
    padding: '12px 16px',
    border: 'none',
    borderRadius: '12px',
    backgroundColor: '#6366f1',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalCard: {
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '500px',
    width: '90vw',
    maxHeight: '85vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: 700,
    margin: '0 0 16px 0',
  },
  modalText: {
    fontSize: '15px',
    margin: '0 0 24px 0',
    lineHeight: '1.6',
  },
  previewBox: {
    height: '160px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
    overflow: 'hidden',
  },
  previewBoxContent: {
    textAlign: 'center',
    color: '#ffffff',
  },
  previewBoxName: {
    fontSize: '16px',
    fontWeight: 700,
    marginBottom: '12px',
  },
  previewBoxIcon: {
    fontSize: '40px',
  },
  modalDescription: {
    fontSize: '14px',
    margin: '0 0 24px 0',
    lineHeight: '1.6',
  },
  progressContainer: {
    marginBottom: 22,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resumeReadyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    boxShadow: '0 8px 30px rgba(2,6,23,0.18)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    alignItems: 'stretch',
  },
  resumeReadyHeader: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },
  checkCircle: {
    width: 44,
    height: 44,
    borderRadius: 999,
    background: 'linear-gradient(90deg,#6366f1,#8b5cf6)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 18,
  },
  resumeReadyTitle: {
    fontSize: 18,
    fontWeight: 800,
  },
  resumeReadySubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  resumeReadyActions: {
    display: 'flex',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  viewButton: {
    padding: '10px 18px',
    borderRadius: 10,
    background: 'linear-gradient(90deg,#6d28d9,#8b5cf6)',
    color: '#fff',
    textDecoration: 'none',
    fontWeight: 700,
  },
  closeButton: {
    padding: '10px 18px',
    borderRadius: 10,
    background: '#6b7280',
    color: '#fff',
    border: 'none',
    fontWeight: 700,
    cursor: 'pointer',
  },
  progressBarOuter: {
    width: '100%',
    height: 10,
    backgroundColor: '#e6e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    background: 'linear-gradient(90deg,#6366f1,#8b5cf6)',
    borderRadius: 8,
    transition: 'width 0.6s ease',
    boxShadow: '0 0 16px rgba(99,102,241,0.4)',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
  },
  confirmButton: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '12px',
    backgroundColor: '#6366f1',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'all 0.2s',
  },
};

