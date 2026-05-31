import React, { useState } from 'react';
import './DateTimePickerModal.css';

export default function DateTimePickerModal({ value, onChange, onClose }) {
  const now = new Date();
  const formatLocalDate = (date) => {
    const localDate = new Date(date);
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  const [selectedDate, setSelectedDate] = useState(value ? formatLocalDate(new Date(value)) : '');
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

  const normalizeDate = (date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  const isDisabledDate = (day) => {
    if (!day) return true;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.getTime() < normalizeDate(now).getTime();
  };

  const handleDateClick = (day) => {
    if (!day || isDisabledDate(day)) return;
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(formatLocalDate(newDate));
  };

  const todayString = normalizeDate(now).toISOString().split('T')[0];
  const selectedDateTime = selectedDate ? new Date(`${selectedDate}T${hours}:${minutes}`) : null;
  const isSelectedDayToday = selectedDate === todayString;
  const isPastSelection = selectedDateTime ? selectedDateTime.getTime() <= Date.now() : false;
  const isTodayTimeInvalid = isSelectedDayToday && selectedDateTime ? selectedDateTime.getTime() <= Date.now() : false;

  const handleConfirm = () => {
    if (!selectedDate || isPastSelection) return;
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
              <button
                onClick={handlePrevMonth}
                className="nav-btn"
                disabled={currentMonth.getFullYear() < now.getFullYear() || (currentMonth.getFullYear() === now.getFullYear() && currentMonth.getMonth() <= now.getMonth())}
              >←</button>
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
              {days.map((day, index) => {
                const disabledDay = !day || isDisabledDate(day);
                return (
                  <button
                    key={index}
                    className={`calendar-day ${day ? 'active' : 'empty'} ${isSelectedDate(day) ? 'selected' : ''} ${disabledDay ? 'disabled-day' : ''}`}
                    onClick={() => day && handleDateClick(day)}
                    disabled={disabledDay}
                  >
                    {day}
                  </button>
                );
              })}
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
                  {selectedDateTime ? selectedDateTime.toLocaleString() : 'No date selected'}
                </strong>
              </p>
              {isTodayTimeInvalid ? (
                <p className="datetime-error">Today is allowed, but the chosen time has already passed. Pick a later time.</p>
              ) : isPastSelection ? (
                <p className="datetime-error">Selected date and time are in the past. Please choose a future slot.</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="datetime-picker-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="confirm-btn" onClick={handleConfirm} disabled={!selectedDate || isPastSelection}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
