const { 
  PurchaseOrder, 
  PurchaseOrderItem, 
  Supplier, 
  Ingredient, 
  User,
  KitchenPermission,
  InventoryTransaction,
  sequelize
} = require('../models');
const { Op } = require('sequelize');

// Get all purchase orders
exports.getAllPurchaseOrders = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    const whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (startDate && endDate) {
      whereClause.orderDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.orderDate = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.orderDate = {
        [Op.lte]: new Date(endDate)
      };
    }
    
    const purchaseOrders = await PurchaseOrder.findAll({
      where: whereClause,
      include: [
        {
          model: Supplier,
          attributes: ['id', 'name', 'phone']
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'role']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'role']
        }
      ],
      order: [['orderDate', 'DESC']]
    });
    
    res.status(200).json(purchaseOrders);
  } catch (error) {
    console.error('Error getting purchase orders:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách đơn đặt hàng' });
  }
};

// Get purchase orders for kitchen
exports.getKitchenPurchaseOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const purchaseOrders = await PurchaseOrder.findAll({
      where: {
        [Op.or]: [
          { requesterId: userId },
          { 
            status: {
              [Op.in]: ['pending', 'approved', 'ordered']
            }
          }
        ]
      },
      include: [
        {
          model: Supplier,
          attributes: ['id', 'name', 'phone']
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'role']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'role']
        }
      ],
      order: [['orderDate', 'DESC']]
    });
    
    res.status(200).json(purchaseOrders);
  } catch (error) {
    console.error('Error getting kitchen purchase orders:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách đơn đặt hàng cho bếp' });
  }
};

// Get purchase order by ID
exports.getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const purchaseOrder = await PurchaseOrder.findByPk(id, {
      include: [
        {
          model: PurchaseOrderItem,
          include: [Ingredient]
        },
        {
          model: Supplier
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'role']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'role']
        }
      ]
    });
    
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Không tìm thấy đơn đặt hàng' });
    }
    
    res.status(200).json(purchaseOrder);
  } catch (error) {
    console.error('Error getting purchase order:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thông tin đơn đặt hàng' });
  }
};

// Create new purchase order
exports.createPurchaseOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { 
      supplierId, 
      expectedDeliveryDate, 
      notes, 
      items 
    } = req.body;
    
    // Validate required fields
    if (!supplierId || !items || !items.length) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Nhà cung cấp và danh sách sản phẩm là bắt buộc' });
    }
    
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Check if user has auto-approve permission
    let canAutoApprove = false;
    let autoApproved = false;
    
    if (userRole === 'kitchen') {
      const kitchenPermission = await KitchenPermission.findOne({
        where: {
          userId,
          canAutoApprove: true
        }
      });
      
      if (kitchenPermission) {
        canAutoApprove = true;
        
        // Calculate total amount to check against max order value
        const totalAmount = items.reduce((sum, item) => {
          return sum + (parseFloat(item.quantity) * parseFloat(item.unitPrice));
        }, 0);
        
        if (!kitchenPermission.maxOrderValue || totalAmount <= kitchenPermission.maxOrderValue) {
          autoApproved = true;
        }
      }
    } else if (userRole === 'admin') {
      canAutoApprove = true;
      autoApproved = true;
    }
    
    // Create purchase order
    const purchaseOrder = await PurchaseOrder.create({
      supplierId,
      requesterId: userId,
      approverId: autoApproved ? userId : null,
      orderDate: new Date(),
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
      status: autoApproved ? 'approved' : 'pending',
      totalAmount: 0, // Will update after adding items
      paymentStatus: 'unpaid',
      notes,
      autoApproved
    }, { transaction });
    
    // Create purchase order items
    let totalAmount = 0;
    
    for (const item of items) {
      const { ingredientId, quantity, unitPrice, notes: itemNotes } = item;
      
      if (!ingredientId || !quantity || !unitPrice) {
        await transaction.rollback();
        return res.status(400).json({ 
          message: 'Mỗi mặt hàng phải có ID nguyên liệu, số lượng và đơn giá' 
        });
      }
      
      const totalPrice = parseFloat(quantity) * parseFloat(unitPrice);
      totalAmount += totalPrice;
      
      await PurchaseOrderItem.create({
        purchaseOrderId: purchaseOrder.id,
        ingredientId,
        quantity,
        unitPrice,
        totalPrice,
        notes: itemNotes,
        status: 'pending'
      }, { transaction });
    }
    
    // Update total amount
    await purchaseOrder.update({ totalAmount }, { transaction });
    
    await transaction.commit();
    
    // Get the complete purchase order with associations
    const completePurchaseOrder = await PurchaseOrder.findByPk(purchaseOrder.id, {
      include: [
        {
          model: PurchaseOrderItem,
          include: [Ingredient]
        },
        {
          model: Supplier
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'role']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'role']
        }
      ]
    });
    
    res.status(201).json({
      purchaseOrder: completePurchaseOrder,
      autoApproved
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating purchase order:', error);
    res.status(500).json({ message: 'Lỗi khi tạo đơn đặt hàng mới' });
  }
};

