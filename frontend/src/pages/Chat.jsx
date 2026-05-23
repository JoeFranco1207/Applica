import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import PresenceAvatar from '../components/PresenceAvatar';

export default function Chat() {
  const { socket, isConnected } = useNotification();
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
  const [isLocalStreamActive, setIsLocalStreamActive] = useState(false);
  const [isRemoteStreamActive, setIsRemoteStreamActive] = useState(false);
  const [callState, setCallState] = useState('idle');
  const [callMode, setCallMode] = useState('audio');
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [activeCallUser, setActiveCallUser] = useState(null);
  const [callStartTime, setCallStartTime] = useState(null);
  const [queuedCall, setQueuedCall] = useState(null);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

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

  const PhoneIcon = ({ size = 18 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.21c1.2.48 2.5.74 3.83.74a1 1 0 011 1v3.5a1 1 0 01-1 1A17.93 17.93 0 013 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.33.26 2.63.74 3.83a1 1 0 01-.21 1.11l-2.4 2.35z" />
    </svg>
  );

  const VideoIcon = ({ size = 18 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 10.5V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-3.5l4 4v-11l-4 4z" />
    </svg>
  );

  const ClipIcon = ({ size = 18 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M21.44 11.05L12.37 20.12a5 5 0 01-7.07 0 5 5 0 010-7.07l8.49-8.49a3.75 3.75 0 015.3 0 3.75 3.75 0 010 5.3L10.5 18.39a2.25 2.25 0 01-3.18 0 2.25 2.25 0 010-3.18l7.18-7.18" />
      <path d="M8.25 10.5l6.75 6.75" />
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

  useEffect(() => {
    if (!queuedCall || !socket || !isConnected) return;
    if (callState !== 'calling') return;
    if (!queuedCall.targetUser) return;
    if (peerConnectionRef.current) return;

    const resumeCall = async () => {
      try {
        await prepareCallConnection(queuedCall.mode, true, queuedCall.targetUser);
        setQueuedCall(null);
        setChatError(null);
      } catch (err) {
        console.error('Unable to resume queued call', err);
        setChatError('Unable to start the call after connecting.');
        cleanupCall();
      }
    };

    resumeCall();
  }, [queuedCall, socket, isConnected, callState]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current || null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current || null;
    }
  }, [isRemoteStreamActive, isLocalStreamActive]);

  const formatDuration = (milliseconds) => {
    if (!milliseconds || milliseconds < 1000) return '00:00';
    const totalSeconds = Math.round(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const buildCallSummaryText = ({ endedByLabel, mode, durationMs, note }) => {
    const typeLabel = mode === 'video' ? 'Video' : 'Audio';
    let summaryText = `${endedByLabel} ended the ${typeLabel.toLowerCase()} call.`;
    if (durationMs != null) {
      summaryText += ` Duration: ${formatDuration(durationMs)}.`;
    }
    if (note) {
      summaryText += ` ${note}`;
    }
    return summaryText;
  };

  const getSystemMessageText = (message) => {
    if (message?.callInfo) {
      const endedByLabel = message.callInfo.endedById === currentUser?._id ? 'You' : message.callInfo.endedBy || message.sender?.firstName || 'Caller';
      return buildCallSummaryText({
        endedByLabel,
        mode: message.callInfo.mode,
        durationMs: message.callInfo.durationMs,
        note: message.callInfo.note,
      });
    }
    return message.text || '';
  };

  const sendCallSummaryMessage = async ({ recipientId, endedById, endedByName, mode, durationMs, note }) => {
    if (!recipientId) return null;
    const endedByLabel = endedById === currentUser?._id ? 'You' : endedByName || 'Caller';
    const summaryText = buildCallSummaryText({ endedByLabel, mode, durationMs, note });
    try {
      const response = await axios.post(
        `http://localhost:8000/api/chat/${recipientId}/messages`,
        {
          text: summaryText,
          system: true,
          callInfo: {
            mode,
            durationMs,
            endedById,
            endedBy: endedByName,
            note,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const sentMessage = response.data?.data?.message;
      if (sentMessage) {
        setMessages((prev) => [...prev, normalizeMessage(sentMessage)]);
      }
      return sentMessage;
    } catch (err) {
      console.error('Failed to send call summary message', err);
      return null;
    }
  };

  const appendCallSummary = ({ endedBy, mode, durationMs, note }) => {
    const summaryText = buildCallSummaryText({ endedBy, mode, durationMs, note });
    setMessages((prev) => [
      ...prev,
      {
        _id: `call-summary-${Date.now()}`,
        text: summaryText,
        system: true,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const cleanupCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }

    setIsLocalStreamActive(false);
    setIsRemoteStreamActive(false);
    setCallStartTime(null);
    setCallState('idle');
    setIncomingCallData(null);
    setActiveCallUser(null);
    setQueuedCall(null);
  };

  const createPeerConnection = (targetUserId) => {
    if (!socket) {
      throw new Error('Socket connection is not ready.');
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pc.ontrack = (event) => {
      const remoteStream = event.streams?.[0];
      if (remoteStream) {
        remoteStreamRef.current = remoteStream;
        setIsRemoteStreamActive(true);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && targetUserId) {
        socket.emit('call:signal', {
          to: targetUserId,
          type: 'ice-candidate',
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
        cleanupCall();
      }
    };

    return pc;
  };

  const prepareCallConnection = async (mode, isCaller, targetUser) => {
    const targetUserId = targetUser?._id || targetUser;
    if (!targetUserId) {
      throw new Error('Call target user is missing.');
    }

    const constraints = {
      audio: true,
      video: mode === 'video',
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localStreamRef.current = stream;
    setIsLocalStreamActive(true);

    const pc = createPeerConnection(targetUserId);
    peerConnectionRef.current = pc;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    if (isCaller) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('call:request', {
        to: targetUserId,
        mode,
        fromName: currentUser?.firstName || currentUser?.email || 'Unknown',
        fromAvatar: getAvatarUrl(currentUser),
        offer: {
          type: 'offer',
          sdp: offer.sdp,
        },
      });
    }

    return pc;
  };

  const startCall = async (mode) => {
    if (!selectedUser) {
      setChatError('Select a connected user to start a call.');
      return;
    }
    setChatError(null);
    setCallMode(mode);
    setActiveCallUser(selectedUser);
    setCallState('calling');

    if (!socket || !isConnected) {
      setChatError('Connecting to call server... starting the call once ready.');
      setQueuedCall({ mode, targetUser: selectedUser });
      return;
    }

    try {
      await prepareCallConnection(mode, true, selectedUser);
    } catch (err) {
      console.error('Unable to start call', err);
      setChatError('Unable to start call. Please allow microphone access.');
      cleanupCall();
    }
  };

  const acceptIncomingCall = async () => {
    if (!incomingCallData) return;

    setCallMode(incomingCallData.mode || 'audio');
    setActiveCallUser({
      _id: incomingCallData.from,
      firstName: incomingCallData.fromName || 'Caller',
      profilePicture: incomingCallData.fromAvatar,
    });
    setCallState('connected');

    try {
      await prepareCallConnection(incomingCallData.mode || 'audio', false, incomingCallData.from);
      const pc = peerConnectionRef.current;
      if (pc && incomingCallData.offer) {
        await pc.setRemoteDescription({ type: 'offer', sdp: incomingCallData.offer.sdp });
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        setCallStartTime(Date.now());
        socket.emit('call:signal', {
          to: incomingCallData.from,
          type: 'answer',
          sdp: answer.sdp,
          mode: incomingCallData.mode,
          fromName: currentUser?.firstName || currentUser?.email || 'Caller',
        });
      }
      setIncomingCallData(null);
    } catch (err) {
      console.error('Unable to accept call', err);
      setChatError('Unable to accept call.');
      cleanupCall();
    }
  };

  const rejectIncomingCall = async () => {
    if (incomingCallData?.from) {
      socket.emit('call:reject', {
        to: incomingCallData.from,
        mode: incomingCallData.mode,
        fromName: currentUser?.firstName || currentUser?.email || 'Caller',
      });
      await sendCallSummaryMessage({
        recipientId: incomingCallData.from,
        endedById: currentUser?._id,
        endedByName: currentUser?.firstName || currentUser?.email || 'Caller',
        mode: incomingCallData.mode || callMode,
        durationMs: 0,
        note: 'Call declined.',
      });
    }
    cleanupCall();
  };

  const hangUpCall = async () => {
    const durationMs = callStartTime ? Date.now() - callStartTime : 0;
    if (activeCallUser?._id) {
      await sendCallSummaryMessage({
        recipientId: activeCallUser._id,
        endedById: currentUser?._id,
        endedByName: currentUser?.firstName || currentUser?.email || 'Caller',
        mode: callMode,
        durationMs,
      });
      socket.emit('call:end', {
        to: activeCallUser._id,
        mode: callMode,
        fromName: currentUser?.firstName || currentUser?.email || 'Caller',
      });
    }
    cleanupCall();
  };

  const handleRemoteSignal = async (payload) => {
    if (!payload || !peerConnectionRef.current) return;

    if (payload.type === 'ice-candidate' && payload.candidate) {
      try {
        await peerConnectionRef.current.addIceCandidate(payload.candidate);
      } catch (err) {
        console.warn('Failed to add remote ICE candidate', err);
      }
      return;
    }

    if (payload.type === 'answer' && payload.sdp) {
      try {
        await peerConnectionRef.current.setRemoteDescription({ type: 'answer', sdp: payload.sdp });
        setCallState('connected');
        if (!callStartTime) {
          setCallStartTime(Date.now());
        }
      } catch (err) {
        console.error('Failed to set remote answer', err);
      }
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleCallRequest = (payload) => {
      if (!payload?.from || payload.from === currentUser?._id) return;
      if (callState !== 'idle') {
        socket.emit('call:reject', {
          to: payload.from,
        });
        return;
      }

      setIncomingCallData({
        from: payload.from,
        fromName: payload.fromName,
        fromAvatar: payload.fromAvatar,
        mode: payload.mode,
        offer: payload.offer,
      });
      setActiveCallUser({
        _id: payload.from,
        firstName: payload.fromName || 'Caller',
        profilePicture: payload.fromAvatar,
      });
      setCallMode(payload.mode || 'audio');
      setCallState('incoming');
    };

    const handleCallSignalEvent = async (payload) => {
      await handleRemoteSignal(payload);
    };

    const handleCallEnded = () => {
      if (callState !== 'idle') {
        setChatError('Call ended.');
      }
      cleanupCall();
    };

    const handleCallRejected = () => {
      if (callState === 'calling') {
        setChatError('Call rejected.');
      }
      cleanupCall();
    };

    socket.on('call:request', handleCallRequest);
    socket.on('call:signal', handleCallSignalEvent);
    socket.on('call:end', handleCallEnded);
    socket.on('call:reject', handleCallRejected);

    return () => {
      socket.off('call:request', handleCallRequest);
      socket.off('call:signal', handleCallSignalEvent);
      socket.off('call:end', handleCallEnded);
      socket.off('call:reject', handleCallRejected);
    };
  }, [socket, callState, currentUser]);

  useEffect(() => {
    if (!queuedCall || !socket || !isConnected) return;
    if (callState !== 'calling') return;
    if (peerConnectionRef.current) return;

    const resumeQueuedCall = async () => {
      try {
        await prepareCallConnection(queuedCall.mode, true, queuedCall.targetUser);
        setQueuedCall(null);
        setChatError(null);
      } catch (err) {
        console.error('Unable to resume queued call', err);
        setChatError('Unable to start the call after connecting.');
        cleanupCall();
      }
    };

    resumeQueuedCall();
  }, [queuedCall, socket, isConnected, callState]);

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
                  <PresenceAvatar
                    src={getAvatarUrl(connection)}
                    alt={connection.firstName || connection.companyName || connection.email || 'User'}
                    userId={connection._id}
                    initialPresenceMode={connection.presenceMode || (connection.isOnline ? 'online' : 'offline')}
                    size={44}
                    style={chatStyles.avatarImage}
                    showLastActive={false}
                  />
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
                  <PresenceAvatar
                    src={getAvatarUrl(selectedUser)}
                    alt={selectedUser.firstName || selectedUser.companyName || selectedUser.email || 'User'}
                    userId={selectedUser._id}
                    initialPresenceMode={selectedUser.presenceMode || (selectedUser.isOnline ? 'online' : 'offline')}
                    size={84}
                    style={{ ...chatStyles.avatarImage, width: 84, height: 84 }}
                    showLastActive={false}
                  />
                </div>
                <div>
                  <div style={chatStyles.chatTitle}>
                    {selectedUser.firstName || selectedUser.email} {selectedUser.lastName || ''}
                  </div>
                  <div style={chatStyles.chatSubtitle}>{selectedUser.role}</div>
                </div>
              </div>
              <div style={chatStyles.callActions}>
                <button
                  type="button"
                  style={chatStyles.callIconButton}
                  onClick={() => startCall('audio')}
                  title="Audio call"
                >
                  <PhoneIcon size={18} />
                </button>
                <button
                  type="button"
                  style={chatStyles.callIconButton}
                  onClick={() => startCall('video')}
                  title="Video call"
                >
                  <VideoIcon size={18} />
                </button>
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
                  const messageSender = message.sender && typeof message.sender === 'object' ? message.sender : null;
                  const messageSenderId = messageSender?._id || messageSender?.id || null;
                  const messageSenderPresence = messageSender?.presenceMode || (selectedUser && (message.sender === selectedUser._id || message.sender === selectedUser?.id)
                    ? (selectedUser.presenceMode || (selectedUser.isOnline ? 'online' : undefined))
                    : undefined);
                  const senderAlt = messageSender ? (messageSender.firstName || messageSender.companyName || messageSender.email || 'User') : 'User';
                  const isSystem = Boolean(message.system);
                  if (isSystem) {
                    return (
                      <div
                        key={message._id || `${message.createdAt}-${message.text}`}
                        style={chatStyles.systemMessageRow}
                      >
                        <div style={chatStyles.systemMessageBubble}>{getSystemMessageText(message)}</div>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={message._id || `${message.createdAt}-${message.text}`}
                      style={isOwn ? chatStyles.messageRowOwn : chatStyles.messageRowOther}
                    >
                      {!isOwn ? (
                        <div style={chatStyles.messageAvatarWrapper}>
                          <PresenceAvatar
                            src={messageAvatar}
                            alt={senderAlt}
                            userId={messageSenderId}
                            initialPresenceMode={messageSenderPresence}
                            size={36}
                            style={chatStyles.messageAvatar}
                            showLastActive={false}
                          />
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
                          <PresenceAvatar
                            src={ownAvatar}
                            alt={currentUser?.firstName || currentUser?.email || 'You'}
                            userId={currentUser?._id || currentUser?.id}
                            initialPresenceMode={currentUser?.presenceMode || (currentUser?.isOnline ? 'online' : 'offline')}
                            size={36}
                            style={chatStyles.messageAvatar}
                            showLastActive={false}
                          />
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
                <ClipIcon size={18} />
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
      {(callState !== 'idle' || incomingCallData) ? (
        <div style={chatStyles.callOverlay}>
          <div style={chatStyles.callModal}>
            <div style={chatStyles.callModalHeader}>
              <div>
                <div style={chatStyles.callModalTitle}>
                  {callState === 'incoming'
                    ? `Incoming ${incomingCallData?.mode === 'video' ? 'Video' : 'Audio'} call`
                    : callState === 'calling'
                    ? `Calling ${activeCallUser?.firstName || 'User'}...`
                    : 'In call'}
                </div>
                <div style={chatStyles.callModalStatus}>
                  {callState === 'incoming'
                    ? 'Accept to answer or reject to decline.'
                    : callState === 'calling'
                    ? 'Connecting to the other person…'
                    : `${callMode === 'video' ? 'Video call' : 'Audio call'} connected`}
                </div>
              </div>
            </div>
            <div style={chatStyles.callModalGrid}>
              <div style={chatStyles.callModalLargeVideo}>
                {callState === 'connected' ? (
                  <video ref={remoteVideoRef} autoPlay playsInline style={chatStyles.callModalRemoteVideo} />
                ) : (
                  <div style={chatStyles.callModalPlaceholder}>
                    {callState === 'incoming'
                      ? incomingCallData?.fromName || 'Caller'
                      : activeCallUser?.firstName || 'User'}
                  </div>
                )}
              </div>
              <div style={chatStyles.callModalLocalVideo}>
                {isLocalStreamActive ? (
                  <video ref={localVideoRef} autoPlay muted playsInline style={chatStyles.callModalLocalVideoMini} />
                ) : (
                  <div style={chatStyles.callModalPlaceholderSmall}>
                    {currentUser?.firstName ? `You (${currentUser.firstName})` : 'You'}
                  </div>
                )}
              </div>
            </div>
            <div style={chatStyles.callModalControls}>
              {callState === 'incoming' ? (
                <>
                  <button type="button" style={chatStyles.callConfirmButton} onClick={acceptIncomingCall}>
                    Accept
                  </button>
                  <button type="button" style={chatStyles.callDeclineButton} onClick={rejectIncomingCall}>
                    Decline
                  </button>
                </>
              ) : (
                <button type="button" style={chatStyles.callModalHangupButton} onClick={hangUpCall}>
                  End call
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
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
  callActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  callIconButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 999,
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface)',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: 18,
  },
  callPanel: {
    padding: '14px 16px',
    borderBottom: '1px solid var(--border)',
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  callInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  callDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    color: 'var(--text-h)',
  },
  callControls: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  callConfirmButton: {
    borderRadius: 999,
    border: 'none',
    backgroundColor: '#10b981',
    color: '#fff',
    padding: '10px 16px',
    cursor: 'pointer',
  },
  callDeclineButton: {
    borderRadius: 999,
    border: 'none',
    backgroundColor: '#ef4444',
    color: '#fff',
    padding: '10px 16px',
    cursor: 'pointer',
  },
  callEndButton: {
    borderRadius: 999,
    border: 'none',
    backgroundColor: '#ef4444',
    color: '#fff',
    padding: '10px 14px',
    cursor: 'pointer',
  },
  callVideoContainer: {
    display: 'grid',
    gap: 12,
    alignItems: 'center',
    gridTemplateColumns: '1fr auto',
    minHeight: 180,
  },
  callVideo: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: '#000',
    minHeight: 180,
  },
  callMiniVideo: {
    width: 160,
    aspectRatio: '16/9',
    borderRadius: 14,
    backgroundColor: '#000',
    border: '1px solid rgba(255,255,255,0.14)',
  },
  systemMessageRow: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  },
  systemMessageBubble: {
    maxWidth: '72%',
    padding: '10px 14px',
    borderRadius: 18,
    backgroundColor: 'rgba(148, 163, 184, 0.14)',
    color: 'var(--text-muted)',
    fontSize: 13,
    textAlign: 'center',
  },
  incomingCallOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    display: 'grid',
    placeItems: 'center',
    zIndex: 1100,
    padding: 24,
  },
  incomingCallModal: {
    width: 'min(520px, 100%)',
    borderRadius: 20,
    backgroundColor: 'var(--surface-strong)',
    boxShadow: '0 32px 80px rgba(15, 23, 42, 0.32)',
    padding: 28,
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  incomingCallHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  incomingCallTitle: {
    fontSize: 18,
    fontWeight: 800,
  },
  incomingCallCaller: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  incomingCallAvatar: {
    width: 58,
    height: 58,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1px solid var(--border)',
  },
  incomingCallAvatarPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    fontSize: 20,
    fontWeight: 700,
    backgroundColor: 'var(--border)',
    color: 'var(--text-h)',
  },
  incomingCallName: {
    fontWeight: 700,
    fontSize: 16,
  },
  incomingCallSubtitle: {
    color: 'var(--text-muted)',
    fontSize: 14,
  },
  incomingCallActions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  callOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(15, 23, 42, 0.96))',
    display: 'grid',
    placeItems: 'center',
    zIndex: 1200,
    padding: 20,
  },
  callModal: {
    width: 'min(980px, 100%)',
    borderRadius: 24,
    backgroundColor: '#0f172a',
    border: '1px solid rgba(148, 163, 184, 0.14)',
    boxShadow: '0 40px 90px rgba(15, 23, 42, 0.52)',
    overflow: 'hidden',
    color: '#fff',
  },
  callModalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 24,
    padding: '24px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
  },
  callModalTitle: {
    fontSize: 20,
    fontWeight: 800,
  },
  callModalStatus: {
    marginTop: 6,
    color: 'rgba(148, 163, 184, 1)',
    fontSize: 14,
  },
  callModalGrid: {
    display: 'grid',
    gridTemplateColumns: '1.7fr 0.8fr',
    gap: 20,
    padding: '24px',
  },
  callModalLargeVideo: {
    position: 'relative',
    minHeight: 360,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
    display: 'grid',
    placeItems: 'center',
  },
  callModalRemoteVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    backgroundColor: '#000',
  },
  callModalLocalVideo: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#020617',
    minHeight: 220,
    display: 'grid',
    placeItems: 'center',
  },
  callModalLocalVideoMini: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  callModalPlaceholder: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 700,
    textAlign: 'center',
    padding: 16,
  },
  callModalPlaceholderSmall: {
    color: 'rgba(148, 163, 184, 1)',
    fontSize: 16,
    textAlign: 'center',
    padding: 16,
  },
  callModalControls: {
    display: 'flex',
    justifyContent: 'center',
    gap: 16,
    padding: '0 24px 24px',
    flexWrap: 'wrap',
  },
  callModalHangupButton: {
    borderRadius: 999,
    border: 'none',
    backgroundColor: '#dc2626',
    color: '#fff',
    padding: '12px 28px',
    cursor: 'pointer',
    fontWeight: 700,
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
