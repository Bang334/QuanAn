import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Badge, Spinner, Alert, Modal, Tabs, Tab } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaTag, FaGift } from 'react-icons/fa';
import promotionService from '../../services/promotionService';
import { formatCurrency, formatDate, formatDateOnly, toPercentage } from '../../utils/formatters';

const PromotionManagementPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [modalMode, setModalMode] = useState('create'); // 'create' hoặc 'edit'
  const [activeTab, setActiveTab] = useState('active');

  // Bộ lọc
  const [filters, setFilters] = useState({
    isActive: '',
    search: ''
  });

  // Dữ liệu form cho việc tạo/chỉnh sửa khuyến mãi
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountType: 'percent',
    discountValue: 0,
    startDate: '',
    endDate: '',
    isActive: true,
    minimumOrderAmount: 0,
    maximumDiscountAmount: null,
    applicableCategories: '',
    usageLimit: null,
    promotionCode: ''
  });

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is logged in
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (!token) {
        setError('Bạn chưa đăng nhập. Vui lòng đăng nhập để xem khuyến mãi.');
        setLoading(false);
        return;
      }
      
      const data = await promotionService.getAllPromotions(filters);
      setPromotions(data);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách khuyến mãi. Vui lòng thử lại sau.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      isActive: '',
      search: ''
    });
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    if (key === 'active') {
      setFilters(prev => ({ ...prev, isActive: 'true' }));
    } else if (key === 'inactive') {
      setFilters(prev => ({ ...prev, isActive: 'false' }));
    } else {
      setFilters(prev => ({ ...prev, isActive: '' }));
    }
  };

  const handleCreateClick = () => {
    // Reset form data
    setFormData({
      name: '',
      description: '',
      discountType: 'percent',
      discountValue: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Mặc định: 30 ngày từ bây giờ
      isActive: true,
      minimumOrderAmount: 0,
      maximumDiscountAmount: null,
      applicableCategories: '',
      usageLimit: null,
      promotionCode: ''
    });
    setModalMode('create');
    setShowModal(true);
  };

  const handleEditClick = (promotion) => {
    setSelectedPromotion(promotion);
    // Format dates for the form
    const startDate = new Date(promotion.startDate).toISOString().split('T')[0];
    const endDate = new Date(promotion.endDate).toISOString().split('T')[0];
    
    setFormData({
      name: promotion.name,
      description: promotion.description || '',
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      startDate,
      endDate,
      isActive: promotion.isActive,
      minimumOrderAmount: promotion.minimumOrderAmount || 0,
      maximumDiscountAmount: promotion.maximumDiscountAmount || null,
      applicableCategories: promotion.applicableCategories || '',
      usageLimit: promotion.usageLimit || null,
      promotionCode: promotion.promotionCode || ''
    });
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) {
      try {
        setLoading(true);
        await promotionService.deletePromotion(id);
        fetchPromotions();
      } catch (err) {
        setError('Không thể xóa khuyến mãi. Có thể nó đang được sử dụng.');
        setLoading(false);
      }
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Kiểm tra form
      if (!formData.name || !formData.discountValue || !formData.startDate || !formData.endDate) {
        setError('Vui lòng điền đầy đủ các trường bắt buộc.');
        setLoading(false);
        return;
      }
      
      if (formData.discountType === 'percent' && (formData.discountValue <= 0 || formData.discountValue > 100)) {
        setError('Phần trăm giảm giá phải nằm trong khoảng 1-100.');
        setLoading(false);
        return;
      }
      
      if (formData.discountType === 'fixed' && formData.discountValue <= 0) {
        setError('Giá trị giảm giá phải lớn hơn 0.');
        setLoading(false);
        return;
      }
      
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        setError('Ngày kết thúc phải sau ngày bắt đầu.');
        setLoading(false);
        return;
      }
      
      // Gửi form
      if (modalMode === 'create') {
        await promotionService.createPromotion(formData);
      } else {
        await promotionService.updatePromotion(selectedPromotion.id, formData);
      }
      
      setShowModal(false);
      fetchPromotions();
    } catch (err) {
      setError(`Không thể ${modalMode === 'create' ? 'tạo' : 'cập nhật'} khuyến mãi.`);
      setLoading(false);
    }
  };

  const getStatusBadge = (isActive, startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (!isActive) {
      return <Badge bg="secondary">Không hoạt động</Badge>;
    } else if (start > now) {
      return <Badge bg="info">Sắp diễn ra</Badge>;
    } else if (end < now) {
      return <Badge bg="danger">Hết hạn</Badge>;
    } else {
      return <Badge bg="success">Đang hoạt động</Badge>;
    }
  };

  const getDiscountDisplay = (type, value) => {
    return type === 'percent' ? toPercentage(value / 100) : formatCurrency(value);
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-3">
            <FaTag className="me-2" />
            Quản Lý Khuyến Mãi
          </h2>
          <Card>
            <Card.Header>
              <Row>
                <Col md={8}>
                  <Form.Group>
                    <div className="input-group">
                      <Form.Control
                        type="text"
                        placeholder="Tìm kiếm khuyến mãi theo tên hoặc mã..."
                        name="search"
                        value={filters.search}
                        onChange={handleFilterChange}
                      />
                      <Button variant="primary">
                        <FaSearch />
                      </Button>
                      <Button variant="secondary" onClick={handleResetFilters} className="ms-2">
                        Đặt lại
                      </Button>
                    </div>
                  </Form.Group>
                </Col>
                <Col md={4} className="text-end">
                  <Button variant="success" onClick={handleCreateClick}>
                    <FaPlus className="me-2" />
                    Tạo Khuyến Mãi Mới
                  </Button>
                </Col>
              </Row>
            </Card.Header>
          </Card>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        <Col>
          <Card>
            <Card.Header>
              <Tabs
                activeKey={activeTab}
                onSelect={handleTabChange}
                className="mb-3"
              >
                <Tab eventKey="all" title="Tất Cả" />
                <Tab eventKey="active" title="Đang Hoạt Động" />
                <Tab eventKey="inactive" title="Không Hoạt Động" />
              </Tabs>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center my-5">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                  </Spinner>
                </div>
              ) : promotions.length === 0 ? (
                <Alert variant="info">
                  Không tìm thấy khuyến mãi. Hãy điều chỉnh bộ lọc hoặc tạo khuyến mãi mới.
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Tên</th>
                        <th>Mã</th>
                        <th>Giảm giá</th>
                        <th>Thời gian</th>
                        <th>Sử dụng</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {promotions.map(promotion => (
                        <tr key={promotion.id}>
                          <td>{promotion.id}</td>
                          <td>
                            <strong>{promotion.name}</strong>
                            {promotion.description && (
                              <div className="small text-muted">{promotion.description}</div>
                            )}
                          </td>
                          <td>
                            {promotion.promotionCode ? (
                              <Badge bg="info">{promotion.promotionCode}</Badge>
                            ) : (
                              <span className="text-muted">Không có mã</span>
                            )}
                          </td>
                          <td>
                            {getDiscountDisplay(promotion.discountType, promotion.discountValue)}
                            {promotion.minimumOrderAmount > 0 && (
                              <div className="small text-muted">
                                Tối thiểu: {formatCurrency(promotion.minimumOrderAmount)}
                              </div>
                            )}
                            {promotion.maximumDiscountAmount && (
                              <div className="small text-muted">
                                Tối đa: {formatCurrency(promotion.maximumDiscountAmount)}
                              </div>
                            )}
                          </td>
                          <td>
                            <div>{formatDateOnly(promotion.startDate)}</div>
                            <div className="text-muted">đến</div>
                            <div>{formatDateOnly(promotion.endDate)}</div>
                          </td>
                          <td>
                            {promotion.usageCount} / {promotion.usageLimit || '∞'}
                          </td>
                          <td>
                            {getStatusBadge(promotion.isActive, promotion.startDate, promotion.endDate)}
                          </td>
                          <td>
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              className="me-2"
                              onClick={() => handleEditClick(promotion)}
                            >
                              <FaEdit /> Sửa
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleDeleteClick(promotion.id)}
                            >
                              <FaTrash /> Xóa
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal Tạo/Sửa Khuyến Mãi */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" style={{ zIndex: 10000 }}>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'create' ? (
              <><FaGift className="me-2" /> Tạo Khuyến Mãi Mới</>
            ) : (
              <><FaEdit className="me-2" /> Sửa Khuyến Mãi</>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tên khuyến mãi *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Nhập tên khuyến mãi"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mã khuyến mãi</Form.Label>
                  <Form.Control
                    type="text"
                    name="promotionCode"
                    value={formData.promotionCode}
                    onChange={handleFormChange}
                    placeholder="Tùy chọn: Nhập mã khuyến mãi"
                  />
                  <Form.Text className="text-muted">
                    Để trống nếu không cần mã
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Mô tả</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Tùy chọn: Nhập mô tả khuyến mãi"
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Loại giảm giá *</Form.Label>
                  <Form.Select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="percent">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (VNĐ)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Giá trị giảm giá *</Form.Label>
                  <Form.Control
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleFormChange}
                    required
                    min="0"
                    step={formData.discountType === 'percent' ? "1" : "1000"}
                  />
                  <Form.Text className="text-muted">
                    {formData.discountType === 'percent' ? 'Nhập phần trăm (0-100)' : 'Nhập số tiền (VNĐ)'}
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Giảm giá tối đa</Form.Label>
                  <Form.Control
                    type="number"
                    name="maximumDiscountAmount"
                    value={formData.maximumDiscountAmount || ''}
                    onChange={handleFormChange}
                    min="0"
                    step="1000"
                    placeholder="Tùy chọn"
                    disabled={formData.discountType === 'fixed'}
                  />
                  <Form.Text className="text-muted">
                    Giới hạn số tiền tối đa cho giảm giá phần trăm
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ngày bắt đầu *</Form.Label>
                  <Form.Control
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleFormChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ngày kết thúc *</Form.Label>
                  <Form.Control
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleFormChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Giá trị đơn hàng tối thiểu</Form.Label>
                  <Form.Control
                    type="number"
                    name="minimumOrderAmount"
                    value={formData.minimumOrderAmount}
                    onChange={handleFormChange}
                    min="0"
                    step="1000"
                  />
                  <Form.Text className="text-muted">
                    Giá trị đơn hàng tối thiểu để áp dụng khuyến mãi
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Giới hạn sử dụng</Form.Label>
                  <Form.Control
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit || ''}
                    onChange={handleFormChange}
                    min="0"
                    step="1"
                    placeholder="Tùy chọn"
                  />
                  <Form.Text className="text-muted">
                    Số lần tối đa khuyến mãi có thể được sử dụng
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Danh mục áp dụng</Form.Label>
              <Form.Control
                type="text"
                name="applicableCategories"
                value={formData.applicableCategories}
                onChange={handleFormChange}
                placeholder="Tùy chọn: Nhập danh mục cách nhau bởi dấu phẩy"
              />
              <Form.Text className="text-muted">
                Để trống để áp dụng cho tất cả danh mục
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Kích hoạt"
                name="isActive"
                checked={formData.isActive}
                onChange={handleFormChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : (
              modalMode === 'create' ? 'Tạo Khuyến Mãi' : 'Cập Nhật Khuyến Mãi'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PromotionManagementPage;