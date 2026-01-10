import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { loadCartFromBackend } = useCart();
  const { addToast } = useToast();

  useEffect(() => {
    const handleGoogleCallback = () => {
      const token = searchParams.get('token');
      const userStr = searchParams.get('user');
      const error = searchParams.get('error');

      if (error) {
        addToast('Google authentication failed. Please try again.', 'error');
        navigate('/login');
        return;
      }

      if (token && userStr) {
        try {
          const userData = JSON.parse(decodeURIComponent(userStr));
          
          // Store token and user data
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Load cart from backend
          setTimeout(() => loadCartFromBackend(), 100);
          
          addToast(`Welcome ${userData.name}!`, 'success');
          
          // Redirect admin to dashboard, others to profile
          if (userData.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/profile');
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          addToast('Authentication error. Please try again.', 'error');
          navigate('/login');
        }
      } else {
        addToast('Authentication failed. Please try again.', 'error');
        navigate('/login');
      }
    };

    handleGoogleCallback();
  }, [searchParams, navigate, addToast]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing Google authentication...</p>
      </div>
    </div>
  );
};

export default GoogleCallback;
