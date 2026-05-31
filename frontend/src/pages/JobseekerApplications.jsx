import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EmployerInterviews.css';

const statusLabels = {
  pending: 'Pending',
  reviewing: 'In Review',
  interview: 'Interview',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

const statusStyles = {
  pending: { backgroundColor: 'rgba(245, 158, 11, 0.08)', color: '#92400e' },
  reviewing: { backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#1d4ed8' },
  interview: { backgroundColor: 'rgba(16, 185, 129, 0.08)', color: '#047857' },
  accepted: { backgroundColor: 'rgba(14, 165, 233, 0.08)', color: '#0ea5e9' },
  rejected: { backgroundColor: 'rgba(239, 68, 68, 0.08)', color: '#b91c1c' },
};

function formatDate(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  return date.toLocaleString();
}

export default function JobseekerApplications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();

  const openCompanyProfile = (company) => {
    const companyId = company?._id || company?.id;
    if (companyId) {
      navigate(`/profile/${companyId}`);
    }
  };


  const token = localStorage.getItem('token');
  const userId = storedUser?._id || storedUser?.id;
  const isJobseeker = storedUser?.role === 'jobseeker';

  useEffect(() => {
    if (!userId || !isJobseeker) return;

    const fetchApplications = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('http://localhost:8000/api/jobseeker/applications', {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        });
        setApplications(response.data?.data || []);
      } catch (err) {
        console.error('Failed to load applications', err?.response?.data || err.message || err);
        setError('Unable to load your job applications at the moment.');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [userId, isJobseeker, token]);

  if (!isJobseeker) {
    return (
      <div className="interviews-page">
        <div className="interviews-header">
          <div>
            <h1 className="interviews-heading">My Applications</h1>
            <p className="interviews-description">
              This page is only available for jobseekers. Switch to your jobseeker profile to view application status tracking.
            </p>
          </div>
        </div>
        <div className="empty-state">Jobseeker access required to see your applications.</div>
      </div>
    );
  }

  return (
    <div className="interviews-page">
      <div className="interviews-header">
        <div>
          <h1 className="interviews-heading">My Applications</h1>
          <p className="interviews-description">
            Track the companies you've applied to and see current status updates for each role.
          </p>
        </div>
      </div>

      <div className="jobseeker-header-panel">
        <div>
          <h2>Application status dashboard</h2>
          <p>Review your active and past applications, see when they were updated, and open the job post for details.</p>
        </div>
        <span className="request-badge">Jobseeker view</span>
      </div>

      <div>
        {loading ? (
          <div className="empty-state">Loading your applications…</div>
        ) : error ? (
          <div className="empty-state">{error}</div>
        ) : !applications.length ? (
          <div className="empty-state">
            You haven't applied to any jobs yet. Your applications will appear here once you've applied.
          </div>
        ) : (
          <div className="interviews-grid">
            {applications.map((application) => {
              const status = application.status || 'pending';
              const statusText = statusLabels[status] || status;
              const statusStyle = statusStyles[status] || statusStyles.pending;

              return (
                <div key={application.jobId} className="interview-card">
                  <div>
                    <p className="interview-card-title">{application.title || 'Job application'}</p>
                    <p
                      className="interview-card-subtitle"
                      style={{ cursor: application.jobCreatedBy?._id ? 'pointer' : 'default', color: application.jobCreatedBy?._id ? '#1d4ed8' : 'inherit' }}
                      onClick={() => application.jobCreatedBy?._id && openCompanyProfile(application.jobCreatedBy)}
                    >
                      {application.jobCreatedBy?.companyName || application.companyName || 'Employer'}
                    </p>
                    <div className="interview-card-meta">
                      <span className="interview-pill" style={statusStyle}>{statusText}</span>
                      <span className="interview-pill">{application.location || 'Location not specified'}</span>
                      <span className="interview-pill">Applied {formatDate(application.appliedAt)}</span>
                    </div>
                    <p className="request-description">
                      Last updated: {formatDate(application.updatedAt)}
                    </p>
                  </div>
                  <button
                    className="interview-join-button"
                    onClick={() => navigate(`/explore?jobId=${application.jobId}`)}
                  >
                    View Job
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
