import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const samplePosts = [
  {
    id: 1,
    company: "Tech Innovations Inc.",
    role: "Senior React Developer",
    location: "Manila, NCR",
    postedAt: "2h ago",
    description:
      "We are looking for a senior React developer to lead our front-end squad, build modern web experiences, and work closely with product and design.",
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
      "Join our design team to create beautiful product experiences and collaborate with engineers, researchers, and brand teams.",
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
      "Help our analytics team turn data into action for finance and operations. Strong SQL and storytelling skills preferred.",
    details: ["Office first", "Data team", "BI tools", "Career growth"],
    tags: ["#Data", "#Analytics", "#SQL"],
    applicants: 51,
    views: 143,
  },
];

const feedItems = [
  {
    title: "Featured Company: Web Solutions Ltd",
    text: "Explore new openings in full stack development and back-end engineering.",
  },
  {
    title: "Career Tip",
    text: "Update your profile regularly to stay visible to recruiters.",
  },
  {
    title: "Top Skill",
    text: "React, UX design, and data storytelling are in demand this season.",
  },
];

const categories = ["All", "Engineering", "Design", "Data"];

export default function BrowseJob() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [savedJobIds, setSavedJobIds] = useState(() => {
    const saved = localStorage.getItem("savedJobs");
    return saved ? JSON.parse(saved) : [];
  });
  const [jobs, setJobs] = useState([]);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobError, setJobError] = useState("");

  const handleApply = (jobTitle) => {
    if (!token) {
      navigate("/auth");
      return;
    }
    alert(`Ready to apply for ${jobTitle}? Head to your profile and submit your application.`);
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

  const handleShare = (role) => {
    const message = `Check out this job: ${role} on Applica.`;
    if (navigator.share) {
      navigator.share({ title: role, text: message }).catch(() => {});
    } else {
      alert(message);
    }
  };

  useEffect(() => {
    const fetchJobs = async () => {
      setJobLoading(true);
      setJobError("");

      try {
        const response = await axios.get("http://localhost:8000/api/jobs");
        setJobs(response.data.data || []);
      } catch (error) {
        console.error("Job fetch error", error);
        setJobError("Unable to load jobs right now.");
      } finally {
        setJobLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const tabs = ["For you", "Trending", "Saved"];
  const [activeTab, setActiveTab] = useState("For you");

  const jobPosts = jobs.map((job) => ({
    id: job._id,
    company: job.companyName,
    role: job.title,
    location: job.location || "Remote",
    postedAt: job.createdAt
      ? new Date(job.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "Recently",
    description: job.description,
    details: [
      `Requirements: ${job.requirements}`,
      job.salary ? `Salary: ₱${job.salary.toLocaleString()}` : "Salary: Negotiable",
      `Employer ID: ${job.createdBy?._id?.slice(0, 8) || "unknown"}`,
    ],
    tags: [
      `#${job.title.split(" ").slice(0, 2).join("")}`,
      job.location ? `#${job.location.split(",")[0].replace(/\s+/g, "")}` : "#Remote",
    ],
    applicants: Math.max(20, Math.floor(Math.random() * 120)),
    views: Math.max(40, Math.floor(Math.random() * 320)),
    createdById: job.createdBy?._id,
  }));

  const feedItemsToShow = jobs.length ? jobPosts : samplePosts;
  const filteredPosts = feedItemsToShow.filter((post) => {
    if (activeTab === "Saved" && !savedJobIds.includes(post.id)) {
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
    const matchesCategory =
      selectedCategory === "All" ||
      post.tags?.some((tag) =>
        tag.toLowerCase().includes(selectedCategory.toLowerCase())
      ) ||
      post.role.toLowerCase().includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const trendingJobs = jobs.length
    ? [...jobPosts].sort((a, b) => b.views - a.views)
    : samplePosts;

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.title}>Applica Feed</h1>
          <p style={styles.subtitle}>
            A fast, job-centered stream with trending roles, company posts, and quick actions.
          </p>
        </div>

        <div style={styles.tabs}> 
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={
                activeTab === tab ? styles.activeTab : styles.tab
              }
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={styles.searchBarRow}>
          <input
            type="text"
            placeholder="Search job titles, companies, or skills"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.categoryChips}>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={
                selectedCategory === category
                  ? styles.activeChip
                  : styles.chip
              }
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <section style={styles.feedSection}>
        <div style={styles.feedColumn}>
          {filteredPosts.map((post) => (
            <div key={post.id} style={styles.xPostCard}>
              <div style={styles.postHeaderRow}>
                <div style={styles.postAvatar}>{post.company.charAt(0)}</div>
                <div style={styles.postHeading}>
                  <div style={styles.postCompanyRow}>
                    <span style={styles.postCompany}>{post.company}</span>
                    <span style={styles.postDot}>·</span>
                    <span style={styles.postMeta}>{post.postedAt}</span>
                  </div>
                  <p style={styles.postTagline}>{post.location}</p>
                  {post.createdById && (
                    <p style={styles.postMeta}>
                      Employer ID: {post.createdById.slice(0, 8)}
                    </p>
                  )}
                </div>
              </div>

              <div style={styles.postBody}>
                <h2 style={styles.postRole}>{post.role}</h2>
                <p style={styles.postText}>{post.description}</p>
              </div>

              <div style={styles.postTags}>
                {post.tags.map((tag) => (
                  <span key={tag} style={styles.postTag}>{tag}</span>
                ))}
              </div>

              <div style={styles.postStatsRow}>
                <span style={styles.postStatItem}>💼 {post.applicants} applicants</span>
                <span style={styles.postStatItem}>👀 {post.views} views</span>
              </div>

              <div style={styles.postActionRow}>
                <button
                  style={savedJobIds.includes(post.id) ? styles.savedButton : styles.actionButton}
                  onClick={() => handleSave(post.id)}
                >
                  {savedJobIds.includes(post.id) ? "Saved" : "Save"}
                </button>
                <button
                  style={styles.actionButton}
                  onClick={() => handleApply(post.role)}
                >
                  Apply
                </button>
                <button
                  style={styles.actionButton}
                  onClick={() => handleShare(post.role)}
                >
                  Share
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside style={styles.sidebarColumn}>
          <div style={styles.sidebarCard}>
            <div style={styles.sidebarHeader}>
              <h3 style={styles.sidebarTitle}>Trending now</h3>
              <p style={styles.sidebarSubtitle}>Hot job topics and skills</p>
            </div>
            <div style={styles.trendingList}>
              <button style={styles.trendingItem}>#RemoteWork</button>
              <button style={styles.trendingItem}>#ReactJobs</button>
              <button style={styles.trendingItem}>#DesignOpenings</button>
              <button style={styles.trendingItem}>#DataAnalytics</button>
            </div>
          </div>

          <div style={styles.sidebarCard}>
            <h3 style={styles.sidebarTitle}>Trending companies</h3>
            <ul style={styles.companyList}>
              <li style={styles.companyItem}>Tech Innovations Inc.</li>
              <li style={styles.companyItem}>Creative Labs</li>
              <li style={styles.companyItem}>Analytics Pro</li>
              <li style={styles.companyItem}>Web Solutions Ltd</li>
            </ul>
          </div>

          <div style={{ ...styles.sidebarCard, marginTop: "24px" }}>
            <h3 style={styles.sidebarTitle}>Job shortcuts</h3>
            <button
              style={styles.shortcutButton}
              onClick={() => navigate("/profile")}
            >
              View profile
            </button>
            <button
              style={styles.shortcutButton}
              onClick={() => navigate("/create")}
            >
              Complete your profile
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#e5e7eb",
    fontFamily: "Arial, sans-serif",
    paddingBottom: "60px",
    color: "#0f172a",
  },
  pageHeader: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "30px 20px 20px",
  },
  title: {
    fontSize: "36px",
    fontWeight: "800",
    marginBottom: "10px",
  },
  subtitle: {
    fontSize: "16px",
    lineHeight: "1.7",
    maxWidth: "760px",
    color: "#475569",
    marginBottom: "24px",
  },
  tabs: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "20px",
  },
  tab: {
    padding: "10px 18px",
    borderRadius: "999px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: "700",
    cursor: "pointer",
  },
  activeTab: {
    padding: "10px 18px",
    borderRadius: "999px",
    border: "1px solid #2563eb",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
  },
  searchBarRow: {
    marginBottom: "18px",
  },
  searchInput: {
    width: "100%",
    maxWidth: "760px",
    padding: "14px 18px",
    borderRadius: "16px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "15px",
    outline: "none",
  },
  categoryChips: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  chip: {
    padding: "10px 16px",
    borderRadius: "999px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#0f172a",
    cursor: "pointer",
    fontWeight: "600",
  },
  activeChip: {
    padding: "10px 16px",
    borderRadius: "999px",
    border: "1px solid #2563eb",
    background: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "700",
  },
  feedSection: {
    display: "grid",
    gridTemplateColumns: "1.45fr 0.85fr",
    gap: "24px",
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "0 20px 40px",
  },
  feedColumn: {
    display: "grid",
    gap: "18px",
  },
  sidebarColumn: {
    display: "grid",
    gap: "18px",
  },
  xPostCard: {
    background: "#ffffff",
    borderRadius: "24px",
    padding: "20px",
    boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
    border: "1px solid #e2e8f0",
  },
  postHeaderRow: {
    display: "flex",
    gap: "14px",
    marginBottom: "16px",
  },
  postAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "#2563eb",
    color: "#ffffff",
    display: "grid",
    placeItems: "center",
    fontWeight: "800",
    fontSize: "18px",
  },
  postHeading: {
    minWidth: 0,
  },
  postCompanyRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  postCompany: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#0f172a",
  },
  postDot: {
    color: "#94a3b8",
  },
  postMeta: {
    color: "#64748b",
    fontSize: "13px",
  },
  postTagline: {
    margin: "6px 0 0 0",
    color: "#475569",
    fontSize: "14px",
  },
  postBody: {
    marginBottom: "16px",
  },
  postRole: {
    fontSize: "22px",
    fontWeight: "800",
    margin: "0 0 12px 0",
    lineHeight: "1.2",
  },
  postText: {
    fontSize: "15px",
    lineHeight: "1.8",
    color: "#334155",
    margin: 0,
  },
  postTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "16px",
  },
  postTag: {
    color: "#2563eb",
    fontWeight: "700",
    fontSize: "13px",
  },
  postStatsRow: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    color: "#64748b",
    fontSize: "14px",
    marginBottom: "16px",
  },
  postStatItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  },
  postActionRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "10px",
  },
  actionButton: {
    borderRadius: "14px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    padding: "12px 10px",
    fontWeight: "700",
    cursor: "pointer",
  },
  savedButton: {
    borderRadius: "14px",
    border: "1px solid #2563eb",
    background: "#2563eb",
    color: "#ffffff",
    padding: "12px 10px",
    fontWeight: "700",
    cursor: "pointer",
  },
  sidebarCard: {
    background: "#ffffff",
    borderRadius: "24px",
    padding: "20px",
    boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
    border: "1px solid #e2e8f0",
  },
  sidebarHeader: {
    marginBottom: "18px",
  },
  sidebarTitle: {
    fontSize: "18px",
    fontWeight: "800",
    margin: 0,
  },
  sidebarSubtitle: {
    margin: "8px 0 0 0",
    fontSize: "14px",
    color: "#64748b",
  },
  trendingList: {
    display: "grid",
    gap: "10px",
  },
  trendingItem: {
    width: "100%",
    textAlign: "left",
    padding: "12px 14px",
    borderRadius: "16px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    color: "#2563eb",
    fontWeight: "700",
    cursor: "pointer",
  },
  companyList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "grid",
    gap: "10px",
  },
  companyItem: {
    padding: "12px 14px",
    borderRadius: "16px",
    background: "#f8fafc",
    color: "#0f172a",
    fontWeight: "600",
  },
  shortcutButton: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "16px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: "700",
    cursor: "pointer",
    marginBottom: "10px",
  },
};
