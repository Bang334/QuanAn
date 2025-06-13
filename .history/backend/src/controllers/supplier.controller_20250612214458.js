const { Supplier, PurchaseOrder } = require('../models');
const { Op } = require('sequelize');

// Get all suppliers
exports.getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.findAll({
      order: [['name', 'ASC']]
    });
    
    res.status(200).json(suppliers);
  } catch (error) {
    console.error('Error getting suppliers:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách nhà cung cấp' });
  }
};

// Get active suppliers
exports.getActiveSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });
    
    res.status(200).json(suppliers);
  } catch (error) {
    console.error('Error getting active suppliers:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách nhà cung cấp đang hoạt động' });
  }
};

// Get supplier by ID
exports.getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findByPk(id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Không tìm thấy nhà cung cấp' });
    }
    
    res.status(200).json(supplier);
  } catch (error) {
    console.error('Error getting supplier:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thông tin nhà cung cấp' });
  }
};

// Create new supplier
exports.createSupplier = async (req, res) => {
  try {
    const { 
      name, contactPerson, phone, email, address, 
      paymentTerms, notes, rating 
    } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Tên nhà cung cấp là bắt buộc' });
    }
    
    // Create supplier
    const supplier = await Supplier.create({
      name,
      contactPerson,
      phone,
      email,
      address,
      paymentTerms,
      notes,
      rating,
      isActive: true
    });
    
    res.status(201).json(supplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ message: 'Lỗi khi tạo nhà cung cấp mới' });
  }
};

// Update supplier
exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, contactPerson, phone, email, address, 
      paymentTerms, notes, rating, isActive 
    } = req.body;
    
    const supplier = await Supplier.findByPk(id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Không tìm thấy nhà cung cấp' });
    }
    
    // Update supplier details
    await supplier.update({
      name: name || supplier.name,
      contactPerson: contactPerson !== undefined ? contactPerson : supplier.contactPerson,
      phone: phone !== undefined ? phone : supplier.phone,
      email: email !== undefined ? email : supplier.email,
      address: address !== undefined ? address : supplier.address,
      paymentTerms: paymentTerms !== undefined ? paymentTerms : supplier.paymentTerms,
      notes: notes !== undefined ? notes : supplier.notes,
      rating: rating !== undefined ? rating : supplier.rating,
      isActive: isActive !== undefined ? isActive : supplier.isActive
    });
    
    res.status(200).json(supplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật nhà cung cấp' });
  }
};

// Delete supplier (soft delete)
exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    
    const supplier = await Supplier.findByPk(id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Không tìm thấy nhà cung cấp' });
    }
    
    // Check if supplier has associated purchase orders
    const purchaseOrderCount = await PurchaseOrder.count({
      where: { supplierId: id }
    });
    
    if (purchaseOrderCount > 0) {
      // If supplier has purchase orders, just mark as inactive
      await supplier.update({ isActive: false });
      return res.status(200).json({ 
        message: 'Nhà cung cấp đã được đánh dấu là không hoạt động',
        deactivated: true
      });
    }
    
    // If no purchase orders, can delete completely
    await supplier.destroy();
    
    res.status(200).json({ 
      message: 'Đã xóa nhà cung cấp thành công',
      deactivated: false
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ message: 'Lỗi khi xóa nhà cung cấp' });
  }
};

// Search suppliers
exports.searchSuppliers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Từ khóa tìm kiếm là bắt buộc' });
    }
    
    const suppliers = await Supplier.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { contactPerson: { [Op.like]: `%${query}%` } },
          { phone: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } },
          { address: { [Op.like]: `%${query}%` } }
        ]
      },
      order: [['name', 'ASC']]
    });
    
    res.status(200).json(suppliers);
  } catch (error) {
    console.error('Error searching suppliers:', error);
    res.status(500).json({ message: 'Lỗi khi tìm kiếm nhà cung cấp' });
  }
};

// Get purchase history for a supplier
exports.getPurchaseHistory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const supplier = await Supplier.findByPk(id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Không tìm thấy nhà cung cấp' });
    }
    
    const purchaseOrders = await PurchaseOrder.findAll({
      where: { supplierId: id },
      order: [['orderDate', 'DESC']]
    });
    
    res.status(200).json(purchaseOrders);
  } catch (error) {
    console.error('Error getting supplier purchase history:', error);
    res.status(500).json({ message: 'Lỗi khi lấy lịch sử mua hàng từ nhà cung cấp' });
  }
};

// Lấy báo cáo hiệu suất nhà cung cấp
exports.getSupplierPerformance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Sử dụng stored procedure để lấy báo cáo hiệu suất nhà cung cấp
    const dbProcedures = require('../scripts/database/execute_procedures');
    
    const supplierPerformance = await dbProcedures.getSupplierPerformance({
      startDate: startDate || null,
      endDate: endDate || null
    });
    
    res.status(200).json(supplierPerformance);
  } catch (error) {
    console.error('Error getting supplier performance:', error);
    res.status(500).json({ message: 'Error getting supplier performance', error: error.message });
  }
}; 