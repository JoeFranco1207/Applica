import React, { useState } from 'react';
import axios from 'axios';
import './CommentModal.css';

const CommentModal = ({ post, isOpen, onClose, onCommentAdded, userName, userAvatar }) => {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  console.log('CommentModal isOpen:', isOpen, 'post:', post);

  if (!isOpen) return null;
  if (!post) {
    console.error('CommentModal: No post provided');
    return null;
  }

  const handleSubmit = async () => {
    if (!commentText.trim()) {
      setError('Pakiusap magsulat ng komento');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      console.log('=== SUBMITTING COMMENT ===');
      console.log('Post ID:', post._id);
      console.log('Comment text:', commentText);
      console.log('Token exists:', !!token);
      console.log('User ID:', userId);

      const response = await axios.post(
        `http://localhost:8000/api/posts/${post._id}/comment`,
        { content: commentText },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('=== COMMENT SUCCESS ===');
      console.log('Response:', response.data);
      
      setCommentText('');
      setError('');
      
      if (onCommentAdded) {
        onCommentAdded(response.data.data);
      }
      onClose();
    } catch (error) {
      console.error('=== COMMENT ERROR ===');
      console.error('Error:', error.message);
      console.error('Status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      console.error('Full error:', error);
      
      setError(error.response?.data?.message || error.message || 'Nabigong mag-post ng komento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target.className === 'comment-modal-backdrop') {
      onClose();
    }
  };

  return (
    <div className="comment-modal-backdrop" onClick={handleBackdropClick}>
      <div className="comment-modal">
        {/* Close Button */}
        <button 
          className="modal-close-btn" 
          onClick={onClose}
          type="button"
          aria-label="Isara"
        >
          ✕
        </button>

        {/* Original Post Preview */}
        <div className="original-post">
          <div className="post-preview-header">
            {post?.authorAvatar && (
              <img src={post.authorAvatar} alt={post.authorName || 'Author'} className="post-preview-avatar" />
            )}
            <div className="post-preview-info">
              <h4 className="post-preview-author">{post?.authorName || 'Anonymous na User'}</h4>
              <span className="post-preview-role">{post?.authorRole || 'Gumagamit'}</span>
            </div>
          </div>
          <p className="post-preview-content">{post?.content || ''}</p>
          {post?.media?.type === 'image' && post?.media?.data && (
            <img src={post.media.data} alt="Post media" className="post-preview-media" />
          )}
          {post?.media?.type === 'video' && post?.media?.data && (
            <video className="post-preview-media" controls>
              <source src={post.media.data} type={post.media.contentType} />
            </video>
          )}
        </div>

        {/* Divider */}
        <div className="modal-divider"></div>

        {/* Comment Input Section */}
        <div className="comment-input-section">
          <div className="comment-user-info">
            {userAvatar && (
              <img src={userAvatar} alt={userName || 'Ikaw'} className="comment-user-avatar" />
            )}
            <span className="comment-user-name">{userName || 'Ikaw'}</span>
          </div>

          <textarea
            value={commentText}
            onChange={(e) => {
              setCommentText(e.target.value);
              if (error) setError('');
            }}
            onKeyDown={handleKeyDown}
            placeholder="Mag-post ng iyong komento!"
            className="comment-input"
            rows="4"
            disabled={isSubmitting}
          />

          {error && <div className="comment-error">{error}</div>}

          <div className="comment-actions">
            <button
              onClick={handleSubmit}
              disabled={!commentText.trim() || isSubmitting}
              className="reply-btn"
              type="button"
            >
              {isSubmitting ? 'Nagpo-post...' : 'Sagot'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentModal;
