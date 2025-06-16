/**
 * Ánh xạ từ loại ca (shift) sang thời gian bắt đầu/kết thúc
 * Được sử dụng để tính giờ làm việc và kiểm tra thời gian check-in hợp lệ
 */

const shiftTimes = {
  morning: {
    startTime: '06:00:00',
    endTime: '12:00:00',
    hoursWorked: 6.0
  },
  afternoon: {
    startTime: '12:00:00',
    endTime: '18:00:00',
    hoursWorked: 6.0
  },
  evening: {
    startTime: '18:00:00',
    endTime: '00:00:00',
    hoursWorked: 6.0
  },
  night: {
    startTime: '00:00:00',
    endTime: '06:00:00',
    hoursWorked: 6.0
  }
};

/**
 * Lấy thời gian bắt đầu của ca làm việc
 * @param {string} shift - Loại ca làm việc
 * @returns {string|null} - Thời gian bắt đầu ca làm việc (định dạng HH:MM:SS)
 */
const getShiftStartTime = (shift) => {
  return shiftTimes[shift]?.startTime || null;
};

/**
 * Lấy thời gian kết thúc của ca làm việc
 * @param {string} shift - Loại ca làm việc
 * @returns {string|null} - Thời gian kết thúc ca làm việc (định dạng HH:MM:SS)
 */
const getShiftEndTime = (shift) => {
  return shiftTimes[shift]?.endTime || null;
};

/**
 * Lấy số giờ làm việc của ca làm việc
 * @param {string} shift - Loại ca làm việc
 * @returns {number|0} - Số giờ làm việc của ca
 */
const getShiftHours = (shift) => {
  return shiftTimes[shift]?.hoursWorked || 0;
};

/**
 * Kiểm tra xem thời gian check-in có hợp lệ không (trước giờ bắt đầu ca tối đa 30 phút)
 * @param {string} shift - Loại ca làm việc
 * @param {string} checkInTime - Thời gian check-in (định dạng HH:MM:SS)
 * @returns {boolean} - true nếu hợp lệ, false nếu không hợp lệ
 */
const isValidCheckInTime = (shift, checkInTime) => {
  const shiftStartTime = getShiftStartTime(shift);
  if (!shiftStartTime) return false;

  // Chuyển đổi sang đối tượng Date để so sánh
  const startTimeDate = new Date(`2000-01-01T${shiftStartTime}`);
  const checkInTimeDate = new Date(`2000-01-01T${checkInTime}`);
  const earliestAllowedTime = new Date(startTimeDate.getTime() - 30 * 60 * 1000); // Trừ 30 phút

  // Kiểm tra xem thời gian check-in có nằm trong khoảng cho phép không
  return checkInTimeDate >= earliestAllowedTime && checkInTimeDate <= startTimeDate;
};

/**
 * Hàm cũ để tương thích ngược
 * @param {string} shift - Loại ca làm việc
 * @returns {Object} Đối tượng chứa thời gian bắt đầu và kết thúc
 */
const getShiftTimes = (shift) => {
  return {
    startTime: getShiftStartTime(shift),
    endTime: getShiftEndTime(shift)
  };
};

module.exports = {
  shiftTimes,
  getShiftStartTime,
  getShiftEndTime,
  getShiftHours,
  isValidCheckInTime,
  getShiftTimes
}; 