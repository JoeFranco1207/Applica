import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

export default function Chat() {
  const { socket } = useNotification();
  const location = useLocation();
  const requestedChatUserId = useMemo(() => new URLSearchParams(location.search).get('user'), [location.search]);
  const [connections, setConnections] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState('');
  const [chatError, setChatError] = useState(null);
  const [showUnsendModal, setShowUnsendModal] = useState(false);
  const [pendingUnsendMessageId, setPendingUnsendMessageId] = useState(null);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const token = localStorage.getItem('token');
  const fileInputRef = useRef(null);
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return null;
    }
  }, []);

  const getAttachmentUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    // If it's already an absolute URL or a data/blob URI, return as-is
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('//')) return url;
    // Otherwise normalize relative paths and prepend backend host
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    return `http://localhost:8000${normalizedUrl}`;
  };

  // Format values for the debug panel: truncate long data URIs and long strings
  const formatDebugValue = (val, max = 80) => {
    if (!val) return '';
    if (typeof val !== 'string') return String(val);
    if (val.startsWith('data:')) {
      const comma = val.indexOf(',');
      const header = comma === -1 ? val : val.slice(0, comma);
      return `${header},... (base64 truncated)`;
    }
    if (val.length > max) return val.slice(0, max) + '... (truncated)';
    return val;
  };

  const getAvatarUrl = (user) => {
    const avatar = user?.profilePicture || user?.companyLogo;
    return getAttachmentUrl(avatar);
  };

  const getMessageAvatarUrl = (message) => {
    if (!message) return null;
    const sender = message.sender;
    if (sender && typeof sender === 'object') {
      return getAvatarUrl(sender);
    }
    if (sender === currentUser?._id || sender === currentUser?.id) {
      return getAvatarUrl(currentUser);
    }
    if (selectedUser && (sender === selectedUser._id || sender === selectedUser?.id)) {
      return getAvatarUrl(selectedUser);
    }
    return null;
  };

  const getPlaceholderAvatar = (user, size = 128) => {
    const initials = (user && typeof user === 'object') ? getAvatarInitials(user) : (String(user || 'U').charAt(0).toUpperCase());
    const bg = encodeURIComponent('#374151');
    const fg = encodeURIComponent('#ffffff');
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'><rect width='100%' height='100%' fill='${bg}' rx='999' ry='999'/><text x='50%' y='50%' dy='.35em' font-family='Arial, Helvetica, sans-serif' font-size='${Math.floor(size/2.8)}' fill='${fg}' text-anchor='middle'>${initials}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const getAvatarInitials = (user) => {
    const source = (user?.firstName || user?.companyName || user?.email || 'U').trim();
    return source
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const HeartIcon = ({ filled = false, size = 16 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6.42 3.42 5 5.5 5c1.54 0 2.94.99 3.57 2.36h1.87C13.56 5.99 14.96 5 16.5 5 18.58 5 20 6.42 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={filled ? '#ef4444' : 'none'}
        stroke={filled ? '#ef4444' : 'currentColor'}
        strokeWidth="1.5"
      />
    </svg>
  );

  const normalizeMessage = (message) => ({
    ...message,
    liked: Boolean(message?.liked),
    likes: Number(message?.likes ?? 0),
  });

  const formatMessageText = (text) => {
    if (!text) return null;
    const parts = text.split(/(https?:\/\/[^\s]+|www\.[^\s]+)/g).filter(Boolean);
    return parts.map((part, index) => {
      const trimmedPart = part.trim();
      const isLink = /^(https?:\/\/|www\.)/.test(trimmedPart);
      if (isLink) {
        const href = trimmedPart.startsWith('http') ? trimmedPart : `https://${trimmedPart}`;
        return (
          <a key={index} href={href} target="_blank" rel="noreferrer" style={chatStyles.link}>
            {trimmedPart}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const preview = URL.createObjectURL(file);
      setSelectedFilePreview(preview);
    } else {
      setSelectedFilePreview('');
    }
  };

  const removeSelectedFile = () => {
    if (selectedFilePreview) {
      URL.revokeObjectURL(selectedFilePreview);
    }
    setSelectedFile(null);
    setSelectedFilePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const openUnsendModal = (messageId) => {
    setPendingUnsendMessageId(messageId);
    setShowUnsendModal(true);
  };

  const closeUnsendModal = () => {
    setPendingUnsendMessageId(null);
    setShowUnsendModal(false);
  };

  const handleUnsendMessage = async () => {
    if (!selectedUser || !pendingUnsendMessageId) return;
    setChatError(null);
    try {
      await axios.delete(`http://localhost:8000/api/chat/${selectedUser._id}/messages/${pendingUnsendMessageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages((prev) => prev.filter((msg) => msg._id !== pendingUnsendMessageId));
    } catch (err) {
      console.error('Failed to unsend message', err);
      setChatError(err.response?.data?.message || 'Unable to unsend message.');
    } finally {
      closeUnsendModal();
    }
  };

  useEffect(() => {
    const fetchConnections = async () => {
      if (!token) return;
      try {
        const response = await axios.get('http://localhost:8000/api/chat/connections', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const items = response.data?.data?.connections || [];
        console.debug('Chat: connections fetched', items);
        setConnections(items);
        if (!selectedUser && items.length > 0) {
          if (requestedChatUserId) {
            const target = items.find((item) => item._id === requestedChatUserId);
            setSelectedUser(target || items[0]);
          } else {
            setSelectedUser(items[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load connections', err);
      } finally {
        setLoadingConnections(false);
      }
    };

    fetchConnections();
  }, [token, requestedChatUserId, selectedUser]);

  useEffect(() => {
    if (connections.length === 0) return;
    if (!selectedUser) {
      if (requestedChatUserId) {
        const target = connections.find((item) => item._id === requestedChatUserId);
        setSelectedUser(target || connections[0]);
      } else {
        setSelectedUser(connections[0]);
      }
    }
  }, [connections, requestedChatUserId, selectedUser]);

  useEffect(() => {
    if (!selectedUser || !token) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const response = await axios.get(`http://localhost:8000/api/chat/${selectedUser._id}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetchedMessages = response.data?.data?.messages || [];
        console.debug('Chat: messages fetched for', selectedUser?._id, fetchedMessages);
        setMessages(fetchedMessages.map(normalizeMessage));
      } catch (err) {
        console.error('Failed to load messages', err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedUser, token]);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = (payload) => {
      if (!selectedUser) return;
      const isRelevant =
        payload.sender?._id === selectedUser._id ||
        payload.recipient?._id === selectedUser._id ||
        payload.sender === selectedUser._id;
      if (!isRelevant) return;

      console.debug('Chat: incoming message', payload);
      setMessages((prev) => [...prev, normalizeMessage(payload)]);
    };

    const handleDeletedMessage = (payload) => {
      if (!payload?.messageId) return;
      setMessages((prev) => prev.filter((msg) => msg._id !== payload.messageId));
    };

    socket.on('chat:message', handleIncomingMessage);
    socket.on('chat:message-deleted', handleDeletedMessage);
    return () => {
      socket.off('chat:message', handleIncomingMessage);
      socket.off('chat:message-deleted', handleDeletedMessage);
    };
  }, [socket, selectedUser]);

  const sendMessage = async () => {
    if (!selectedUser || (!messageText.trim() && !selectedFile)) return;
    setChatError(null);
    const recipientId = selectedUser._id || selectedUser.id;
    if (!recipientId) {
      setChatError('Invalid recipient selected.');
      return;
    }

    const formData = new FormData();
    if (messageText.trim()) {
      formData.append('text', messageText.trim());
    }
    if (selectedFile) {
      formData.append('attachment', selectedFile);
    }

    try {
      const response = await axios.post(
        `http://localhost:8000/api/chat/${recipientId}/messages`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const sentMessage = response.data?.data?.message;
      if (sentMessage) {
        setMessages((prev) => [...prev, normalizeMessage(sentMessage)]);
        setMessageText('');
        removeSelectedFile();
      }
    } catch (err) {
      console.error('Failed to send message', err);
      setChatError(err.response?.data?.message || 'Unable to send message. Check your connection.');
    }
  };

  const toggleLike = (messageId) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg._id !== messageId) return msg;
        const liked = !msg.liked;
        const likes = (msg.likes || 0) + (liked ? 1 : -1);
        return {
          ...msg,
          liked,
          likes: Math.max(0, likes),
        };
      })
    );
  };

  return (
    <div style={chatStyles.page}>
      <div style={chatStyles.sidebar}>
        <div style={chatStyles.header}>Connections</div>
        {loadingConnections ? (
          <div style={chatStyles.emptyState}>Loading connections...</div>
        ) : connections.length === 0 ? (
          <div style={chatStyles.emptyState}>No connected users yet.</div>
        ) : (
          <div style={chatStyles.contactList}>
            {connections.map((connection) => (
              <button
                key={connection._id}
                style={selectedUser?._id === connection._id ? chatStyles.contactItemActive : chatStyles.contactItem}
                onClick={() => setSelectedUser(connection)}
              >
                <div style={chatStyles.contactAvatar}>
                  {connection.profilePicture || connection.companyLogo ? (
                    <img
                      src={getAvatarUrl(connection)}
                      alt="avatar"
                      style={chatStyles.avatarImage}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getPlaceholderAvatar(connection, 64);
                      }}
                    />
                  ) : (
                    <span>{(connection.firstName || connection.email || 'U')[0].toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <div style={chatStyles.contactName}>
                    {connection.firstName || connection.companyName || ''} {connection.lastName || ''}
                  </div>
                  <div style={chatStyles.contactMeta}>{connection.role}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={chatStyles.chatArea}>
        {selectedUser ? (
          <>
            <div style={chatStyles.chatHeader}>
              <div style={chatStyles.chatHeaderProfile}>
                <div style={chatStyles.chatHeaderAvatar}>
                  {selectedUser.profilePicture || selectedUser.companyLogo ? (
                    <img
                      src={getAvatarUrl(selectedUser)}
                      alt="avatar"
                      style={chatStyles.avatarImage}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getPlaceholderAvatar(selectedUser, 96);
                      }}
                    />
                  ) : (
                    <span>{getAvatarInitials(selectedUser)}</span>
                  )}
                </div>
                <div>
                  <div style={chatStyles.chatTitle}>
                    {selectedUser.firstName || selectedUser.email} {selectedUser.lastName || ''}
                  </div>
                  <div style={chatStyles.chatSubtitle}>{selectedUser.role}</div>
                </div>
              </div>
            </div>

            <div style={chatStyles.messagesContainer}>
              {loadingMessages ? (
                <div style={chatStyles.emptyState}>Loading messages...</div>
              ) : messages.length === 0 ? (
                <div style={chatStyles.emptyState}>No messages yet. Start the conversation.</div>
              ) : (
                messages.map((message) => {
                  const isOwn =
                    (message.sender && typeof message.sender === 'object' && message.sender._id === currentUser?._id) ||
                    message.sender === currentUser?._id ||
                    message.sender === currentUser?.id;
                  const attachmentUrl = getAttachmentUrl(message.attachment?.fileUrl);
                  const messageAvatar = getMessageAvatarUrl(message);
                  const ownAvatar = getAvatarUrl(currentUser);
                  return (
                    <div
                      key={message._id || `${message.createdAt}-${message.text}`}
                      style={isOwn ? chatStyles.messageRowOwn : chatStyles.messageRowOther}
                    >
                      {!isOwn ? (
                        <div style={chatStyles.messageAvatarWrapper}>
                          {messageAvatar ? (
                            <img
                              src={messageAvatar}
                              alt="avatar"
                              style={chatStyles.messageAvatar}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = getPlaceholderAvatar(message.sender, 36);
                              }}
                            />
                          ) : (
                            <span>{getAvatarInitials(message.sender)}</span>
                          )}
                        </div>
                      ) : null}

                      <div style={isOwn ? chatStyles.messageOwnBubble : chatStyles.messageOtherBubble}>
                        {message.linkUrl ? (
                          <a
                            href={message.linkUrl.startsWith('http') ? message.linkUrl : `https://${message.linkUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            style={chatStyles.messageLink}
                          >
                            {message.linkUrl}
                          </a>
                        ) : null}
                        {message.attachment ? (
                          <div style={chatStyles.attachmentMessage}>
                            {message.attachment.mimeType?.startsWith('image/') ? (
                              <img src={attachmentUrl} alt={message.attachment.fileName} style={chatStyles.messageImage} />
                            ) : (
                              <a href={attachmentUrl} target="_blank" rel="noreferrer" style={chatStyles.attachmentLink}>
                                {message.attachment.fileName || 'Download file'}
                              </a>
                            )}
                          </div>
                        ) : null}
                        {message.text ? <div style={chatStyles.messageText}>{formatMessageText(message.text)}</div> : null}
                        <div style={chatStyles.reactionRow}>
                          <button
                            type="button"
                            style={message.liked ? chatStyles.reactionButtonActive : chatStyles.reactionButton}
                            onClick={() => toggleLike(message._id)}
                            aria-label={message.liked ? 'Unlike message' : 'Like message'}
                          >
                            <div style={chatStyles.reactionContent}>
                              <HeartIcon filled={message.liked} size={16} />
                              {message.likes > 0 ? <span style={chatStyles.reactionCount}>{message.likes}</span> : null}
                            </div>
                          </button>
                        </div>
                        <div style={chatStyles.messageFooter}>
                          <div style={chatStyles.messageTime}>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          {isOwn && message._id ? (
                            <button type="button" style={chatStyles.messageDeleteButton} onClick={() => openUnsendModal(message._id)}>
                              Unsend
                            </button>
                          ) : null}
                        </div>
                      </div>

                      {isOwn ? (
                        <div style={chatStyles.messageAvatarWrapper}>
                          {ownAvatar ? (
                            <img
                              src={ownAvatar}
                              alt="avatar"
                              style={chatStyles.messageAvatar}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = getPlaceholderAvatar(currentUser, 36);
                              }}
                            />
                          ) : (
                            <span>{getAvatarInitials(currentUser)}</span>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>

            <div style={chatStyles.inputPanel}>
              <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} />
              <button
                type="button"
                style={chatStyles.attachIconButton}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach file"
              >
                📎
              </button>
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={selectedUser ? `Message ${selectedUser.firstName || selectedUser.email}` : 'Select a user to chat'}
                style={chatStyles.input}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <button style={chatStyles.sendButton} onClick={sendMessage}>Send</button>
            </div>
            {selectedFile ? (
              <div style={chatStyles.selectedFilePreview}>
                <div>
                  {selectedFile.type.startsWith('image/') && selectedFilePreview ? (
                    <img src={selectedFilePreview} alt={selectedFile.name} style={chatStyles.previewImage} />
                  ) : null}
                  <div>{selectedFile.name}</div>
                </div>
                <button type="button" style={chatStyles.removeButton} onClick={removeSelectedFile}>
                  Unsend
                </button>
              </div>
            ) : null}
            {chatError ? <div style={chatStyles.errorText}>{chatError}</div> : null}
          </>
        ) : (
          <div style={chatStyles.emptyState}>Select a connected user to start chatting.</div>
        )}
      </div>
      {showUnsendModal ? (
        <div style={chatStyles.modalOverlay} onClick={closeUnsendModal}>
          <div style={chatStyles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3 style={chatStyles.modalTitle}>Confirm Unsend</h3>
            <p style={chatStyles.modalMessage}>Are you sure you want to unsend this message?</p>
            <div style={chatStyles.modalActions}>
              <button type="button" style={chatStyles.modalCancelButton} onClick={closeUnsendModal}>
                Cancel
              </button>
              <button type="button" style={chatStyles.modalConfirmButton} onClick={handleUnsendMessage}>
                Unsend
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const chatStyles = {
  page: {
    display: 'flex',
    height: 'calc(100vh - 120px)',
    gap: 20,
    padding: 20,
    boxSizing: 'border-box',
  },
  sidebar: {
    width: 320,
    minWidth: 280,
    borderRadius: 16,
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface-strong)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    padding: '18px 16px',
    borderBottom: '1px solid var(--border)',
    fontWeight: 700,
  },
  contactList: {
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    background: 'transparent',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    color: 'inherit',
  },
  contactItemActive: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    color: 'inherit',
  },
  contactAvatar: {
    width: 42,
    height: 42,
    borderRadius: '50%',
    backgroundColor: 'var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    fontWeight: 700,
    color: 'var(--text-h)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  contactName: {
    fontWeight: 700,
  },
  contactMeta: {
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  chatArea: {
    flexGrow: 1,
    borderRadius: 16,
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface-strong)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  chatHeader: {
    padding: '18px 16px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatHeaderProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  chatHeaderAvatar: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    backgroundColor: 'var(--border)',
    display: 'grid',
    placeItems: 'center',
    overflow: 'hidden',
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text-h)',
  },
  chatTitle: {
    fontWeight: 700,
    fontSize: 18,
  },
  chatSubtitle: {
    color: 'var(--text-muted)',
    fontSize: 13,
    marginTop: 2,
  },
  debug: {
    marginTop: 8,
  },
  messagesContainer: {
    flexGrow: 1,
    padding: 16,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  messageRowOther: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    width: '100%',
    justifyContent: 'flex-start',
  },
  messageRowOwn: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    justifyContent: 'flex-end',
    width: '100%',
  },
  messageAvatarWrapper: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    backgroundColor: 'var(--border)',
    display: 'grid',
    placeItems: 'center',
    overflow: 'hidden',
    flexShrink: 0,
    color: 'var(--text-h)',
    fontWeight: 700,
    fontSize: 13,
  },
  messageAvatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  messageOwnBubble: {
    width: 'auto',
    maxWidth: '62%',
    minWidth: '24%',
    backgroundColor: 'var(--primary)',
    color: '#fff',
    borderRadius: '18px 18px 4px 18px',
    padding: '10px 14px',
    position: 'relative',
    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.18)',
    textAlign: 'left',
  },
  messageOtherBubble: {
    width: 'auto',
    maxWidth: '62%',
    minWidth: '24%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: 'var(--text-h)',
    borderRadius: '18px 18px 18px 4px',
    padding: '10px 14px',
    position: 'relative',
    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)',
    textAlign: 'left',
  },
  messageText: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    lineHeight: 1.6,
  },
  messageLink: {
    display: 'block',
    color: 'var(--primary)',
    marginBottom: 8,
    textDecoration: 'underline',
    wordBreak: 'break-word',
  },
  attachmentMessage: {
    marginBottom: 8,
  },
  reactionRow: {
    display: 'flex',
    justifyContent: 'flex-start',
    marginTop: 8,
  },
  reactionButton: {
    borderRadius: 999,
    border: '1px solid rgba(255, 255, 255, 0.18)',
    backgroundColor: 'transparent',
    color: 'inherit',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: 13,
  },
  reactionButtonActive: {
    borderRadius: 999,
    border: '1px solid rgba(255, 255, 255, 0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    color: 'var(--danger)',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: 13,
  },
  reactionContent: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  reactionCount: {
    fontSize: 12,
    opacity: 0.8,
  },
  messageFooter: {
    marginTop: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  messageDeleteButton: {
    borderRadius: 999,
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--danger)',
    cursor: 'pointer',
    fontSize: 12,
    padding: '6px 10px',
  },
  messageImage: {
    maxWidth: '240px',
    maxHeight: '240px',
    borderRadius: 14,
    display: 'block',
  },
  attachmentLink: {
    color: 'var(--primary)',
    textDecoration: 'underline',
    wordBreak: 'break-word',
  },
  attachIconButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 42,
    borderRadius: 999,
    border: '1px solid var(--border)',
    backgroundColor: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: 20,
    marginRight: 8,
  },
  selectedFilePreview: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'var(--surface)',
    width: '100%',
  },
  previewImage: {
    maxWidth: 80,
    maxHeight: 80,
    borderRadius: 14,
  },
  removeButton: {
    borderRadius: 999,
    border: 'none',
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    color: 'var(--danger)',
    padding: '8px 12px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  modalCard: {
    width: 'min(420px, 90vw)',
    borderRadius: 16,
    backgroundColor: 'var(--surface-strong)',
    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.16)',
    padding: 24,
    color: 'inherit',
  },
  modalTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
  },
  modalMessage: {
    marginTop: 12,
    marginBottom: 20,
    color: 'var(--text-muted)',
    lineHeight: 1.5,
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelButton: {
    borderRadius: 999,
    border: '1px solid var(--border)',
    backgroundColor: 'transparent',
    color: 'inherit',
    padding: '10px 16px',
    cursor: 'pointer',
  },
  modalConfirmButton: {
    borderRadius: 999,
    border: 'none',
    backgroundColor: 'var(--danger)',
    color: '#fff',
    padding: '10px 16px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  messageTime: {
    marginTop: 6,
    fontSize: 10,
    opacity: 0.75,
    textAlign: 'right',
  },
  inputPanel: {
    display: 'flex',
    gap: 12,
    padding: 16,
    borderTop: '1px solid var(--border)',
    backgroundColor: 'var(--surface)',
  },
  input: {
    flexGrow: 1,
    borderRadius: 999,
    border: '1px solid var(--border)',
    padding: '12px 16px',
    fontSize: 14,
    outline: 'none',
    background: 'var(--surface-strong)',
    color: 'inherit',
  },
  sendButton: {
    borderRadius: 999,
    border: 'none',
    backgroundColor: 'var(--primary)',
    color: '#fff',
    padding: '12px 20px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  errorText: {
    padding: '0 16px 16px',
    color: 'var(--danger)',
    fontSize: 13,
  },
  emptyState: {
    padding: 20,
    color: 'var(--text-muted)',
  },
};
