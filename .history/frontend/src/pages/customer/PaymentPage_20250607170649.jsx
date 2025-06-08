import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import PaymentForm from '../../components/customer/PaymentForm';

const PaymentPage = () => {
  const { orderId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    // Trong ứng dụng thực tế, chúng ta sẽ lấy thông tin đơn hàng từ API
    // Hiện tại, chỉ giả lập quá trình tải và tạo một đơn hàng mẫu
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Giả lập độ trễ của API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Dữ liệu đơn hàng mẫu
        const mockOrder = {
          id: orderId,
          items: [
            { id: 1, name: 'Phở Bò', quantity: 2, price: 75000, total: 150000 },
            { id: 2, name: 'Nem Cuốn', quantity: 1, price: 45000, total: 45000 },
            { id: 3, name: 'Coca Cola', quantity: 2, price: 15000, total: 30000 }
          ],
          subtotal: 225000,
          tax: 22500,
          totalAmount: 247500,
          customer: {
            name: 'Khách hàng',
            phone: '0123456789'
          },
          tableNumber: 5,
          orderDate: new Date().toISOString(),
          status: 'pending',
          promotions: []
        };
        
        setOrder(mockOrder);
      } catch (err) {
        setError('Không thể tải thông tin đơn hàng. Vui lòng thử lại.');
        console.error('Lỗi khi tải đơn hàng:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handlePaymentComplete = (result) => {
    console.log('Thanh toán hoàn tất:', result);
    // Trong ứng dụng thực tế, chúng ta có thể cập nhật trạng thái đơn hàng
    // hoặc thực hiện các hành động khác sau khi thanh toán hoàn tất
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          <h1 className="mb-4">Thanh Toán</h1>
          
          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </Spinner>
              <p className="mt-3">Đang tải thông tin đơn hàng...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : (
            <PaymentForm 
              order={order} 
              onPaymentComplete={handlePaymentComplete} 
            />
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default PaymentPage; 