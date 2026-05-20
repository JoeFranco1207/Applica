import React from 'react';
import './Footer.css';
import { useLanguage } from '../contexts/LanguageContext';

export default function Footer() {
  const { translate: t } = useLanguage();

  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div className="footer-left">
          <div className="footer-brand">Applica</div>
          <div className="footer-devs">
            <strong>{t('nav.profile')}: </strong>
            <span>NovaForge Technologies</span>
            <span className="divider">•</span>
            <span>Afreads07</span>
          </div>
          <div className="footer-copy">© {new Date().getFullYear()} Applica</div>
        </div>

        <div className="footer-center">
          <div className="footer-links">
            <a href="/explore">{t('browse.feedTitle') || 'Explore'}</a>
            <a href="/resume-designs">{t('resume.title') || 'Resume'}</a>
            <a href="/profile">{t('nav.profile') || 'Profile'}</a>
          </div>
        </div>

        <div className="footer-right">
          <div className="social-label">Follow</div>
          <div className="footer-socials">
            <a href="https://github.com/" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">LinkedIn</a>
            <a href="https://twitter.com/" target="_blank" rel="noreferrer">Twitter</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
