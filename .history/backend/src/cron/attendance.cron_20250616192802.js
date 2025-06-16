const cron = require('node-cron');
const { markAbsentEmployees } = require('../controllers/attendance.controller');

/**
 * Cron job để tự động đánh dấu vắng mặt cho nhân viên không chấm công
 * Chạy vào 23:59 hàng ngày
 * Chỉ áp dụng cho những lịch làm việc đã được confirm
 */
const scheduleAbsentMarking = () => {
  console.log('Đã khởi tạo cron job đánh dấu vắng mặt tự động');
  
  // Chạy vào 23:59 hàng ngày
  cron.schedule('59 23 * * *', async () => {
    console.log('Bắt đầu chạy cron job đánh dấu vắng mặt tự động cho lịch làm việc đã được confirm');
    try {
      const records = await markAbsentEmployees();
      console.log(`Cron job đã đánh dấu vắng mặt cho ${records.length} nhân viên có lịch làm việc đã confirm nhưng không chấm công`);
    } catch (error) {
      console.error('Lỗi khi chạy cron job đánh dấu vắng mặt:', error);
    }
  });
};

module.exports = {
  scheduleAbsentMarking
}; 