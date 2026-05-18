import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PostDetailsModal.css';

const PostDetailsModal = ({ 
  post, 
  isOpen, 
  onClose, 
  onUpdate,
  currentUserId,
  userName,
  userAvatar 
}) => {
  const [commentText, setCommentText] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [error, setError] = useState('');
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const [currentPost, setCurrentPost] = useState(post);
  const [isLiked, setIsLiked] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (post) {
      setCurrentPost(post);
      const hasLiked = post.likes?.some(id => {
        const likeId = typeof id === 'object' ? id._id || id : id;
        return likeId.toString() === currentUserId?.toString();
      });
      setIsLiked(!!hasLiked);
    }
  }, [post, currentUserId]);

  if (!isOpen || !currentPost) return null;

  const handleLike = async () => {
    try {
      const response = await axios.post(
        `http://localhost:8000/api/posts/${currentPost._id}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCurrentPost(response.data.data);
      setIsLiked(!isLiked);
      if (onUpdate) onUpdate(response.data.data);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await axios.delete(
        `http://localhost:8000/api/posts/${currentPost._id}/comment/${commentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCurrentPost(response.data.data);
      if (onUpdate) onUpdate(response.data.data);
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    }
  };

  const submitComment = async () => {
    if (!commentText.trim()) {
      setError('Please write a comment');
      return;
    }

    setIsSubmittingComment(true);
    setError('');
    
    try {
      const response = await axios.post(
        `http://localhost:8000/api/posts/${currentPost._id}/comment`,
        { content: commentText },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setCurrentPost(response.data.data);
      setCommentText('');
      if (onUpdate) onUpdate(response.data.data);
    } catch (error) {
      console.error('Error posting comment:', error);
      setError(error.response?.data?.message || 'Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const submitReply = async (commentId) => {
    if (!replyText.trim()) {
      alert('Please write a reply');
      return;
    }

    setIsSubmittingReply(true);
    
    try {
      const response = await axios.post(
        `http://localhost:8000/api/posts/${currentPost._id}/comment/${commentId}/reply`,
        { content: replyText },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setCurrentPost(response.data.data);
      setReplyText('');
      setReplyingToCommentId(null);
      if (onUpdate) onUpdate(response.data.data);
    } catch (error) {
      console.error('Error posting reply:', error);
      alert(error.response?.data?.message || 'Failed to post reply');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const toggleRepliesExpanded = (commentId) => {
    const newSet = new Set(expandedReplies);
    if (newSet.has(commentId)) {
      newSet.delete(commentId);
    } else {
      newSet.add(commentId);
    }
    setExpandedReplies(newSet);
  };

  const expandComments = () => {
    if (!commentsExpanded) {
      setCommentsExpanded(true);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target.className === 'post-details-backdrop') {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="post-details-backdrop" onClick={handleBackdropClick} onKeyDown={handleKeyDown}>
      <div className="post-details-modal">
        {/* Close Button */}
        <button 
          className="modal-close-btn" 
          onClick={onClose}
          type="button"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Post Header Section */}
        <div className="post-details-header">
          <div className="post-author-section">
            {currentPost.authorAvatar && (
              <img 
                src={currentPost.authorAvatar} 
                alt={currentPost.authorName} 
                className="post-author-avatar" 
              />
            )}
            <div className="post-author-info">
              <h3 className="post-author-name">{currentPost.authorName}</h3>
              <p className="post-author-role">{currentPost.authorRole}</p>
              <span className="post-timestamp">
                {new Date(currentPost.createdAt).toLocaleDateString()} at {new Date(currentPost.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
          
          <div className="post-actions-menu">
            <button 
              className={`action-icon-btn ${isLiked ? 'liked' : ''}`}
              onClick={handleLike}
              title="Like"
            >
              ❤️
            </button>
          </div>
        </div>

        {/* Post Content */}
        <div className="post-details-content">
          <p className="post-text">{currentPost.content}</p>
          
          {currentPost.tags && currentPost.tags.length > 0 && (
            <div className="post-tags">
              {currentPost.tags.map((tag, idx) => (
                <span key={idx} className="tag">#{tag}</span>
              ))}
            </div>
          )}

          {currentPost.media && (
            <div className="post-media-section">
              {currentPost.media.type === 'image' && (
                <img 
                  src={currentPost.media.data} 
                  alt="Post media" 
                  className="post-media-image" 
                />
              )}
              {currentPost.media.type === 'video' && (
                <video controls className="post-media-video">
                  <source src={currentPost.media.data} type={currentPost.media.contentType} />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="modal-divider"></div>

        {/* Comments Section */}
        <div className={`comments-container ${commentsExpanded ? 'expanded' : ''}`} onClick={() => setCommentsExpanded(true)}>
          <div className="comments-list">
            {currentPost.comments && currentPost.comments.length > 0 ? (
              currentPost.comments.map((comment) => {
                const commentAuthorId = typeof comment.author === 'object'
                  ? (comment.author._id || comment.author)
                  : comment.author;
                const canDeleteComment = currentUserId?.toString() === commentAuthorId?.toString();
                const showReplies = expandedReplies.has(comment._id);

                return (
                  <div key={comment._id} className="comment-item">
                    <div className="comment-header">
                      {comment.authorAvatar && (
                        <img 
                          src={comment.authorAvatar} 
                          alt={comment.authorName} 
                          className="comment-avatar" 
                        />
                      )}
                      <div className="comment-author-info">
                        <h4 className="comment-author-name">{comment.authorName}</h4>
                        <span className="comment-timestamp">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {canDeleteComment && (
                        <button
                          className="delete-comment-btn"
                          onClick={() => handleDeleteComment(comment._id)}
                          title="Delete comment"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <p className="comment-text">{comment.content}</p>
                    
                    {/* Reply Button */}
                    <button
                      className="reply-trigger-btn"
                      onClick={() => {
                        if (replyingToCommentId === comment._id) {
                          setReplyingToCommentId(null);
                        } else {
                          setReplyingToCommentId(comment._id);
                          setReplyText('');
                        }
                      }}
                    >
                      Reply
                    </button>

                    {/* Reply Input */}
                    {replyingToCommentId === comment._id && (
                      <div className="reply-input-section">
                        <div className="reply-user-info">
                          {userAvatar && (
                            <img src={userAvatar} alt={userName || 'You'} className="reply-avatar" />
                          )}
                          <span className="reply-username">{userName || 'You'}</span>
                        </div>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write your reply..."
                          className="reply-input"
                          rows="3"
                          disabled={isSubmittingReply}
                        />
                        <div className="reply-actions">
                          <button
                            className="cancel-reply-btn"
                            onClick={() => setReplyingToCommentId(null)}
                            disabled={isSubmittingReply}
                          >
                            Cancel
                          </button>
                          <button
                            className="submit-reply-btn"
                            onClick={() => submitReply(comment._id)}
                            disabled={!replyText.trim() || isSubmittingReply}
                          >
                            {isSubmittingReply ? 'Posting...' : 'Reply'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Replies List */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="replies-section">
                        <button
                          className="view-replies-btn"
                          onClick={() => toggleRepliesExpanded(comment._id)}
                        >
                          {showReplies ? '▼' : '▶'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                        </button>
                        
                        {showReplies && (
                          <div className="replies-list">
                            {comment.replies.map((reply) => (
                              <div key={reply._id} className="reply-item">
                                <div className="reply-header">
                                  {reply.authorAvatar && (
                                    <img 
                                      src={reply.authorAvatar} 
                                      alt={reply.authorName} 
                                      className="reply-avatar" 
                                    />
                                  )}
                                  <div className="reply-author-info">
                                    <h5 className="reply-author-name">{reply.authorName}</h5>
                                    <span className="reply-timestamp">
                                      {new Date(reply.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <p className="reply-text">{reply.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="no-comments-message">
                <p>No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </div>

        {/* Post Stats - Moved to Bottom */}
        <div className="post-stats-section-bottom">
          <div className="stat-item">
            <span className="stat-number">{currentPost.likes?.length || 0}</span>
            <span className="stat-label">Likes</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{currentPost.comments?.length || 0}</span>
            <span className="stat-label">Comments</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{currentPost.views?.length || 0}</span>
            <span className="stat-label">Views</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{currentPost.shares?.length || 0}</span>
            <span className="stat-label">Shares</span>
          </div>
        </div>

        {/* Comment Input Section */}
        <div className="comment-input-section">
          <div className="comment-input-header">
            <div className="comment-user-info">
              {userAvatar && (
                <img src={userAvatar} alt={userName || 'You'} className="comment-user-avatar" />
              )}
              <span className="comment-username">{userName || 'You'}</span>
            </div>
          </div>

          <textarea
            value={commentText}
            onFocus={expandComments}
            onChange={(e) => {
              setCommentText(e.target.value);
              if (error) setError('');
            }}
            placeholder="Post your reply!"
            className="comment-textarea"
            rows="3"
            disabled={isSubmittingComment}
          />

          {error && <div className="error-message">{error}</div>}

          <div className="comment-submit-actions">
            <button
              onClick={submitComment}
              disabled={!commentText.trim() || isSubmittingComment}
              className="submit-comment-btn"
              type="button"
            >
              {isSubmittingComment ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailsModal;
