import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PostCard from '../../components/PostCard';
import CreatePost from '../../components/CreatePost';
import './Feed.css';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get('http://localhost:8000/api/posts', {
        headers,
      });
      const payload = response.data?.data;
      setPosts(Array.isArray(payload) ? payload : payload?.posts || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Listen for profile updates and update posts list entries when an author updates their avatar/name
  useEffect(() => {
    const handler = (e) => {
      const updatedUser = e?.detail;
      if (!updatedUser) return;
      setPosts((prev) =>
        prev.map((p) => {
          try {
            const authorId = typeof p.author === 'object' ? (p.author._id || p.author) : p.author;
            const updatedUserId = updatedUser._id || updatedUser.id;
            if (authorId && updatedUserId && authorId.toString() === updatedUserId.toString()) {
              return {
                ...p,
                authorAvatar: updatedUser.profilePicture || updatedUser.companyLogo || p.authorAvatar,
                authorName: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim() || updatedUser.email || p.authorName,
              };
            }
          } catch (err) {
            // ignore
          }
          return p;
        })
      );
    };

    window.addEventListener('app:profileUpdated', handler);
    return () => window.removeEventListener('app:profileUpdated', handler);
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts((prevPosts) => [newPost, ...prevPosts]);
  };

  // Merge helper to preserve author/avatar when API returns partial objects
  const mergePostData = (existing = {}, updated = {}) => {
    const result = { ...existing, ...updated };
    const authorFields = ['author', 'authorName', 'authorAvatar', 'authorRole'];
    authorFields.forEach((f) => {
      if (updated[f] === undefined || updated[f] === null) {
        result[f] = existing[f];
      }
    });
    if ((updated.media === undefined || updated.media === null) && existing.media) {
      result.media = existing.media;
    }
    return result;
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post._id === updatedPost._id ? mergePostData(post, updatedPost) : post
      )
    );
  };

  if (loading) {
    return <div className="feed-container loading">Loading posts...</div>;
  }

  if (error) {
    return <div className="feed-container error">{error}</div>;
  }

  return (
    <div className="feed-container">
      <div className="feed-header">
        <h1>Feed</h1>
        <p>Discover posts from employers and job seekers</p>
      </div>

      <CreatePost onPostCreated={handlePostCreated} />

      {posts.length === 0 ? (
        <div className="no-posts">
          <p>No posts yet. Be the first to create one!</p>
        </div>
      ) : (
        <div className="posts-list">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onUpdate={handlePostUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Feed;

