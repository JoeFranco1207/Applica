import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Moderation() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (e) {
      return {};
    }
  })();
  const isAdmin = storedUser?.role === 'admin';

  const [queue, setQueue] = useState([]);
  const [blocklist, setBlocklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newWord, setNewWord] = useState('');

  useEffect(() => {
    if (!token) return navigate('/auth');
    if (!isAdmin) return navigate('/');

    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchQueue(), fetchBlocklist()]);
      setLoading(false);
    };

    loadData();
  }, [token, isAdmin, navigate]);

  const fetchQueue = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/admin/moderation/queue', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQueue(res.data.data.posts || []);
    } catch (err) {
      console.error('Failed to load moderation queue', err);
      setQueue([]);
    }
  };

  const fetchBlocklist = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/admin/moderation/blocklist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBlocklist(res.data.data || []);
    } catch (err) {
      console.error('Failed to load blocklist', err);
      setBlocklist([]);
    }
  };

  const clearRestriction = async (postId) => {
    try {
      await axios.post(
        `http://localhost:8000/api/admin/moderation/posts/${postId}/clear`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchQueue();
    } catch (err) {
      console.error(err);
    }
  };

  const restrictWithReason = async (postId, reason) => {
    try {
      await axios.post(
        `http://localhost:8000/api/admin/moderation/posts/${postId}/restrict`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchQueue();
    } catch (err) {
      console.error(err);
    }
  };

  const addWord = async () => {
    if (!newWord.trim()) return;
    try {
      await axios.post(
        'http://localhost:8000/api/admin/moderation/blocklist',
        { word: newWord.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewWord('');
      fetchBlocklist();
    } catch (err) {
      console.error(err);
    }
  };

  const removeWord = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/api/admin/moderation/blocklist/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchBlocklist();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Moderation Center</h1>
          <p style={subtitleStyle}>Review restricted posts, manage blocklist words, and keep Applica safe.</p>
        </div>
        <button onClick={() => { setLoading(true); Promise.all([fetchQueue(), fetchBlocklist()]).finally(() => setLoading(false)); }} style={refreshButtonStyle}>
          Refresh data
        </button>
      </div>

      <div style={statsGridStyle}>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Restricted Posts</div>
          <div style={statValueStyle}>{queue.length}</div>
          <div style={statMetaStyle}>Posts flagged for review.</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Blocked Words</div>
          <div style={statValueStyle}>{blocklist.length}</div>
          <div style={statMetaStyle}>Words currently on the blocklist.</div>
        </div>
      </div>

      {loading ? (
        <div style={loadingStyle}>Loading moderation data...</div>
      ) : (
        <div style={gridStyle}>
          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <h2 style={panelTitleStyle}>Restricted Posts</h2>
                <p style={panelSubtitleStyle}>Review and clear restrictions for flagged content.</p>
              </div>
            </div>

            {queue.length === 0 ? (
              <div style={emptyStateStyle}>No posts are currently restricted.</div>
            ) : (
              queue.map((post) => (
                <div key={post._id} style={cardStyle}>
                  <div style={cardHeaderStyle}>
                    <div>{post.authorName || post.authorEmail || 'Unknown author'}</div>
                    <div style={dateStyle}>{new Date(post.createdAt).toLocaleString()}</div>
                  </div>
                  <div style={postContentStyle}>{post.content}</div>
                  <div style={tagStyle}>Reason: {post.restrictionReason || 'Unknown'}</div>
                  <div style={cardActionsStyle}>
                    <button onClick={() => clearRestriction(post._id)} style={clearButtonStyle}>Clear restriction</button>
                    <button
                      onClick={() => {
                        const reason = prompt('Enter restriction reason', post.restrictionReason || 'Contains disallowed content');
                        if (reason != null) restrictWithReason(post._id, reason);
                      }}
                      style={denyButtonStyle}
                    >
                      Update reason
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>

          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <h2 style={panelTitleStyle}>Blocklist</h2>
                <p style={panelSubtitleStyle}>Add or remove forbidden words used by moderation.</p>
              </div>
            </div>

            <div style={blocklistInputRowStyle}>
              <input
                type="text"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="Add a blocked word"
                style={blocklistInputStyle}
              />
              <button onClick={addWord} style={addButtonStyle}>Add word</button>
            </div>

            {blocklist.length === 0 ? (
              <div style={emptyStateStyle}>No blocked words defined yet.</div>
            ) : (
              <div style={blocklistGridStyle}>
                {blocklist.map((item) => (
                  <div key={item._id} style={blocklistCardStyle}>
                    <span style={blocklistWordStyle}>{item.word}</span>
                    <button onClick={() => removeWord(item._id)} style={removeWordStyle}>Remove</button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

const containerStyle = {
  padding: 24,
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  marginBottom: 24,
};

const titleStyle = {
  fontSize: 32,
  color: '#0f172a',
  marginBottom: 8,
};

const subtitleStyle = {
  color: '#475569',
  fontSize: 15,
  maxWidth: 620,
  lineHeight: 1.6,
};

const refreshButtonStyle = {
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 14,
  padding: '12px 18px',
  cursor: 'pointer',
  fontWeight: 700,
};

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 16,
  marginBottom: 24,
};

const statCardStyle = {
  background: '#fff',
  borderRadius: 20,
  padding: 22,
  boxShadow: '0 20px 40px rgba(15, 23, 42, 0.06)',
};

const statLabelStyle = {
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.16em',
  color: '#64748b',
  marginBottom: 12,
};

const statValueStyle = {
  fontSize: 36,
  fontWeight: 800,
  color: '#0f172a',
};

const statMetaStyle = {
  marginTop: 8,
  color: '#64748b',
  fontSize: 13,
  lineHeight: 1.8,
};

const loadingStyle = {
  padding: 32,
  borderRadius: 20,
  background: '#fff',
  boxShadow: '0 20px 40px rgba(15, 23, 42, 0.06)',
  color: '#64748b',
  textAlign: 'center',
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: '2fr 1.1fr',
  gap: 24,
};

const panelStyle = {
  background: '#fff',
  borderRadius: 24,
  padding: 24,
  boxShadow: '0 20px 40px rgba(15, 23, 42, 0.06)',
};

const panelHeaderStyle = {
  marginBottom: 18,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const panelTitleStyle = {
  fontSize: 20,
  marginBottom: 6,
  color: '#0f172a',
};

const panelSubtitleStyle = {
  color: '#64748b',
  fontSize: 13,
  lineHeight: 1.7,
};

const cardStyle = {
  background: '#f8fafc',
  borderRadius: 20,
  padding: 20,
  marginBottom: 16,
  border: '1px solid #e2e8f0',
};

const cardHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  color: '#0f172a',
  fontWeight: 700,
};

const dateStyle = {
  color: '#64748b',
  fontSize: 12,
};

const postContentStyle = {
  marginTop: 12,
  color: '#334155',
  lineHeight: 1.7,
};

const tagStyle = {
  marginTop: 14,
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 12px',
  borderRadius: 999,
  background: '#f8d7da',
  color: '#991b1b',
  fontWeight: 700,
  fontSize: 13,
};

const cardActionsStyle = {
  marginTop: 18,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
};

const clearButtonStyle = {
  background: '#16a34a',
  color: '#fff',
  border: 'none',
  borderRadius: 14,
  padding: '10px 16px',
  cursor: 'pointer',
  fontWeight: 700,
};

const denyButtonStyle = {
  background: '#dc2626',
  color: '#fff',
  border: 'none',
  borderRadius: 14,
  padding: '10px 16px',
  cursor: 'pointer',
  fontWeight: 700,
};

const blocklistInputRowStyle = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  marginBottom: 18,
};

const blocklistInputStyle = {
  flex: 1,
  minWidth: 0,
  padding: '12px 16px',
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  outline: 'none',
  fontSize: 15,
};

const addButtonStyle = {
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 14,
  padding: '12px 18px',
  cursor: 'pointer',
  fontWeight: 700,
};

const blocklistGridStyle = {
  display: 'grid',
  gap: 12,
};

const blocklistCardStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '14px 18px',
  borderRadius: 16,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
};

const blocklistWordStyle = {
  fontWeight: 700,
  color: '#0f172a',
};

const removeWordStyle = {
  border: 'none',
  background: 'transparent',
  color: '#dc2626',
  cursor: 'pointer',
  fontWeight: 700,
};

const emptyStateStyle = {
  marginTop: 20,
  padding: 22,
  borderRadius: 20,
  background: '#f8fafc',
  color: '#64748b',
};
