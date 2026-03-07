/**
 * Time utilities for YouTube Focus Guard
 * Handles time calculations, night lock checks, and formatting
 */

class TimeUtils {
  static instance: TimeUtils;

  static getInstance(): TimeUtils {
    if (!TimeUtils.instance) {
      TimeUtils.instance = new TimeUtils();
    }
    return TimeUtils.instance;
  }

  /**
   * Check if current time is within night lock period
   */
  isNightLockActive(startTime: string, endTime: string): boolean {
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
    
    // Same-day lock
    return currentTime >= lockStart && currentTime <= lockEnd;
  }

  /**
   * Calculate time until night lock ends
   */
  timeUntilUnlock(endTime: string): { hours: number; minutes: number } {
    const now = new Date();
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let unlockDate = new Date();
    unlockDate.setHours(endHour, endMin, 0, 0);
    
    // If unlock time is earlier in day, it's tomorrow
    if (unlockDate <= now) {
      unlockDate.setDate(unlockDate.getDate() + 1);
    }
    
    const diffMs = unlockDate.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes };
  }

  /**
   * Format duration in human-readable format
   */
  formatDuration(minutes: number): string {
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

  /**
   * Format seconds to MM:SS
   */
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Get time until next reminder
   */
  getNextReminderTime(sessionStart: number, intervalMinutes: number): number {
    const sessionDuration = Math.floor((Date.now() - sessionStart) / 1000 / 60);
    const nextReminder = intervalMinutes - (sessionDuration % intervalMinutes);
    return nextReminder === intervalMinutes ? 0 : nextReminder;
  }

  /**
   * Check if it's a new day for resetting daily limits
   */
  isNewDay(lastResetDate: string): boolean {
    const today = new Date().toDateString();
    return today !== lastResetDate;
  }

  /**
   * Get current time in HH:MM format
   */
  getCurrentTime(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Calculate session duration in seconds
   */
  getSessionDuration(startTimestamp: number): number {
    return Math.floor((Date.now() - startTimestamp) / 1000);
  }

  /**
   * Get countdown text for unlock time
   */
  getUnlockCountdown(endTime: string): string {
    const { hours, minutes } = this.timeUntilUnlock(endTime);
    
    if (hours === 0) {
      return `${minutes}m`;
    }
    
    if (minutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${minutes}m`;
  }

  /**
   * Check if time string is valid (HH:MM format)
   */
  isValidTimeFormat(timeStr: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeStr);
  }

  /**
   * Convert time string to minutes since midnight
   */
  timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes since midnight to time string
   */
  minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}

// Export for global access
(window as any).TimeUtils = TimeUtils;