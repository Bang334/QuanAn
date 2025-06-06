import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Receipt as ReceiptIcon,
  LocalDining as LocalDiningIcon,
} from '@mui/icons-material';
import axios from 'axios';

const TableServicePage = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Giả lập dữ liệu bàn - trong thực tế sẽ lấy từ API
    const mockTables = [
      {
        id: 1,
        name: 'Bàn 1',
        capacity: 4,
        status: 'occupied',
        order: {
          id: 101,
          status: 'served',
          items: [
            { name: 'Phở bò', quantity: 2, status: 'served' },
            { name: 'Nước chanh', quantity: 2, status: 'served' },
          ]
        }
      },
      {
        id: 2,
        name: 'Bàn 2',
        capacity: 4,
        status: 'available',
        order: null
      },
      {
        id: 3,
        name: 'Bàn 3',
        capacity: 6,
        status: 'occupied',
        order: {
          id: 102,
          status: 'ready',
          items: [
            { name: 'Bún chả', quantity: 1, status: 'ready' },
            { name: 'Chả giò', quantity: 1, status: 'ready' },
            { name: 'Trà đá', quantity: 2, status: 'ready' },
          ]
        }
      },
      {
        id: 4,
        name: 'Bàn 4',
        capacity: 4,
        status: 'reserved',
        order: null
      },
      {
        id: 5,
        name: 'Bàn 5',
        capacity: 6,
        status: 'occupied',
        order: {
          id: 103,
          status: 'payment_requested',
          items: [
            { name: 'Cơm tấm', quantity: 3, status: 'served' },
            { name: 'Bia Hà Nội', quantity: 3, status: 'served' },
          ]
        }
      },
      {
        id: 6,
        name: 'Bàn 6',
        capacity: 4,
        status: 'available',
        order: null
      },
      {
        id: 7,
        name: 'Bàn 7',
        capacity: 4,
        status: 'occupied',
        order: {
          id: 104,
          status: 'processing',
          items: [
            { name: 'Bún bò Huế', quantity: 2, status: 'processing' },
            { name: 'Gỏi cuốn', quantity: 1, status: 'ready' },
          ]
        }
      },
      {
        id: 8,
        name: 'Bàn 8',
        capacity: 6,
        status: 'available',
        order: null
      },
    ];

    setTables(mockTables);
    setLoading(false);
  }, []);

  const handleServeTable = (tableId) => {
    // Trong thực tế sẽ gọi API để cập nhật trạng thái
    setTables(prevTables => 
      prevTables.map(table => 
        table.id === tableId && table.order
          ? { 
              ...table, 
              order: { 
                ...table.order, 
                status: 'served',
                items: table.order.items.map(item => ({
                  ...item,
                  status: 'served'
                }))
              } 
            } 
          : table
      )
    );
  };

  const handleConfirmPayment = (tableId) => {
    // Trong thực tế sẽ gọi API để cập nhật trạng thái
    setTables(prevTables => 
      prevTables.map(table => 
        table.id === tableId
          ? { 
              ...table, 
              status: 'available',
              order: null
            } 
          : table
      )
    );
  };

  const getTableStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'occupied': return 'error';
      case 'reserved': return 'warning';
      default: return 'default';
    }
  };

  const getTableStatusLabel = (status) => {
    switch (status) {
      case 'available': return 'Trống';
      case 'occupied': return 'Có khách';
      case 'reserved': return 'Đã đặt trước';
      default: return status;
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'processing': return 'warning';
      case 'ready': return 'info';
      case 'served': return 'success';
      case 'payment_requested': return 'error';
      default: return 'default';
    }
  };

  const getOrderStatusLabel = (status) => {
    switch (status) {
      case 'processing': return 'Đang chế biến';
      case 'ready': return 'Sẵn sàng phục vụ';
      case 'served': return 'Đã phục vụ';
      case 'payment_requested': return 'Yêu cầu thanh toán';
      default: return status;
    }
  };

  if (loading) {
    return <Typography>Đang tải...</Typography>;
  }

  if (error) {
    return <Typography color="error">Lỗi: {error}</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Phục vụ bàn
      </Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Bàn</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Sức chứa</TableCell>
              <TableCell>Đơn hàng</TableCell>
              <TableCell>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tables.map((table) => (
              <TableRow key={table.id}>
                <TableCell>{table.name}</TableCell>
                <TableCell>
                  <Chip 
                    size="small"
                    label={getTableStatusLabel(table.status)} 
                    color={getTableStatusColor(table.status)} 
                  />
                </TableCell>
                <TableCell>{table.capacity} người</TableCell>
                <TableCell>
                  {table.order ? (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip 
                        size="small"
                        label={getOrderStatusLabel(table.order.status)} 
                        color={getOrderStatusColor(table.order.status)} 
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="body2">
                        {table.order.items.length} món
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Không có đơn hàng
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {table.order && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {table.order.status === 'ready' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<LocalDiningIcon />}
                          onClick={() => handleServeTable(table.id)}
                        >
                          Phục vụ
                        </Button>
                      )}
                      
                      {table.order.status === 'payment_requested' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<ReceiptIcon />}
                          onClick={() => handleConfirmPayment(table.id)}
                        >
                          Xác nhận thanh toán
                        </Button>
                      )}
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TableServicePage; 