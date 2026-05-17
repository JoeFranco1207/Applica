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
      const response = await axios.get('http://localhost:8000/api/posts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(response.data.data || []);
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

  const handlePostCreated = (newPost) => {
    setPosts((prevPosts) => [newPost, ...prevPosts]);
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post._id === updatedPost._id ? updatedPost : post
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
