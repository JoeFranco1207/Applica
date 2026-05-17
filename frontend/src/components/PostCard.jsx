import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PostCard.css';

const PostCard = ({ post, onUpdate }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
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

  const handleComment = async () => {
    if (!commentText.trim()) return;

    try {
      console.log('Adding comment:', commentText);
      const response = await axios.post(
        `http://localhost:8000/api/posts/${currentPost._id}/comment`,
        { content: commentText },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log('Comment response:', response.data);
      setCommentText('');
      setCurrentPost(response.data.data);
      onUpdate(response.data.data);
    } catch (error) {
      console.error('Error adding comment:', error.response?.data || error.message);
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

  React.useEffect(() => {
    handleView();
  }, [currentPost._id]);

  return (
    <div className="post-card">
      {/* Post Header */}
      <div className="post-header">
        <div className="author-info">
          {currentPost.authorAvatar && (
            <img src={currentPost.authorAvatar} alt={currentPost.authorName} className="author-avatar" />
          )}
          <div className="author-details">
            <h3 className="author-name">{currentPost.authorName}</h3>
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
          onClick={() => setShowComments(!showComments)}
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
      {showComments && (
        <div className="comments-section">
          {/* Add Comment */}
          {(() => {
            const postAuthorId = typeof currentPost.author === 'object' 
              ? (currentPost.author._id || currentPost.author) 
              : currentPost.author;
            return userId?.toString() !== postAuthorId?.toString() && (
              <div className="add-comment">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  rows="2"
                />
                <button onClick={handleComment} className="submit-comment-btn">
                  Post Comment
                </button>
              </div>
            );
          })()}

          {/* Comments List */}
          <div className="comments-list">
            {currentPost.comments && currentPost.comments.length > 0 ? (
              currentPost.comments.map((comment) => {
                const commentAuthorId = typeof comment.author === 'object'
                  ? (comment.author._id || comment.author)
                  : comment.author;
                return (
                  <div key={comment._id} className="comment-item">
                    <div className="comment-author">
                      {comment.authorAvatar && (
                        <img src={comment.authorAvatar} alt={comment.authorName} className="comment-avatar" />
                      )}
                      <div className="comment-info">
                        <h4 className="comment-author-name">{comment.authorName}</h4>
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
              })
            ) : (
              <p className="no-comments">No comments yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
