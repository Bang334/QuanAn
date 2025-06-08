import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

  const { addToCart, tableId, setTableId } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Xử lý tham số tableId từ URL khi trang được tải
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tableIdFromUrl = params.get('tableId');
    
    if (tableIdFromUrl) {
      // Nếu có tableId trong URL, lưu nó vào context
      setTableId(tableIdFromUrl);
    } else if (!tableId) {
      // Nếu không có tableId trong URL và cũng không có trong context, chuyển về trang chủ
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
    <Box sx={{ width: '100vw', m: 0, p: 0, overflow: 'hidden' }}>
      <Box sx={{ 
        mb: { xs: 1, sm: 2, md: 3 }, 
        textAlign: 'center', 
        bgcolor: alpha(theme.palette.primary.main, 0.05), 
        py: { xs: 1.5, sm: 3, md: 4 }, 
        px: { xs: 1, sm: 3 }, 
        borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` 
      }}>
        <Typography 
          variant={isMobile ? "h5" : "h3"} 
          component="h1" 
          sx={{ 
            fontWeight: 700, 
            mb: 0.5, 
            fontSize: { xs: '1.25rem', sm: '2rem', md: '2.5rem' }, 
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, 
            backgroundClip: 'text', 
            textFillColor: 'transparent', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
          }}
        >
          Thực Đơn Nhà Hàng
        </Typography>
        <Divider sx={{ width: '60px', mx: 'auto', mb: 1, borderColor: theme.palette.primary.main, borderWidth: 2 }} />
        {!isMobile && (
          <Typography variant="subtitle1" color="text.secondary">
            Khám phá các món ăn đặc sắc của chúng tôi, được chế biến từ nguyên liệu tươi ngon nhất
          </Typography>
        )}
      </Box>

      <Box sx={{ 
        mb: { xs: 1, sm: 2 }, 
        position: 'sticky', 
        top: 0,
        zIndex: 100, 
        bgcolor: 'background.default', 
        pt: { xs: 1, sm: 2 }, 
        pb: { xs: 1, sm: 2 }, 
        px: { xs: 1, sm: 2 }, 
        width: '99%', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Tìm kiếm món ăn..."
          value={searchTerm}
          onChange={handleSearchChange}
          size="small"
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearSearch} edge="end">
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
            sx: { 
              borderRadius: 2, 
              bgcolor: 'background.paper', 
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)', 
              '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }, 
              pr: searchTerm ? 0 : 2,
              height: { xs: '40px', sm: 'auto' }
            },
          }}
        />
        {isMobile && (
          <Fab 
            color="primary" 
            aria-label="filter" 
            size="small" 
            onClick={toggleFilterDrawer} 
            sx={{ 
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)', 
              minWidth: 40,
              width: 40,
              height: 40
            }}
          >
            <Badge color="error" variant="dot" invisible={category === 'all'}><FilterIcon /></Badge>
          </Fab>
        )}
      </Box>

      {!isMobile && (
        <Paper elevation={2} sx={{ 
          mb: 2, 
          borderRadius: { xs: 0, sm: 2 }, 
          overflow: 'hidden', 
          position: 'sticky', 
          top: 65, 
          zIndex: 99, 
          width: '98%', 
          mx: 'auto' 
        }}>
          <Tabs 
            value={category} 
            onChange={handleCategoryChange} 
            variant="scrollable" 
            scrollButtons="auto" 
            allowScrollButtonsMobile 
            sx={{ 
              '& .MuiTab-root': { 
                minWidth: 'auto', 
                px: { xs: 2, sm: 3 }, 
                py: { xs: 1.5, sm: 2 }, 
                fontWeight: 600, 
                textTransform: 'capitalize', 
                fontSize: { xs: '0.875rem', sm: '1rem' } 
              }, 
              '& .Mui-selected': { color: theme.palette.primary.main }, 
              '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' } 
            }}
          >
            <Tab icon={<RestaurantIcon />} iconPosition="start" label="Tất cả" value="all" />
            {uniqueCategories.filter(([key]) => key !== 'all').map(([key, displayName]) => (
              <Tab key={key} label={displayName} value={key} icon={getCategoryIcon(displayName)} iconPosition="start" />
            ))}
          </Tabs>
        </Paper>
      )}

      <Drawer 
        anchor="right" 
        open={filterDrawerOpen} 
        onClose={() => setFilterDrawerOpen(false)} 
        PaperProps={{ 
          sx: { 
            width: '80%', 
            maxWidth: 300, 
            borderTopLeftRadius: 16, 
            borderBottomLeftRadius: 16, 
            p: 0,
          } 
        }}
      >
        <Box sx={{ 
          p: 2, 
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
        }}>
          <Typography variant="h6" sx={{ mb: 0, fontWeight: 'bold', color: theme.palette.primary.main }}>
            Lọc theo danh mục
          </Typography>
        </Box>
        <List sx={{ pt: 1, px: 1 }}>
          <ListItemButton 
            selected={category === 'all'} 
            onClick={(e) => handleCategoryChange(e, 'all')} 
            sx={{ 
              borderRadius: 2, 
              mb: 1, 
              bgcolor: category === 'all' ? alpha(theme.palette.primary.main, 0.1) : 'transparent' 
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: category === 'all' ? theme.palette.primary.main : 'inherit' }}>
              <RestaurantIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Tất cả" 
              primaryTypographyProps={{ 
                fontWeight: category === 'all' ? 'bold' : 'normal', 
                color: category === 'all' ? theme.palette.primary.main : 'inherit' 
              }} 
            />
          </ListItemButton>
          {uniqueCategories.filter(([key]) => key !== 'all').map(([key, displayName]) => (
            <ListItemButton 
              key={key} 
              selected={category === key} 
              onClick={(e) => handleCategoryChange(e, key)} 
              sx={{ 
                borderRadius: 2, 
                mb: 1, 
                bgcolor: category === key ? alpha(theme.palette.primary.main, 0.1) : 'transparent' 
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: category === key ? theme.palette.primary.main : 'inherit' }}>
                {getCategoryIcon(displayName)}
              </ListItemIcon>
              <ListItemText 
                primary={displayName} 
                primaryTypographyProps={{ 
                  fontWeight: category === key ? 'bold' : 'normal', 
                  color: category === key ? theme.palette.primary.main : 'inherit' 
                }} 
              />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      {filteredItems.length === 0 ? (
        <Box sx={{ 
          p: { xs: 3, sm: 5 }, 
          textAlign: 'center', 
          bgcolor: 'background.paper', 
          borderRadius: { xs: 0, sm: 2 }, 
          mx: { xs: 1, sm: 2 }, 
          boxShadow: { xs: 'none', sm: '0 2px 8px rgba(0,0,0,0.08)' } 
        }}>
          <Typography variant="h6" color="text.secondary">Không tìm thấy món ăn nào</Typography>
          {searchTerm && (
            <Button 
              variant="outlined" 
              color="primary" 
              startIcon={<ClearIcon />} 
              onClick={handleClearSearch} 
              sx={{ mt: 2 }}
            >
              Xóa tìm kiếm
            </Button>
          )}
        </Box>
      ) : (
        <Box sx={{ width: '100%', px: { xs: 0.5, sm: 1 },marginLeft: '7px' }}>
          <Grid container spacing={1} sx={{ width: '100%', m: 0 }}>
            {filteredItems.map((item, index) => (
              <Grid 
                item 
                xs={12}
                sm={12}
                md={12}
                key={item.id}
                sx={{ 
                  width: Math.floor(index/2) % 2 === 0 ? 
                    (index % 2 === 0 ? '55%' : '40%') : 
                    (index % 2 === 0 ? '45%' : '55%'),
                  maxWidth: Math.floor(index/2) % 2 === 0 ? 
                    (index % 2 === 0 ? '55%' : '40%') : 
                    (index % 2 === 0 ? '40%' : '55%'),
                  flexBasis: Math.floor(index/2) % 2 === 0 ? 
                    (index % 2 === 0 ? '55%' : '40%') : 
                    (index % 2 === 0 ? '40%' : '55%')
                }}
              >
                <Zoom in={true} style={{ transitionDelay: `${Math.min(index * 20, 150)}ms` }}>
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex',
                    flexDirection: 'column', 
                    borderRadius: { xs: 1, sm: 1.5 }, 
                    overflow: 'hidden', 
                    boxShadow: { xs: '0 1px 3px rgba(0,0,0,0.08)', sm: '0 4px 12px rgba(0,0,0,0.1)' }, 
                    transition: 'transform 0.2s', 
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }
                  }}>
                    <Box sx={{ 
                      position: 'relative', 
                      width: '100%', 
                      height: { xs: '120px', sm: '180px', md: '200px' },
                      overflow: 'hidden' 
                    }}>
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
                      <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
                        <Chip 
                          label={item.category} 
                          color="secondary" 
                          size="small" 
                          sx={{ 
                            fontWeight: 'bold', 
                            opacity: 0.9, 
                            fontSize: '0.6rem', 
                            height: { xs: 16, sm: 20 },
                            '& .MuiChip-label': {
                              px: { xs: 0.75, sm: 1 }
                            }
                          }} 
                        />
                      </Box>
                    </Box>
                    <CardContent sx={{ 
                      flexGrow: 1, 
                      p: { xs: 1, sm: 1.5 }, 
                      pb: { xs: 0.5, sm: 1 },
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between',
                      minHeight: { xs: '70px', sm: '90px' }
                    }}>
                      <Box>
                        <Typography 
                          variant="h6" 
                          component="div" 
                          sx={{ 
                            fontWeight: 'bold', 
                            fontSize: { xs: '0.8rem', sm: '0.9rem' }, 
                            mb: 0.25, 
                            height: { xs: '2.4em', sm: '2.4em' }, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            display: '-webkit-box', 
                            WebkitLineClamp: 2, 
                            WebkitBoxOrient: 'vertical',
                            lineHeight: '1.2'
                          }}
                        >
                          {item.name}
                        </Typography>
                        
                        {/* Hiển thị đánh giá sao - sử dụng dữ liệu thật từ item */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.25 }}>
                          <Rating 
                            value={item.avgRating || 0} 
                            precision={0.5} 
                            readOnly 
                            size="small"
                            sx={{
                              fontSize: { xs: '0.7rem', sm: '0.8rem' }
                            }}
                          />
                          <Typography variant="caption" sx={{ ml: 0.5, color: 'text.secondary', fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                            {item.avgRating ? `(${item.avgRating.toFixed(1)})` : '(Chưa có)'}
                          </Typography>
                        </Box>
                        
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
                              WebkitBoxOrient: 'vertical',
                              fontSize: '0.8rem'
                            }}
                          >
                            {item.description || 'Không có mô tả'}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.25 }}>
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                          {formatPrice(item.price)}
                        </Typography>
                        {item.isPopular && !isMobile && (
                          <Chip label="Phổ biến" color="error" size="small" sx={{ fontWeight: 'bold', fontSize: '0.6rem', height: 18 }} />
                        )}
                      </Box>
                    </CardContent>
                    <CardActions sx={{ 
                      p: { xs: 0.5, sm: 1 }, 
                      pt: 0, 
                      justifyContent: 'center', 
                      height: { xs: '36px', sm: '50px' } 
                    }}>
                      <Stack direction="row" spacing={0.5} width="100%">
                        <Button 
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewDetails(item.id)}
                          sx={{ 
                            borderRadius: 1, 
                            flex: 1,
                            py: 0.25, 
                            minHeight: { xs: 24, sm: 30 }, 
                            fontSize: index % 2 === 0 ? { xs: '0.6rem', sm: '0.7rem' } : { xs: '0.55rem', sm: '0.7rem' }, 
                            fontWeight: 'bold', 
                            textTransform: 'none',
                          }}
                          startIcon={isMobile ? null : <InfoIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
                        >
                          {isMobile ? "Chi tiết" : "Xem chi tiết"}
                        </Button>
                        <Button 
                          startIcon={!isMobile && <AddIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />} 
                          variant="contained" 
                          size="small"
                          onClick={() => handleAddToCart(item)} 
                          sx={{ 
                            borderRadius: 1, 
                            flex: 1,
                            py: 0.25, 
                            minHeight: { xs: 24, sm: 30 }, 
                            fontSize: index % 2 === 0 ? { xs: '0.6rem', sm: '0.7rem' } : { xs: '0.55rem', sm: '0.7rem' }, 
                            fontWeight: 'bold', 
                            textTransform: 'none', 
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            backgroundColor: '#8B4513',
                            '&:hover': {
                              backgroundColor: '#A0522D',
                            }
                          }}
                        >
                          {isMobile ? <AddIcon sx={{ fontSize: index % 2 === 0 ? '0.8rem' : '0.75rem' }} /> : "Thêm vào giỏ"}
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