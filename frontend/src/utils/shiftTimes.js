/**
 * Ánh xạ từ loại ca làm việc sang thời gian bắt đầu và kết thúc
 */
export const SHIFT_TIMES = {
  morning: {
    startTime: '06:00:00',
    endTime: '12:00:00',
    label: 'Ca sáng (6:00 - 12:00)'
  },
  afternoon: {
    startTime: '12:00:00',
    endTime: '18:00:00',
    label: 'Ca chiều (12:00 - 18:00)'
  },
  evening: {
    startTime: '18:00:00',
    endTime: '00:00:00',
    label: 'Ca tối (18:00 - 00:00)'
  },
  night: {
    startTime: '00:00:00',
    endTime: '06:00:00',  // Kết thúc vào sáng hôm sau
    label: 'Ca đêm (00:00 - 6:00)'
  }
};

/**
 * Lấy thời gian bắt đầu và kết thúc dựa trên loại ca
 * @param {string} shift - Loại ca làm việc
 * @returns {Object} Đối tượng chứa thời gian bắt đầu và kết thúc
 */
export const getShiftTimes = (shift) => {
  return SHIFT_TIMES[shift] || {
    startTime: '08:00:00',
    endTime: '17:00:00',  // Mặc định ca làm việc 8h-17h
    label: 'Ca mặc định (8:00 - 17:00)'
  };
};

/**
 * Chuyển đổi thời gian từ định dạng 'HH:mm:ss' sang 'HH:mm'
 * @param {string} time - Thời gian định dạng 'HH:mm:ss'
 * @returns {string} Thời gian định dạng 'HH:mm'
 */
export const formatTime = (time) => {
  if (!time) return '';
  return time.substring(0, 5);
};

/**
 * Tính số giờ làm việc dựa trên ca
 * @param {string} shift - Loại ca làm việc
 * @returns {number} Số giờ làm việc
 */
export const calculateWorkHours = (shift) => {
  // Cung cấp giá trị mặc định cho mỗi ca làm việc
  const hoursPerShift = {
    morning: 6.0,
    afternoon: 6.0,
    evening: 6.0,
    night: 6.0
  };
  
  // Nếu có loại ca đã biết, trả về giờ làm việc tương ứng
  if (hoursPerShift[shift] !== undefined) {
    return hoursPerShift[shift];
  }
  
  // Nếu không, tính toán dựa trên thời gian bắt đầu và kết thúc
  const { startTime, endTime } = getShiftTimes(shift);
  
  // Chuyển đổi thời gian sang phút
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMinute;
  let endMinutes = endHour * 60 + endMinute;
  
  // Nếu giờ kết thúc nhỏ hơn giờ bắt đầu, giả định là qua ngày hôm sau
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }
  
  // Chuyển đổi phút thành giờ và làm tròn đến 2 chữ số thập phân
  return Math.round(((endMinutes - startMinutes) / 60) * 100) / 100;
};

/**
 * Lấy tên hiển thị của ca làm việc
 * @param {string} shift - Loại ca làm việc
 * @returns {string} Tên hiển thị của ca làm việc
 */
export const getShiftLabel = (shift) => {
  const shiftInfo = SHIFT_TIMES[shift];
  return shiftInfo ? shiftInfo.label : 'Không xác định';
};

export default {
  SHIFT_TIMES,
  getShiftTimes,
  formatTime,
  calculateWorkHours,
  getShiftLabel
}; 