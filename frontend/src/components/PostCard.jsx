import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PostCard.css';
import CommentModal from './CommentModal';

const getUserId = (user) => {
  if (!user) return null;
  return typeof user === 'object' ? user._id || user.id || null : user;
};

const PostCard = ({ post, onUpdate }) => {
  const navigate = useNavigate();
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [currentPost, setCurrentPost] = useState(post);

  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  // Update state when post changes
  useEffect(() => {
    setCurrentPost(post);
    // Check if current user has liked
    const hasLiked = post.likes?.some(id => {
      const likeId = typeof id === 'object' ? id._id || id : id;
      return likeId.toString() === userId?.toString();
    });
    setIsLiked(!!hasLiked);

    // Check if current user has reposted
    const hasReposted = post.reposts?.some(r => {
      const repostUserId = typeof r === 'object' ? (r.userId?._id || r.userId || r) : r;
      return repostUserId.toString() === userId?.toString();
    });
    setIsReposted(!!hasReposted);
  }, [post, userId]);

  const handleLike = async () => {
    try {
      console.log('Liking post:', currentPost._id);
      const response = await axios.post(
        `http://localhost:8000/api/posts/${currentPost._id}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log('Like response:', response.data);
      setIsLiked(!isLiked);
      setCurrentPost(response.data.data);
      onUpdate(response.data.data);
    } catch (error) {
      console.error('Error liking post:', error.response?.data || error.message);
    }
  };

  const handleCommentAdded = (updatedPost) => {
    console.log('Comment added! Updated post:', updatedPost);
    setCurrentPost(updatedPost);
    onUpdate(updatedPost);
  };

  const submitComment = async () => {
    if (!commentText.trim()) {
      alert('Please write a comment');
      return;
    }

    setIsSubmittingComment(true);
    try {
      const response = await axios.post(
        `http://localhost:8000/api/posts/${currentPost._id}/comment`,
        { content: commentText },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log('Comment submitted:', response.data);
      setCommentText('');
      setShowCommentModal(false);
      setCurrentPost(response.data.data);
      onUpdate(response.data.data);
      alert('Comment posted!');
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to post comment: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleView = async () => {
    try {
      await axios.post(
        `http://localhost:8000/api/posts/${currentPost._id}/view`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (error) {
      console.error('Error recording view:', error.response?.data || error.message);
    }
  };

  const handleShare = async () => {
    try {
      console.log('Sharing post:', currentPost._id);
      const response = await axios.post(
        `http://localhost:8000/api/posts/${currentPost._id}/share`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log('Share response:', response.data);
      setCurrentPost(response.data.data);
      onUpdate(response.data.data);
      alert('Post shared successfully!');
    } catch (error) {
      console.error('Error sharing post:', error.response?.data || error.message);
      alert('Failed to share post');
    }
  };

  const handleRepost = async () => {
    if (isReposted) {
      // Remove repost
      try {
        console.log('Removing repost:', currentPost._id);
        const response = await axios.delete(
          `http://localhost:8000/api/posts/${currentPost._id}/repost`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log('Remove repost response:', response.data);
        setIsReposted(false);
        setCurrentPost(response.data.data);
        onUpdate(response.data.data);
        console.log('Repost removed successfully!');
      } catch (error) {
        console.error('Error removing repost:', error.response?.data || error.message);
        alert('Failed to remove repost');
      }
    } else {
      // Add repost
      try {
        console.log('Adding repost:', currentPost._id);
        const response = await axios.post(
          `http://localhost:8000/api/posts/${currentPost._id}/repost`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log('Add repost response:', response.data);
        setIsReposted(true);
        setCurrentPost(response.data.data);
        onUpdate(response.data.data);
        console.log('Post reposted successfully!');
      } catch (error) {
        console.error('Error reposting post:', error.response?.data || error.message);
        alert('Failed to repost post');
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      console.log('Deleting comment:', commentId);
      const response = await axios.delete(
        `http://localhost:8000/api/posts/${currentPost._id}/comment/${commentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log('Delete comment response:', response.data);
      setCurrentPost(response.data.data);
      onUpdate(response.data.data);
    } catch (error) {
      console.error('Error deleting comment:', error.response?.data || error.message);
    }
  };


  return (
    <div className="post-card">
      {/* Post Header */}
      <div className="post-header">
        <div className="author-info">
          {currentPost.authorAvatar && (
            <img
              src={currentPost.authorAvatar}
              alt={currentPost.authorName}
              className="author-avatar"
              style={{ cursor: currentPost.author ? 'pointer' : 'default' }}
              onClick={() => {
                const authorId = getUserId(currentPost.author);
                if (authorId) navigate(`/profile/${authorId}`);
              }}
            />
          )}
          <div className="author-details">
            <h3
              className="author-name"
              style={{ cursor: currentPost.author ? 'pointer' : 'default' }}
              onClick={() => {
                const authorId = getUserId(currentPost.author);
                if (authorId) navigate(`/profile/${authorId}`);
              }}
            >
              {currentPost.authorName}
            </h3>
            <span className="author-role">{currentPost.authorRole}</span>
            <span className="post-time">{new Date(currentPost.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="post-content">
        <p className="post-text">{currentPost.content}</p>
        {currentPost.tags && currentPost.tags.length > 0 && (
          <div className="post-tags">
            {currentPost.tags.map((tag, idx) => (
              <span key={idx} className="tag">
                #{tag}
              </span>
            ))}
          </div>
        )}
        {currentPost.media && (
          <div className="post-media">
            {currentPost.media.type === 'image' && (
              <img src={currentPost.media.data} alt="Post media" className="post-image" />
            )}
            {currentPost.media.type === 'video' && (
              <video controls className="post-video">
                <source src={currentPost.media.data} type={currentPost.media.contentType} />
              </video>
            )}
          </div>
        )}
      </div>

      {/* Post Stats */}
      <div className="post-stats">
        <span>{currentPost.likes?.length || 0} Likes</span>
        <span>{currentPost.comments?.length || 0} Comments</span>
        <span>{currentPost.views?.length || 0} Views</span>
        <span>{currentPost.shares?.length || 0} Shares</span>
        <span>{currentPost.reposts?.length || 0} Reposts</span>
      </div>

      {/* Post Actions */}
      <div className="post-actions">
        <button
          className={`action-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          title="Like"
        >
          ❤️ {currentPost.likes?.length || 0}
        </button>
        <button
          className="action-btn"
          onClick={() => setShowCommentModal(true)}
          title="Comment"
        >
          💬 {currentPost.comments?.length || 0}
        </button>
        <button
          className="action-btn"
          onClick={handleView}
          title="View"
        >
          👁️ {currentPost.views?.length || 0}
        </button>
        <button
          className="action-btn"
          onClick={handleShare}
          title="Share"
        >
          🔗 {currentPost.shares?.length || 0}
        </button>
        <button
          className={`action-btn ${isReposted ? 'reposted' : ''}`}
          onClick={handleRepost}
          title="Repost"
        >
          🔄 {currentPost.reposts?.length || 0}
        </button>
      </div>

      {/* Comments Section */}
      {currentPost.comments && currentPost.comments.length > 0 && (
        <div className="comments-section">
          <div className="comments-list">
            {currentPost.comments.map((comment) => {
              const commentAuthorId = typeof comment.author === 'object'
                ? (comment.author._id || comment.author)
                : comment.author;
              return (
                <div key={comment._id} className="comment-item">
                  <div className="comment-author">
                    {comment.authorAvatar && (
                      <img
                        src={comment.authorAvatar}
                        alt={comment.authorName}
                        className="comment-avatar"
                        style={{ cursor: comment.author ? 'pointer' : 'default' }}
                        onClick={() => {
                          const authorId = getUserId(comment.author);
                          if (authorId) navigate(`/profile/${authorId}`);
                        }}
                      />
                    )}
                    <div className="comment-info">
                      <h4
                        className="comment-author-name"
                        style={{ cursor: comment.author ? 'pointer' : 'default' }}
                        onClick={() => {
                          const authorId = getUserId(comment.author);
                          if (authorId) navigate(`/profile/${authorId}`);
                        }}
                      >
                        {comment.authorName}
                      </h4>
                      <span className="comment-time">{new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p className="comment-text">{comment.content}</p>
                  {userId?.toString() === commentAuthorId?.toString() && (
                    <button
                      className="delete-comment-btn"
                      onClick={() => handleDeleteComment(comment._id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Reply</h2>
              <button 
                onClick={() => setShowCommentModal(false)}
                style={{ 
                  fontSize: '24px', 
                  cursor: 'pointer', 
                  border: 'none', 
                  background: 'none', 
                  padding: '0',
                  color: '#666'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '12px', 
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: '0', fontSize: '14px', color: '#333' }}>
                <strong>{currentPost.authorName}</strong>
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#666' }}>
                {currentPost.content}
              </p>
            </div>

            <textarea 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="What do you think?"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                minHeight: '100px',
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
                marginBottom: '15px',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            />
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCommentModal(false)}
                style={{
                  backgroundColor: '#f0f0f0',
                  color: '#333',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitComment}
                disabled={isSubmittingComment || !commentText.trim()}
                style={{
                  backgroundColor: commentText.trim() && !isSubmittingComment ? '#1da1f2' : '#ccc',
                  color: 'white',
                  padding: '10px 24px',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: commentText.trim() && !isSubmittingComment ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {isSubmittingComment ? 'Posting...' : 'Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
