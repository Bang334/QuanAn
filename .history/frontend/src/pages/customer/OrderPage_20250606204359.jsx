import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { Snackbar, InputAdornment, TextField, MenuItem } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Typography } from '@mui/material';

const [search, setSearch] = useState('');
const [filterStatus, setFilterStatus] = useState('all');
const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

// Lọc đơn hàng theo trạng thái và tìm kiếm
const filteredOrders = orders.filter(order => {
  const matchStatus = filterStatus === 'all' || order.status === filterStatus;
  const matchSearch = search.trim() === '' ||
    order.id.toString().includes(search.trim()) ||
    (order.OrderItems && order.OrderItems.some(item =>
      item.MenuItem?.name?.toLowerCase().includes(search.trim().toLowerCase())
    ));
  return matchStatus && matchSearch;
});

// Tổng tiền đã chi tiêu
const totalSpent = orders
  .filter(order => order.status === 'completed')
  .reduce((sum, order) =>
    sum + (order.OrderItems?.reduce((t, i) => t + i.price * i.quantity, 0) || 0), 0
  );

<Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
  <TextField
    size="small"
    placeholder="Tìm kiếm mã đơn hoặc tên món..."
    value={search}
    onChange={e => setSearch(e.target.value)}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon />
        </InputAdornment>
      ),
    }}
    sx={{ flex: 1, minWidth: 180 }}
  />
  <TextField
    select
    size="small"
    label="Trạng thái"
    value={filterStatus}
    onChange={e => setFilterStatus(e.target.value)}
    sx={{ minWidth: 140 }}
  >
    <MenuItem value="all">Tất cả</MenuItem>
    <MenuItem value="pending">Chờ xác nhận</MenuItem>
    <MenuItem value="preparing">Đang chế biến</MenuItem>
    <MenuItem value="ready">Sẵn sàng phục vụ</MenuItem>
    <MenuItem value="served">Đã phục vụ</MenuItem>
    <MenuItem value="payment_requested">Yêu cầu thanh toán</MenuItem>
    <MenuItem value="completed">Hoàn thành</MenuItem>
    <MenuItem value="cancelled">Đã hủy</MenuItem>
  </TextField>
</Box>

<Typography variant="subtitle2" sx={{ mb: 2 }}>
  Tổng đơn: {filteredOrders.length} &nbsp;|&nbsp; Đã chi: {formatPrice(totalSpent)}
</Typography>

<Snackbar
  open={snackbar.open}
  autoHideDuration={3000}
  onClose={() => setSnackbar({ ...snackbar, open: false })}
  message={snackbar.message}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
/>
