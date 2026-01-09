import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Shopping from './pages/Shopping';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Contact from './pages/Contact';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminProductForm from './pages/AdminProductForm';
import AdminOrders from './pages/AdminOrders';
import AdminFilters from './pages/AdminFilters';
import AdminCoupons from './pages/AdminCoupons';
import AdminCustomers from './pages/AdminCustomers';
import AdminReplacements from './pages/AdminReplacements';
import GoogleCallback from './pages/auth/GoogleCallback';

function App() {
  const location = useLocation();
  
  // Hide footer on mobile for Home and Shopping pages
  const hideFooterOnMobile = location.pathname === '/' || location.pathname === '/shopping';

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <Header />
      <main className="flex-1 lg:mb-0 mb-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shopping" element={<Shopping />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/products/new" element={<AdminProductForm />} />
          <Route path="/admin/products/edit/:id" element={<AdminProductForm />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/filters" element={<AdminFilters />} />
          <Route path="/admin/coupons" element={<AdminCoupons />} />
          <Route path="/admin/customers" element={<AdminCustomers />} />
          <Route path="/admin/replacements" element={<AdminReplacements />} />
        </Routes>
      </main>
      <div className={hideFooterOnMobile ? 'hidden lg:block' : ''}>
        <Footer />
      </div>
      <BottomNav />
    </div>
  );
}

export default App;
