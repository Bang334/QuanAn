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
import CustomerOrderDetailPage from './pages/customer/OrderDetailPage';

// Admin Pages
import LoginPage from './pages/auth/LoginPage';
import AdminDashboardPage from './pages/admin/DashboardPage';
import AdminTablePage from './pages/admin/TableManagementPage';
import AdminUserPage from './pages/admin/UserManagementPage';
import AdminOrderPage from './pages/admin/OrderManagementPage';
import AdminReviewPage from './pages/admin/ReviewManagementPage';
import AdminPaymentPage from './pages/admin/PaymentManagementPage';
import AdminPromotionPage from './pages/admin/PromotionManagementPage';
import AdminRevenueAnalyticsPage from './pages/admin/RevenueAnalyticsPage';
import AdminSalaryPage from './pages/AdminSalaryPage';
import AdminInventoryPage from './pages/admin/InventoryManagementPage';
import AdminReportPage from './pages/admin/InventoryReportsPage';
import RecipeManagementPage from './pages/admin/RecipeManagementPage';
import AdminShoppingPage from './pages/admin/PurchaseOrdersPage';
import KitchenPermissionManagementPage from './pages/admin/KitchenPermissionManagementPage';
import MenuManagementPage from './pages/admin/MenuManagementPage';
import OrderDetailPage from './pages/admin/OrderDetailPage';
import IngredientPriceHistoryPage from './pages/admin/IngredientPriceHistoryPage';

// Kitchen Pages
import KitchenDashboardPage from './pages/kitchen/DashboardPage';
import KitchenInventoryPage from './pages/kitchen/InventoryPage.jsx';
import MySalaryPage from './pages/MySalaryPage';
import { IngredientHistoryPage } from './pages/kitchen/IngredientHistoryPage';
import PurchaseOrderDetailPage from './pages/kitchen/PurchaseOrderDetailPage';

