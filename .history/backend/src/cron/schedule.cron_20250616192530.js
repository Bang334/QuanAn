const cron = require('node-cron');
const { autoRejectNearbySchedules } = require('../controllers/attendance.controller');

/**
 * Cron job để tự động reject lịch làm việc khi thời gian vào ca cách thời gian hiện tại dưới 1 tiếng
 * Chạy mỗi 15 phút
 */
const scheduleAutoReject = () => {
  // console.log('Đã khởi tạo cron job tự động reject lịch làm việc');
  
  // Chạy mỗi 15 phút
  cron.schedule('*/15 * * * *', async () => {
    // console.log('Bắt đầu chạy cron job tự động reject lịch làm việc');
    try {
      const records = await autoRejectNearbySchedules();
      // console.log(`Cron job đã tự động reject ${records.length} lịch làm việc do đăng ký quá gần thời gian bắt đầu ca (dưới 1 tiếng)`);
    } catch (error) {
      console.error('Lỗi khi chạy cron job tự động reject lịch làm việc:', error);
    }
  });
};

module.exports = {
  scheduleAutoReject
}; 