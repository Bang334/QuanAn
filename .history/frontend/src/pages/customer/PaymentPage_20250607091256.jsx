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
    // In a real app, we would fetch order details from an API
    // For now, just simulate loading and create a mock order
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock order data
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
        setError('Failed to load order details. Please try again.');
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handlePaymentComplete = (result) => {
    console.log('Payment completed:', result);
    // In a real app, we might update the order status
    // or perform other actions after payment is complete
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          <h1 className="mb-4">Payment</h1>
          
          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-3">Loading order details...</p>
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