// Waiter Pages
import WaiterDashboard from './pages/waiter/DashboardPage';
import TableService from './pages/waiter/TableServicePage';
import OrdersPage from './pages/waiter/OrdersPage';

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
    '0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)',
    '0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)',
    '0px 3px 3px -2px rgba(0,0,0,0.2), 0px 3px 4px 0px rgba(0,0,0,0.14), 0px 1px 8px 0px rgba(0,0,0,0.12)',
    '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)',
    '0px 3px 5px -1px rgba(0,0,0,0.2), 0px 5px 8px 0px rgba(0,0,0,0.14), 0px 1px 14px 0px rgba(0,0,0,0.12)',
    '0px 3px 5px -1px rgba(0,0,0,0.2), 0px 6px 10px 0px rgba(0,0,0,0.14), 0px 1px 18px 0px rgba(0,0,0,0.12)',
    '0px 4px 5px -2px rgba(0,0,0,0.2), 0px 7px 10px 1px rgba(0,0,0,0.14), 0px 2px 16px 1px rgba(0,0,0,0.12)',
    '0px 5px 5px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)',
    '0px 5px 6px -3px rgba(0,0,0,0.2), 0px 9px 12px 1px rgba(0,0,0,0.14), 0px 3px 16px 2px rgba(0,0,0,0.12)',
    '0px 6px 6px -3px rgba(0,0,0,0.2), 0px 10px 14px 1px rgba(0,0,0,0.14), 0px 4px 18px 3px rgba(0,0,0,0.12)',
    '0px 6px 7px -4px rgba(0,0,0,0.2), 0px 11px 15px 1px rgba(0,0,0,0.14), 0px 4px 20px 3px rgba(0,0,0,0.12)',
    '0px 7px 8px -4px rgba(0,0,0,0.2), 0px 12px 17px 2px rgba(0,0,0,0.14), 0px 5px 22px 4px rgba(0,0,0,0.12)',
    '0px 7px 8px -4px rgba(0,0,0,0.2), 0px 13px 19px 2px rgba(0,0,0,0.14), 0px 5px 24px 4px rgba(0,0,0,0.12)',
    '0px 7px 9px -4px rgba(0,0,0,0.2), 0px 14px 21px 2px rgba(0,0,0,0.14), 0px 5px 26px 4px rgba(0,0,0,0.12)',
    '0px 8px 9px -5px rgba(0,0,0,0.2), 0px 15px 22px 2px rgba(0,0,0,0.14), 0px 6px 28px 5px rgba(0,0,0,0.12)',
    '0px 8px 10px -5px rgba(0,0,0,0.2), 0px 16px 24px 2px rgba(0,0,0,0.14), 0px 6px 30px 5px rgba(0,0,0,0.12)',
    '0px 8px 11px -5px rgba(0,0,0,0.2), 0px 17px 26px 2px rgba(0,0,0,0.14), 0px 6px 32px 5px rgba(0,0,0,0.12)',
    '0px 9px 11px -5px rgba(0,0,0,0.2), 0px 18px 28px 2px rgba(0,0,0,0.14), 0px 7px 34px 6px rgba(0,0,0,0.12)',
    '0px 9px 12px -6px rgba(0,0,0,0.2), 0px 19px 29px 2px rgba(0,0,0,0.14), 0px 7px 36px 6px rgba(0,0,0,0.12)',
    '0px 10px 13px -6px rgba(0,0,0,0.2), 0px 20px 31px 3px rgba(0,0,0,0.14), 0px 8px 38px 7px rgba(0,0,0,0.12)',
    '0px 10px 13px -6px rgba(0,0,0,0.2), 0px 21px 33px 3px rgba(0,0,0,0.14), 0px 8px 40px 7px rgba(0,0,0,0.12)',
    '0px 10px 14px -6px rgba(0,0,0,0.2), 0px 22px 35px 3px rgba(0,0,0,0.14), 0px 8px 42px 7px rgba(0,0,0,0.12)',
    '0px 11px 14px -7px rgba(0,0,0,0.2), 0px 23px 36px 3px rgba(0,0,0,0.14), 0px 9px 44px 8px rgba(0,0,0,0.12)',
    '0px 11px 15px -7px rgba(0,0,0,0.2), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 9px 46px 8px rgba(0,0,0,0.12)'
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
                <Route path="order-detail/:id" element={<CustomerOrderDetailPage />} />
              </Route>

              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="menu" element={<MenuManagementPage />} />
                <Route path="tables" element={<AdminTablePage />} />
                <Route path="users" element={<AdminUserPage />} />
                <Route path="orders" element={<AdminOrderPage />} />
                <Route path="orders/:id" element={<OrderDetailPage />} />
                <Route path="reviews" element={<AdminReviewPage />} />
                <Route path="payments" element={<AdminPaymentPage />} />
                <Route path="promotions" element={<AdminPromotionPage />} />
                <Route path="analytics" element={<AdminRevenueAnalyticsPage />} />
                <Route path="salaries" element={<AdminSalaryPage />} />
                <Route path="inventory" element={<AdminInventoryPage />} />
                <Route path="inventory/:id/history" element={<IngredientHistoryPage />} />
                <Route path="inventory/ingredient/:id/price-history" element={<IngredientPriceHistoryPage />} />
                <Route path="reports" element={<AdminReportPage />} />
                <Route path="recipes" element={<RecipeManagementPage />} />
                <Route path="shopping" element={<AdminShoppingPage />} />
                <Route path="kitchen-permissions" element={<KitchenPermissionManagementPage />} />
              </Route>

              {/* Kitchen Routes */}
              <Route path="/kitchen" element={<KitchenLayout />}>
                <Route index element={<KitchenDashboardPage />} />
                <Route path="inventory" element={<KitchenInventoryPage />} />
                <Route path="inventory/:id/history" element={<IngredientHistoryPage />} />
                <Route path="purchase-orders/:id" element={<PurchaseOrderDetailPage />} />
                <Route path="salary" element={<MySalaryPage />} />
              </Route>

              {/* Waiter Routes */}
              <Route path="/waiter" element={<WaiterLayout />}>
                <Route index element={<WaiterDashboard />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="tables" element={<TableService />} />
                <Route path="salary" element={<MySalaryPage />} />
              </Route>
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

