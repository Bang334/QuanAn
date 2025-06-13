import React, { useState } from 'react';
import { Form, Row, Col, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaCreditCard, FaMoneyBillWave, FaCheckCircle } from 'react-icons/fa';
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
      setPromotionError('Vui lòng nhập mã khuyến mãi');
      return;
    }

    try {
      setPromotionLoading(true);
      setPromotionError(null);
      setPromotionSuccess(null);

      // Gọi API để áp dụng khuyến mãi
      const result = await promotionService.applyPromotionToOrder(order.id, promotionCode);
      
      setAppliedPromotions([...appliedPromotions, result.promotion]);
      setTotalAfterDiscount(result.newTotal);
      setPromotionSuccess(`Đã áp dụng khuyến mãi: ${result.promotion.name}`);
      setPromotionCode('');
    } catch (err) {
      setPromotionError(err.message || 'Mã khuyến mãi không hợp lệ hoặc không thể áp dụng cho đơn hàng này');
      console.error('Lỗi khi áp dụng khuyến mãi:', err);
    } finally {
      setPromotionLoading(false);
    }
  };

  const handleRemovePromotion = async (promotionId) => {
    try {
      setLoading(true);
      setError(null);

      // Gọi API để xóa khuyến mãi
      await promotionService.removePromotionFromOrder(order.id, promotionId);
      
      // Cập nhật danh sách khuyến mãi đã áp dụng
      const updatedPromotions = appliedPromotions.filter(promo => promo.id !== promotionId);
      setAppliedPromotions(updatedPromotions);
      
      // Lấy tổng tiền đơn hàng đã cập nhật
      const updatedOrder = await fetchOrderDetails(order.id);
      setTotalAfterDiscount(updatedOrder.totalAmount);
      
      setPromotionSuccess('Đã xóa khuyến mãi thành công');
    } catch (err) {
      setError('Không thể xóa khuyến mãi');
      console.error('Lỗi khi xóa khuyến mãi:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    // Trong thực tế sẽ được triển khai trong orderService
    // Hiện tại, chỉ giả lập kết quả trả về
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
      // Tạo dữ liệu thanh toán
      const paymentData = {
        orderId: order.id,
        amount: totalAfterDiscount,
        paymentMethod,
        // Các thông tin khác sẽ được thêm vào tùy thuộc vào phương thức thanh toán
      };

      // Xử lý thanh toán thông qua service
      const result = await paymentService.createPayment(paymentData);
      
      setSuccess(true);
      
      // Thông báo cho component cha
      if (onPaymentComplete) {
        onPaymentComplete(result);
      }
      
      // Chuyển hướng đến trang thành công sau 2 giây
      setTimeout(() => {
        navigate(`/status/${order.id}`);
      }, 2000);
    } catch (err) {
      console.error('Lỗi thanh toán:', err);
      setError(err.message || 'Xử lý thanh toán thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodIcon = () => {
    switch (paymentMethod) {
      case 'cash':
        return <FaMoneyBillWave size={24} />;
      case 'bank':
        return <FaCreditCard size={24} />;
      default:
        return <FaMoneyBillWave size={24} />;
    }
  };

  // Hiển thị thông báo thanh toán thành công
  if (success) {
    return (
      <Card className="mb-4 shadow-sm">
        <Card.Body className="text-center py-5">
          <FaCheckCircle size={60} className="text-success mb-3" />
          <h3>Thanh Toán Thành Công!</h3>
          <p>Cảm ơn bạn đã đặt món.</p>
          <p>Bạn sẽ được chuyển đến trang theo dõi đơn hàng trong giây lát...</p>
          <Spinner animation="border" variant="primary" />
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <Card className="mb-4 shadow-sm">
        <Card.Header>
          <h5>Tóm Tắt Đơn Hàng</h5>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col sm={6}>
              <p className="mb-1">Mã đơn: {order.id}</p>
              <p className="mb-1">Số món: {order.items ? order.items.length : 0}</p>
              <p className="mb-1">Ngày: {new Date().toLocaleDateString()}</p>
            </Col>
            <Col sm={6} className="text-sm-end">
              <p className="mb-1">Tạm tính: {formatCurrency(order.subtotal || order.totalAmount)}</p>
              {appliedPromotions && appliedPromotions.length > 0 && (
                <div className="mb-1">
                  <p className="mb-0">Giảm giá:</p>
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
              <p className="fw-bold mb-1">Tổng cộng: {formatCurrency(totalAfterDiscount)}</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="mb-4 shadow-sm">
        <Card.Header>
          <h5>Áp Dụng Khuyến Mãi</h5>
        </Card.Header>
        <Card.Body>
          {promotionError && <Alert variant="danger">{promotionError}</Alert>}
          {promotionSuccess && <Alert variant="success">{promotionSuccess}</Alert>}
          
          <Form.Group className="mb-3">
            <div className="input-group">
              <Form.Control
                type="text"
                placeholder="Nhập mã khuyến mãi"
                value={promotionCode}
                onChange={(e) => setPromotionCode(e.target.value)}
                disabled={promotionLoading}
              />
              <Button 
                variant="primary" 
                onClick={handlePromotionApply}
                disabled={promotionLoading}
              >
                {promotionLoading ? <Spinner animation="border" size="sm" /> : 'Áp dụng'}
              </Button>
            </div>
          </Form.Group>
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Header>
          <h5>Phương Thức Thanh Toán</h5>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handlePaymentSubmit}>
            <Form.Group className="mb-4">
              <Row>
                <Col md={6}>
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
                            <div>Tiền mặt</div>
                          </>
                        }
                        className="d-flex flex-column align-items-center"
                      />
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card 
                    className={`payment-method-card ${paymentMethod === 'bank' ? 'border-primary' : ''}`}
                    onClick={() => setPaymentMethod('bank')}
                  >
                    <Card.Body className="text-center">
                      <Form.Check
                        type="radio"
                        name="paymentMethod"
                        id="bank"
                        checked={paymentMethod === 'bank'}
                        onChange={() => setPaymentMethod('bank')}
                        label={
                          <>
                            <FaCreditCard size={24} className="mb-2" />
                            <div>Chuyển khoản</div>
                          </>
                        }
                        className="d-flex flex-column align-items-center"
                      />
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Form.Group>

            {paymentMethod === 'bank' && (
              <div className="mb-4">
                <p className="text-muted">
                  Thông tin chuyển khoản:
                </p>
                <ul className="text-muted">
                  <li>Ngân hàng: VietComBank</li>
                  <li>Số tài khoản: 1234567890</li>
                  <li>Chủ tài khoản: CÔNG TY TNHH NHÀ HÀNG XYZ</li>
                  <li>Nội dung: Thanh toán đơn hàng {order.id}</li>
                </ul>
                <p className="text-muted">
                  Vui lòng chuyển khoản và chụp màn hình giao dịch để xác nhận thanh toán.
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
                    <span className="ms-2">Thanh toán {formatCurrency(totalAfterDiscount)}</span>
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