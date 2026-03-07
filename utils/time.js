/**
 * Time utilities for YouTube Focus Guard (JS version)
 * Handles time calculations, night lock checks, and formatting
 */

class TimeUtils {
  static getInstance() {
    if (!TimeUtils.instance) {
      TimeUtils.instance = new TimeUtils();
    }
    return TimeUtils.instance;
  }

  isNightLockActive(startTime, endTime) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const lockStart = startHour * 60 + startMin;
    const lockEnd = endHour * 60 + endMin;

    // Handle overnight locks (e.g., 23:30 to 06:00)
    if (lockStart > lockEnd) {
      return currentTime >= lockStart || currentTime <= lockEnd;
    }
    
    return currentTime >= lockStart && currentTime <= lockEnd;
  }

  timeUntilUnlock(endTime) {
    const now = new Date();
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let unlockDate = new Date();
    unlockDate.setHours(endHour, endMin, 0, 0);
    
    if (unlockDate <= now) {
      unlockDate.setDate(unlockDate.getDate() + 1);
    }
    
    const diffMs = unlockDate.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes };
  }

  formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (mins === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${mins}m`;
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  getNextReminderTime(sessionStart, intervalMinutes) {
    const sessionDuration = Math.floor((Date.now() - sessionStart) / 1000 / 60);
    const nextReminder = intervalMinutes - (sessionDuration % intervalMinutes);
    return nextReminder === intervalMinutes ? 0 : nextReminder;
  }

  isNewDay(lastResetDate) {
    const today = new Date().toDateString();
    return today !== lastResetDate;
  }

  getCurrentTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  getSessionDuration(startTimestamp) {
    return Math.floor((Date.now() - startTimestamp) / 1000);
  }

  getUnlockCountdown(endTime) {
    const { hours, minutes } = this.timeUntilUnlock(endTime);
    
    if (hours === 0) {
      return `${minutes}m`;
    }
    
    if (minutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${minutes}m`;
  }

  isValidTimeFormat(timeStr) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeStr);
  }

  timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}

// Export for global access
window.TimeUtils = TimeUtils;