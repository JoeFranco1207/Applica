import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PostCard from '../components/PostCard';

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [error, setError] = useState('');
  const [isNarrow, setIsNarrow] = useState(typeof window !== 'undefined' ? window.innerWidth < 960 : false);

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 960);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const currentQuery = searchParams.get('query') || '';
    setQuery(currentQuery);
  }, [searchParams]);

  useEffect(() => {
    const queryValue = (searchParams.get('query') || '').trim();
    if (!queryValue) {
      setProfiles([]);
      setPosts([]);
      setError('Type a keyword, profile, or post to begin searching.');
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      setError('');
      try {
        const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE}/api/auth/search`, {
          params: { query: queryValue },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = response.data?.data || {};
        const fetchedProfiles = data.profiles || [];
        const fetchedPosts = data.posts || [];

        setProfiles(fetchedProfiles);
        setPosts(fetchedPosts);

        if (!fetchedProfiles.length && !fetchedPosts.length) {
          setError('No profiles or posts found for this search.');
        }
      } catch (err) {
        console.error('Search results error', err);
        setProfiles([]);
        setPosts([]);
        setError('Unable to load search results. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [searchParams]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextQuery = query.trim();
    if (!nextQuery) return;
    setSearchParams({ query: nextQuery });
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1>Search people and posts</h1>
        <p style={styles.subtitle}>Search names, companies, or post content, then click any profile or post to view it.</p>
      </div>
      <form onSubmit={handleSubmit} style={styles.searchForm}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people or posts"
          style={styles.input}
        />
        <button type="submit" style={styles.searchButton}>See results</button>
      </form>

      {loading ? (
        <div style={styles.status}>Loading search results...</div>
      ) : error ? (
        <div style={styles.status}>{error}</div>
      ) : (
        <div style={isNarrow ? styles.stacked : styles.columns}>
          <div style={styles.leftColumn}>
            <h2 style={styles.sectionHeader}>Profiles</h2>
            {profiles.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', padding: '12px' }}>No profiles</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {profiles.map((profile) => (
                  <button
                    key={profile._id}
                    type="button"
                    style={styles.resultCardCompact}
                    onClick={() => navigate(`/profile/${profile._id}`)}
                  >
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <img
                        src={profile.profilePicture || '/src/assets/Applica_Logo.png'}
                        alt={`${profile.firstName} ${profile.lastName}`}
                        style={styles.avatarSmall}
                      />
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={styles.resultName}>{`${profile.firstName} ${profile.lastName}`}</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                          <IconCompany />
                          <div style={styles.resultMeta}>{profile.companyName || profile.role || 'Profile'}</div>
                        </div>
                      </div>
                      <div style={{ marginLeft: 8 }} title="View profile">
                        <IconChevronRight />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={styles.rightColumn}>
            <h2 style={styles.sectionHeader}>Posts</h2>
            {posts.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', padding: '12px' }}>No posts</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {posts.map((post) => (
                  <div key={post._id} style={{ width: '100%' }}>
                    <PostCard post={post} onUpdate={() => {}} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function IconCompany() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="3" y="4" width="18" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="3" y="12" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const styles = {
  page: {
    padding: '28px 24px',
    maxWidth: 1100,
    margin: '0 auto',
  },
  header: {
    marginBottom: 18,
  },
  subtitle: {
    marginTop: 8,
    color: 'var(--text-secondary)',
    fontSize: 15,
  },
  searchForm: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 22,
  },
  input: {
    flex: 1,
    minWidth: 240,
    padding: '12px 16px',
    borderRadius: 999,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontSize: 15,
  },
  searchButton: {
    minWidth: 140,
    padding: '12px 18px',
    borderRadius: 999,
    border: 'none',
    cursor: 'pointer',
    backgroundColor: 'var(--primary)',
    color: 'var(--cta-text)',
    fontWeight: 700,
  },
  status: {
    fontSize: 15,
    color: 'var(--text-secondary)',
    padding: '20px 0',
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    marginBottom: 12,
    fontSize: 18,
    fontWeight: 700,
  },
  columns: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: 20,
  },
  stacked: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  leftColumn: {
    width: 320,
    minWidth: 220,
    maxHeight: '75vh',
    overflowY: 'auto',
    paddingRight: 6,
  },
  rightColumn: {
    width: '100%',
    minWidth: 320,
  },
  resultCardCompact: {
    textAlign: 'left',
    borderRadius: 12,
    padding: 10,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'inherit',
    cursor: 'pointer',
  },
  avatarSmall: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1px solid var(--border)',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  resultsGrid: {
    display: 'grid',
    gap: 16,
  },
  resultCard: {
    width: '100%',
    textAlign: 'left',
    borderRadius: 18,
    padding: 18,
    border: '1px solid var(--border)',
    background: 'var(--surface-strong)',
    color: 'inherit',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  postCard: {
    width: '100%',
    textAlign: 'left',
    borderRadius: 18,
    padding: 18,
    border: '1px solid var(--border)',
    background: 'var(--surface-strong)',
    color: 'inherit',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  cardHeader: {
    display: 'flex',
    gap: 14,
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1px solid var(--border)',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  resultName: {
    fontSize: 17,
    fontWeight: 700,
  },
  resultMeta: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    marginTop: 4,
  },
  postSnippet: {
    color: 'var(--text-secondary)',
    fontSize: 14,
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxHeight: 96,
  },
  postMediaThumb: {
    marginTop: 8,
    display: 'flex',
    justifyContent: 'center',
  },
  postThumbImage: {
    maxWidth: '100%',
    maxHeight: 220,
    borderRadius: 12,
    objectFit: 'cover',
  },
  postFooter: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
  viewLabel: {
    padding: '8px 12px',
    borderRadius: 999,
    backgroundColor: 'rgba(59,130,246,0.08)',
    color: 'var(--primary)',
    fontSize: 13,
    fontWeight: 700,
    alignSelf: 'flex-start',
  },
};
