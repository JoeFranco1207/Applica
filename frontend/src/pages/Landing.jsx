import { useState } from "react";

export default function Landing() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    // Clear token and user data
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    // Redirect to signup page
    window.location.href = "/";
  };

  return (
    <div style={styles.container}>
      {/* Navigation Bar */}
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <div style={styles.logo}>
            <img
              src="/src/assets/Applica_Logo.png"
              alt="Applica"
              style={styles.logoImage}
            />
            <span style={styles.logoText}>Applica</span>
          </div>

          <div style={styles.navLinks}>
            <a href="#" style={styles.navLink}>
              Browse Jobs
            </a>
            <a href="#" style={styles.navLink}>
              Companies
            </a>
            <a href="#" style={styles.navLink}>
              Resources
            </a>
          </div>

          <div style={styles.profileMenu}>
            <button
              style={styles.profileButton}
              onClick={() =>
                setUserMenuOpen(!userMenuOpen)
              }
            >
              <span style={styles.profileIcon}>
                ⋯
              </span>
            </button>
            {userMenuOpen && (
              <div style={styles.dropdown}>
                <a href="#" style={styles.dropdownItem}>
                  My Profile
                </a>
                <a href="#" style={styles.dropdownItem}>
                  Settings
                </a>
                <button
                  onClick={handleLogout}
                  style={{
                    ...styles.dropdownItem,
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    color: "#ff4757",
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={styles.heroSection}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>
            Welcome to Your Professional Journey
          </h1>
          <p style={styles.heroSubtitle}>
            Discover amazing job opportunities and connect with leading companies
          </p>
          <div style={styles.heroButtons}>
            <button style={styles.primaryButton}>
              Explore Jobs
            </button>
            <button style={styles.secondaryButton}>
              Complete Profile
            </button>
          </div>
        </div>
        <div style={styles.heroImage}>
          <div style={styles.imagePlaceholder}>
            <span style={styles.placeholderText}>
              
            </span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.featuresSection}>
        <h2 style={styles.sectionTitle}>
          Why Choose Applica?
        </h2>
        <div style={styles.featuresGrid}>
          <FeatureCard
            title="Find Perfect Jobs"
            description="Discover job opportunities tailored to your skills and preferences"
          />
          <FeatureCard
            title="Connect with Companies"
            description="Build relationships with leading organizations and recruiters"
          />
          <FeatureCard
            title="Grow Your Career"
            description="Access resources and guidance to advance in your professional journey"
          />
          <FeatureCard
            title="Easy Applications"
            description="Apply to multiple jobs with just a few clicks using your profile"
          />
        </div>
      </section>

      {/* Trending Jobs Section */}
      <section style={styles.jobsSection}>
        <h2 style={styles.sectionTitle}>
          Trending Jobs
        </h2>
        <div style={styles.jobsList}>
          <JobCard
            title="Senior React Developer"
            company="Tech Innovations Inc"
            location="Manila, NCR"
            salary="₱150,000 - ₱180,000"
          />
          <JobCard
            title="UX/UI Designer"
            company="Creative Studios"
            location="Quezon City, NCR"
            salary="₱100,000 - ₱130,000"
          />
          <JobCard
            title="Data Analyst"
            company="Analytics Pro"
            location="Makati, NCR"
            salary="₱120,000 - ₱150,000"
          />
          <JobCard
            title="Full Stack Developer"
            company="Web Solutions Ltd"
            location="Cebu, Cebu"
            salary="₱140,000 - ₱170,000"
          />
        </div>
        <div style={styles.viewAllButton}>
          <button style={styles.primaryButton}>
            View All Jobs
          </button>
        </div>
      </section>

      {/* Call to Action Section */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaContent}>
          <h2 style={styles.ctaTitle}>
            Ready to Land Your Dream Job?
          </h2>
          <p style={styles.ctaText}>
            Complete your profile and start applying to amazing
            opportunities today
          </p>
          <button style={styles.ctaButton}>
            Complete Your Profile
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerSection}>
            <h4 style={styles.footerTitle}>
              About Applica
            </h4>
            <p style={styles.footerText}>
              Connecting talented professionals with
              leading companies
            </p>
          </div>
          <div style={styles.footerSection}>
            <h4 style={styles.footerTitle}>
              Quick Links
            </h4>
            <ul style={styles.footerLinks}>
              <li>
                <a href="#" style={styles.footerLink}>
                  Browse Jobs
                </a>
              </li>
              <li>
                <a href="#" style={styles.footerLink}>
                  Companies
                </a>
              </li>
              <li>
                <a href="#" style={styles.footerLink}>
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div style={styles.footerSection}>
            <h4 style={styles.footerTitle}>
              Connect With Us
            </h4>
            <div style={styles.socialLinks}>
              <a href="#" style={styles.socialLink}>
                f
              </a>
              <a href="#" style={styles.socialLink}>
                𝕏
              </a>
              <a href="#" style={styles.socialLink}>
                in
              </a>
            </div>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <p>
            © 2024 Applica. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description }) {
  return (
    <div style={styles.featureCard}>
      <h3 style={styles.featureTitle}>{title}</h3>
      <p style={styles.featureDescription}>
        {description}
      </p>
    </div>
  );
}

function JobCard({
  title,
  company,
  location,
  salary,
}) {
  return (
    <div style={styles.jobCard}>
      <div style={styles.jobCardHeader}>
        <h3 style={styles.jobTitle}>{title}</h3>
        <button
          style={styles.saveButton}
          title="Save job"
        >
          Save
        </button>
      </div>
      <p style={styles.jobCompany}>{company}</p>
      <div style={styles.jobDetails}>
        <span style={styles.jobLocation}>
          {location}
        </span>
        <span style={styles.jobSalary}>
          {salary}
        </span>
      </div>
      <button style={styles.applyButton}>
        Apply Now
      </button>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#ffffff",
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
  },

  logoImage: {
    width: "40px",
    height: "40px",
  },

  logoText: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#2563eb",
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
    transition: "0.3s",
    cursor: "pointer",
  },

  profileMenu: {
    position: "relative",
  },

  profileButton: {
    background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
    border: "none",
    borderRadius: "50%",
    width: "44px",
    height: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "20px",
  },

  profileIcon: {
    color: "#ffffff",
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
    zIndex: 101,
  },

  dropdownItem: {
    display: "block",
    padding: "12px 16px",
    color: "#333",
    textDecoration: "none",
    fontSize: "14px",
    borderBottom: "1px solid #f0f0f0",
    transition: "0.2s",
  },

  heroSection: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "80px 30px",
    display: "flex",
    alignItems: "center",
    gap: "60px",
  },

  heroContent: {
    flex: 1,
  },

  heroTitle: {
    fontSize: "52px",
    fontWeight: "800",
    color: "#000",
    marginBottom: "20px",
    lineHeight: "1.2",
  },

  heroSubtitle: {
    fontSize: "18px",
    color: "#666",
    marginBottom: "32px",
    lineHeight: "1.6",
  },

  heroButtons: {
    display: "flex",
    gap: "16px",
  },

  primaryButton: {
    padding: "14px 32px",
    border: "none",
    borderRadius: "12px",
    background:
      "linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)",
    color: "#fff",
    fontWeight: "700",
    fontSize: "16px",
    cursor: "pointer",
    transition: "0.3s",
  },

  secondaryButton: {
    padding: "14px 32px",
    border: "2px solid #2563eb",
    borderRadius: "12px",
    background: "transparent",
    color: "#2563eb",
    fontWeight: "700",
    fontSize: "16px",
    cursor: "pointer",
    transition: "0.3s",
  },

  heroImage: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  imagePlaceholder: {
    width: "100%",
    height: "400px",
    background:
      "linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)",
    borderRadius: "24px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "120px",
  },

  placeholderText: {
    fontSize: "100px",
  },

  featuresSection: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "80px 30px",
    backgroundColor: "#f8fafc",
  },

  jobsSection: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "80px 30px",
  },

  sectionTitle: {
    fontSize: "42px",
    fontWeight: "800",
    color: "#000",
    marginBottom: "60px",
    textAlign: "center",
  },

  featuresGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "30px",
  },

  featureCard: {
    padding: "30px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    textAlign: "center",
    transition: "0.3s",
  },

  featureTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#000",
    marginBottom: "12px",
  },

  featureDescription: {
    fontSize: "14px",
    color: "#666",
    lineHeight: "1.6",
  },

  jobsList: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "24px",
    marginBottom: "40px",
  },

  jobCard: {
    padding: "24px",
    backgroundColor: "#ffffff",
    border: "1.5px solid #e0e0e0",
    borderRadius: "16px",
    transition: "0.3s",
  },

  jobCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
  },

  jobTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#000",
    margin: 0,
  },

  saveButton: {
    background: "none",
    border: "none",
    fontSize: "12px",
    cursor: "pointer",
    padding: "6px 12px",
    color: "#2563eb",
    fontWeight: "600",
    transition: "0.2s",
  },

  jobCompany: {
    fontSize: "14px",
    color: "#2563eb",
    fontWeight: "600",
    margin: "8px 0",
  },

  jobDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    margin: "16px 0",
    fontSize: "13px",
    color: "#666",
  },

  jobLocation: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  jobSalary: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontWeight: "600",
    color: "#000",
  },

  applyButton: {
    width: "100%",
    padding: "12px",
    border: "2px solid #2563eb",
    borderRadius: "10px",
    background: "transparent",
    color: "#2563eb",
    fontWeight: "600",
    cursor: "pointer",
    transition: "0.3s",
  },

  viewAllButton: {
    textAlign: "center",
  },

  ctaSection: {
    background:
      "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
    padding: "80px 30px",
    textAlign: "center",
  },

  ctaContent: {
    maxWidth: "600px",
    margin: "0 auto",
  },

  ctaTitle: {
    fontSize: "42px",
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: "20px",
  },

  ctaText: {
    fontSize: "18px",
    color: "rgba(255,255,255,0.9)",
    marginBottom: "32px",
    lineHeight: "1.6",
  },

  ctaButton: {
    padding: "16px 40px",
    border: "none",
    borderRadius: "12px",
    background: "#ffffff",
    color: "#2563eb",
    fontWeight: "700",
    fontSize: "16px",
    cursor: "pointer",
    transition: "0.3s",
  },

  footer: {
    backgroundColor: "#0f172a",
    color: "#ffffff",
  },

  footerContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "60px 30px",
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "40px",
  },

  footerSection: {
    textAlign: "left",
  },

  footerTitle: {
    fontSize: "16px",
    fontWeight: "700",
    marginBottom: "16px",
    color: "#ffffff",
  },

  footerText: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.7)",
    lineHeight: "1.6",
  },

  footerLinks: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },

  footerLink: {
    color: "rgba(255,255,255,0.7)",
    textDecoration: "none",
    fontSize: "14px",
    transition: "0.2s",
    display: "block",
    marginBottom: "8px",
  },

  socialLinks: {
    display: "flex",
    gap: "16px",
  },

  socialLink: {
    width: "40px",
    height: "40px",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "18px",
    transition: "0.2s",
  },

  footerBottom: {
    borderTop: "1px solid rgba(255,255,255,0.1)",
    padding: "24px 30px",
    textAlign: "center",
    fontSize: "14px",
    color: "rgba(255,255,255,0.6)",
  },
};
