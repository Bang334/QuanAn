import React, { useState } from 'react';
import { Form, Row, Col, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaCreditCard, FaMoneyBillWave, FaMobileAlt, FaCheckCircle } from 'react-icons/fa';
import paymentService from '../../services/paymentService';
import promotionService from '../../services/promotionService';
import { formatCurrency } from '../../utils/formatters';

const PaymentForm = ({ order, onPaymentComplete }) => {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [promotionCode, setPromotionCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [appliedPromotions, setAppliedPromotions] = useState(order.promotions || []);
  const [totalAfterDiscount, setTotalAfterDiscount] = useState(order.totalAmount);
  const [promotionError, setPromotionError] = useState(null);
  const [promotionSuccess, setPromotionSuccess] = useState(null);

  const handlePromotionApply = async () => {
    if (!promotionCode.trim()) {
      setPromotionError('Please enter a promotion code');
      return;
    }

    try {
      setPromotionLoading(true);
      setPromotionError(null);
      setPromotionSuccess(null);

      // API call to apply promotion
      const result = await promotionService.applyPromotionToOrder(order.id, promotionCode);
      
      setAppliedPromotions([...appliedPromotions, result.promotion]);
      setTotalAfterDiscount(result.newTotal);
      setPromotionSuccess(`Applied promotion: ${result.promotion.name}`);
      setPromotionCode('');
    } catch (err) {
      setPromotionError(err.message || 'Invalid promotion code or cannot be applied to this order');
      console.error('Error applying promotion:', err);
    } finally {
      setPromotionLoading(false);
    }
  };

  const handleRemovePromotion = async (promotionId) => {
    try {
      setLoading(true);
      setError(null);

      // API call to remove promotion
      await promotionService.removePromotionFromOrder(order.id, promotionId);
      
      // Update the applied promotions list
      const updatedPromotions = appliedPromotions.filter(promo => promo.id !== promotionId);
      setAppliedPromotions(updatedPromotions);
      
      // Get updated order total
      const updatedOrder = await fetchOrderDetails(order.id);
      setTotalAfterDiscount(updatedOrder.totalAmount);
      
      setPromotionSuccess('Promotion removed successfully');
    } catch (err) {
      setError('Failed to remove promotion');
      console.error('Error removing promotion:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    // This would be implemented in a real orderService
    // For now, mock the return
    return {
      ...order,
      totalAmount: order.totalAmount
    };
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Create payment data
      const paymentData = {
        orderId: order.id,
        amount: totalAfterDiscount,
        paymentMethod,
        // Other details would be added depending on payment method
      };

      // Process payment through service
      const result = await paymentService.createPayment(paymentData);
      
      setSuccess(true);
      
      // Notify parent component
      if (onPaymentComplete) {
        onPaymentComplete(result);
      }
      
      // Redirect to success page after 2 seconds
      setTimeout(() => {
        navigate(`/status/${order.id}`);
      }, 2000);
    } catch (err) {
      setError('Payment processing failed. Please try again.');
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodIcon = () => {
    switch (paymentMethod) {
      case 'cash':
        return <FaMoneyBillWave size={24} />;
      case 'card':
        return <FaCreditCard size={24} />;
      case 'momo':
      case 'zalopay':
      case 'vnpay':
        return <FaMobileAlt size={24} />;
      default:
        return <FaCreditCard size={24} />;
    }
  };

  // Render payment success message
  if (success) {
    return (
      <Card className="mb-4 shadow-sm">
        <Card.Body className="text-center py-5">
          <FaCheckCircle size={60} className="text-success mb-3" />
          <h3>Payment Successful!</h3>
          <p>Thank you for your order.</p>
          <p>You will be redirected to the order status page shortly...</p>
          <Spinner animation="border" variant="primary" />
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <Card className="mb-4 shadow-sm">
        <Card.Header>
          <h5>Order Summary</h5>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col sm={6}>
              <p className="mb-1">Order #: {order.id}</p>
              <p className="mb-1">Items: {order.items ? order.items.length : 0}</p>
              <p className="mb-1">Date: {new Date().toLocaleDateString()}</p>
            </Col>
            <Col sm={6} className="text-sm-end">
              <p className="mb-1">Subtotal: {formatCurrency(order.subtotal || order.totalAmount)}</p>
              {appliedPromotions && appliedPromotions.length > 0 && (
                <div className="mb-1">
                  <p className="mb-0">Discounts:</p>
                  {appliedPromotions.map(promo => (
                    <div key={promo.id} className="d-flex justify-content-between">
                      <small>{promo.name}</small>
                      <small className="text-danger">
                        -{formatCurrency(promo.discountAmount)}
                        <button 
                          onClick={() => handleRemovePromotion(promo.id)} 
                          className="btn btn-link btn-sm text-danger p-0 ms-2"
                        >
                          &times;
                        </button>
                      </small>
                    </div>
                  ))}
                </div>
              )}
              <p className="fw-bold mb-1">Total: {formatCurrency(totalAfterDiscount)}</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="mb-4 shadow-sm">
        <Card.Header>
          <h5>Apply Promotion</h5>
        </Card.Header>
        <Card.Body>
          {promotionError && <Alert variant="danger">{promotionError}</Alert>}
          {promotionSuccess && <Alert variant="success">{promotionSuccess}</Alert>}
          
          <Form.Group className="mb-3">
            <div className="input-group">
              <Form.Control
                type="text"
                placeholder="Enter promotion code"
                value={promotionCode}
                onChange={(e) => setPromotionCode(e.target.value)}
                disabled={promotionLoading}
              />
              <Button 
                variant="primary" 
                onClick={handlePromotionApply}
                disabled={promotionLoading}
              >
                {promotionLoading ? <Spinner animation="border" size="sm" /> : 'Apply'}
              </Button>
            </div>
          </Form.Group>
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Header>
          <h5>Payment Method</h5>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handlePaymentSubmit}>
            <Form.Group className="mb-4">
              <Row>
                <Col md={4}>
                  <Card 
                    className={`payment-method-card ${paymentMethod === 'cash' ? 'border-primary' : ''}`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <Card.Body className="text-center">
                      <Form.Check
                        type="radio"
                        name="paymentMethod"
                        id="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={() => setPaymentMethod('cash')}
                        label={
                          <>
                            <FaMoneyBillWave size={24} className="mb-2" />
                            <div>Cash</div>
                          </>
                        }
                        className="d-flex flex-column align-items-center"
                      />
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card 
                    className={`payment-method-card ${paymentMethod === 'card' ? 'border-primary' : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <Card.Body className="text-center">
                      <Form.Check
                        type="radio"
                        name="paymentMethod"
                        id="card"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        label={
                          <>
                            <FaCreditCard size={24} className="mb-2" />
                            <div>Credit Card</div>
                          </>
                        }
                        className="d-flex flex-column align-items-center"
                      />
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card 
                    className={`payment-method-card ${['momo', 'zalopay', 'vnpay'].includes(paymentMethod) ? 'border-primary' : ''}`}
                    onClick={() => setPaymentMethod('momo')}
                  >
                    <Card.Body className="text-center">
                      <Form.Check
                        type="radio"
                        name="paymentMethod"
                        id="momo"
                        checked={['momo', 'zalopay', 'vnpay'].includes(paymentMethod)}
                        onChange={() => setPaymentMethod('momo')}
                        label={
                          <>
                            <FaMobileAlt size={24} className="mb-2" />
                            <div>Mobile Wallet</div>
                          </>
                        }
                        className="d-flex flex-column align-items-center"
                      />
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Form.Group>

            {/* Conditional rendering based on payment method */}
            {paymentMethod === 'card' && (
              <div className="mb-4">
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Card Number</Form.Label>
                      <Form.Control type="text" placeholder="**** **** **** ****" required />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name on Card</Form.Label>
                      <Form.Control type="text" placeholder="Enter name" required />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Expiry Date</Form.Label>
                      <Form.Control type="text" placeholder="MM/YY" required />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>CVC</Form.Label>
                      <Form.Control type="text" placeholder="***" required />
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            )}

            {['momo', 'zalopay', 'vnpay'].includes(paymentMethod) && (
              <div className="mb-4">
                <Form.Group className="mb-3">
                  <Form.Label>Mobile Wallet</Form.Label>
                  <Form.Select 
                    value={paymentMethod} 
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="momo">MoMo</option>
                    <option value="zalopay">ZaloPay</option>
                    <option value="vnpay">VNPay</option>
                  </Form.Select>
                </Form.Group>
                <p className="text-muted">
                  You will be redirected to the {paymentMethod.toUpperCase()} app or website to complete your payment.
                </p>
              </div>
            )}

            <div className="d-grid gap-2">
              <Button 
                variant="primary" 
                size="lg" 
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <>
                    {getPaymentMethodIcon()} 
                    <span className="ms-2">Pay {formatCurrency(totalAfterDiscount)}</span>
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      <style jsx="true">{`
        .payment-method-card {
          cursor: pointer;
          transition: all 0.2s ease;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .payment-method-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .payment-method-card.border-primary {
          border-width: 2px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
      `}</style>
    </>
  );
};

export default PaymentForm;