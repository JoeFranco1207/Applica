import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EmployerInterviews.css';

export default function JobseekerInterviews() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();

  const userId = storedUser?._id || storedUser?.id;
  const isJobseeker = storedUser?.role === 'jobseeker';

  useEffect(() => {
    if (!userId || !isJobseeker) return;

    const fetchInterviews = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:8000/api/interviews/user/${userId}`);
        setInterviews(res.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch interview requests', err?.response?.data || err.message || err);
        setError('Unable to load interview requests at the moment.');
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, [userId, isJobseeker]);

  if (!isJobseeker) {
    return (
      <div className="interviews-page">
        <div className="interviews-header">
          <div>
            <h1 className="interviews-heading">Interview Requests</h1>
            <p className="interviews-description">
              This page is only available to jobseekers. Please switch to your jobseeker profile to see interview invitations.
            </p>
          </div>
        </div>
        <div className="empty-state">Jobseeker access required to view interview requests.</div>
      </div>
    );
  }

  return (
    <div className="interviews-page">
      <div className="interviews-header">
        <div>
          <h1 className="interviews-heading">Interview Requests</h1>
          <p className="interviews-description">
            Employers send interview invitations here. Open the room when you're ready to join.
          </p>
        </div>
      </div>

      <div className="jobseeker-header-panel">
        <div>
          <h2>All invitations in one place</h2>
          <p>Review active interview requests, track the schedule, and jump into the room when your employer is ready.</p>
        </div>
        <span className="request-badge">Jobseeker view</span>
      </div>

      <div>
        {loading ? (
          <div className="empty-state">Loading your interview requests…</div>
        ) : error ? (
          <div className="empty-state">{error}</div>
        ) : !interviews.length ? (
          <div className="empty-state">
            No interview requests yet. Once an employer invites you, the interview room will appear here.
          </div>
        ) : (
          <div className="interviews-grid">
            {interviews.map((iv) => (
              <div key={iv._id} className="interview-card interview-request-card">
                <div>
                  <p className="interview-card-title">{iv.title || 'Interview request'}</p>
                  <p className="interview-card-subtitle">
                    {new Date(iv.scheduledAt).toLocaleString()}
                  </p>
                  <div className="interview-card-meta">
                    <span className="interview-pill">Employer: {iv.employer?.firstName ? `${iv.employer.firstName} ${iv.employer.lastName || ''}`.trim() : 'Recruiter'}</span>
                    <span className="interview-pill">Location: {iv.location || 'Online'}</span>
                    <span className="interview-pill">Room ID: {iv.roomId}</span>
                  </div>
                  {iv.description && (
                    <p className="request-description">
                      {iv.description}
                    </p>
                  )}
                </div>
                <button
                  className="interview-join-button"
                  onClick={() => navigate(`/interview/${iv.roomId}`)}
                >
                  View request
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
