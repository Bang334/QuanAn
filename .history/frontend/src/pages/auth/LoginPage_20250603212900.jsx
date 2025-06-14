import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Container,
  Avatar,
  Link,
} from '@mui/material';
import { LockOutlined as LockOutlinedIcon } from '@mui/icons-material';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const user = await login(email, password);
      
      // Chuyển hướng dựa vào vai trò
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'kitchen') {
        navigate('/kitchen');
      } else if (user.role === 'waiter') {
        navigate('/waiter');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Đăng nhập
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Mật khẩu"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Khách hàng không cần đăng nhập.{' '}
              <Link href="/" variant="body2">
                Quay lại trang chủ
              </Link>
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ mt: 4, width: '100%' }}>
          <Typography variant="subtitle2" gutterBottom>
            Tài khoản mẫu:
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
            <Typography variant="body2">
              <strong>Admin:</strong> admin@quanan.com / admin123
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
            <Typography variant="body2">
              <strong>Bếp:</strong> kitchen@quanan.com / kitchen123
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2">
              <strong>Phục vụ:</strong> waiter@quanan.com / waiter123
            </Typography>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage; 