import { useState } from "react";

export default function Landing({
  onCreateProfile,
}) {
  const [userMenuOpen, setUserMenuOpen] =
    useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/";
  };

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <div style={styles.logoContainer}>
          <img
            src="/src/assets/Applica_Logo.png"
            alt="Applica"
            style={styles.logo}
          />

          <h2 style={styles.logoText}>
            Applica
          </h2>
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

          <button
            style={styles.createBtn}
            onClick={onCreateProfile}
          >
            Create Profile
          </button>
        </div>

        <div style={styles.profileMenu}>
          <button
            style={styles.profileButton}
            onClick={() =>
              setUserMenuOpen(!userMenuOpen)
            }
          >
            ⋯
          </button>

          {userMenuOpen && (
            <div style={styles.dropdown}>
              <button
                style={styles.dropdownItem}
              >
                My Profile
              </button>

              <button
                style={styles.dropdownItem}
              >
                Settings
              </button>

              <button
                style={{
                  ...styles.dropdownItem,
                  color: "#ef4444",
                }}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      <section style={styles.heroSection}>
        <div style={styles.heroContent}>
          <span style={styles.badge}>
            Your future starts here
          </span>

          <h1 style={styles.heroTitle}>
            Find work that matches your
            passion.
          </h1>

          <p style={styles.heroSubtitle}>
            Build your professional profile,
            connect with companies, and
            discover opportunities waiting
            for you.
          </p>

          <div style={styles.heroButtons}>
            <button
              style={styles.primaryButton}
            >
              Explore Jobs
            </button>

            <button
              style={styles.secondaryButton}
              onClick={onCreateProfile}
            >
              Complete Profile
            </button>
          </div>
        </div>

        <div style={styles.heroCard}>
          <div style={styles.heroGlass}>
            <img
              src="/src/assets/Applica_Logo.png"
              alt="logo"
              style={styles.heroLogo}
            />

            <h3 style={styles.heroCardTitle}>
              Applica
            </h3>

            <p style={styles.heroCardText}>
              A modern platform where talent
              meets opportunity.
            </p>

            <div style={styles.heroStats}>
              <div style={styles.statBox}>
                <h2 style={styles.statNumber}>
                  5K+
                </h2>

                <p style={styles.statLabel}>
                  Jobs
                </p>
              </div>

              <div style={styles.statBox}>
                <h2 style={styles.statNumber}>
                  2K+
                </h2>

                <p style={styles.statLabel}>
                  Companies
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={styles.featuresSection}>
        <h2 style={styles.sectionTitle}>
          Why Choose Applica?
        </h2>

        <div style={styles.featuresGrid}>
          <FeatureCard
            title="Smart Matching"
            description="Get job recommendations based on your skills and experience."
          />

          <FeatureCard
            title="Easy Applications"
            description="Apply to jobs in just a few clicks with your profile."
          />

          <FeatureCard
            title="Professional Growth"
            description="Grow your career with opportunities from top companies."
          />

          <FeatureCard
            title="Modern Experience"
            description="Fast, clean, and designed for a smooth user journey."
          />
        </div>
      </section>

      <section style={styles.jobsSection}>
        <h2 style={styles.sectionTitle}>
          Trending Jobs
        </h2>

        <div style={styles.jobsGrid}>
          <JobCard
            title="Frontend Developer"
            company="TechNova"
            location="Manila"
            salary="₱80k - ₱120k"
          />

          <JobCard
            title="UI/UX Designer"
            company="Creative Hub"
            location="Makati"
            salary="₱70k - ₱100k"
          />

          <JobCard
            title="Backend Engineer"
            company="CloudStack"
            location="Cebu"
            salary="₱90k - ₱150k"
          />

          <JobCard
            title="Data Analyst"
            company="Vision Analytics"
            location="Quezon City"
            salary="₱75k - ₱110k"
          />
        </div>
      </section>

      <section style={styles.ctaSection}>
        <div style={styles.ctaCard}>
          <h2 style={styles.ctaTitle}>
            Ready to start your journey?
          </h2>

          <p style={styles.ctaText}>
            Create your profile and unlock
            thousands of opportunities.
          </p>

          <button
            style={styles.ctaButton}
            onClick={onCreateProfile}
          >
            Create Profile
          </button>
        </div>
      </section>

      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div>
            <h3 style={styles.footerLogo}>
              Applica
            </h3>

            <p style={styles.footerText}>
              Connecting ambitious people
              with meaningful careers.
            </p>
          </div>

          <div>
            <h4 style={styles.footerTitle}>
              Quick Links
            </h4>

            <a
              href="#"
              style={styles.footerLink}
            >
              Browse Jobs
            </a>

            <a
              href="#"
              style={styles.footerLink}
            >
              Companies
            </a>

            <a
              href="#"
              style={styles.footerLink}
            >
              Contact
            </a>
          </div>

          <div>
            <h4 style={styles.footerTitle}>
              Socials
            </h4>

            <div style={styles.socials}>
              <div style={styles.social}>
                f
              </div>

              <div style={styles.social}>
                𝕏
              </div>

              <div style={styles.social}>
                in
              </div>
            </div>
          </div>
        </div>

        <div style={styles.footerBottom}>
          © 2026 Applica. All rights
          reserved.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}) {
  return (
    <div style={styles.featureCard}>
      <h3 style={styles.featureTitle}>
        {title}
      </h3>

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
      <div style={styles.jobTop}>
        <h3 style={styles.jobTitle}>
          {title}
        </h3>

        <button style={styles.saveBtn}>
          Save
        </button>
      </div>

      <p style={styles.company}>
        {company}
      </p>

      <div style={styles.jobInfo}>
        <span>{location}</span>
        <span>{salary}</span>
      </div>

      <button style={styles.applyBtn}>
        Apply Now
      </button>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background:
      "linear-gradient(to right, #0f172a, #1e293b)",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#fff",
  },

  navbar: {
    height: "75px",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(12px)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 40px",
    borderBottom:
      "1px solid rgba(255,255,255,0.1)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },

  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  logo: {
    width: "45px",
  },

  logoText: {
    fontSize: "1.6rem",
    fontWeight: "800",
  },

  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "28px",
  },

  navLink: {
    color: "#cbd5e1",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "15px",
  },

  createBtn: {
    padding: "12px 20px",
    borderRadius: "12px",
    border: "none",
    background:
      "linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },

  profileMenu: {
    position: "relative",
  },

  profileButton: {
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    border: "none",
    background:
      "rgba(255,255,255,0.12)",
    color: "#fff",
    fontSize: "24px",
    cursor: "pointer",
  },

  dropdown: {
    position: "absolute",
    right: 0,
    top: "55px",
    background: "#fff",
    borderRadius: "16px",
    overflow: "hidden",
    minWidth: "180px",
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.2)",
  },

  dropdownItem: {
    width: "100%",
    padding: "14px 18px",
    border: "none",
    background: "#fff",
    textAlign: "left",
    cursor: "pointer",
    fontWeight: "600",
    color: "#0f172a",
  },

  heroSection: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    alignItems: "center",
    gap: "50px",
    padding: "80px 60px",
    maxWidth: "1400px",
    margin: "0 auto",
  },

  heroContent: {
    display: "flex",
    flexDirection: "column",
  },

  badge: {
    background:
      "rgba(59,130,246,0.15)",
    color: "#93c5fd",
    width: "fit-content",
    padding: "10px 18px",
    borderRadius: "999px",
    marginBottom: "24px",
    fontWeight: "700",
  },

  heroTitle: {
    fontSize: "4rem",
    fontWeight: "900",
    lineHeight: "1.1",
    marginBottom: "20px",
  },

  heroSubtitle: {
    fontSize: "18px",
    lineHeight: "1.8",
    color: "#cbd5e1",
    marginBottom: "35px",
    maxWidth: "550px",
  },

  heroButtons: {
    display: "flex",
    gap: "16px",
  },

  primaryButton: {
    padding: "16px 30px",
    borderRadius: "14px",
    border: "none",
    background:
      "linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)",
    color: "#fff",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer",
  },

  secondaryButton: {
    padding: "16px 30px",
    borderRadius: "14px",
    border:
      "1px solid rgba(255,255,255,0.2)",
    background:
      "rgba(255,255,255,0.08)",
    color: "#fff",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer",
  },

  heroCard: {
    display: "flex",
    justifyContent: "center",
  },

  heroGlass: {
    width: "100%",
    maxWidth: "420px",
    background:
      "rgba(255,255,255,0.08)",
    backdropFilter: "blur(14px)",
    borderRadius: "28px",
    padding: "40px",
    border:
      "1px solid rgba(255,255,255,0.1)",
    boxShadow:
      "0 20px 40px rgba(0,0,0,0.3)",
  },

  heroLogo: {
    width: "70px",
    marginBottom: "20px",
  },

  heroCardTitle: {
    fontSize: "2rem",
    fontWeight: "800",
    marginBottom: "10px",
  },

  heroCardText: {
    color: "#cbd5e1",
    lineHeight: "1.7",
    marginBottom: "30px",
  },

  heroStats: {
    display: "flex",
    gap: "20px",
  },

  statBox: {
    flex: 1,
    background:
      "rgba(255,255,255,0.08)",
    borderRadius: "18px",
    padding: "20px",
    textAlign: "center",
  },

  statNumber: {
    fontSize: "2rem",
    marginBottom: "6px",
  },

  statLabel: {
    color: "#cbd5e1",
  },

  featuresSection: {
    padding: "80px 60px",
  },

  sectionTitle: {
    fontSize: "2.7rem",
    textAlign: "center",
    marginBottom: "50px",
    fontWeight: "800",
  },

  featuresGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "25px",
    maxWidth: "1300px",
    margin: "0 auto",
  },

  featureCard: {
    background:
      "rgba(255,255,255,0.08)",
    borderRadius: "24px",
    padding: "35px",
    border:
      "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(12px)",
  },

  featureTitle: {
    fontSize: "1.4rem",
    marginBottom: "12px",
  },

  featureDescription: {
    color: "#cbd5e1",
    lineHeight: "1.7",
  },

  jobsSection: {
    padding: "80px 60px",
  },

  jobsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "25px",
    maxWidth: "1300px",
    margin: "0 auto",
  },

  jobCard: {
    background:
      "rgba(255,255,255,0.08)",
    borderRadius: "24px",
    padding: "28px",
    backdropFilter: "blur(12px)",
    border:
      "1px solid rgba(255,255,255,0.08)",
  },

  jobTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },

  jobTitle: {
    fontSize: "1.2rem",
    fontWeight: "700",
  },

  saveBtn: {
    border: "none",
    background:
      "rgba(255,255,255,0.1)",
    color: "#93c5fd",
    padding: "8px 14px",
    borderRadius: "10px",
    cursor: "pointer",
  },

  company: {
    color: "#93c5fd",
    marginBottom: "20px",
  },

  jobInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    color: "#cbd5e1",
    marginBottom: "25px",
  },

  applyBtn: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    background:
      "linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },

  ctaSection: {
    padding: "100px 60px",
  },

  ctaCard: {
    maxWidth: "1000px",
    margin: "0 auto",
    background:
      "linear-gradient(135deg, rgba(37,99,235,0.25), rgba(59,130,246,0.15))",
    borderRadius: "32px",
    padding: "70px 40px",
    textAlign: "center",
    border:
      "1px solid rgba(255,255,255,0.1)",
    backdropFilter: "blur(12px)",
  },

  ctaTitle: {
    fontSize: "3rem",
    fontWeight: "900",
    marginBottom: "20px",
  },

  ctaText: {
    color: "#cbd5e1",
    fontSize: "18px",
    marginBottom: "30px",
  },

  ctaButton: {
    padding: "16px 32px",
    borderRadius: "14px",
    border: "none",
    background: "#fff",
    color: "#2563eb",
    fontWeight: "800",
    cursor: "pointer",
  },

  footer: {
    marginTop: "80px",
    borderTop:
      "1px solid rgba(255,255,255,0.1)",
  },

  footerContent: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "40px",
    padding: "60px",
    maxWidth: "1300px",
    margin: "0 auto",
  },

  footerLogo: {
    fontSize: "2rem",
    marginBottom: "14px",
  },

  footerText: {
    color: "#cbd5e1",
    lineHeight: "1.7",
  },

  footerTitle: {
    marginBottom: "16px",
    fontSize: "1.1rem",
  },

  footerLink: {
    display: "block",
    color: "#cbd5e1",
    textDecoration: "none",
    marginBottom: "10px",
  },

  socials: {
    display: "flex",
    gap: "14px",
  },

  social: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background:
      "rgba(255,255,255,0.1)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "700",
  },

  footerBottom: {
    textAlign: "center",
    padding: "25px",
    color: "#94a3b8",
    borderTop:
      "1px solid rgba(255,255,255,0.08)",
  },
};