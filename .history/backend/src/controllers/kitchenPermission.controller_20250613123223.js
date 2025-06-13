const { KitchenPermission, User } = require('../models');
const { Op } = require('sequelize');

// Get all kitchen permissions
exports.getAllKitchenPermissions = async (req, res) => {
  try {
    const permissions = await KitchenPermission.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'role']
        },
        {
          model: User,
          as: 'grantor',
          attributes: ['id', 'name', 'role']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json(permissions);
  } catch (error) {
    console.error('Error getting kitchen permissions:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách quyền nhân viên bếp' });
  }
};

// Get active kitchen permissions
exports.getActiveKitchenPermissions = async (req, res) => {
  try {
    const permissions = await KitchenPermission.findAll({
      where: {
        isActive: true,
        [Op.or]: [
          { expiryDate: null },
          { expiryDate: { [Op.gt]: new Date() } }
        ]
      },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'role']
        },
        {
          model: User,
          as: 'grantor',
          attributes: ['id', 'name', 'role']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json(permissions);
  } catch (error) {
    console.error('Error getting active kitchen permissions:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách quyền đang hoạt động' });
  }
};

// Get kitchen permission by ID
exports.getKitchenPermissionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const permission = await KitchenPermission.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'role']
        },
        {
          model: User,
          as: 'grantor',
          attributes: ['id', 'name', 'role']
        }
      ]
    });
    
    if (!permission) {
      return res.status(404).json({ message: 'Không tìm thấy quyền' });
    }
    
    res.status(200).json(permission);
  } catch (error) {
    console.error('Error getting kitchen permission:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thông tin quyền' });
  }
};

// Get kitchen permissions for a user
exports.getUserKitchenPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const permissions = await KitchenPermission.findAll({
      where: { userId },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'role']
        },
        {
          model: User,
          as: 'grantor',
          attributes: ['id', 'name', 'role']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json(permissions);
  } catch (error) {
    console.error('Error getting user kitchen permissions:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách quyền của người dùng' });
  }
};

// Create new kitchen permission
exports.createKitchenPermission = async (req, res) => {
  try {
    const { 
      userId, 
      canAutoApprove, 
      maxOrderValue, 
      notes, 
      expiryDate 
    } = req.body;
    
    // Validate required fields
    if (!userId) {
      return res.status(400).json({ message: 'ID người dùng là bắt buộc' });
    }
    
    // Check if user exists and is a kitchen staff
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    if (user.role !== 'kitchen') {
      return res.status(400).json({ message: 'Chỉ nhân viên bếp mới được cấp quyền này' });
    }
    
    // Check if admin is granting permission
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có thể cấp quyền' });
    }
    
    // Create permission
    const permission = await KitchenPermission.create({
      userId,
      grantedById: req.user.id,
      canAutoApprove: canAutoApprove !== undefined ? canAutoApprove : false,
      maxOrderValue,
      notes,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      isActive: true,
      grantedAt: new Date()
    });
    
    // Get complete permission with associations
    const completePermission = await KitchenPermission.findByPk(permission.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'role']
        },
        {
          model: User,
          as: 'grantor',
          attributes: ['id', 'name', 'role']
        }
      ]
    });
    
    res.status(201).json(completePermission);
  } catch (error) {
    console.error('Error creating kitchen permission:', error);
    res.status(500).json({ message: 'Lỗi khi tạo quyền mới' });
  }
};

// Update kitchen permission
exports.updateKitchenPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      canAutoApprove, 
      maxOrderValue, 
      notes, 
      expiryDate,
      isActive
    } = req.body;
    
    // Check if admin is updating permission
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có thể cập nhật quyền' });
    }
    
    const permission = await KitchenPermission.findByPk(id);
    
    if (!permission) {
      return res.status(404).json({ message: 'Không tìm thấy quyền' });
    }
    
    // Update permission
    await permission.update({
      canAutoApprove: canAutoApprove !== undefined ? canAutoApprove : permission.canAutoApprove,
      maxOrderValue: maxOrderValue !== undefined ? maxOrderValue : permission.maxOrderValue,
      notes: notes !== undefined ? notes : permission.notes,
      expiryDate: expiryDate !== undefined ? (expiryDate ? new Date(expiryDate) : null) : permission.expiryDate,
      isActive: isActive !== undefined ? isActive : permission.isActive
    });
    
    // Get updated permission with associations
    const updatedPermission = await KitchenPermission.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'role']
        },
        {
          model: User,
          as: 'grantor',
          attributes: ['id', 'name', 'role']
        }
      ]
    });
    
    res.status(200).json(updatedPermission);
  } catch (error) {
    console.error('Error updating kitchen permission:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật quyền' });
  }
};

// Revoke kitchen permission
exports.revokeKitchenPermission = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if admin is revoking permission
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có thể thu hồi quyền' });
    }
    
    const permission = await KitchenPermission.findByPk(id);
    
    if (!permission) {
      return res.status(404).json({ message: 'Không tìm thấy quyền' });
    }
    
    // Revoke permission by setting isActive to false
    await permission.update({
      isActive: false,
      notes: permission.notes + `\nThu hồi bởi ${req.user.name} vào ${new Date().toISOString()}`
    });
    
    res.status(200).json({ 
      message: 'Đã thu hồi quyền thành công',
      permission
    });
  } catch (error) {
    console.error('Error revoking kitchen permission:', error);
    res.status(500).json({ message: 'Lỗi khi thu hồi quyền' });
  }
};

// Check if a user has auto-approve permission
exports.checkAutoApprovePermission = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const permission = await KitchenPermission.findOne({
      where: {
        userId,
        isActive: true,
        canAutoApprove: true,
        [Op.or]: [
          { expiryDate: null },
          { expiryDate: { [Op.gt]: new Date() } }
        ]
      }
    });
    
    const hasPermission = !!permission;
    let maxOrderValue = null;
    
    if (hasPermission && permission.maxOrderValue) {
      maxOrderValue = permission.maxOrderValue;
    }
    
    res.status(200).json({
      hasAutoApprovePermission: hasPermission,
      maxOrderValue,
      permission: permission || null
    });
  } catch (error) {
    console.error('Error checking auto-approve permission:', error);
    res.status(500).json({ message: 'Lỗi khi kiểm tra quyền tự động phê duyệt' });
  }
};
