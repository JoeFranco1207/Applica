import React from 'react';
import './Footer.css';
import { useLanguage } from '../contexts/LanguageContext';

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.167 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.604-3.369-1.343-3.369-1.343-.454-1.155-1.11-1.463-1.11-1.463-.907-.62.069-.608.069-.608 1.003.071 1.53 1.031 1.53 1.031.892 1.528 2.341 1.086 2.91.831.091-.647.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.944 0-1.091.39-1.984 1.03-2.682-.103-.254-.447-1.272.098-2.65 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.91-1.294 2.748-1.025 2.748-1.025.547 1.378.203 2.396.1 2.65.64.698 1.028 1.591 1.028 2.682 0 3.843-2.339 4.688-4.566 4.935.36.31.68.918.68 1.852 0 1.336-.012 2.415-.012 2.742 0 .268.18.58.688.481C19.137 20.165 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6z" />
    <path d="M2 9h4v12H2z" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0012 4v1A10.66 10.66 0 013 5s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
  </svg>
);

export default function Footer() {
  const { translate: t } = useLanguage();

  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div className="footer-left">
          <div className="footer-brand">Applica</div>
          <div className="footer-devs">
            Built by
            <strong> NovaForge Technologies</strong>
            <span className="divider">•</span>
            <strong>Afreads07</strong>
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
            <a className="footer-social-link" href="https://github.com/" target="_blank" rel="noreferrer" aria-label="GitHub">
              <GitHubIcon />
            </a>
            <a className="footer-social-link" href="https://www.linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <LinkedInIcon />
            </a>
            <a className="footer-social-link" href="https://twitter.com/" target="_blank" rel="noreferrer" aria-label="Twitter">
              <TwitterIcon />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
