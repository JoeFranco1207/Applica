import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PremiumAd.css';

export default function PremiumAd() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleUpgrade = () => {
    navigate('/ai-premium');
  };

  return (
    <div className="premium-ad-container">
      <div className="premium-ad-content">
        <div className="premium-ad-badge">✨ Premium</div>
        <div className="premium-ad-body">
          <div className="premium-ad-text">
            <h3 className="premium-ad-title">Unlock Premium Features</h3>
            <p className="premium-ad-description">
              Unlock premium perks for both employers and jobseekers: better job posting limits, resume AI tools, and faster matching.
            </p>
            <div className="premium-ad-features">
              <div className="premium-ad-feature">
                <span className="feature-icon">🤖</span>
                <span>AI Resume Optimizer</span>
              </div>
              <div className="premium-ad-feature">
                <span className="feature-icon">🚀</span>
                <span>Expanded employer job posting limits</span>
              </div>
              <div className="premium-ad-feature">
                <span className="feature-icon">📊</span>
                <span>Priority job and applicant matching</span>
              </div>
            </div>
          </div>
          <div className="premium-ad-actions">
            <button className="premium-ad-upgrade-btn" onClick={handleUpgrade}>
              Upgrade Now
            </button>
            <button
              className="premium-ad-close-btn"
              onClick={() => setIsVisible(false)}
              aria-label="Close advertisement"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
