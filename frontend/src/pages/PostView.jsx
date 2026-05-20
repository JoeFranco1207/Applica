import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import PostDetailsModal from '../components/PostDetailsModal';

const PostView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:8000/api/posts/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setPost(res.data.data);
      } catch (err) {
        console.error('Failed to load post', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  // Listen for profile updates and update the post author avatar/name if it matches
  useEffect(() => {
    const handler = (e) => {
      const updatedUser = e?.detail;
      if (!updatedUser || !post) return;
      try {
        const authorId = typeof post.author === 'object' ? (post.author._id || post.author) : post.author;
        const updatedUserId = updatedUser._id || updatedUser.id;
        if (authorId && updatedUserId && authorId.toString() === updatedUserId.toString()) {
          setPost((prev) => ({
            ...prev,
            authorAvatar: updatedUser.profilePicture || updatedUser.companyLogo || prev.authorAvatar,
            authorName: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim() || updatedUser.email || prev.authorName,
          }));
        }
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener('app:profileUpdated', handler);
    return () => window.removeEventListener('app:profileUpdated', handler);
  }, [post]);

  // read commentId from querystring
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const commentId = params.get('commentId');

  if (loading) return null;

  return (
    <PostDetailsModal
      post={post}
      isOpen={!!post}
      onClose={() => navigate(-1)}
      onUpdate={(updated) => setPost(updated)}
      currentUserId={JSON.parse(localStorage.getItem('user') || 'null')?._id}
      userName={JSON.parse(localStorage.getItem('user') || 'null')?.firstName || 'You'}
      userAvatar={JSON.parse(localStorage.getItem('user') || 'null')?.profilePicture}
      highlightCommentId={commentId}
    />
  );
};

export default PostView;
