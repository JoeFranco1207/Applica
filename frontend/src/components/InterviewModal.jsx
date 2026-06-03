import React, { useEffect, useRef, useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import axios from 'axios';
import DateTimePickerModal from './DateTimePickerModal';
import './InterviewModal.css';

export default function InterviewModal({ employerId, defaultParticipants = [], onClose }) {
  const { createInterview } = useNotification();
  const [title, setTitle] = useState('Interview');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [participantInput, setParticipantInput] = useState('');
  const [participants, setParticipants] = useState(defaultParticipants.map((id) => ({ user: id })));
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestionError, setSuggestionError] = useState(null);
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const suggestionTimerRef = useRef(null);

  // derive stored user info for banners and CTA
  let isEmployer = false;
  let hasPremium = false;
  try {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    isEmployer = (storedUser?.role || '').toString().toLowerCase() === 'employer';
    hasPremium = !!storedUser?.premiumAIAccess;
  } catch (err) {
    // ignore
  }

  const parseParticipants = (input) => {
    return String(input || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => ({ user: value.toLowerCase(), email: value.toLowerCase() }));
  };

  const getPendingQuery = () => {
    return String(participantInput || '')
      .split(',')
      .pop()
      .trim();
  };

  const addParticipant = (participant) => {
    if (!participant) return;

    const normalizedUser = participant.user?.toString().toLowerCase();
    const normalizedEmail = participant.email?.toString().toLowerCase();
    const duplicate = participants.some((p) => {
      const existingUser = p.user?.toString().toLowerCase();
      const existingEmail = p.email?.toString().toLowerCase();
      return existingUser === normalizedUser || existingEmail === normalizedEmail;
    });

    if (duplicate) {
      setParticipantInput('');
      setSuggestions([]);
      return;
    }

    setParticipants((prev) => [...prev, participant]);
    setParticipantInput('');
    setSuggestions([]);
  };

  const removeParticipant = (participant) => {
    setParticipants((prev) => prev.filter((p) => p.user !== participant.user && p.email !== participant.email));
  };

  const handleRawEmailAdd = (rawValue) => {
    const email = String(rawValue || '').trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return;
    }
    addParticipant({ user: email, email });
  };

  useEffect(() => {
    const query = getPendingQuery();
    if (!query || query.length < 2) {
      setSuggestions([]);
      setSuggestionError(null);
      return;
    }

    if (suggestionTimerRef.current) {
      clearTimeout(suggestionTimerRef.current);
    }

    suggestionTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      setSuggestionError(null);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:8000/api/auth/users/search`, {
          params: { query },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const results = response.data?.data || [];
        const filtered = results.filter((user) => !participants.some((p) => p.user === user._id || p.email === user.email));
        setSuggestions(filtered);
      } catch (err) {
        setSuggestionError('Unable to load profile suggestions');
      } finally {
        setIsSearching(false);
      }
    }, 220);

    return () => {
      if (suggestionTimerRef.current) {
        clearTimeout(suggestionTimerRef.current);
      }
    };
  }, [participantInput, participants]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const participantsList = participants.length ? participants : parseParticipants(participantInput);
      const payload = {
        employer: employerId,
        title,
        description,
        participants: participantsList.map((p) => p.user || p.email || p),
        scheduledAt,
        location,
      };
      const res = await createInterview(payload, true);
      setLoading(false);
      if (res?.ok === false) {
        // backend returns 403 and message when trial expired or premium required
        if (res.status === 403 && res.data?.message) {
          setError(res.data.message);
        } else {
          setError('Failed to schedule interview. Please try again.');
        }
      } else {
        onClose && onClose();
      }
    } catch (err) {
      setError('Failed to schedule interview. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="interview-modal-overlay">
      <form onSubmit={handleSubmit} className="interview-modal-card">
        <div className="interview-modal-header">
          <h2 className="interview-modal-title">Schedule Interview</h2>
          <p className="interview-modal-description">
            Create a shared interview room and invite applicants so your team can join smoothly.
          </p>
        </div>

        {/* Trial banner: show if stored user indicates employer and trial available */}
        {(() => {
          try {
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const isEmployer = (storedUser?.role || '').toString().toLowerCase() === 'employer';
            const hasPremium = !!storedUser?.premiumAIAccess;
            const trialUsed = !!storedUser?.interviewTrialUsed;
            if (isEmployer && !hasPremium && !trialUsed) {
              return (
                <div className="trial-banner">You have one free interview scheduling trial available.</div>
              );
            }
            if (isEmployer && !hasPremium && trialUsed) {
              return (
                <div className="trial-banner trial-used">Your one-time interview trial has been used. Upgrade for unlimited scheduling.</div>
              );
            }
          } catch (err) {
            return null;
          }
          return null;
        })()}

        <div className="interview-form">
          <div className="form-field">
            <label className="form-label" htmlFor="interview-title">Title</label>
            <input
              id="interview-title"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Product designer interview"
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="interview-description">Description</label>
            <textarea
              id="interview-description"
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add meeting details or interview notes"
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="interview-scheduled-at">Scheduled At</label>
            <button
              id="interview-scheduled-at"
              type="button"
              className="form-input datetime-picker-button"
              onClick={() => setShowDateTimePicker(true)}
            >
              {scheduledAt
                ? new Date(`${scheduledAt}Z`).toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Click to select date and time'}
            </button>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="interview-participants">Participants</label>
            <input
              id="interview-participants"
              className="form-input"
              value={participantInput}
              onChange={(e) => setParticipantInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleRawEmailAdd(getPendingQuery());
                }
              }}
              placeholder="Type participant email or name"
              autoComplete="off"
            />
            {isSearching && <div className="participant-loading">Searching profiles…</div>}
            {suggestionError && <div className="participant-error">{suggestionError}</div>}
            {suggestions.length > 0 && (
              <div className="participant-suggestions">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion._id}
                    type="button"
                    className="participant-suggestion"
                    onClick={() => addParticipant({
                      user: suggestion._id,
                      email: suggestion.email,
                      firstName: suggestion.firstName,
                      lastName: suggestion.lastName,
                      profilePicture: suggestion.profilePicture,
                      companyName: suggestion.companyName,
                      role: suggestion.role,
                    })}
                  >
                    <img
                      className="participant-suggestion-avatar"
                      src={suggestion.profilePicture || '/default-avatar.png'}
                      alt={`${suggestion.firstName} ${suggestion.lastName}`}
                    />
                    <div className="participant-suggestion-details">
                      <div className="participant-suggestion-name">
                        {suggestion.firstName || suggestion.companyName} {suggestion.lastName || ''}
                      </div>
                      <div className="participant-suggestion-email">{suggestion.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {participants.length > 0 && (
              <div className="chip-list">
                {participants.map((participant) => (
                  <span key={`${participant.user}-${participant.email || ''}`} className="chip">
                    {participant.firstName || participant.companyName
                      ? `${participant.firstName || ''} ${participant.lastName || ''}`.trim()
                      : participant.email || participant.user}
                    <button
                      type="button"
                      className="chip-remove"
                      onClick={() => removeParticipant(participant)}
                      aria-label="Remove participant"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="interview-location">Location (optional)</label>
            <input
              id="interview-location"
              className="form-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Zoom, Google Meet, or Office Room"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* If an error is shown and employer is not premium, show the upgrade CTA */}
          {error && isEmployer && !hasPremium && (
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <a href="/ai-premium" className="primary-button premium-gradient" aria-label="Upgrade to Premium">Premium</a>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Scheduling...' : 'Schedule Interview'}
            </button>
          </div>
        </div>
      </form>

      {showDateTimePicker && (
        <DateTimePickerModal
          value={scheduledAt}
          onChange={setScheduledAt}
          onClose={() => setShowDateTimePicker(false)}
        />
      )}
    </div>
  );
}
