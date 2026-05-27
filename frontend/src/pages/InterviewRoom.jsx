import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import './InterviewRoom.css';

export default function InterviewRoom() {
  const { roomId } = useParams();
  const { socket } = useNotification();
  const [participants, setParticipants] = useState([]);
  const [status, setStatus] = useState('Connecting...');

  useEffect(() => {
    if (!socket) {
      setStatus('Socket connection not available. Please refresh the page.');
      return;
    }

    setStatus('Joining room...');
    socket.emit('interview:join', { roomId });

    const handleJoined = (payload) => {
      if (payload?.roomId !== roomId) return;
      setParticipants((prev) => Array.from(new Set([...prev, payload.userId])));
    };

    const handleLeft = (payload) => {
      if (payload?.roomId !== roomId) return;
      setParticipants((prev) => prev.filter((id) => id !== payload.userId));
    };

    socket.on('interview:participant-joined', handleJoined);
    socket.on('interview:participant-left', handleLeft);

    setStatus('Connected. Waiting for participants...');

    return () => {
      socket.emit('interview:leave', { roomId });
      socket.off('interview:participant-joined', handleJoined);
      socket.off('interview:participant-left', handleLeft);
    };
  }, [roomId, socket]);

  return (
    <div className="interview-room-page">
      <h1 className="interview-room-title">Interview room</h1>
      <p className="interview-room-subtitle">This is your shared interview space. Team members and applicants can join the room using the same room ID.</p>

      <div className="interview-room-panel">
        <div className="interview-room-card">
          <div className="interview-room-status">
            <div>
              <p><strong>Status:</strong> {status}</p>
            </div>
            <div className="interview-room-id">{roomId}</div>
          </div>
        </div>

        <div className="interview-room-card">
          <h2 style={{ marginTop: 0 }}>Participants</h2>
          <div className="interview-room-participants">
            {participants.length ? (
              <div className="participant-list">
                {participants.map((userId) => (
                  <div key={userId} className="participant-chip">{userId}</div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, color: 'var(--muted)' }}>No participants have joined yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
