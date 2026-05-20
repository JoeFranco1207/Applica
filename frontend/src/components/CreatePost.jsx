import React, { useState } from 'react';
import axios from 'axios';
import './CreatePost.css';

const CreatePost = ({ onPostCreated }) => {
  const [postContent, setPostContent] = useState('');
  const [tags, setTags] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaFileType, setMediaFileType] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (mediaPreview) {
        URL.revokeObjectURL(mediaPreview);
      }
      const mediaType = file.type.startsWith('image') ? 'image' : 'video';
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      setMediaFileType(mediaType);
    }
  };

  const handleRemoveMedia = () => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }
    setMediaFile(null);
    setMediaFileType(null);
    setMediaPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!postContent.trim()) {
      alert('Pakiusap magsulat ng bagay para sa iyong post');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('content', postContent);
      tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .forEach((tag) => formData.append('tags[]', tag));
      if (mediaFile instanceof File) {
        formData.append('media', mediaFile);
      }

      const response = await axios.post('http://localhost:8000/api/posts', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPostContent('');
      setTags('');
      setMediaFile(null);
      setMediaPreview(null);
      setMediaFileType(null);

      if (onPostCreated) {
        onPostCreated(response.data.data);
      }

      alert('Matagumpay na nalikha ang post!');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Hindi malikha ang post');
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
          placeholder="Anong iniisip mo?"
          rows="4"
          className="post-textarea"
        />

        <div className="post-tags-input">
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Magdagdag ng mga tag (hiwalayin ng kuwit) #React #JavaScript"
            className="tags-input"
          />
        </div>

        {mediaPreview && (
          <div className="media-preview">
            {mediaFileType === 'image' ? (
              <img src={mediaPreview} alt="Preview" className="preview-image" />
            ) : (
              <video controls className="preview-video">
                <source src={mediaPreview} type={mediaFile?.type} />
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
            {loading ? 'Nagpo-post...' : 'I-post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
