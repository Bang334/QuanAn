import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Layouts
import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';
import KitchenLayout from './layouts/KitchenLayout';
import WaiterLayout from './layouts/WaiterLayout';

// Customer Pages
import HomePage from './pages/customer/HomePage';
import MenuPage from './pages/customer/MenuPage';
import OrderPage from './pages/customer/OrderPage';
import CartPage from './pages/customer/CartPage';
import OrderStatusPage from './pages/customer/OrderStatusPage';
import PaymentPage from './pages/customer/PaymentPage';
import FoodDetailPage from './pages/customer/FoodDetailPage';

// Admin Pages
import LoginPage from './pages/auth/LoginPage';
import AdminDashboard from './pages/admin/DashboardPage';
import MenuManagement from './pages/admin/MenuManagementPage';
import TableManagement from './pages/admin/TableManagementPage';
import UserManagement from './pages/admin/UserManagementPage';
import OrderManagement from './pages/admin/OrderManagementPage';
import PaymentManagement from './pages/admin/PaymentManagementPage';
import PromotionManagement from './pages/admin/PromotionManagementPage';
import RevenueAnalytics from './pages/admin/RevenueAnalyticsPage';

// Kitchen Pages
import KitchenDashboard from './pages/kitchen/DashboardPage';

// Waiter Pages
import WaiterDashboard from './pages/waiter/DashboardPage';
import TableService from './pages/waiter/TableServicePage';

// Context
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#8E3200',
      light: '#A64B2A',
      dark: '#662500',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#D7A86E',
      light: '#E6C69F',
      dark: '#BF8D4A',
      contrastText: '#000000',
    },
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2D2D2D',
      secondary: '#616161',
    },
    error: {
      main: '#CF000F',
    },
    success: {
      main: '#009944',
    },
    warning: {
      main: '#F5A623',
    },
  },
  typography: {
    fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.75rem',
      lineHeight: 1.3,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0, 0, 0, 0.05)',
    '0px 4px 8px rgba(0, 0, 0, 0.08)',
    '0px 6px 12px rgba(0, 0, 0, 0.1)',
    '0px 8px 16px rgba(0, 0, 0, 0.12)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.15)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(45deg, #8E3200, #A64B2A)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          overflow: 'hidden',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <CartProvider>
          <Router>
            <Routes>
              {/* Customer Routes */}
              <Route path="/" element={<CustomerLayout />}>
                <Route index element={<HomePage />} />
                <Route path="menu" element={<MenuPage />} />
                <Route path="food/:foodId" element={<FoodDetailPage />} />
                <Route path="order" element={<OrderPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="status/:orderId" element={<OrderStatusPage />} />
                <Route path="payment/:orderId" element={<PaymentPage />} />
              </Route>

              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="menu" element={<MenuManagement />} />
                <Route path="tables" element={<TableManagement />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="orders" element={<OrderManagement />} />
                <Route path="payments" element={<PaymentManagement />} />
                <Route path="promotions" element={<PromotionManagement />} />
                <Route path="analytics" element={<RevenueAnalytics />} />
              </Route>

              {/* Kitchen Routes */}
              <Route path="/kitchen" element={<KitchenLayout />}>
                <Route index element={<KitchenDashboard />} />
              </Route>

              {/* Waiter Routes */}
              <Route path="/waiter" element={<WaiterLayout />}>
                <Route index element={<WaiterDashboard />} />
                <Route path="tables" element={<TableService />} />
              </Route>
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

