import React, { useState } from 'react';
import axios from 'axios';
import './CreatePost.css';

const CreatePost = ({ onPostCreated }) => {
  const [postContent, setPostContent] = useState('');
  const [tags, setTags] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const mediaType = file.type.startsWith('image') ? 'image' : 'video';
        setMediaFile({
          data: reader.result,
          type: mediaType,
          contentType: file.type,
          fileName: file.name,
        });
        setMediaPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!postContent.trim()) {
      alert('Please write something for your post');
      return;
    }

    try {
      setLoading(true);
      const postData = {
        content: postContent,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        media: mediaFile || undefined,
      };

      const response = await axios.post('http://localhost:8000/api/posts', postData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPostContent('');
      setTags('');
      setMediaFile(null);
      setMediaPreview(null);

      if (onPostCreated) {
        onPostCreated(response.data.data);
      }

      alert('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-card">
      <div className="create-post-header">
        {user.profilePicture || user.companyLogo ? (
          <img
            src={user.profilePicture || user.companyLogo}
            alt={user.firstName}
            className="create-post-avatar"
          />
        ) : (
          <div className="create-post-avatar-initials">
            {user.firstName ? user.firstName[0] : user.email[0]}
          </div>
        )}
        <div>
          <h3 className="create-post-name">
            {user.firstName} {user.lastName}
          </h3>
          <span className="create-post-role">{user.role}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="create-post-form">
        <textarea
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
          placeholder="What's on your mind?"
          rows="4"
          className="post-textarea"
        />

        <div className="post-tags-input">
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Add tags (comma separated) #React #JavaScript"
            className="tags-input"
          />
        </div>

        {mediaPreview && (
          <div className="media-preview">
            {mediaFile.type === 'image' ? (
              <img src={mediaPreview} alt="Preview" className="preview-image" />
            ) : (
              <video controls className="preview-video">
                <source src={mediaPreview} type={mediaFile.contentType} />
              </video>
            )}
            <button
              type="button"
              onClick={handleRemoveMedia}
              className="remove-media-btn"
            >
              ✕
            </button>
          </div>
        )}

        <div className="post-actions-bar">
          <div className="post-media-buttons">
            <label className="media-button">
              📷
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaChange}
                hidden
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={loading || !postContent.trim()}
            className="post-submit-btn"
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
