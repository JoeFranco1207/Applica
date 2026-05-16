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
  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const currentUserId = currentUser?.id || currentUser?._id || null;
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [companyFilter, setCompanyFilter] = useState("All");
  const [savedJobIds, setSavedJobIds] = useState(() => {
    const saved = localStorage.getItem("savedJobs");
    return saved ? JSON.parse(saved) : [];
  });
  const [jobs, setJobs] = useState([]);
  const [socialPosts, setSocialPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostTags, setNewPostTags] = useState("");
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [editingTags, setEditingTags] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobError, setJobError] = useState("");
  const [jobActionLoading, setJobActionLoading] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [modalJob, setModalJob] = useState(null);

  const handleApply = async (jobId, jobTitle) => {
    if (!token) {
      navigate("/auth");
      return;
    }

    try {
      setJobActionLoading(true);
      const response = await axios.post(
        `http://localhost:8000/api/jobs/${jobId}/apply`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedJob = response.data.data;
      setJobs((prevJobs) =>
        prevJobs.map((job) => (job._id === updatedJob._id ? updatedJob : job))
      );
      if (modalJob && modalJob._id === updatedJob._id) {
        setModalJob(updatedJob);
      }
      alert(`Application recorded for ${jobTitle}.`);
    } catch (error) {
      console.error("Apply error", error);
      alert("Unable to apply at the moment. Please try again.");
    } finally {
      setJobActionLoading(false);
    }
  };

  const handleViewJob = async (jobId) => {
    if (!token) {
      navigate("/auth");
      return;
    }

    try {
      setJobActionLoading(true);
      const response = await axios.post(
        `http://localhost:8000/api/jobs/${jobId}/view`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedJob = response.data.data;
      setJobs((prevJobs) =>
        prevJobs.map((job) => (job._id === updatedJob._id ? updatedJob : job))
      );
      // update modal if open
      if (modalJob && modalJob._id === updatedJob._id) setModalJob(updatedJob);
    } catch (error) {
      console.error("View error", error);
    } finally {
      setJobActionLoading(false);
    }
  };

  const openJobModal = async (jobId) => {
    let full = jobs.find((j) => j._id === jobId) || null;

    if (!full) {
      try {
        const response = await axios.get(`http://localhost:8000/api/jobs/${jobId}`);
        full = response.data.data;
      } catch (error) {
        console.error("Failed to fetch job details", error);
        alert("Could not load job details right now.");
        return;
      }
    }

    setModalJob(full);
    setShowJobModal(true);

    if (currentUser?.role === "jobseeker") {
      handleViewJob(jobId);
    }
  };

  const closeJobModal = () => {
    setShowJobModal(false);
    setModalJob(null);
  };

  const handleToggleLike = async (jobId) => {
    if (!token) {
      navigate("/auth");
      return;
    }

    try {
      setJobActionLoading(true);
      const response = await axios.post(
        `http://localhost:8000/api/jobs/${jobId}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedJob = response.data.data;
      setJobs((prevJobs) =>
        prevJobs.map((job) => (job._id === updatedJob._id ? updatedJob : job))
      );
      if (modalJob && modalJob._id === updatedJob._id) {
        setModalJob(updatedJob);
      }
    } catch (error) {
      console.error("Like error", error);
      alert("Unable to update like right now.");
    } finally {
      setJobActionLoading(false);
    }
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

  const handleCreatePost = async () => {
    if (!token) {
      navigate("/auth");
      return;
    }

    if (!newPostContent.trim()) {
      alert("Please write something before posting.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8000/api/posts",
        {
          content: newPostContent.trim(),
          tags: newPostTags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSocialPosts((prev) => [response.data.data, ...prev]);
      setNewPostContent("");
      setNewPostTags("");
    } catch (error) {
      console.error("Create post error", error);
      alert("Unable to create post right now. Please try again.");
    }
  };

  const startEditPost = (post) => {
    setEditingPostId(post._id);
    setEditingContent(post.content || "");
    setEditingTags((post.tags || []).join(", "));
  };

  const cancelEdit = () => {
    setEditingPostId(null);
    setEditingContent("");
    setEditingTags("");
  };

  const saveEditPost = async () => {
    if (!editingPostId) return;
    const token = localStorage.getItem("token");
    try {
      const response = await axios.patch(
        `http://localhost:8000/api/posts/${editingPostId}`,
        {
          content: editingContent,
          tags: editingTags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSocialPosts((prev) => prev.map((p) => (p._id === response.data.data._id ? response.data.data : p)));
      cancelEdit();
    } catch (err) {
      console.error('Edit post error', err);
      alert('Unable to save post edits.');
    }
  };

  const archivePost = async (postId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.patch(
        `http://localhost:8000/api/posts/${postId}`,
        { archived: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSocialPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      console.error('Archive error', err);
      alert('Unable to archive post.');
    }
  };

  const deletePost = async (postId) => {
    const token = localStorage.getItem('token');
    if (!confirm('Delete this post permanently?')) return;
    try {
      await axios.delete(`http://localhost:8000/api/posts/${postId}`, { headers: { Authorization: `Bearer ${token}` } });
      setSocialPosts((prev) => prev.filter((p) => p._id !== postId));
      if (selectedPost?._id === postId) {
        closePostModal();
      }
    } catch (err) {
      console.error('Delete post error', err);
      alert('Unable to delete post.');
    }
  };

  const openPostModal = (post) => {
    setSelectedPost(post);
    setShowPostModal(true);
  };

  const closePostModal = () => {
    setShowPostModal(false);
    setSelectedPost(null);
  };

  const togglePostLike = async (postId) => {
    if (!token) {
      navigate('/auth');
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:8000/api/posts/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedPost = response.data.data;
      setSocialPosts((prev) => prev.map((p) => (p._id === updatedPost._id ? updatedPost : p)));
      if (selectedPost?._id === updatedPost._id) {
        setSelectedPost(updatedPost);
      }
    } catch (err) {
      console.error('Toggle post like error', err);
    }
  };

  const openPostOrJob = (post) => {
    if (post.jobId) {
      openJobModal(post.jobId);
    } else {
      openPostModal(post);
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

    const fetchSocialPosts = async () => {
      if (!token) return;
      try {
        const response = await axios.get("http://localhost:8000/api/posts", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setSocialPosts(response.data.data || []);
      } catch (error) {
        console.error("Social posts fetch error", error);
      }
    };

    fetchJobs();
    fetchSocialPosts();
  }, [token]);

  const tabs = ["For you", "Trending", "Saved"];
  const [activeTab, setActiveTab] = useState("For you");

  const jobPosts = jobs.map((job) => {
    const viewsCount = Array.isArray(job.views) ? job.views.length : 0;
    const likesCount = Array.isArray(job.likes) ? job.likes.length : 0;
    const applicantsCount = Array.isArray(job.applicants) ? job.applicants.length : 0;
    const userLiked = job.likes?.some(
      (like) => like.toString() === currentUserId?.toString()
    );

    return {
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
        `Employer: ${job.createdBy?.companyName || `${job.createdBy?.firstName || ""} ${job.createdBy?.lastName || ""}`}`,
        `Job ID: ${job._id}`,
      ],
      tags: [
        job.category ? `#${job.category.replace(/\s+/g, "")}` : `#${job.title.split(" ").slice(0, 2).join("")}`,
        job.location ? `#${job.location.split(",")[0].replace(/\s+/g, "")}` : "#Remote",
      ],
      applicants: applicantsCount,
      views: viewsCount,
      likes: likesCount,
      userLiked,
      createdById: job.createdBy?._id,
    };
  });

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
    const matchesLocation =
      locationFilter === "All" || post.location === locationFilter;
    const matchesCompany =
      companyFilter === "All" || post.company === companyFilter;

    return matchesSearch && matchesCategory && matchesLocation && matchesCompany;
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

        <div style={styles.filterRow}>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="All">All locations</option>
            {[...new Set(jobs.map((job) => job.location || "Remote"))]
              .filter(Boolean)
              .map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
          </select>

          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="All">All companies</option>
            {[...new Set(jobs.map((job) => job.companyName || "Unknown"))]
              .filter(Boolean)
              .map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={styles.filterSelect}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
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
          {currentUser?.role === "jobseeker" && (
            <div style={styles.postComposerCard}>
              <h2 style={styles.postComposerTitle}>Share a job search update</h2>
              <p style={styles.postComposerSubtitle}>
                Post short updates, questions, or memes for your network.
              </p>
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's on your mind?"
                style={styles.postComposerTextarea}
              />
              <input
                value={newPostTags}
                onChange={(e) => setNewPostTags(e.target.value)}
                placeholder="Tags (comma separated)"
                style={styles.postComposerInput}
              />
              <button
                style={styles.postComposerButton}
                onClick={handleCreatePost}
              >
                Post update
              </button>
            </div>
          )}

          {socialPosts.length > 0 && (
            <div style={styles.socialFeedHeading}>
              <h3 style={styles.sidebarTitle}>Jobseeker updates</h3>
            </div>
          )}
          {socialPosts.map((post) => (
            <div key={post._id} style={styles.socialPostCard}>
              <div style={styles.socialPostHeader}>
                <div style={styles.postAvatar}>
                  {post.authorAvatar ? (
                    <img src={post.authorAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    post.authorName?.charAt(0) || "U"
                  )}
                </div>
                <div style={styles.postHeading}>
                  <div style={styles.postCompanyRow}>
                    <span style={{ ...styles.postCompany, cursor: post.author ? 'pointer' : 'default' }} onClick={() => post.author && navigate(`/profile/${post.author}`)}>{post.authorName || "Jobseeker"}</span>
                    <span style={styles.postDot}>·</span>
                    <span style={styles.postMeta}>{post.authorRole}</span>
                  </div>
                  <span style={styles.postMeta}>{new Date(post.createdAt).toLocaleString()}</span>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  {post.author === currentUserId && (
                    <>
                      <button style={styles.actionButton} onClick={() => startEditPost(post)}>Edit</button>
                      <button style={styles.actionButton} onClick={() => archivePost(post._id)}>Archive</button>
                      <button style={{ ...styles.actionButton, background: '#ffefef', color: '#b91c1c' }} onClick={() => deletePost(post._id)}>Delete</button>
                    </>
                  )}
                </div>
              </div>
              <div style={styles.postBody} onClick={() => openPostOrJob(post)}>
                <p style={styles.postText}>{post.content}</p>
              </div>
              {post.tags?.length > 0 && (
                <div style={styles.postTags}>
                  {post.tags.map((tag, index) => (
                    <span key={`${post._id || post.id}-social-tag-${index}`} style={styles.postTag}>#{tag}</span>
                  ))}
                </div>
              )}
              {editingPostId === post._id && (
                <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                  <textarea value={editingContent} onChange={(e) => setEditingContent(e.target.value)} style={{ width: '100%', minHeight: 80 }} />
                  <input value={editingTags} onChange={(e) => setEditingTags(e.target.value)} placeholder="Tags (comma separated)" />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={cancelEdit} style={styles.actionButton}>Cancel</button>
                    <button onClick={saveEditPost} style={styles.postComposerButton}>Save</button>
                  </div>
                </div>
              )}
            </div>
          ))}
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
                {post.tags.map((tag, index) => (
                  <span key={`${post.id}-tag-${index}`} style={styles.postTag}>{tag}</span>
                ))}
              </div>

              <div style={styles.postStatsRow}>
                <span style={styles.postStatItem}> {post.applicants} applicants</span>
                <span style={styles.postStatItem}> {post.views} views</span>
                <span style={styles.postStatItem}> {post.likes} likes</span>
              </div>

              <div style={styles.postActionRow}>
                <button
                  style={savedJobIds.includes(post.id) ? styles.savedButton : styles.actionButton}
                  onClick={() => handleSave(post.id)}
                >
                  {savedJobIds.includes(post.id) ? "Saved" : "Save"}
                </button>
                <button
                  style={{
                    ...(post.userLiked ? styles.savedButton : styles.actionButton),
                  }}
                  onClick={() => handleToggleLike(post.id)}
                  disabled={jobActionLoading}
                >
                  {post.userLiked ? `Unlike (${post.likes})` : `Like (${post.likes})`}
                </button>
                <button
                  style={styles.actionButton}
                  onClick={() => handleApply(post.id, post.role)}
                  disabled={jobActionLoading}
                >
                  Apply
                </button>
                <button
                  style={styles.actionButton}
                  onClick={() => openJobModal(post.id)}
                >
                  View details
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

      {showPostModal && selectedPost && (
        <div style={styles.modalOverlay} onClick={closePostModal}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={{ margin: 0 }}>Post details</h2>
                <p style={{ margin: '8px 0 0', color: '#64748b' }}>
                  {selectedPost.authorName || 'Unknown author'} · {selectedPost.authorRole}
                </p>
              </div>
              <button style={styles.modalClose} onClick={closePostModal}>✕</button>
            </div>

            <div style={styles.socialPostHeader}>
              <div style={styles.postAvatar}>
                {selectedPost.authorAvatar ? (
                  <img src={selectedPost.authorAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  selectedPost.authorName?.charAt(0) || 'U'
                )}
              </div>
              <div style={{ marginLeft: 16 }}>
                <button
                  style={styles.profileLinkButton}
                  onClick={() => navigate(`/profile/${selectedPost.author}`)}
                >
                  View profile
                </button>
                <p style={{ margin: '8px 0 0', color: '#334155' }}>
                  {new Date(selectedPost.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div style={styles.modalBody}>
              <p style={styles.postText}>{selectedPost.content}</p>
              {selectedPost.media?.data && (
                <div style={{ marginTop: 16 }}>
                  <img
                    src={selectedPost.media.data}
                    alt="post media"
                    style={{ width: '100%', borderRadius: 14, maxHeight: 320, objectFit: 'cover' }}
                  />
                </div>
              )}
              {selectedPost.tags?.length > 0 && (
                <div style={styles.postTags}>
                  {selectedPost.tags.map((tag, index) => (
                    <span key={`${selectedPost._id}-modal-tag-${index}`} style={styles.postTag}>#{tag}</span>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.modalActions}>
              <button
                style={styles.actionButton}
                onClick={() => togglePostLike(selectedPost._id)}
              >
                {selectedPost.likes?.some((id) => id.toString() === currentUserId?.toString())
                  ? `Unlike (${selectedPost.likes.length})`
                  : `Like (${selectedPost.likes?.length || 0})`}
              </button>
              <button
                style={styles.actionButton}
                onClick={() => closePostModal()}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Modal */}
      {showJobModal && modalJob && (
        <div style={styles.modalOverlay} onClick={closeJobModal}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={{ margin: 0 }}>{modalJob.title}</h2>
              <button style={styles.modalClose} onClick={closeJobModal}>✕</button>
            </div>

            <p style={styles.modalCompany}>{modalJob.companyName} · {modalJob.location || 'Remote'}</p>
            <div style={styles.modalBody}>
              <p style={styles.postText}>{modalJob.description}</p>
              <h4>Requirements</h4>
              <p style={styles.postText}>{modalJob.requirements}</p>

              <h4>Details</h4>
              <ul>
                {modalJob.salary !== undefined && <li>Salary: {modalJob.salary ? `₱${modalJob.salary.toLocaleString()}` : 'Negotiable'}</li>}
                {modalJob.category && <li>Category: {modalJob.category}</li>}
                {modalJob.jobType && <li>Type: {modalJob.jobType}</li>}
                {modalJob.experienceLevel && <li>Experience: {modalJob.experienceLevel}</li>}
                <li>Job ID: {modalJob._id}</li>
              </ul>

              <div style={{ marginTop: 12 }}>
                <strong>Metrics:</strong>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <span>{modalJob.views?.length || 0} views</span>
                  <span> {modalJob.likes?.length || 0} likes</span>
                  <span>{modalJob.applicants?.length || 0} applicants</span>
                </div>
              </div>
            </div>

            <div style={styles.modalActions}>
              <button
                style={styles.actionButton}
                onClick={() => handleToggleLike(modalJob._id)}
                disabled={jobActionLoading}
              >
                {modalJob.likes?.some((id) => id.toString() === currentUserId?.toString()) ? 'Unlike' : 'Like'}
              </button>
              <button
                style={styles.actionButton}
                onClick={() => handleApply(modalJob._id, modalJob.title)}
                disabled={jobActionLoading}
              >
                Apply
              </button>
              <button style={styles.actionButton} onClick={() => { navigator.share ? navigator.share({ title: modalJob.title, text: modalJob.description }) : alert(modalJob.title + '\n' + modalJob.description); }}>
                Share
              </button>
            </div>
          </div>
        </div>
      )}
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
  filterRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "18px",
  },
  filterSelect: {
    padding: "12px 14px",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "14px",
    outline: "none",
    minWidth: "170px",
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
  postComposerCard: {
    background: "#ffffff",
    borderRadius: "24px",
    padding: "22px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
    display: "grid",
    gap: "14px",
  },
  postComposerTitle: {
    fontSize: "20px",
    fontWeight: "800",
    margin: 0,
  },
  postComposerSubtitle: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
    lineHeight: "1.6",
  },
  postComposerTextarea: {
    width: "100%",
    minHeight: "120px",
    borderRadius: "18px",
    border: "1px solid #cbd5e1",
    padding: "14px 16px",
    fontSize: "15px",
    color: "#0f172a",
    resize: "vertical",
    outline: "none",
  },
  postComposerInput: {
    width: "100%",
    borderRadius: "18px",
    border: "1px solid #cbd5e1",
    padding: "14px 16px",
    fontSize: "15px",
    color: "#0f172a",
    outline: "none",
  },
  postComposerButton: {
    width: "fit-content",
    padding: "12px 20px",
    borderRadius: "14px",
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
  },
  socialFeedHeading: {
    marginTop: "4px",
    marginBottom: "4px",
  },
  socialPostCard: {
    background: "#ffffff",
    borderRadius: "24px",
    padding: "20px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
  },
  socialPostHeader: {
    display: "flex",
    gap: "14px",
    marginBottom: "14px",
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
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
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
  profileLinkButton: {
    borderRadius: "14px",
    border: "1px solid #cbd5e1",
    background: "#eef2ff",
    color: "#1d4ed8",
    padding: "10px 14px",
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
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "grid",
    placeItems: "center",
    zIndex: 2000,
    padding: "20px",
  },
  modalCard: {
    width: "100%",
    maxWidth: "900px",
    background: "#fff",
    color: "#0f172a",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 10px 40px rgba(2,6,23,0.4)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  modalClose: {
    background: "transparent",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
  },
  modalCompany: {
    color: "#475569",
    marginTop: 0,
    marginBottom: "12px",
  },
  modalBody: {
    maxHeight: "60vh",
    overflow: "auto",
  },
};