/**
 * Cập nhật trạng thái đơn đặt hàng
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} - JSON response
 */
const updatePurchaseOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectReason, adminNotes } = req.body;
    
    // Lấy đơn đặt hàng hiện tại để kiểm tra
    const purchaseOrder = await PurchaseOrder.findByPk(id);
    
    if (!purchaseOrder) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt hàng' });
    }
    
    // Xác thực chuyển đổi trạng thái hợp lệ (ngoài database trigger)
    const currentStatus = purchaseOrder.status;
    let isValidTransition = false;
    
    switch (currentStatus) {
      case 'pending':
        isValidTransition = ['approved', 'cancelled'].includes(status);
        break;
      case 'approved':
        isValidTransition = ['delivered', 'cancelled'].includes(status);
        break;
      case 'delivered':
        isValidTransition = ['completed'].includes(status);
        break;
      case 'completed':
        isValidTransition = false; // Đã hoàn thành không thể thay đổi trạng thái
        break;
      case 'cancelled':
        isValidTransition = false; // Đã hủy không thể thay đổi trạng thái
        break;
      default:
        isValidTransition = false;
    }
    
    if (!isValidTransition) {
      return res.status(400).json({
        success: false,
        message: `Không thể chuyển từ trạng thái ${currentStatus} sang ${status}`
      });
    }
    
    // Cập nhật trạng thái
    try {
      const updateData = { status };
      
      // Cập nhật ghi chú của admin nếu có
      if (adminNotes) {
        updateData.notes = adminNotes;
      }
      
      // Nếu đã giao hàng, cập nhật ngày giao thực tế
      if (status === 'delivered') {
        updateData.actualDeliveryDate = new Date();
      }
      
      // Cập nhật người phê duyệt nếu chuyển sang approved
      if (status === 'approved' && currentStatus === 'pending') {
        updateData.approverId = req.user.id;
      }
      
      await purchaseOrder.update(updateData);
      
      // Nếu đơn hàng được giao, cập nhật kho hàng
      if (status === 'delivered') {
        const purchaseOrderItems = await PurchaseOrderItem.findAll({
          where: { purchaseOrderId: id }
        });
        
        // Tạo giao dịch kho cho từng mục
        for (const item of purchaseOrderItems) {
          await InventoryTransaction.create({
            ingredientId: item.ingredientId,
            quantity: item.quantity,
            transactionType: 'purchase',
            referenceId: id,
            referenceType: 'purchase_order',
            unitPrice: item.unitPrice,
            notes: `Nhập hàng từ đơn đặt hàng #${id}`
          });
          
          // Cập nhật số lượng tồn kho
          const ingredient = await Ingredient.findByPk(item.ingredientId);
          if (ingredient) {
            await ingredient.update({
              stockQuantity: sequelize.literal(`stockQuantity + ${item.quantity}`)
            });
          }
        }
      }
      
      return res.status(200).json({
        success: true,
        message: 'Cập nhật trạng thái đơn đặt hàng thành công',
        data: await PurchaseOrder.findByPk(id, {
          include: [
            { model: Supplier },
            { model: User, as: 'requester' },
            { model: User, as: 'approver' }
          ]
        })
      });
    } catch (error) {
      // Xử lý lỗi từ MySQL trigger (nếu có)
      if (error.name === 'SequelizeDatabaseError' && error.parent && error.parent.sqlState === '45000') {
        return res.status(400).json({
          success: false,
          message: error.parent.sqlMessage || 'Chuyển đổi trạng thái không hợp lệ'
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error updating purchase order status:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật trạng thái đơn đặt hàng',
      error: error.message
    });
  }
};

