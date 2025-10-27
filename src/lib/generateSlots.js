/**
 * Check if a time string is in 12-hour format with AM/PM.
 * @param {string} timeStr - Time string to check.
 * @returns {boolean} True if 12-hour format, false otherwise.
 */
function is12HourFormat(timeStr) {
  return /am|pm/i.test(timeStr);
}

/**
 * Convert 12-hour time string (e.g. "9:00 AM") to 24-hour format ("HH:mm").
 * @param {string} timeStr - 12-hour format time string.
 * @returns {string} Time in 24-hour format.
 */
function convert12To24(timeStr) {
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (modifier.toLowerCase() === "pm" && hours !== 12) {
    hours += 12;
  }
  if (modifier.toLowerCase() === "am" && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Normalize time string to 24-hour format.
 * @param {string} timeStr - Time string in 12-hour or 24-hour format.
 * @returns {string} Time string in 24-hour format.
 */
function normalizeTime(timeStr) {
  if (is12HourFormat(timeStr)) {
    return convert12To24(timeStr);
  }
  return timeStr;
}

/**
 * Generate time slots between startTime and endTime with given duration.
 * @param {string} startTime - Start time, e.g. "09:00" or "9:00 AM".
 * @param {string} endTime - End time, e.g. "11:00" or "11:30 PM".
 * @param {string} durationStr - Duration string like "30m" or "1h".
 * @returns {Array<{startTime: string, endTime: string}>} Array of time slot objects.
 */
export function generateTimeSlots(startTime, endTime, durationStr) {
  // Helper to parse duration string into minutes.
  function getDurationInMinutes(duration) {
    const match = duration.match(/^(\d+)(h|m)$/);
    if (!match) throw new Error("Invalid duration format, use '30m' or '1h'");
    const value = parseInt(match[1], 10);
    return match[2] === "h" ? value * 60 : value;
  }

  // Helper to convert "HH:mm" to total minutes from midnight.
  function timeToMinutes(t) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }

  // Helper to convert minutes from midnight back to "HH:mm".
  function minutesToTime(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  // Normalize input times to 24-hour format.
  const normalizedStart = normalizeTime(startTime);
  const normalizedEnd = normalizeTime(endTime);

  const duration = getDurationInMinutes(durationStr);
  let current = timeToMinutes(normalizedStart);
  const end = timeToMinutes(normalizedEnd);

  const slots = [];

  while (current + duration <= end) {
    slots.push({
      startTime: minutesToTime(current),
      endTime: minutesToTime(current + duration),
    });
    current += duration;
  }

  return slots;
}
// console.log(generateTimeSlots("9:00 AM", "11:00 AM", "30m"));
// console.log(generateTimeSlots("09:00", "11:00", "1h"));
