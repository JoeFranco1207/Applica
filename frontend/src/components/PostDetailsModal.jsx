import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PostDetailsModal.css';
import PresenceAvatar from './PresenceAvatar';
import { useTranslate } from '../hooks/useTranslate';
import { useLanguage } from '../contexts/LanguageContext';
import LikesList from './LikesList';

const getUserId = (user) => {
  if (!user) return null;
  return typeof user === 'object' ? user._id || user.id || null : user;
};

// Merge updated fields from API into the existing post while preserving
// important author/profile fields when the API response omits them.
const mergePostData = (existing = {}, updated = {}) => {
  const result = { ...existing, ...updated };

  const authorFields = ['author', 'authorName', 'authorAvatar', 'authorRole', 'authorEmail', 'authorCompanyName'];
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

const CloseIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const HeartIcon = ({ filled = false, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const ChatBubbleIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ShareIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const RepostIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <polyline points="17 2 21 6 17 10" />
    <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
    <polyline points="7 22 3 18 7 14" />
    <path d="M21 13v1a4 4 0 0 1-4 4H3" />
  </svg>
);

const SendIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const MailIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4h16v16H4z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const PostDetailsModal = ({ 
  post, 
  isOpen, 
  onClose, 
  onUpdate,
  currentUserId,
  userName,
  userAvatar,
  highlightCommentId
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
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [viewRecorded, setViewRecorded] = useState(false);
  const profileUpdateTimeoutRef = useRef(null);

  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const { translate } = useLanguage();
  const { translated: translatedContent, loading: translatingContent } = useTranslate(currentPost?.content || '');

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

  // If a specific comment should be highlighted (from notification), scroll and highlight it
  useEffect(() => {
    if (!highlightCommentId || !currentPost) return;
    setCommentsExpanded(true);
    // small delay so the DOM renders
    setTimeout(() => {
      const el = document.getElementById(`comment-${highlightCommentId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const prev = el.style.backgroundColor;
        el.style.backgroundColor = 'rgba(255, 246, 145, 0.5)';
        setTimeout(() => {
          el.style.transition = 'background-color 0.4s ease';
          el.style.backgroundColor = prev || 'transparent';
        }, 3000);
      }
    }, 200);
  }, [highlightCommentId, currentPost]);

  useEffect(() => {
    if (!post?._id) return;
    setViewRecorded(false);
  }, [post?._id]);

  useEffect(() => {
    if (!isOpen || !post?._id) return;

    const fetchFreshPost = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/posts/${post._id}?t=${Date.now()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const updatedData = response.data.data || {};
        const merged = mergePostData(post, updatedData);
        setCurrentPost(merged);
        if (onUpdate) onUpdate(merged);
      } catch (error) {
        console.error('Error fetching fresh post data:', error.response?.data || error.message);
      }
    };

    fetchFreshPost();
  }, [isOpen, post?._id, token, onUpdate, post]);

  useEffect(() => {
    if (!isOpen || !currentPost || viewRecorded) return;

    const recordView = async () => {
      try {
        const response = await axios.post(
          `http://localhost:8000/api/posts/${currentPost._id}/view`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const updatedData = response.data.data || {};
        const merged = mergePostData(currentPost, updatedData);
        setCurrentPost(merged);
        if (onUpdate) onUpdate(merged);
      } catch (error) {
        console.error('Error recording post view:', error.response?.data || error.message);
      } finally {
        setViewRecorded(true);
      }
    };

    recordView();
  }, [isOpen, currentPost, viewRecorded, onUpdate, token]);

  // Listen for profile updates and fetch fresh post data to ensure consistency
  useEffect(() => {
    const handler = async (e) => {
      const updatedUser = e?.detail;
      if (!updatedUser || !currentPost) return;

      const updatedUserId = updatedUser._id || updatedUser.id;
      if (!updatedUserId) return;

      const postAuthorId = getUserId(currentPost.author);
      // Only refresh if the updated user is the post author
      if (!postAuthorId || postAuthorId.toString() !== updatedUserId.toString()) {
        return;
      }

      // Clear any pending timeout to debounce rapid profile updates
      if (profileUpdateTimeoutRef.current) {
        clearTimeout(profileUpdateTimeoutRef.current);
      }

      // Debounce: wait 300ms before fetching to batch rapid updates
      profileUpdateTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await axios.get(`http://localhost:8000/api/posts/${currentPost._id}?t=${Date.now()}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const updatedData = response.data.data || {};
          const merged = mergePostData(currentPost, updatedData);
          setCurrentPost(merged);
          if (onUpdate) onUpdate(merged);
        } catch (error) {
          console.error('Error refreshing post after profile update:', error.response?.data || error.message);
        }
      }, 300);
    };

    window.addEventListener('app:profileUpdated', handler);
    return () => {
      window.removeEventListener('app:profileUpdated', handler);
      if (profileUpdateTimeoutRef.current) {
        clearTimeout(profileUpdateTimeoutRef.current);
      }
    };
  }, [currentPost, token, onUpdate]);

  // Listen for presence updates and update current post / comment authors
  useEffect(() => {
    const handler = (e) => {
      const payload = e?.detail;
      if (!payload || !currentPost) return;
      const uid = (payload.userId || payload.userID || payload.user)?.toString();

      // Update post author
      const postAuthorId = typeof currentPost.author === 'object' ? (currentPost.author._id || currentPost.author) : currentPost.author;
      if (postAuthorId && postAuthorId.toString() === uid) {
        const mode = payload.presenceMode || (payload.isOnline ? 'online' : 'offline');
        setCurrentPost((prev) => ({ ...prev, authorIsOnline: mode === 'online', authorLastActive: payload.lastActive || null, authorPresenceMode: mode }));
        return;
      }

      // Update comments and replies
      setCurrentPost((prev) => {
        if (!prev) return prev;
        const clone = { ...prev };
        if (Array.isArray(clone.comments)) {
            clone.comments = clone.comments.map((c) => {
            const cid = typeof c.author === 'object' ? (c.author._id || c.author) : c.author;
            if (cid && cid.toString() === uid) {
              const mode = payload.presenceMode || (payload.isOnline ? 'online' : 'offline');
              return { ...c, authorIsOnline: mode === 'online', authorLastActive: payload.lastActive || null, authorPresenceMode: mode };
            }
            if (Array.isArray(c.replies)) {
              c.replies = c.replies.map((r) => {
                const rid = typeof r.author === 'object' ? (r.author._id || r.author) : r.author;
                if (rid && rid.toString() === uid) {
                  const mode = payload.presenceMode || (payload.isOnline ? 'online' : 'offline');
                  return { ...r, authorIsOnline: mode === 'online', authorLastActive: payload.lastActive || null, authorPresenceMode: mode };
                }
                return r;
              });
            }
            return c;
          });
        }
        return clone;
      });
    };

    window.addEventListener('app:userPresenceUpdated', handler);
    return () => window.removeEventListener('app:userPresenceUpdated', handler);
  }, [currentPost]);

  if (!isOpen || !currentPost) return null;

  const handleLike = async () => {
    if (!token) {
      navigate('/auth');
      return;
    }

    if (!currentPost) return;
    const previousPost = currentPost;
    const previousIsLiked = isLiked;
    const userIdString = currentUserId?.toString();

    const normalizedLikes = (currentPost.likes || []).filter((id) => {
      const likeId = typeof id === 'object' ? id._id || id : id;
      return likeId.toString() !== userIdString;
    });

    const optimisticLikes = previousIsLiked
      ? normalizedLikes
      : [...normalizedLikes, userIdString];

    setIsLiked(!previousIsLiked);
    setCurrentPost((prev) => ({ ...prev, likes: optimisticLikes }));

    try {
      const response = await axios.post(
        `http://localhost:8000/api/posts/${currentPost._id}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const updatedData = response.data.data || {};
      const merged = mergePostData(currentPost, updatedData);
      setCurrentPost(merged);
      const hasLiked = updatedData.likes?.some((id) => {
        const likeId = typeof id === 'object' ? id._id || id : id;
        return likeId.toString() === userIdString;
      });
      setIsLiked(hasLiked);
      if (onUpdate) onUpdate(merged);
    } catch (error) {
      console.error('Error liking post:', error);
      setIsLiked(previousIsLiked);
      setCurrentPost(previousPost);
    }
  };

  const handleCommentButton = () => {
    expandComments();
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await axios.delete(
        `http://localhost:8000/api/posts/${currentPost._id}/comment/${commentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const updatedData = response.data.data || {};
      const merged = mergePostData(currentPost, updatedData);
      setCurrentPost(merged);
      if (onUpdate) onUpdate(merged);
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Nabigong tanggalin ang komento');
    }
  };

  const isCommentLiked = (comment) => {
    if (!comment.likes) return false;
    return comment.likes.some((id) => {
      const likeId = typeof id === 'object' ? id._id || id : id;
      return likeId.toString() === currentUserId?.toString();
    });
  };

  const toggleCommentLike = async (commentId) => {
    try {
      const response = await axios.post(
        `http://localhost:8000/api/posts/${currentPost._id}/comment/${commentId}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const updatedData = response.data.data || {};
      const merged = mergePostData(currentPost, updatedData);
      setCurrentPost(merged);
      if (onUpdate) onUpdate(merged);
    } catch (error) {
      console.error('Error toggling comment like:', error);
    }
  };

  const formatRelativeTime = (dateValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    const diff = Date.now() - date.getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}sec`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}min`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}hr`;
    const day = Math.floor(hr / 24);
    if (day < 30) return `${day}day`;
    const month = Math.floor(day / 30);
    if (month < 12) return `${month}month`;
    const year = Math.floor(month / 12);
    return `${year}yr`;
  };

  const formatLastActive = (dateValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    const diff = Date.now() - date.getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return 'just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} min ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} hr${hr>1?'s':''} ago`;
    const day = Math.floor(hr / 24);
    if (day < 30) return `${day} day${day>1?'s':''} ago`;
    const month = Math.floor(day / 30);
    if (month < 12) return `${month} mo ago`;
    const year = Math.floor(month / 12);
    return `${year} yr${year>1?'s':''} ago`;
  };

  const openLikesModal = (e) => {
    if (e?.stopPropagation) {
      e.stopPropagation();
    }
    setShowLikesModal(true);
  };

  const submitComment = async () => {
    if (!commentText.trim()) {
      setError('Pakiusap magsulat ng komento');
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
      
      const updatedData = response.data.data || {};
      const merged = mergePostData(currentPost, updatedData);
      setCurrentPost(merged);
      setCommentText('');
      if (onUpdate) onUpdate(merged);
    } catch (error) {
      console.error('Error posting comment:', error);
      setError(error.response?.data?.message || 'Nabigong mag-post ng komento');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const submitReply = async (commentId) => {
    if (!replyText.trim()) {
      alert('Pakiusap magsulat ng sagot');
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
      
      const updatedData = response.data.data || {};
      const merged = mergePostData(currentPost, updatedData);
      setCurrentPost(merged);
      setReplyText('');
      setReplyingToCommentId(null);
      if (onUpdate) onUpdate(merged);
    } catch (error) {
      console.error('Error posting reply:', error);
      alert(error.response?.data?.message || 'Nabigong mag-post ng sagot');
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

  const authorPresenceMode = currentPost.authorPresenceMode || currentPost.author?.presenceMode || (currentPost.authorIsOnline || currentPost.author?.isOnline ? 'online' : undefined);
  const authorLastActive = currentPost.authorLastActive || currentPost.author?.lastActive;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="post-details-backdrop" onClick={handleBackdropClick} onKeyDown={handleKeyDown}>
      <div className="post-details-modal">
        <button 
          className="modal-close-btn" 
          onClick={onClose}
          type="button"
          aria-label="Close"
        >
          <CloseIcon />
        </button>

        <div className="post-author-bar">
          <div className="post-author-section">
            <div className="avatar-wrapper" style={{ position: 'relative' }}>
              <PresenceAvatar
                userId={getUserId(currentPost.author)}
                src={currentPost.authorAvatar}
                alt={currentPost.authorName || 'User'}
                presenceMode={currentPost.authorPresenceMode || currentPost.author?.presenceMode || (currentPost.authorIsOnline || currentPost.author?.isOnline ? 'online' : undefined)}
                initialIsOnline={!!(currentPost.authorIsOnline || currentPost.author?.isOnline)}
                lastActive={currentPost.authorLastActive || currentPost.author?.lastActive}
                size={56}
                style={{ width: '100%', height: '100%', cursor: currentPost.author ? 'pointer' : 'default' }}
                showLastActive={false}
                onClick={() => {
                  const authorId = getUserId(currentPost.author);
                  if (authorId) navigate(`/profile/${authorId}`);
                }}
              />
            </div>

            <div className="post-author-info">
              <div className="post-author-name-row">
                <h2
                  className="post-details-title"
                  style={{ cursor: currentPost.author ? 'pointer' : 'default' }}
                  onClick={() => {
                    const authorId = getUserId(currentPost.author);
                    if (authorId) navigate(`/profile/${authorId}`);
                  }}
                >
                  {currentPost.authorName}
                </h2>
                {currentPost.authorRole && (
                  <span className="post-role-badge">{currentPost.authorRole}</span>
                )}
              </div>

              <div className="post-author-meta">
                {currentPost.authorEmail && (
                  <a href={`mailto:${currentPost.authorEmail}`} className="post-author-email-link">
                    <MailIcon />
                    <span>{currentPost.authorEmail}</span>
                  </a>
                )}
                <span className="post-author-timestamp">{formatRelativeTime(currentPost.createdAt)}</span>
                {authorPresenceMode !== 'online' && authorLastActive && (
                  <span className="last-active">{formatLastActive(authorLastActive)}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="post-details-content">
              <p className="post-text">{translatingContent ? currentPost.content : (translatedContent || currentPost.content)}</p>
          
          {currentPost.tags && currentPost.tags.length > 0 && (
            <div className="post-tags">
              {currentPost.tags.map((tag, idx) => (
                <span key={idx} className="tag">#{tag}</span>
              ))}
            </div>
          )}

          {currentPost.media && (currentPost.media.url || currentPost.media.data) && (
            <div className="post-media-section">
              {currentPost.media.type === 'image' && (
                <img 
                  src={currentPost.media.url || currentPost.media.data} 
                  alt="Post media" 
                  className="post-media-image" 
                />
              )}
              {currentPost.media.type === 'video' && (
                <video controls className="post-media-video">
                  <source src={currentPost.media.url || currentPost.media.data} type={currentPost.media.contentType} />
                  Hindi sinusuportahan ng iyong browser ang video tag.
                </video>
              )}
            </div>
          )}
        </div>

        <div className="post-actions-row">
          <button
            type="button"
            className={`action-icon-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleLike}
            title={translate('browse.likePostTitle')}
          >
            <HeartIcon filled={isLiked} />
            <span onClick={openLikesModal} style={{ cursor: 'pointer' }}>{currentPost.likes?.length || 0}</span>
          </button>

          <button
            type="button"
            className="action-icon-btn"
            onClick={handleCommentButton}
            title={translate('browse.commentPostTitle')}
          >
            <ChatBubbleIcon />
            <span>{currentPost.comments?.length || 0}</span>
          </button>

          <button
            type="button"
            className="action-icon-btn"
            onClick={async () => {
              try {
                const response = await axios.post(
                  `http://localhost:8000/api/posts/${currentPost._id}/repost`,
                  {},
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );
                const updatedData = response.data.data || {};
                const merged = mergePostData(currentPost, updatedData);
                setCurrentPost(merged);
                if (onUpdate) onUpdate(merged);
              } catch (err) {
                console.error('Repost error', err);
              }
            }}
            title={translate('browse.repostPostTitle')}
          >
            <RepostIcon />
            <span>{currentPost.reposts?.length || 0}</span>
          </button>

          <button
            type="button"
            className="action-icon-btn"
            onClick={async () => {
              try {
                const response = await axios.post(
                  `http://localhost:8000/api/posts/${currentPost._id}/share`,
                  {},
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );
                const updatedData = response.data.data || {};
                const merged = mergePostData(currentPost, updatedData);
                setCurrentPost(merged);
                if (onUpdate) onUpdate(merged);
              } catch (err) {
                console.error('Share error', err);
              }
            }}
            title={translate('browse.sharePostTitle')}
          >
            <ShareIcon />
            <span>{currentPost.shares?.length || 0}</span>
          </button>
        </div>

        <div className={`comments-container ${commentsExpanded ? 'expanded' : ''}`}>
          <div className="comments-top-bar">
            <span className="comments-sort-label">{translate('browse.mostRelevant')}</span>
            <span className="comments-sort-icon">▾</span>
          </div>

          <div className="comments-list">
            {currentPost.comments && currentPost.comments.length > 0 ? (
              currentPost.comments.map((comment) => {
                const commentAuthorId = typeof comment.author === 'object'
                  ? (comment.author._id || comment.author)
                  : comment.author;
                const canDeleteComment = currentUserId?.toString() === commentAuthorId?.toString();
                const showReplies = expandedReplies.has(comment._id);

                return (
                  <div key={comment._id} id={`comment-${comment._id}`} className="comment-item">
                    <div className="comment-header">
                      {comment.authorAvatar && (
                        <div className="avatar-wrapper" style={{ position: 'relative' }}>
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

                          {comment.authorPresenceMode ? (
                            <span className={`presence-dot presence-${comment.authorPresenceMode}`} title={comment.authorPresenceMode}></span>
                          ) : null}
                        </div>
                      )}
                      <div className="comment-author-info">
                        <div className="comment-author-top">
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
                          {comment.authorRole && (
                            <span className="comment-author-role">{comment.authorRole}</span>
                          )}
                        </div>
                        <div className="comment-meta-row">
                          <span className="comment-timestamp">
                            {formatRelativeTime(comment.createdAt)}
                          </span>
                          {comment.authorPresenceMode !== 'online' && comment.authorLastActive && (
                            <span className="last-active">{formatLastActive(comment.authorLastActive)}</span>
                          )}
                        </div>
                      </div>
                      {canDeleteComment && (
                        <button
                          className="delete-comment-btn"
                          onClick={() => handleDeleteComment(comment._id)}
                          title="Tanggalin ang komento"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <p className="comment-text">{comment.content}</p>
                    <div className="comment-actions-row">
                      <button
                        className={`comment-like-btn ${isCommentLiked(comment) ? 'liked' : ''}`}
                        onClick={() => toggleCommentLike(comment._id)}
                        type="button"
                        aria-label={isCommentLiked(comment) ? 'Hindi gusto ang komento' : 'Gusto ang komento'}
                      >
                        <svg className="comment-like-icon" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        <span>{comment.likes?.length || 0}</span>
                      </button>
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
                        Sagot
                      </button>
                    </div>

                    {replyingToCommentId === comment._id && (
                      <div className="reply-input-section">
                        <div className="reply-user-info">
                          {userAvatar && (
                            <img src={userAvatar} alt={userName || 'Ikaw'} className="reply-avatar" />
                          )}
                          <span className="reply-username">{userName || 'Ikaw'}</span>
                        </div>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Isulat ang iyong sagot..."
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
                            Kanselahin
                          </button>
                          <button
                            className="submit-reply-btn"
                            onClick={() => submitReply(comment._id)}
                            disabled={!replyText.trim() || isSubmittingReply}
                          >
                            {isSubmittingReply ? 'Naga-post...' : 'Sagot'}
                          </button>
                        </div>
                      </div>
                    )}

                    {comment.replies && comment.replies.length > 0 && (
                      <div className="replies-section">
                        <button
                          className="view-replies-btn"
                          onClick={() => toggleRepliesExpanded(comment._id)}
                        >
                          {showReplies ? '▼' : '▶'} {comment.replies.length} {comment.replies.length === 1 ? 'sagot' : 'mga sagot'}
                        </button>
                        
                        {showReplies && (
                          <div className="replies-list">
                            {comment.replies.map((reply) => (
                              <div key={reply._id} className="reply-item">
                                <div className="reply-header">
                                  {reply.authorAvatar && (
                                    <div className="avatar-wrapper" style={{ position: 'relative' }}>
                                      <img 
                                        src={reply.authorAvatar} 
                                        alt={reply.authorName} 
                                        className="reply-avatar" 
                                        style={{ cursor: reply.author ? 'pointer' : 'default' }}
                                        onClick={() => {
                                          const authorId = getUserId(reply.author);
                                          if (authorId) navigate(`/profile/${authorId}`);
                                        }}
                                      />

                                      {reply.authorPresenceMode ? (
                                        <span className={`presence-dot presence-${reply.authorPresenceMode}`} title={reply.authorPresenceMode}></span>
                                      ) : null}
                                    </div>
                                  )}
                                  <div className="reply-author-info">
                                    <div className="reply-author-top">
                                      <h5
                                        className="reply-author-name"
                                        style={{ cursor: reply.author ? 'pointer' : 'default' }}
                                        onClick={() => {
                                          const authorId = getUserId(reply.author);
                                          if (authorId) navigate(`/profile/${authorId}`);
                                        }}
                                      >
                                        {reply.authorName}
                                      </h5>
                                      {reply.authorRole && (
                                        <span className="reply-author-role">{reply.authorRole}</span>
                                      )}
                                    </div>
                                    <span className="reply-timestamp">
                                      {formatRelativeTime(reply.createdAt)}
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
                <p>Walang komento pa. Maging una sa pagkomento!</p>
              </div>
            )}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="comment-entry-row">
          {userAvatar && (
            <img src={userAvatar} alt={userName || 'Ikaw'} className="comment-input-avatar" />
          )}
          <input
            type="text"
            value={commentText}
            onFocus={expandComments}
            onChange={(e) => {
              setCommentText(e.target.value);
              if (error) setError('');
            }}
            placeholder="Sumulat ng sagot..."
            className="comment-input-bar"
            disabled={isSubmittingComment}
          />
          <button
            type="button"
            className="send-comment-btn"
            onClick={submitComment}
            disabled={!commentText.trim() || isSubmittingComment}
            title="I-post ang sagot"
          >
            <SendIcon />
          </button>
        </div>

        {showLikesModal && (
          <LikesList postId={currentPost._id} onClose={() => setShowLikesModal(false)} />
        )}
      </div>
    </div>
  );
};

export default PostDetailsModal;

