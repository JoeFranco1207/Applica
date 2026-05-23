import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PostCard.css';
import LikesList from './LikesList';
import { useTranslate } from '../hooks/useTranslate';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';

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
  const [authorAvatarError, setAuthorAvatarError] = useState(false);
  const profileUpdateTimeoutRef = useRef(null);

  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
  const { translate } = useLanguage();

  const formatRelativeTime = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    const diff = Date.now() - d.getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}seg`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}min`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}oras`;
    const day = Math.floor(hr / 24);
    if (day < 30) return `${day}araw`;
    const month = Math.floor(day / 30);
    if (month < 12) return `${month}buwan`;
    const year = Math.floor(month / 12);
    return `${year}taon`;
  };

  const formatLastActive = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    const diff = Date.now() - d.getTime();
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

  const { socket } = useNotification();

  useEffect(() => {
    if (!socket || !currentPost?._id) return;

    const handlePostUpdated = (updatedPost) => {
      if (!updatedPost || updatedPost._id !== currentPost._id) return;

      const mergedPost = {
        ...currentPost,
        ...updatedPost,
      };

      setCurrentPost(mergedPost);
      if (onUpdate) onUpdate(mergedPost);

      const normalizedUserId = userId?.toString();
      const hasLiked = updatedPost.likes?.some((id) => {
        const likeId = typeof id === 'object' ? id._id || id : id;
        return likeId.toString() === normalizedUserId;
      });
      setIsLiked(!!hasLiked);

      const hasReposted = updatedPost.reposts?.some((r) => {
        const repostUserId = typeof r === 'object' ? (r.userId?._id || r.userId || r) : r;
        return repostUserId.toString() === normalizedUserId;
      });
      setIsReposted(!!hasReposted);
    };

    socket.on('post:updated', handlePostUpdated);
    return () => {
      socket.off('post:updated', handlePostUpdated);
    };
  }, [socket, currentPost?._id, currentPost, onUpdate, userId]);

  // Listen for presence updates from server (dispatched by NotificationContext)
  useEffect(() => {
    const handler = (e) => {
      const payload = e?.detail;
      if (!payload || !currentPost) return;
      const pid = (typeof currentPost.author === 'object' ? (currentPost.author._id || currentPost.author) : currentPost.author)?.toString();
      const uid = (payload.userId || payload.userID || payload.user)?.toString();
      if (!pid || !uid) return;
      if (pid === uid) {
        const mode = payload.presenceMode || (payload.isOnline ? 'online' : 'offline');
        setCurrentPost((prev) => ({ ...prev, authorIsOnline: mode === 'online', authorLastActive: payload.lastActive || null, authorPresenceMode: mode }));
      }
    };
    window.addEventListener('app:userPresenceUpdated', handler);
    return () => window.removeEventListener('app:userPresenceUpdated', handler);
  }, [currentPost]);

  // Listen for profile updates and refresh this post's display data
  useEffect(() => {
    const handler = async (e) => {
      const updatedUser = e?.detail;
      if (!updatedUser || !currentPost) return;
      
      const updatedUserId = updatedUser._id || updatedUser.id;
      if (!updatedUserId) return;

      const postAuthorId = typeof currentPost.author === 'object' 
        ? (currentPost.author._id || currentPost.author) 
        : currentPost.author;
      
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
          const merged = { ...currentPost, ...updatedData };
          setCurrentPost(merged);
          if (onUpdate) onUpdate(merged);
        } catch (error) {
          // Fallback: use the event detail to update immediately
          setCurrentPost((prev) => ({
            ...prev,
            authorAvatar: updatedUser.profilePicture || updatedUser.companyLogo || prev.authorAvatar,
            authorName: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim() || updatedUser.email || prev.authorName,
          }));
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

  if (!post || !post._id) return null;

  const handleLike = async () => {
    if (!token) {
      navigate('/auth');
      return;
    }

    const userIdString = userId?.toString();
    if (!currentPost) return;

    const previousPost = currentPost;
    const previousIsLiked = isLiked;

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
      const updatedData = response.data.data;
      const updatedPost = mergePostData(previousPost, updatedData);
      setCurrentPost(updatedPost);
      const hasLiked = updatedPost.likes?.some((id) => {
        const likeId = typeof id === 'object' ? id._id || id : id;
        return likeId.toString() === userIdString;
      });
      setIsLiked(hasLiked);
      onUpdate(updatedPost);
    } catch (error) {
      console.error('Error liking post:', error.response?.data || error.message);
      setIsLiked(previousIsLiked);
      setCurrentPost(previousPost);
    }
  };

  // Merge updated fields from API into the existing post while preserving
  // important author/profile fields when the API response omits them.
  const mergePostData = (existing = {}, updated = {}) => {
    const result = { ...existing, ...updated };

    // Preserve author-related display fields if API didn't provide them
    const authorFields = ['author', 'authorName', 'authorAvatar', 'authorRole', 'authorEmail', 'authorCompanyName'];
    authorFields.forEach((f) => {
      if (updated[f] === undefined || updated[f] === null) {
        result[f] = existing[f];
      }
    });

    // Preserve nested media or other complex objects if omitted
    if ((updated.media === undefined || updated.media === null) && existing.media) {
      result.media = existing.media;
    }

    return result;
  };

  const submitComment = async () => {
    if (!commentText.trim()) {
      alert('Pakiusap magsulat ng komento');
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
      const updatedData = response.data.data;
      const updatedPost = mergePostData(currentPost, updatedData);
      setCurrentPost(updatedPost);
      onUpdate(updatedPost);
      alert('Naipadala ang komento!');
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Nabigong mag-post ng komento: ' + (error.response?.data?.message || error.message));
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
      const updatedData = response.data.data;
      const updatedPost = mergePostData(currentPost, updatedData);
      setCurrentPost(updatedPost);
      onUpdate(updatedPost);
      alert('Matagumpay na naibahagi ang post!');
    } catch (error) {
      console.error('Error sharing post:', error.response?.data || error.message);
      alert('Nabigong ibahagi ang post');
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
        const updatedData = response.data.data;
        const updatedPost = mergePostData(currentPost, updatedData);
        setIsReposted(false);
        setCurrentPost(updatedPost);
        onUpdate(updatedPost);
        console.log('Matagumpay na tanggal ang repost!');
      } catch (error) {
        console.error('Error removing repost:', error.response?.data || error.message);
        alert('Nabigong tanggalin ang repost');
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
        const updatedData = response.data.data;
        const updatedPost = mergePostData(currentPost, updatedData);
        setIsReposted(true);
        setCurrentPost(updatedPost);
        onUpdate(updatedPost);
        console.log('Na-repost na ang post!');
      } catch (error) {
        console.error('Error reposting post:', error.response?.data || error.message);
        alert('Nabigong i-repost ang post');
      }
    }
  };


  const { translated: translatedContent, loading: translating, translateNow } = useTranslate(currentPost.content || '');
  const authorPresenceMode = currentPost.authorPresenceMode || currentPost.author?.presenceMode || (currentPost.authorIsOnline || currentPost.author?.isOnline ? 'online' : undefined);
  const authorLastActive = currentPost.authorLastActive || currentPost.author?.lastActive;
  const [showLikesModal, setShowLikesModal] = useState(false);

  const openLikesModal = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setShowLikesModal(true);
  };

  return (
    <div className="post-card">
      {/* Post Header */}
      <div className="post-header">
        <div className="author-info">
          <div className="avatar-wrapper" style={{ position: 'relative' }}>
            {(currentPost.authorAvatar && !authorAvatarError) ? (
              <img
                src={currentPost.authorAvatar}
                alt={currentPost.authorName}
                className="author-avatar"
                style={{ cursor: currentPost.author ? 'pointer' : 'default' }}
                onClick={() => {
                  const authorId = getUserId(currentPost.author);
                  if (authorId) navigate(`/profile/${authorId}`);
                }}
                onError={() => setAuthorAvatarError(true)}
              />
            ) : (
              <div
                className="author-avatar placeholder"
                style={{ cursor: currentPost.author ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => {
                  const authorId = getUserId(currentPost.author);
                  if (authorId) navigate(`/profile/${authorId}`);
                }}
              >
                {(currentPost.authorName && currentPost.authorName.charAt(0)) || 'U'}
              </div>
            )}

            {authorPresenceMode ? (
              <span className={`presence-dot presence-${authorPresenceMode}`} title={authorPresenceMode}></span>
            ) : null}
          </div>
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
            <div className="author-meta">
              <span className="author-role">{currentPost.authorRole}</span>
              {currentPost.authorCompanyName && (
                <span className="author-company">{currentPost.authorCompanyName}</span>
              )}
              <div className="author-email-date">
                {currentPost.authorEmail && (
                  <span className="author-email">{currentPost.authorEmail}</span>
                )}
                <span className="post-time">{formatRelativeTime(currentPost.createdAt)}</span>
                {authorPresenceMode !== 'online' && authorLastActive && (
                  <span className="last-active">{formatLastActive(authorLastActive)}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="post-content">
        <p className="post-text">{translating ? (currentPost.content) : (translatedContent || currentPost.content)}</p>
        {currentPost.tags && currentPost.tags.length > 0 && (
          <div className="post-tags">
            {currentPost.tags.map((tag, idx) => (
              <span key={idx} className="tag">
                #{tag}
              </span>
            ))}
          </div>
        )}
        {currentPost.media && (currentPost.media.url || currentPost.media.data) && (
          <div className="post-media">
            {currentPost.media.type === 'image' && (
              <img src={currentPost.media.url || currentPost.media.data} alt="Post media" className="post-image" />
            )}
            {currentPost.media.type === 'video' && (
              <video controls className="post-video">
                <source src={currentPost.media.url || currentPost.media.data} type={currentPost.media.contentType} />
              </video>
            )}
          </div>
        )}
      </div>

      {/* Post Stats */}
      <div className="post-stats">
        <span onClick={openLikesModal} style={{ cursor: 'pointer' }} title="View likers">{currentPost.likes?.length || 0} {translate('browse.likes')}</span>
        <span>{currentPost.comments?.length || 0} {translate('browse.comments')}</span>
        <span>{currentPost.views?.length || 0} {translate('browse.views')}</span>
        <span>{currentPost.shares?.length || 0} {translate('browse.shares')}</span>
        <span>{currentPost.reposts?.length || 0} {translate('browse.reposts')}</span>
      </div>

      {/* Post Actions */}
      <div className="post-actions">
        <button
          className={`action-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          title={translate('browse.likePostTitle')}
        >
          ❤️ <span onClick={(e) => { e.stopPropagation(); openLikesModal(e); }} style={{ cursor: 'pointer' }}>{currentPost.likes?.length || 0}</span>
        </button>
        <button
          className="action-btn"
          onClick={() => setShowCommentModal(true)}
          title={translate('browse.commentPostTitle')}
        >
          💬 {currentPost.comments?.length || 0}
        </button>
        <button
          className="action-btn"
          onClick={handleView}
          title={translate('browse.viewPostTitle')}
        >
          👁️ {currentPost.views?.length || 0}
        </button>
        <button
          className="action-btn"
          onClick={handleShare}
          title={translate('browse.sharePostTitle')}
        >
          🔗 {currentPost.shares?.length || 0}
        </button>
        <button
          className={`action-btn ${isReposted ? 'reposted' : ''}`}
          onClick={handleRepost}
          title={translate('browse.repostPostTitle')}
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
                      <span className="comment-time">{formatRelativeTime(comment.createdAt)}</span>
                    </div>
                  </div>
                  <p className="comment-text">{comment.content}</p>
                  {userId?.toString() === commentAuthorId?.toString() && (
                    <button
                      className="delete-comment-btn"
                      onClick={() => handleDeleteComment(comment._id)}
                    >
                      Tanggalin
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
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Sagot</h2>
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
              placeholder="Ano ang iniisip mo?"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                minHeight: '100px',
                fontFamily: 'inherit',
                fontSize: '14px',
                marginBottom: '15px',
                boxSizing: 'border-box'
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
                Kanselahin
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
                {isSubmittingComment ? 'Naga-post...' : 'Sagot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

      {showLikesModal && (
        <LikesList postId={currentPost._id} onClose={() => setShowLikesModal(false)} />
      )}

export default PostCard;
