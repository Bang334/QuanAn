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
          isActive: true,
          canAutoApprove: true,
          [Op.or]: [
            { expiryDate: null },
            { expiryDate: { [Op.gt]: new Date() } }
          ]
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

// Update purchase order status
exports.updatePurchaseOrderStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { status, notes, rejectReason } = req.body;
    
    const purchaseOrder = await PurchaseOrder.findByPk(id, {
      include: [
        {
          model: PurchaseOrderItem,
          include: [Ingredient]
        }
      ]
    });
    
    if (!purchaseOrder) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Không tìm thấy đơn đặt hàng' });
    }
    
    // Validate status transition
    const validTransitions = {
      'pending': ['approved', 'rejected'],
      'approved': ['ordered', 'cancelled'],
      'ordered': ['delivered', 'cancelled'],
      'delivered': ['delivered'], // No change allowed
      'rejected': ['pending'], // Can resubmit
      'cancelled': ['pending'] // Can resubmit
    };
    
    if (!validTransitions[purchaseOrder.status].includes(status)) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: `Không thể chuyển trạng thái từ ${purchaseOrder.status} sang ${status}` 
      });
    }
    
    // Update purchase order
    const updateData = { status };
    
    if (notes) {
      updateData.notes = notes;
    }
    
    if (status === 'rejected' && rejectReason) {
      updateData.rejectReason = rejectReason;
    }
    
    if (status === 'approved') {
      updateData.approverId = req.user.id;
    }
    
    if (status === 'delivered') {
      updateData.actualDeliveryDate = new Date();
      
      // Update inventory for each item
      for (const item of purchaseOrder.PurchaseOrderItems) {
        const ingredient = await Ingredient.findByPk(item.ingredientId);
        
        if (ingredient) {
          const previousQuantity = parseFloat(ingredient.quantity);
          const newQuantity = previousQuantity + parseFloat(item.quantity);
          
          // Update ingredient quantity
          await ingredient.update({ 
            quantity: newQuantity 
          }, { transaction });
          
          // Create inventory transaction
          await InventoryTransaction.create({
            ingredientId: ingredient.id,
            quantity: item.quantity,
            type: 'purchase',
            previousQuantity,
            newQuantity,
            unitPrice: item.unitPrice,
            notes: `Nhập hàng từ đơn hàng #${purchaseOrder.id}`,
            userId: req.user.id,
            referenceId: purchaseOrder.id,
            referenceType: 'PurchaseOrder',
            transactionDate: new Date()
          }, { transaction });
          
          // Update purchase order item status
          await item.update({ 
            status: 'complete',
            receivedQuantity: item.quantity
          }, { transaction });
        }
      }
    }
    
    await purchaseOrder.update(updateData, { transaction });
    
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
    console.error('Error updating purchase order status:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái đơn đặt hàng' });
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
