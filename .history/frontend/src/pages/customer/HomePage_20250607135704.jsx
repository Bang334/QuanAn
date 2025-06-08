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
    <Box
      sx={{
        backgroundImage: 'url("/background.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        padding: { xs: 2, sm: 4 },
        width: '100vw',
      }}
    >
      <Box
        sx={{
          textAlign: 'center',
          mb: 4,
          pt: 4,
          color: 'white',
          textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
        }}
      >
        <Typography 
          variant="h2" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 'bold',
            letterSpacing: '1px',
          }}
        >
          Nhà hàng XYZ
        </Typography>
        <Typography 
          variant="h5" 
          gutterBottom
          sx={{ 
            fontWeight: '500',
            letterSpacing: '0.5px',
          }}
        >
          Ẩm thực Việt Nam truyền thống
        </Typography>
      </Box>

      <Grid container spacing={3} justifyContent="center">
        <Grid item xs={12} md={6}>
          <Paper 
            sx={{ 
              p: 3, 
              textAlign: 'center',
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
            }}
          >
            <Typography variant="h5" gutterBottom>
              Chào mừng quý khách!
            </Typography>
            <Typography paragraph>
              Quét mã QR tại bàn của bạn hoặc nhập số bàn trực tiếp để bắt đầu đặt món.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', mb: 2 }}>
              <QrCodeIcon sx={{ fontSize: 100, color: 'primary.main', mb: 2 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Mỗi bàn đều có mã QR riêng. Quét mã để truy cập menu ngay!
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<TableBarIcon />}
              onClick={handleOpenDialog}
              sx={{ mt: 2 }}
            >
              Nhập số bàn thủ công
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Box 
        sx={{ 
          mt: 4,
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          p: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Typography 
          variant="h5" 
          gutterBottom
          sx={{ 
            fontWeight: 'bold',
            color: 'primary.main',
            textAlign: 'center',
            mb: 2
          }}
        >
          Cách thức đặt món
        </Typography>
        <List sx={{ bgcolor: 'transparent' }}>
          <ListItem>
            <ListItemIcon>
              <TableBarIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="1. Quét mã QR tại bàn của bạn" 
              secondary="Mỗi bàn có một mã QR riêng, quét để truy cập menu ngay lập tức"
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

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', pb: 2 }}>
          Nhập số bàn
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
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
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleTableSubmit} 
            variant="contained" 
            color="primary"
            sx={{ borderRadius: 2 }}
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HomePage; 