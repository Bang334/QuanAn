import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  RestaurantMenu as RestaurantMenuIcon,
  QrCode as QrCodeIcon,
  TableBar as TableBarIcon,
} from '@mui/icons-material';

const HomePage = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const { setTableId } = useCart();
  const navigate = useNavigate();

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleTableSubmit = () => {
    const tableNum = parseInt(tableNumber, 10);
    if (!isNaN(tableNum) && tableNum > 0 && tableNum <= 10) {
      setTableId(tableNum);
      navigate('/menu');
    }
  };

  return (
    <Box>
      <Box
        sx={{
          textAlign: 'center',
          mb: 4,
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom>
          Nhà hàng XYZ
        </Typography>
        <Typography variant="h5" color="text.secondary" gutterBottom>
          Ẩm thực Việt Nam truyền thống
        </Typography>
      </Box>

      <Grid container spacing={3} justifyContent="center">
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Chào mừng quý khách!
            </Typography>
            <Typography paragraph>
              Hãy nhập số bàn của bạn để bắt đầu đặt món.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<TableBarIcon />}
              onClick={handleOpenDialog}
              sx={{ mt: 2 }}
            >
              Nhập số bàn
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Cách thức đặt món
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <TableBarIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="1. Nhập số bàn của bạn" 
              secondary="Mỗi bàn có một mã QR riêng, hoặc bạn có thể nhập số bàn trực tiếp"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <RestaurantMenuIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="2. Chọn món ăn từ thực đơn" 
              secondary="Duyệt qua các danh mục và thêm món ăn vào giỏ hàng"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <QrCodeIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="3. Xác nhận đơn hàng" 
              secondary="Kiểm tra giỏ hàng và gửi đơn đặt hàng của bạn đến nhà bếp"
            />
          </ListItem>
        </List>
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Nhập số bàn</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Số bàn"
            type="number"
            fullWidth
            variant="outlined"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            inputProps={{ min: 1, max: 10 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Vui lòng nhập số bàn từ 1-10
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleTableSubmit} variant="contained" color="primary">
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HomePage; 