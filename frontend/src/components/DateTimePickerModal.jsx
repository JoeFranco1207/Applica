import React, { useState } from 'react';
import './DateTimePickerModal.css';

export default function DateTimePickerModal({ value, onChange, onClose }) {
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value).toISOString().split('T')[0] : '');
  const [hours, setHours] = useState(value ? String(new Date(value).getHours()).padStart(2, '0') : '09');
  const [minutes, setMinutes] = useState(value ? String(new Date(value).getMinutes()).padStart(2, '0') : '00');

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (day) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const handleConfirm = () => {
    if (!selectedDate) return;
    const [year, month, day] = selectedDate.split('-');
    const dateTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
    onChange(dateTimeString);
    onClose();
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const isSelectedDate = (day) => {
    if (!day) return false;
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateStr === selectedDate;
  };

  return (
    <div className="datetime-picker-overlay" onClick={onClose}>
      <div className="datetime-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="datetime-picker-header">
          <h3>Select Date & Time</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="datetime-picker-content">
          {/* Calendar Section */}
          <div className="calendar-section">
            <div className="calendar-navigation">
              <button onClick={handlePrevMonth} className="nav-btn">←</button>
              <h4 className="current-month">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h4>
              <button onClick={handleNextMonth} className="nav-btn">→</button>
            </div>

            <div className="calendar-weekdays">
              {dayNames.map((day) => (
                <div key={day} className="weekday-header">{day}</div>
              ))}
            </div>

            <div className="calendar-days">
              {days.map((day, index) => (
                <button
                  key={index}
                  className={`calendar-day ${day ? 'active' : 'empty'} ${isSelectedDate(day) ? 'selected' : ''}`}
                  onClick={() => day && handleDateClick(day)}
                  disabled={!day}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Time Section */}
          <div className="time-section">
            <h4>Select Time</h4>
            <div className="time-input-group">
              <div className="time-input">
                <label>Hours</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={hours}
                  onChange={(e) => setHours(String(e.target.value).padStart(2, '0'))}
                />
              </div>
              <div className="time-separator">:</div>
              <div className="time-input">
                <label>Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(String(e.target.value).padStart(2, '0'))}
                />
              </div>
            </div>

            <div className="selected-datetime-display">
              <p>
                Selected: <strong>
                  {selectedDate ? new Date(`${selectedDate}T${hours}:${minutes}`).toLocaleString() : 'No date selected'}
                </strong>
              </p>
            </div>
          </div>
        </div>

        <div className="datetime-picker-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="confirm-btn" onClick={handleConfirm} disabled={!selectedDate}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
