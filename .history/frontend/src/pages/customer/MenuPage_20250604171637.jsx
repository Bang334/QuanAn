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
  CardMedia,
  CardActions,
  Button,
  Tabs,
  Tab,
  IconButton,
  Snackbar,
  Alert,
  TextField,
  InputAdornment,
  Chip,
  CircularProgress,
  Divider,
  Fade,
  useTheme,
  alpha,
  Zoom,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Restaurant as RestaurantIcon,
  LocalBar as LocalBarIcon,
  Fastfood as FastfoodIcon,
  LocalCafe as LocalCafeIcon,
  EmojiFoodBeverage as DessertIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../../config';

const MenuPage = () => {
  const theme = useTheme();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const { addToCart, tableId } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!tableId) {
      navigate('/');
      return;
    }

    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/menu`);
        
        // Add some basic validation to ensure category exists for each item
        const validatedItems = response.data.map(item => ({
          ...item,
          category: item.category || 'Chưa phân loại'
        }));
        
        setMenuItems(validatedItems);
        setError(null);
      } catch (err) {
        console.error('Error fetching menu items:', err);
        setError('Không thể tải thực đơn. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [tableId, navigate]);

  const handleCategoryChange = (event, newValue) => {
    setCategory(newValue);
    // For debugging
    console.log(`Changing to category: ${newValue}`);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleAddToCart = (item) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
    });
    setSnackbarMessage(`Đã thêm ${item.name} vào giỏ hàng`);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const normalizeCategory = (cat) => {
    return cat ? cat.trim().toLowerCase() : '';
  };

  const categoryMap = new Map();
  categoryMap.set('all', 'Tất Cả');
  
  menuItems.forEach(item => {
    const normalizedCat = normalizeCategory(item.category);
    if (normalizedCat && !categoryMap.has(normalizedCat)) {
      categoryMap.set(normalizedCat, item.category);
    }
  });
  
  const uniqueCategories = Array.from(categoryMap.entries());

  useEffect(() => {
    if (menuItems.length > 0) {
      console.log('Category Map:', Array.from(categoryMap.entries()));
      console.log('Current category:', category);
      
      // Log unique categories found in items
      const categoryCount = {};
      menuItems.forEach(item => {
        const cat = normalizeCategory(item.category);
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });
      console.log('Categories in items:', categoryCount);
    }
  }, [menuItems, category]);

  const filteredItems = menuItems.filter((item) => {
    const itemCategoryNormalized = normalizeCategory(item.category);
    const matchesCategory = category === 'all' || itemCategoryNormalized === category;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Debug logging for items that don't match the selected category
    if (category !== 'all' && !matchesCategory) {
      console.log(`Item doesn't match: ${item.name}, category: ${item.category}, normalized: ${itemCategoryNormalized}, selected: ${category}`);
    }
    
    return matchesCategory && matchesSearch && item.isAvailable;
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getCategoryIcon = (cat) => {
    switch (cat.toLowerCase()) {
      case 'đồ uống':
        return <LocalBarIcon />;
      case 'khai vị':
        return <RestaurantIcon />;
      case 'món chính':
        return <FastfoodIcon />;
      case 'món tráng miệng':
        return <DessertIcon />;
      case 'đồ ăn':
        return <FastfoodIcon />;
      default:
        return <LocalCafeIcon />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', width: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', width: '100%' }}>
        <Typography color="error">{error}</Typography>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={() => window.location.reload()}
        >
          Thử lại
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{px: 3, py: 0, width: '100%'}}>
      <Box sx={{ 
        mb: 6, 
        textAlign: 'center',
        bgcolor: alpha(theme.palette.primary.main, 0.05),
        py: 5,
        borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      }}>
        <Typography 
          variant="h3" 
          component="h1" 
          sx={{ 
            fontWeight: 700,
            mb: 1,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            textFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Thực Đơn Nhà Hàng
        </Typography>
        <Divider sx={{ 
          width: '80px', 
          mx: 'auto', 
          mb: 2, 
          borderColor: theme.palette.primary.main,
          borderWidth: 2
        }} />
        <Typography variant="subtitle1" color="text.secondary">
          Khám phá các món ăn đặc sắc của chúng tôi, được chế biến từ nguyên liệu tươi ngon nhất
        </Typography>
      </Box>
      
      <Box sx={{ 
        mb: 4,
        position: 'sticky',
        top: 20,
        zIndex: 10,
        bgcolor: 'background.default',
        pt: 2,
        pb: 2,
        px: 0,
        width: '100%',
      }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Tìm kiếm món ăn..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            sx: {
              borderRadius: 2,
              bgcolor: 'background.paper',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              },
            }
          }}
        />
      </Box>
      
      <Paper 
        elevation={2} 
        sx={{ 
          minWidth: '96vw',
          mb: 4, 
          borderRadius: 0,
          overflow: 'hidden',
          position: 'sticky',
          top: '100px',
          zIndex: 9,
          width: '100%',
        }}
      >
        <Tabs
          value={category}
          onChange={handleCategoryChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            '& .MuiTab-root': {
              minWidth: 'auto',
              px: 3,
              py: 2,
              fontWeight: 600,
              textTransform: 'capitalize',
              fontSize: '1rem',
            },
            '& .Mui-selected': {
              color: theme.palette.primary.main,
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            }
          }}
        >
          <Tab 
            icon={<RestaurantIcon />} 
            iconPosition="start" 
            label="Tất cả" 
            value="all" 
          />
          {uniqueCategories
            .filter(([key]) => key !== 'all')
            .map(([key, displayName]) => (
              <Tab 
                key={key} 
                label={displayName} 
                value={key}
                icon={getCategoryIcon(displayName)} 
                iconPosition="start"
              />
            ))}
        </Tabs>
      </Paper>
      
      {filteredItems.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 0, width: '100%' }}>
          <Typography variant="h6" color="text.secondary">Không tìm thấy món ăn nào</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3} justifyContent="center" sx={{ width: '100%' }}>
          {filteredItems.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                    }
                  }}
                >
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="200"
                      src={item.image  || `https://via.placeholder.com/300x200?text=${encodeURIComponent(item.name)}`}
                      alt={item.name}
                      sx={{ 
                        objectFit: 'cover',
                      }}
                    />
                    <Box 
                      sx={{ 
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        m: 1,
                      }}
                    >
                      <Chip 
                        label={item.category} 
                        color="secondary" 
                        size="small" 
                        sx={{ 
                          fontWeight: 'bold',
                          opacity: 0.9,
                        }} 
                      />
                    </Box>
                  </Box>
                  
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Typography 
                      variant="h6" 
                      component="div" 
                      gutterBottom
                      sx={{ 
                        fontWeight: 'bold',
                        fontSize: '1.2rem',
                      }}
                    >
                      {item.name}
                    </Typography>
                    
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: 2,
                        height: '3em',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {item.description || 'Không có mô tả'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography 
                        variant="h6" 
                        color="primary" 
                        sx={{ 
                          fontWeight: 'bold',
                          fontSize: '1.3rem',
                        }}
                      >
                        {formatPrice(item.price)}
                      </Typography>
                      
                      {item.isPopular && (
                        <Chip 
                          label="Phổ biến" 
                          color="error" 
                          size="small" 
                          sx={{ fontWeight: 'bold' }} 
                        />
                      )}
                    </Box>
                  </CardContent>
                  
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button 
                      startIcon={<AddIcon />}
                      variant="contained" 
                      fullWidth
                      onClick={() => handleAddToCart(item)}
                      sx={{ 
                        borderRadius: 2,
                        py: 1,
                        fontWeight: 'bold',
                        textTransform: 'none',
                        fontSize: '1rem',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                      }}
                    >
                      Thêm vào giỏ hàng
                    </Button>
                  </CardActions>
                </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>
      )}
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={Fade}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MenuPage;