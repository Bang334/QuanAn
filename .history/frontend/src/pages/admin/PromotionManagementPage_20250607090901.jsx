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
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [activeTab, setActiveTab] = useState('active');

  // Filters
  const [filters, setFilters] = useState({
    isActive: '',
    search: ''
  });

  // Form data for creating/editing promotions
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
      const data = await promotionService.getAllPromotions(filters);
      setPromotions(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load promotions. Please try again later.');
      setLoading(false);
      console.error('Error fetching promotions:', err);
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
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default: 30 days from now
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
    if (window.confirm('Are you sure you want to delete this promotion?')) {
      try {
        setLoading(true);
        await promotionService.deletePromotion(id);
        fetchPromotions();
      } catch (err) {
        setError('Failed to delete promotion. It may be in use.');
        setLoading(false);
        console.error('Error deleting promotion:', err);
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
      
      // Validate form
      if (!formData.name || !formData.discountValue || !formData.startDate || !formData.endDate) {
        setError('Please fill in all required fields.');
        setLoading(false);
        return;
      }
      
      if (formData.discountType === 'percent' && (formData.discountValue <= 0 || formData.discountValue > 100)) {
        setError('Discount percentage must be between 1 and 100.');
        setLoading(false);
        return;
      }
      
      if (formData.discountType === 'fixed' && formData.discountValue <= 0) {
        setError('Fixed discount amount must be greater than 0.');
        setLoading(false);
        return;
      }
      
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        setError('End date must be after start date.');
        setLoading(false);
        return;
      }
      
      // Submit form
      if (modalMode === 'create') {
        await promotionService.createPromotion(formData);
      } else {
        await promotionService.updatePromotion(selectedPromotion.id, formData);
      }
      
      setShowModal(false);
      fetchPromotions();
    } catch (err) {
      setError(`Failed to ${modalMode === 'create' ? 'create' : 'update'} promotion.`);
      setLoading(false);
      console.error(`Error ${modalMode === 'create' ? 'creating' : 'updating'} promotion:`, err);
    }
  };

  const getStatusBadge = (isActive, startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (!isActive) {
      return <Badge bg="secondary">Inactive</Badge>;
    } else if (start > now) {
      return <Badge bg="info">Scheduled</Badge>;
    } else if (end < now) {
      return <Badge bg="danger">Expired</Badge>;
    } else {
      return <Badge bg="success">Active</Badge>;
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
            Promotion Management
          </h2>
          <Card>
            <Card.Header>
              <Row>
                <Col md={8}>
                  <Form.Group>
                    <div className="input-group">
                      <Form.Control
                        type="text"
                        placeholder="Search promotions by name or code..."
                        name="search"
                        value={filters.search}
                        onChange={handleFilterChange}
                      />
                      <Button variant="primary">
                        <FaSearch />
                      </Button>
                      <Button variant="secondary" onClick={handleResetFilters} className="ms-2">
                        Reset
                      </Button>
                    </div>
                  </Form.Group>
                </Col>
                <Col md={4} className="text-end">
                  <Button variant="success" onClick={handleCreateClick}>
                    <FaPlus className="me-2" />
                    Create New Promotion
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
                <Tab eventKey="all" title="All Promotions" />
                <Tab eventKey="active" title="Active" />
                <Tab eventKey="inactive" title="Inactive" />
              </Tabs>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center my-5">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                </div>
              ) : promotions.length === 0 ? (
                <Alert variant="info">
                  No promotions found. Try adjusting your filters or create a new promotion.
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Code</th>
                        <th>Discount</th>
                        <th>Period</th>
                        <th>Usage</th>
                        <th>Status</th>
                        <th>Actions</th>
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
                              <span className="text-muted">No code</span>
                            )}
                          </td>
                          <td>
                            {getDiscountDisplay(promotion.discountType, promotion.discountValue)}
                            {promotion.minimumOrderAmount > 0 && (
                              <div className="small text-muted">
                                Min: {formatCurrency(promotion.minimumOrderAmount)}
                              </div>
                            )}
                            {promotion.maximumDiscountAmount && (
                              <div className="small text-muted">
                                Max: {formatCurrency(promotion.maximumDiscountAmount)}
                              </div>
                            )}
                          </td>
                          <td>
                            <div>{formatDateOnly(promotion.startDate)}</div>
                            <div className="text-muted">to</div>
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
                              <FaEdit /> Edit
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleDeleteClick(promotion.id)}
                            >
                              <FaTrash /> Delete
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

      {/* Create/Edit Promotion Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'create' ? (
              <><FaGift className="me-2" /> Create New Promotion</>
            ) : (
              <><FaEdit className="me-2" /> Edit Promotion</>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Promotion Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Enter promotion name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Promotion Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="promotionCode"
                    value={formData.promotionCode}
                    onChange={handleFormChange}
                    placeholder="Optional: Enter promotion code"
                  />
                  <Form.Text className="text-muted">
                    Leave blank if no code is needed
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Optional: Enter promotion description"
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Discount Type *</Form.Label>
                  <Form.Select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (VND)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Discount Value *</Form.Label>
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
                    {formData.discountType === 'percent' ? 'Enter percentage (0-100)' : 'Enter amount in VND'}
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Maximum Discount Amount</Form.Label>
                  <Form.Control
                    type="number"
                    name="maximumDiscountAmount"
                    value={formData.maximumDiscountAmount || ''}
                    onChange={handleFormChange}
                    min="0"
                    step="1000"
                    placeholder="Optional"
                    disabled={formData.discountType === 'fixed'}
                  />
                  <Form.Text className="text-muted">
                    Max amount for percentage discounts
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date *</Form.Label>
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
                  <Form.Label>End Date *</Form.Label>
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
                  <Form.Label>Minimum Order Amount</Form.Label>
                  <Form.Control
                    type="number"
                    name="minimumOrderAmount"
                    value={formData.minimumOrderAmount}
                    onChange={handleFormChange}
                    min="0"
                    step="1000"
                  />
                  <Form.Text className="text-muted">
                    Minimum order value to apply this promotion
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Usage Limit</Form.Label>
                  <Form.Control
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit || ''}
                    onChange={handleFormChange}
                    min="0"
                    step="1"
                    placeholder="Optional"
                  />
                  <Form.Text className="text-muted">
                    Maximum number of times this promotion can be used
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Applicable Categories</Form.Label>
              <Form.Control
                type="text"
                name="applicableCategories"
                value={formData.applicableCategories}
                onChange={handleFormChange}
                placeholder="Optional: Enter comma-separated categories"
              />
              <Form.Text className="text-muted">
                Leave blank to apply to all categories
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Active"
                name="isActive"
                checked={formData.isActive}
                onChange={handleFormChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : (
              modalMode === 'create' ? 'Create Promotion' : 'Update Promotion'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PromotionManagementPage; 