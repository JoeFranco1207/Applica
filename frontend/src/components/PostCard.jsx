import React, { useState } from 'react';
import axios from 'axios';
import './PostCard.css';

const PostCard = ({ post, onUpdate }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(
    post.likes?.some(id => id === localStorage.getItem('userId')) || false
  );

  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  const handleLike = async () => {
    try {
      const response = await axios.post(
        `http://localhost:8000/api/posts/${post._id}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setIsLiked(!isLiked);
      onUpdate(response.data.data);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;

    try {
      const response = await axios.post(
        `http://localhost:8000/api/posts/${post._id}/comment`,
        { content: commentText },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCommentText('');
      onUpdate(response.data.data);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleView = async () => {
    try {
      await axios.post(
        `http://localhost:8000/api/posts/${post._id}/view`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (error) {
      console.error('Error recording view:', error);
    }
  };

  const handleShare = async () => {
    try {
      const response = await axios.post(
        `http://localhost:8000/api/posts/${post._id}/share`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      onUpdate(response.data.data);
      alert('Post shared successfully!');
    } catch (error) {
      console.error('Error sharing post:', error);
      alert('Failed to share post');
    }
  };

  const handleRepost = async () => {
    try {
      const response = await axios.post(
        `http://localhost:8000/api/posts/${post._id}/repost`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      onUpdate(response.data.data);
      alert('Post reposted successfully!');
    } catch (error) {
      console.error('Error reposting post:', error);
      alert('Failed to repost post');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await axios.delete(
        `http://localhost:8000/api/posts/${post._id}/comment/${commentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      onUpdate(response.data.data);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  React.useEffect(() => {
    handleView();
  }, [post._id]);

  return (
    <div className="post-card">
      {/* Post Header */}
      <div className="post-header">
        <div className="author-info">
          {post.authorAvatar && (
            <img src={post.authorAvatar} alt={post.authorName} className="author-avatar" />
          )}
          <div className="author-details">
            <h3 className="author-name">{post.authorName}</h3>
            <span className="author-role">{post.authorRole}</span>
            <span className="post-time">{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="post-content">
        <p className="post-text">{post.content}</p>
        {post.tags && post.tags.length > 0 && (
          <div className="post-tags">
            {post.tags.map((tag, idx) => (
              <span key={idx} className="tag">
                #{tag}
              </span>
            ))}
          </div>
        )}
        {post.media && (
          <div className="post-media">
            {post.media.type === 'image' && (
              <img src={post.media.data} alt="Post media" className="post-image" />
            )}
            {post.media.type === 'video' && (
              <video controls className="post-video">
                <source src={post.media.data} type={post.media.contentType} />
              </video>
            )}
          </div>
        )}
      </div>

      {/* Post Stats */}
      <div className="post-stats">
        <span>{post.likes?.length || 0} Likes</span>
        <span>{post.comments?.length || 0} Comments</span>
        <span>{post.views?.length || 0} Views</span>
        <span>{post.shares?.length || 0} Shares</span>
        <span>{post.reposts?.length || 0} Reposts</span>
      </div>

      {/* Post Actions */}
      <div className="post-actions">
        <button
          className={`action-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          title="Like"
        >
          ❤️ {post.likes?.length || 0}
        </button>
        <button
          className="action-btn"
          onClick={() => setShowComments(!showComments)}
          title="Comment"
        >
          💬 {post.comments?.length || 0}
        </button>
        <button
          className="action-btn"
          onClick={handleView}
          title="View"
        >
          👁️ {post.views?.length || 0}
        </button>
        <button
          className="action-btn"
          onClick={handleShare}
          title="Share"
        >
          🔗 {post.shares?.length || 0}
        </button>
        <button
          className="action-btn"
          onClick={handleRepost}
          title="Repost"
        >
          🔄 {post.reposts?.length || 0}
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="comments-section">
          {/* Add Comment */}
          {userId !== post.author && (
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
          )}

          {/* Comments List */}
          <div className="comments-list">
            {post.comments && post.comments.length > 0 ? (
              post.comments.map((comment) => (
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
                  {userId === comment.author && (
                    <button
                      className="delete-comment-btn"
                      onClick={() => handleDeleteComment(comment._id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))
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
