import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  const [tableId, setTableId] = useState(() => {
    return localStorage.getItem('tableId') || '';
  });
  
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  const [orderHistory, setOrderHistory] = useState([]);
  
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);
  
  useEffect(() => {
    if (tableId) {
      localStorage.setItem('tableId', tableId);
    }
  }, [tableId]);
  
  const fetchOrderHistory = async () => {
    if (!tableId) return;
    
    try {
      // Trong thực tế, bạn sẽ gọi API để lấy lịch sử đơn hàng
      // const response = await axios.get(`${API_URL}/api/orders/table/${tableId}`);
      // setOrderHistory(response.data);
      
      // Mock dữ liệu
      const mockOrderHistory = [
        {
          id: '1',
          tableId: tableId,
          status: 'completed',
          items: [
            { id: 1, name: 'Phở bò', price: 50000, quantity: 2 },
            { id: 3, name: 'Coca Cola', price: 15000, quantity: 1 }
          ],
          total: 115000,
          createdAt: '2023-10-15T08:30:00Z',
          completedAt: '2023-10-15T09:15:00Z'
        },
        {
          id: '2',
          tableId: tableId,
          status: 'processing',
          items: [
            { id: 2, name: 'Bún chả', price: 45000, quantity: 1 },
            { id: 4, name: 'Nước chanh', price: 20000, quantity: 2 }
          ],
          total: 85000,
          createdAt: '2023-10-15T12:45:00Z'
        }
      ];
      
      setOrderHistory(mockOrderHistory);
    } catch (err) {
      console.error('Error fetching order history:', err);
    }
  };
  
  const addToCart = (item) => {
    setCartItems(prevItems => {
      // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
      const existingItemIndex = prevItems.findIndex(
        existingItem => existingItem.id === item.id
      );
      
      if (existingItemIndex !== -1) {
        // Nếu sản phẩm đã tồn tại, tăng số lượng
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += item.quantity;
        return updatedItems;
      } else {
        // Nếu sản phẩm chưa tồn tại, thêm mới
        return [...prevItems, item];
      }
    });
  };
  
  const updateItemQuantity = (itemId, quantity) => {
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  };
  
  const removeItem = (itemId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };
  
  const clearCart = () => {
    setCartItems([]);
  };
  
  const getItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };
  
  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  const submitOrder = async (orderNote = '') => {
    if (!tableId || cartItems.length === 0) return null;
    
    try {
      // Trong thực tế, bạn sẽ gửi đơn hàng lên server
      // const response = await axios.post(`${API_URL}/api/orders`, {
      //   tableId,
      //   items: cartItems,
      //   note: orderNote,
      //   total: getTotalPrice()
      // });
      
      // Mock response
      const orderId = Math.floor(Math.random() * 1000).toString();
      
      // Sau khi đặt hàng thành công, xóa giỏ hàng
      clearCart();
      
      return orderId;
    } catch (err) {
      console.error('Error submitting order:', err);
      throw err;
    }
  };
  
  // Hàm mới: Đặt món trực tiếp không thông qua giỏ hàng
  const orderDirectly = async (item, orderNote = '') => {
    if (!tableId) return null;
    
    try {
      // Gọi API để đặt món trực tiếp
      const response = await axios.post(`${API_URL}/api/orders/direct`, {
        tableId,
        item: {
          id: item.id,
          quantity: item.quantity
        },
        note: orderNote
      });
      
      // Lấy ID đơn hàng từ response
      const orderId = response.data.id;
      
      // Sau khi đặt hàng thành công, xóa giỏ hàng
      clearCart();
      
      return orderId;
    } catch (err) {
      console.error('Error ordering directly:', err);
      throw err;
    }
  };
  
  const value = {
    tableId,
    setTableId,
    cartItems,
    addToCart,
    updateItemQuantity,
    removeItem,
    clearCart,
    getItemCount,
    getTotalPrice,
    submitOrder,
    orderDirectly,
    orderHistory,
    fetchOrderHistory
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}; 