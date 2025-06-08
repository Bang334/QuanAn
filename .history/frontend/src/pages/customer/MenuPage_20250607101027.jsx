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
  useMediaQuery,
  Badge,
  Fab,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Rating,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Restaurant as RestaurantIcon,
  LocalBar as LocalBarIcon,
  Fastfood as FastfoodIcon,
  LocalCafe as LocalCafeIcon,
  EmojiFoodBeverage as DessertIcon,
  Menu as MenuIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Info as InfoIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../../config';

const MenuPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [category, setCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const { addToCart, tableId } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!tableId) {
      navigate('/');
      return;
    }

    const fetchMenuItems = async () => {
      try {
        console.log('Fetching menu items from API...');
        setLoading(true);
        
        console.log('API URL:', `${API_URL}/api/menu`);
        const response = await axios.get(`${API_URL}/api/menu`, { timeout: 10000 });
        
        console.log('Raw API response:', response);
        console.log('Menu items data:', response.data);
        console.log('Number of items received:', response.data.length);
        
        if (response.data && Array.isArray(response.data)) {
          const validatedItems = response.data.map(item => ({
            ...item,
            category: item.category || 'Chưa phân loại',
            // Ensure all necessary fields have default values
            image: item.image || `https://via.placeholder.com/150?text=${encodeURIComponent(item.name)}`,
            description: item.description || '',
            isAvailable: item.isAvailable !== undefined ? item.isAvailable : true
          }));
          
          console.log('Validated items:', validatedItems);
          setMenuItems(validatedItems);
          console.log('Menu items state after update:', validatedItems);
          
          setError(null);
        } else {
          console.error('Invalid response format', response.data);
          setError('Dữ liệu không hợp lệ từ máy chủ');
        }
      } catch (err) {
        console.error('Error fetching menu items:', err);
        console.log('Error details:', {
          message: err.message,
          response: err.response,
          request: err.request
        });
        
        let errorMessage = 'Không thể tải thực đơn. Vui lòng thử lại sau.';
        
        if (err.code === 'ECONNABORTED') {
          errorMessage = 'Kết nối đến máy chủ quá chậm. Vui lòng thử lại sau.';
        } else if (err.response) {
          // Server responded with an error
          errorMessage = `Lỗi máy chủ: ${err.response.status} - ${err.response.data.message || 'Không rõ lỗi'}`;
        } else if (err.request) {
          // Request made but no response received
          errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
        }
        
        setError(errorMessage);
        
        if (retryCount < 3 && !err.response) {
          console.log(`Retrying (${retryCount + 1}/3) after 2 seconds...`);
          setRetryCount(prevCount => prevCount + 1);
          setTimeout(() => {
            fetchMenuItems();
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [tableId, navigate, retryCount]);

  const handleCategoryChange = (event, newValue) => {
    setCategory(newValue);
    if (isMobile) {
      setFilterDrawerOpen(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
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

  const filteredItems = menuItems.filter((item) => {
    const itemCategoryNormalized = normalizeCategory(item.category);
    const matchesCategory = category === 'all' || itemCategoryNormalized === category;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
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

  const toggleFilterDrawer = () => {
    setFilterDrawerOpen(!filterDrawerOpen);
  };

  // Mock ratings data - trong thực tế sẽ được lấy từ API
  const mockRatings = {
    1: { avg: 4.5, count: 15 },
    2: { avg: 4.2, count: 8 },
    3: { avg: 3.8, count: 12 },
    4: { avg: 4.7, count: 23 },
    5: { avg: 4.0, count: 10 }
  };

  const handleViewDetails = (itemId) => {
    navigate(`/food/${itemId}`);
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh', 
        width: '100%' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', width: '100%', mt: isMobile ? 2 : 0 }}>
        <Typography color="error">{error}</Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => window.location.reload()}>
          Thử lại
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', m: 0, p: 0, overflow: 'hidden' }}>
      <Box sx={{ mb: { xs: 2, sm: 3, md: 4 }, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.05), py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3 }, borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
        <Typography variant={isMobile ? "h4" : "h3"} component="h1" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }, background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, backgroundClip: 'text', textFillColor: 'transparent', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Thực Đơn Nhà Hàng
        </Typography>
        <Divider sx={{ width: '80px', mx: 'auto', mb: 2, borderColor: theme.palette.primary.main, borderWidth: 2 }} />
        {!isMobile && (
          <Typography variant="subtitle1" color="text.secondary">
            Khám phá các món ăn đặc sắc của chúng tôi, được chế biến từ nguyên liệu tươi ngon nhất
          </Typography>
        )}
      </Box>

      <Box sx={{ mb: { xs: 2, sm: 3 }, position: 'sticky', top: { xs: 0, sm: 20 }, zIndex: 10, bgcolor: 'background.default', pt: { xs: 1, sm: 2 }, pb: { xs: 1, sm: 2 }, px: { xs: 1, sm: 2 }, width: '100%', display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Tìm kiếm món ăn..."
          value={searchTerm}
          onChange={handleSearchChange}
          size={isMobile ? "small" : "medium"}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearSearch} edge="end">
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
            sx: { borderRadius: 2, bgcolor: 'background.paper', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }, pr: searchTerm ? 0 : 2 },
          }}
        />
        {isMobile && (
          <Fab color="primary" aria-label="filter" size="small" onClick={toggleFilterDrawer} sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)', minWidth: 40 }}>
            <Badge color="error" variant="dot" invisible={category === 'all'}><FilterIcon /></Badge>
          </Fab>
        )}
      </Box>

      {!isMobile && (
        <Paper elevation={2} sx={{ mb: 3, borderRadius: { xs: 0, sm: 2 }, overflow: 'hidden', position: 'sticky', top: { xs: 65, sm: 100 }, zIndex: 9, width: '100%', mx: 'auto' }}>
          <Tabs value={category} onChange={handleCategoryChange} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile sx={{ '& .MuiTab-root': { minWidth: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 }, fontWeight: 600, textTransform: 'capitalize', fontSize: { xs: '0.875rem', sm: '1rem' } }, '& .Mui-selected': { color: theme.palette.primary.main }, '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' } }}>
            <Tab icon={<RestaurantIcon />} iconPosition="start" label="Tất cả" value="all" />
            {uniqueCategories.filter(([key]) => key !== 'all').map(([key, displayName]) => (
              <Tab key={key} label={displayName} value={key} icon={getCategoryIcon(displayName)} iconPosition="start" />
            ))}
          </Tabs>
        </Paper>
      )}

      <Drawer anchor="right" open={filterDrawerOpen} onClose={() => setFilterDrawerOpen(false)} PaperProps={{ sx: { width: '80%', maxWidth: 300, borderTopLeftRadius: 16, borderBottomLeftRadius: 16, p: 2 } }}>
        <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: theme.palette.primary.main }}>Lọc theo danh mục</Typography>
          <Divider />
        </Box>
        <List sx={{ pt: 1 }}>
          <ListItemButton selected={category === 'all'} onClick={(e) => handleCategoryChange(e, 'all')} sx={{ borderRadius: 2, mb: 1, bgcolor: category === 'all' ? alpha(theme.palette.primary.main, 0.1) : 'transparent' }}>
            <ListItemIcon sx={{ minWidth: 40, color: category === 'all' ? theme.palette.primary.main : 'inherit' }}><RestaurantIcon /></ListItemIcon>
            <ListItemText primary="Tất cả" primaryTypographyProps={{ fontWeight: category === 'all' ? 'bold' : 'normal', color: category === 'all' ? theme.palette.primary.main : 'inherit' }} />
          </ListItemButton>
          {uniqueCategories.filter(([key]) => key !== 'all').map(([key, displayName]) => (
            <ListItemButton key={key} selected={category === key} onClick={(e) => handleCategoryChange(e, key)} sx={{ borderRadius: 2, mb: 1, bgcolor: category === key ? alpha(theme.palette.primary.main, 0.1) : 'transparent' }}>
              <ListItemIcon sx={{ minWidth: 40, color: category === key ? theme.palette.primary.main : 'inherit' }}>{getCategoryIcon(displayName)}</ListItemIcon>
              <ListItemText primary={displayName} primaryTypographyProps={{ fontWeight: category === key ? 'bold' : 'normal', color: category === key ? theme.palette.primary.main : 'inherit' }} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      {filteredItems.length === 0 ? (
        <Box sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center', bgcolor: 'background.paper', borderRadius: { xs: 0, sm: 2 }, mx: { xs: 1, sm: 2 }, boxShadow: { xs: 'none', sm: '0 2px 8px rgba(0,0,0,0.08)' } }}>
          <Typography variant="h6" color="text.secondary">Không tìm thấy món ăn nào</Typography>
          {searchTerm && (
            <Button variant="outlined" color="primary" startIcon={<ClearIcon />} onClick={handleClearSearch} sx={{ mt: 2 }}>
              Xóa tìm kiếm
            </Button>
          )}
        </Box>
      ) : (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', p: 1 }}>
          <Grid container spacing={1} sx={{ width: '100%', m: 0, p: 0, justifyContent: 'center' }}>
            {filteredItems.map((item, index) => (
              <Grid key={item.id} sx={{ width: { xs: '50%', sm: '33.333%', md: '25%' }, padding: 1 }}>
                <Zoom in={true} style={{ transitionDelay: `${Math.min(index * 50, 300)}ms` }}>
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex',
                    maxWidth: '100%',
                    flexDirection: 'column', 
                    borderRadius: 2, 
                    overflow: 'hidden', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                    transition: 'transform 0.3s', 
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }
                  }}>
                    <Box sx={{ position: 'relative', width: '100%', height: '200px', overflow: 'hidden' }}>
                      <CardMedia
                        component="img"
                        src={item.image || `https://via.placeholder.com/300x300?text=${encodeURIComponent(item.name)}`}
                        alt={item.name}
                        sx={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover' 
                        }}
                      />
                      <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                        <Chip label={item.category} color="secondary" size="small" sx={{ fontWeight: 'bold', opacity: 0.9, fontSize: '0.75rem', height: 24 }} />
                      </Box>
                    </Box>
                    <CardContent sx={{ 
                      flexGrow: 1, 
                      p: 2, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between',
                      minHeight: '120px'
                    }}>
                      <Box>
                        <Typography 
                          variant="h6" 
                          component="div" 
                          sx={{ 
                            fontWeight: 'bold', 
                            fontSize: '1rem', 
                            mb: 1, 
                            height: '2.4em', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            display: '-webkit-box', 
                            WebkitLineClamp: 2, 
                            WebkitBoxOrient: 'vertical' 
                          }}
                        >
                          {item.name}
                        </Typography>
                        
                        {/* Hiển thị đánh giá sao */}
                        {mockRatings[item.id] && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Rating 
                              value={mockRatings[item.id].avg} 
                              precision={0.5} 
                              readOnly 
                              size="small"
                            />
                            <Typography variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>
                              ({mockRatings[item.id].avg.toFixed(1)})
                            </Typography>
                          </Box>
                        )}
                        
                        {!isMobile && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mb: 1,
                              height: '3em',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical' 
                            }}
                          >
                            {item.description || 'Không có mô tả'}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                          {formatPrice(item.price)}
                        </Typography>
                        {item.isPopular && !isMobile && (
                          <Chip label="Phổ biến" color="error" size="small" sx={{ fontWeight: 'bold', fontSize: '0.75rem', height: 24 }} />
                        )}
                      </Box>
                    </CardContent>
                    <CardActions sx={{ p: 2, justifyContent: 'center', height: '60px' }}>
                      <Stack direction="row" spacing={1} width="100%">
                        <Button 
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewDetails(item.id)}
                          sx={{ 
                            borderRadius: 2, 
                            flex: 1,
                            py: 0.75, 
                            minHeight: 36, 
                            fontSize: '0.8rem', 
                            fontWeight: 'bold', 
                            textTransform: 'none',
                          }}
                          startIcon={<InfoIcon fontSize="small" />}
                        >
                          {isMobile ? "Chi tiết" : "Xem chi tiết"}
                        </Button>
                        <Button 
                          startIcon={!isMobile && <AddIcon />} 
                          variant="contained" 
                          size="small"
                          onClick={() => handleAddToCart(item)} 
                          sx={{ 
                            borderRadius: 2, 
                            flex: 1,
                            py: 0.75, 
                            minHeight: 36, 
                            fontSize: '0.8rem', 
                            fontWeight: 'bold', 
                            textTransform: 'none', 
                            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                            backgroundColor: '#8B4513',
                            '&:hover': {
                              backgroundColor: '#A0522D',
                            }
                          }}
                        >
                          {isMobile ? <AddIcon fontSize="small" /> : "Thêm vào giỏ"}
                        </Button>
                      </Stack>
                    </CardActions>
                  </Card>
                </Zoom>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
      <Box sx={{ height: { xs: 80, sm: 40 } }} />
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={2000} 
        onClose={handleSnackbarClose} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} 
        sx={{ mb: { xs: 7, sm: 2 } }} 
        TransitionComponent={Fade}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity="success" 
          variant="filled" 
          sx={{ width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MenuPage;