// Update purchase order details
exports.updatePurchaseOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { 
      supplierId, 
      expectedDeliveryDate, 
      notes,
      items
    } = req.body;
    
    const purchaseOrder = await PurchaseOrder.findByPk(id);
    
    if (!purchaseOrder) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Không tìm thấy đơn đặt hàng' });
    }
    
    // Only allow updates for pending or approved orders
    if (!['pending', 'approved'].includes(purchaseOrder.status)) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: `Không thể cập nhật đơn hàng với trạng thái ${purchaseOrder.status}` 
      });
    }
    
    // Update purchase order
    const updateData = {};
    
    if (supplierId) updateData.supplierId = supplierId;
    if (expectedDeliveryDate) updateData.expectedDeliveryDate = new Date(expectedDeliveryDate);
    if (notes !== undefined) updateData.notes = notes;
    
    await purchaseOrder.update(updateData, { transaction });
    
    // Update items if provided
    if (items && items.length > 0) {
      // Delete existing items
      await PurchaseOrderItem.destroy({
        where: { purchaseOrderId: id },
        transaction
      });
      
      // Create new items
      let totalAmount = 0;
      
      for (const item of items) {
        const { ingredientId, quantity, unitPrice, notes: itemNotes } = item;
        
        if (!ingredientId || !quantity || !unitPrice) {
          await transaction.rollback();
          return res.status(400).json({ 
            message: 'Mỗi mặt hàng phải có ID nguyên liệu, số lượng và đơn giá' 
          });
        }
        
        const totalPrice = parseFloat(quantity) * parseFloat(unitPrice);
        totalAmount += totalPrice;
        
        await PurchaseOrderItem.create({
          purchaseOrderId: purchaseOrder.id,
          ingredientId,
          quantity,
          unitPrice,
          totalPrice,
          notes: itemNotes,
          status: 'pending'
        }, { transaction });
      }
      
      // Update total amount
      await purchaseOrder.update({ totalAmount }, { transaction });
    }
    
    await transaction.commit();
    
    // Get the updated purchase order
    const updatedPurchaseOrder = await PurchaseOrder.findByPk(id, {
      include: [
        {
          model: PurchaseOrderItem,
          include: [Ingredient]
        },
        {
          model: Supplier
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'role']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'role']
        }
      ]
    });
    
    res.status(200).json(updatedPurchaseOrder);
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating purchase order:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật đơn đặt hàng' });
  }
};

// Delete purchase order
exports.deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const purchaseOrder = await PurchaseOrder.findByPk(id);
    
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Không tìm thấy đơn đặt hàng' });
    }
    
    // Only allow deletion of pending orders
    if (purchaseOrder.status !== 'pending') {
      return res.status(400).json({ 
        message: `Không thể xóa đơn hàng với trạng thái ${purchaseOrder.status}` 
      });
    }
    
    // Delete purchase order items first
    await PurchaseOrderItem.destroy({
      where: { purchaseOrderId: id }
    });
    
    // Delete purchase order
    await purchaseOrder.destroy();
    
    res.status(200).json({ message: 'Đã xóa đơn đặt hàng thành công' });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    res.status(500).json({ message: 'Lỗi khi xóa đơn đặt hàng' });
  }
};

// Get purchase order items by purchase order ID
exports.getPurchaseOrderItems = async (req, res) => {
  try {
    const { purchaseOrderId } = req.query;
    
    if (!purchaseOrderId) {
      return res.status(400).json({ message: 'Thiếu tham số purchaseOrderId' });
    }
    
    const purchaseOrderItems = await PurchaseOrderItem.findAll({
      where: { purchaseOrderId },
      include: [
        {
          model: Ingredient,
          attributes: ['id', 'name', 'unit', 'category', 'image']
        }
      ]
    });
    
    res.status(200).json(purchaseOrderItems);
  } catch (error) {
    console.error('Error getting purchase order items:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách mục đơn đặt hàng' });
  }
};

// Đặt các hàm cũ vào biến để export
const createPurchaseOrder = exports.createPurchaseOrder;
const getAllPurchaseOrders = exports.getAllPurchaseOrders;
const getPurchaseOrderById = exports.getPurchaseOrderById;
const updatePurchaseOrder = exports.updatePurchaseOrder;
const deletePurchaseOrder = exports.deletePurchaseOrder;
const getKitchenPurchaseOrders = exports.getKitchenPurchaseOrders;
const addItemToPurchaseOrder = exports.addItemToPurchaseOrder;
const removeItemFromPurchaseOrder = exports.removeItemFromPurchaseOrder;
const updatePurchaseOrderItem = exports.updatePurchaseOrderItem;
const getPurchaseOrderItems = exports.getPurchaseOrderItems;
const getPurchaseOrdersBySupplier = exports.getPurchaseOrdersBySupplier;
const getPurchaseOrdersByStatus = exports.getPurchaseOrdersByStatus;
const getRecentPurchaseOrders = exports.getRecentPurchaseOrders;
const getUpcomingDeliveries = exports.getUpcomingDeliveries;
const getPurchaseOrderStatistics = exports.getPurchaseOrderStatistics;

module.exports = {
  createPurchaseOrder,
  getAllPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  deletePurchaseOrder,
  updatePurchaseOrderStatus,
  addItemToPurchaseOrder,
  removeItemFromPurchaseOrder,
  updatePurchaseOrderItem,
  getPurchaseOrderItems,
  getPurchaseOrdersBySupplier,
  getPurchaseOrdersByStatus,
  getRecentPurchaseOrders,
  getUpcomingDeliveries,
  getPurchaseOrderStatistics,
  getKitchenPurchaseOrders
};
