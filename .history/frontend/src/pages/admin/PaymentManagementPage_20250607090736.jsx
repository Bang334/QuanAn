import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Badge, Spinner, Pagination, Alert, Modal } from 'react-bootstrap';
import { FaEdit, FaSearch, FaFileDownload, FaMoneyBillWave } from 'react-icons/fa';
import paymentService from '../../services/paymentService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ExportToCsv } from 'export-to-csv';

const PaymentManagementPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    refundAmount: 0,
    notes: ''
  });

  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    paymentMethod: '',
    status: ''
  });

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await paymentService.getAllPayments(currentPage, 10, filters);
      setPayments(data.payments);
      setTotalPages(data.totalPages);
      setLoading(false);
    } catch (err) {
      setError('Failed to load payments. Please try again later.');
      setLoading(false);
      console.error('Error fetching payments:', err);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [currentPage, filters]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      paymentMethod: '',
      status: ''
    });
    setCurrentPage(1);
  };

  const handleEditClick = (payment) => {
    setSelectedPayment(payment);
    setFormData({
      status: payment.status,
      refundAmount: payment.refundAmount || 0,
      notes: payment.notes || ''
    });
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdatePayment = async () => {
    try {
      setLoading(true);
      await paymentService.updatePayment(selectedPayment.id, formData);
      setShowModal(false);
      fetchPayments();
    } catch (err) {
      setError('Failed to update payment. Please try again.');
      setLoading(false);
      console.error('Error updating payment:', err);
    }
  };

  const exportPaymentsToCSV = () => {
    const options = { 
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true, 
      filename: `payments-export-${new Date().toISOString().split('T')[0]}`,
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true
    };
    
    const csvExporter = new ExportToCsv(options);
    
    const exportData = payments.map(payment => ({
      ID: payment.id,
      OrderID: payment.orderId,
      Amount: payment.amount,
      PaymentMethod: payment.paymentMethod,
      PaymentDate: new Date(payment.paymentDate).toLocaleString(),
      Status: payment.status,
      TransactionID: payment.transactionId || 'N/A',
      RefundAmount: payment.refundAmount || 0,
      Notes: payment.notes || 'N/A'
    }));
    
    csvExporter.generateCsv(exportData);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge bg="success">Completed</Badge>;
      case 'refunded':
        return <Badge bg="warning">Refunded</Badge>;
      case 'failed':
        return <Badge bg="danger">Failed</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const getPaymentMethodBadge = (method) => {
    switch (method) {
      case 'cash':
        return <Badge bg="success">Cash</Badge>;
      case 'card':
        return <Badge bg="primary">Card</Badge>;
      case 'momo':
        return <Badge bg="danger">MoMo</Badge>;
      case 'zalopay':
        return <Badge bg="info">ZaloPay</Badge>;
      case 'vnpay':
        return <Badge bg="warning">VNPay</Badge>;
      default:
        return <Badge bg="secondary">{method}</Badge>;
    }
  };

  const renderPagination = () => {
    let items = [];
    for (let number = 1; number <= totalPages; number++) {
      items.push(
        <Pagination.Item 
          key={number} 
          active={number === currentPage}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>
      );
    }
    return (
      <Pagination className="justify-content-center mt-3">
        <Pagination.Prev 
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        />
        {items}
        <Pagination.Next 
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        />
      </Pagination>
    );
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-3">
            <FaMoneyBillWave className="me-2" />
            Payment Management
          </h2>
          <Card>
            <Card.Header>
              <Row>
                <Col md={8}>
                  <h5>Filter Payments</h5>
                </Col>
                <Col md={4} className="text-end">
                  <Button variant="success" onClick={exportPaymentsToCSV}>
                    <FaFileDownload className="me-2" />
                    Export to CSV
                  </Button>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body>
              <Form>
                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Start Date</Form.Label>
                      <Form.Control 
                        type="date"
                        name="startDate"
                        value={filters.startDate}
                        onChange={handleFilterChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>End Date</Form.Label>
                      <Form.Control 
                        type="date"
                        name="endDate"
                        value={filters.endDate}
                        onChange={handleFilterChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Payment Method</Form.Label>
                      <Form.Select 
                        name="paymentMethod"
                        value={filters.paymentMethod}
                        onChange={handleFilterChange}
                      >
                        <option value="">All Methods</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="momo">MoMo</option>
                        <option value="zalopay">ZaloPay</option>
                        <option value="vnpay">VNPay</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Select 
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                      >
                        <option value="">All Statuses</option>
                        <option value="completed">Completed</option>
                        <option value="refunded">Refunded</option>
                        <option value="failed">Failed</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col className="text-end">
                    <Button variant="secondary" onClick={handleResetFilters} className="me-2">
                      Reset Filters
                    </Button>
                    <Button variant="primary" onClick={() => fetchPayments()}>
                      <FaSearch className="me-2" />
                      Search
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5>Payment List</h5>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center my-5">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                </div>
              ) : payments.length === 0 ? (
                <Alert variant="info">
                  No payments found. Try adjusting your filters.
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Order ID</th>
                        <th>Amount</th>
                        <th>Payment Method</th>
                        <th>Payment Date</th>
                        <th>Status</th>
                        <th>Transaction ID</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(payment => (
                        <tr key={payment.id}>
                          <td>{payment.id}</td>
                          <td>{payment.orderId}</td>
                          <td>{formatCurrency(payment.amount)}</td>
                          <td>{getPaymentMethodBadge(payment.paymentMethod)}</td>
                          <td>{formatDate(payment.paymentDate)}</td>
                          <td>{getStatusBadge(payment.status)}</td>
                          <td>{payment.transactionId || 'N/A'}</td>
                          <td>
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => handleEditClick(payment)}
                            >
                              <FaEdit /> Edit
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
              
              {renderPagination()}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Edit Payment Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select 
                name="status"
                value={formData.status}
                onChange={handleFormChange}
              >
                <option value="completed">Completed</option>
                <option value="refunded">Refunded</option>
                <option value="failed">Failed</option>
              </Form.Select>
            </Form.Group>
            
            {formData.status === 'refunded' && (
              <Form.Group className="mb-3">
                <Form.Label>Refund Amount</Form.Label>
                <Form.Control 
                  type="number"
                  name="refundAmount"
                  value={formData.refundAmount}
                  onChange={handleFormChange}
                  min="0"
                  step="0.01"
                />
              </Form.Group>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control 
                as="textarea"
                rows={3}
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                placeholder="Enter any notes about this payment"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdatePayment} disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : 'Update Payment'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PaymentManagementPage;