import React from 'react';
import { Card, Button, ListGroup, Alert } from 'react-bootstrap';

const PaymentForm = ({ order, onPaymentComplete }) => {
  if (!order) return <Alert variant="warning">Không có thông tin đơn hàng.</Alert>;

  const handlePay = () => {
    // Giả lập thanh toán thành công
    if (onPaymentComplete) onPaymentComplete({ success: true, orderId: order.id });
  };

  return (
    <Card>
      <Card.Header>Thông tin đơn hàng #{order.id}</Card.Header>
      <ListGroup variant="flush">
        {order.items.map(item => (
          <ListGroup.Item key={item.id}>
            {item.name} x {item.quantity} - {item.total.toLocaleString('vi-VN')} đ
          </ListGroup.Item>
        ))}
        <ListGroup.Item><strong>Tạm tính:</strong> {order.subtotal.toLocaleString('vi-VN')} đ</ListGroup.Item>
        <ListGroup.Item><strong>Thuế:</strong> {order.tax.toLocaleString('vi-VN')} đ</ListGroup.Item>
        <ListGroup.Item><strong>Tổng cộng:</strong> {order.totalAmount.toLocaleString('vi-VN')} đ</ListGroup.Item>
      </ListGroup>
      <Card.Footer className="text-end">
        <Button variant="success" onClick={handlePay}>Thanh toán</Button>
      </Card.Footer>
    </Card>
  );
};

export default PaymentForm; 