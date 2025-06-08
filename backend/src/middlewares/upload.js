const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục uploads nếu chưa tồn tại
const uploadsDir = path.join(__dirname, '../../uploads');
const menuUploadsDir = path.join(uploadsDir, 'menu');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(menuUploadsDir)) {
  fs.mkdirSync(menuUploadsDir, { recursive: true });
}

// Cấu hình storage cho multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Xác định thư mục lưu trữ dựa trên loại file
    if (file.fieldname === 'image' && req.baseUrl.includes('/menu')) {
      cb(null, 'uploads/menu');
    } else if (file.fieldname === 'qrcode') {
      cb(null, 'uploads/qrcodes');
    } else {
      cb(null, 'uploads');
    }
  },
  filename: (req, file, cb) => {
    // Tạo tên file duy nhất để tránh trùng lặp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    
    if (file.fieldname === 'image' && req.baseUrl.includes('/menu')) {
      cb(null, `menu-${uniqueSuffix}${fileExt}`);
    } else if (file.fieldname === 'qrcode') {
      cb(null, `qrcode-${uniqueSuffix}${fileExt}`);
    } else {
      cb(null, `${file.fieldname}-${uniqueSuffix}${fileExt}`);
    }
  }
});

// Cấu hình upload để chỉ chấp nhận hình ảnh
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file hình ảnh!'), false);
  }
};

// Tạo middleware multer
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn 5MB
  },
  fileFilter
});

module.exports = upload; 