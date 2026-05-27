import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import InterviewModal from '../components/InterviewModal';
import './EmployerInterviews.css';

export default function EmployerInterviews() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = storedUser?._id || storedUser?.id;
        if (!userId) return;
        const res = await axios.get(`http://localhost:8000/api/interviews/user/${userId}`);
        setInterviews(res.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch interviews', err?.response?.data || err.message || err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [showModal]); // refresh when modal closes/opens

  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  const employerId = storedUser?._id || storedUser?.id;

  return (
    <div className="interviews-page">
      <div className="interviews-header">
        <div>
          <h1 className="interviews-heading">Interviews</h1>
          <p className="interviews-description">
            Plan meetings, invite candidates, and open a shared interview room for your team.
          </p>
        </div>

        <button className="schedule-interview-button" onClick={() => setShowModal(true)}>
          Schedule Interview
        </button>
      </div>

      <div>
        {loading ? (
          <div className="empty-state">Loading your scheduled interviews…</div>
        ) : !interviews.length ? (
          <div className="empty-state">
            No interviews are scheduled yet. Click the button above to create a new interview room.
          </div>
        ) : (
          <div className="interviews-grid">
            {interviews.map((iv) => (
              <div key={iv._id} className="interview-card">
                <div>
                  <p className="interview-card-title">{iv.title || 'Interview meeting'}</p>
                  <p className="interview-card-subtitle">{new Date(iv.scheduledAt).toLocaleString()}</p>
                  <div className="interview-card-meta">
                    <span className="interview-pill">Location: {iv.location || 'Online'}</span>
                    <span className="interview-pill">Room ID: {iv.roomId}</span>
                  </div>
                </div>
                <button
                  className="interview-join-button"
                  onClick={() => navigate(`/interview/${iv.roomId}`)}
                >
                  Join room
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <InterviewModal employerId={employerId} defaultParticipants={[]} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
