const cron = require('node-cron');
const { autoRejectNearbySchedules } = require('../controllers/attendance.controller');
const { autoRejectUnconfirmedSchedules } = require('../controllers/schedule.controller');

/**
 * Cron job để tự động reject lịch làm việc theo các điều kiện:
 * 1. Khi thời gian vào ca cách thời gian hiện tại dưới 1 giờ (từ controller attendance)
 * 2. Khi nhân viên không phản hồi trước 30 phút ca bắt đầu (từ controller schedule)
 * Chạy mỗi 5 phút
 */
const scheduleAutoReject = () => {
  // console.log('Đã khởi tạo cron job tự động reject lịch làm việc');
  
  // Chạy mỗi 5 phút
  cron.schedule('*/5 * * * *', async () => {
    // console.log('Bắt đầu chạy cron job tự động reject lịch làm việc');
    try {
      // Từ chối các lịch làm việc đăng ký quá gần thời gian bắt đầu ca (dưới 1 giờ)
      const recordsNearby = await autoRejectNearbySchedules();
      // console.log(`Cron job đã tự động reject ${recordsNearby.length} lịch làm việc do đăng ký quá gần thời gian bắt đầu ca (dưới 1 giờ)`);
      
      // Từ chối các lịch làm việc chưa phản hồi trước 30 phút ca bắt đầu
      const recordsUnconfirmed = await autoRejectUnconfirmedSchedules();
      // console.log(`Cron job đã tự động reject ${recordsUnconfirmed.length} lịch làm việc do nhân viên không phản hồi trước 30 phút ca bắt đầu`);
      
      // Tổng số lịch làm việc bị từ chối
      const totalRejected = recordsNearby.length + recordsUnconfirmed.length;
      if (totalRejected > 0) {
        console.log(`Cron job đã tự động reject ${totalRejected} lịch làm việc (${recordsNearby.length} do đăng ký quá gần, ${recordsUnconfirmed.length} do không phản hồi)`);
      }
    } catch (error) {
      console.error('Lỗi khi chạy cron job tự động reject lịch làm việc:', error);
    }
  });
};

module.exports = {
  scheduleAutoReject
}; 