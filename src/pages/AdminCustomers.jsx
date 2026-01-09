import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { customersAPI } from '../api/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

// Inline SVG Icons
const FiUsers = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const FiMail = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const FiCalendar = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const FiShoppingBag = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

const FiDollarSign = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const FiX = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const FiHeart = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const FiMapPin = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const FiPackage = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const FiTrendingUp = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const FiArrowLeft = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const FiLoader = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const FiRefreshCw = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const FiShoppingCart = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const FiRepeat = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const FiClock = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const FiBarChart = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const FiStar = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const AdminCustomers = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/profile');
      return;
    }
    fetchCustomers();
    fetchStats();
  }, [isAuthenticated, user, navigate]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customersAPI.getAll();
      if (response.data && response.data.success && response.data.data) {
        setCustomers(response.data.data);
      } else {
        console.error('Invalid customers response:', response.data);
        setCustomers([]);
        addToast('Failed to load customers - Invalid response', 'error');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
      addToast(error.response?.data?.message || 'Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await customersAPI.getStats();
      if (response.data && response.data.success && response.data.data) {
        setStats(response.data.data);
      } else {
        console.error('Invalid stats response:', response.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const fetchCustomerDetails = async (customerId) => {
    try {
      setDetailsLoading(true);
      setActiveTab('overview');
      setCustomerDetails(null);
      const response = await customersAPI.getById(customerId);
      if (response.data && response.data.success && response.data.data) {
        setCustomerDetails(response.data.data);
      } else {
        console.error('Invalid response format:', response.data);
        addToast('Failed to load customer details - Invalid response', 'error');
      }
    } catch (error) {
      console.error('Error fetching customer details:', error);
      addToast(error.response?.data?.message || 'Failed to load customer details', 'error');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCustomerClick = (customer) => {
    setSelectedCustomer(customer);
    fetchCustomerDetails(customer._id);
  };

  const closeDetails = () => {
    setSelectedCustomer(null);
    setCustomerDetails(null);
  };

  const filteredCustomers = customers
    .filter(customer => {
      // Search filter
      const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Customer type filter
      const matchesType = customerFilter === 'all' ? true :
        customerFilter === 'new' ? customer.stats.totalOrders === 0 :
        customerFilter === 'active' ? customer.stats.totalOrders > 0 :
        customerFilter === 'returns' ? customer.stats.returnedItemsCount > 0 : true;
      
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let aVal, bVal;
      switch(sortBy) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'totalSpent':
          aVal = a.stats.totalSpent;
          bVal = b.stats.totalSpent;
          break;
        case 'totalOrders':
          aVal = a.stats.totalOrders;
          bVal = b.stats.totalOrders;
          break;
        case 'createdAt':
        default:
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
      }
      if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  // Simple bar chart component
  const MiniBarChart = ({ data, maxValue, color = 'bg-blue-500' }) => {
    const max = maxValue || Math.max(...data.map(d => d.value), 1);
    return (
      <div className="flex items-end gap-1 h-16">
        {data.map((item, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div 
              className={`w-full ${color} rounded-t transition-all`}
              style={{ height: `${Math.max(4, (item.value / max) * 100)}%` }}
            />
            <span className="text-[10px] text-gray-500 mt-1">{item.label}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FiUsers className="text-blue-600" />
              Customer Analytics
            </h1>
            <button 
              onClick={() => { fetchCustomers(); fetchStats(); }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <FiRefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Enhanced Stats Cards */}
        {stats && (
          <div className="space-y-4 mb-6">
            {/* Main Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FiUsers className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Customers</p>
                    <p className="text-xl font-bold text-gray-800">{stats.totalCustomers}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FiDollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-xl font-bold text-gray-800">{formatCurrency(stats.totalRevenue)}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FiShoppingBag className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Avg Customer Value</p>
                    <p className="text-xl font-bold text-gray-800">{formatCurrency(stats.averageCustomerValue)}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <FiPackage className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Items Sold</p>
                    <p className="text-xl font-bold text-gray-800">{stats.totalItemsSold}</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-white rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <FiTrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">New (30 days)</p>
                    <p className="text-xl font-bold text-gray-800">{stats.newCustomers}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <FiRepeat className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Repeat Customers</p>
                    <p className="text-xl font-bold text-gray-800">{stats.repeatCustomers}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="bg-white rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-100 rounded-lg">
                    <FiShoppingCart className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">With Cart Items</p>
                    <p className="text-xl font-bold text-gray-800">{stats.customersWithCart}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <FiHeart className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">With Wishlist</p>
                    <p className="text-xl font-bold text-gray-800">{stats.customersWithWishlist}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="bg-white rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <FiBarChart className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Avg Order Value</p>
                    <p className="text-xl font-bold text-gray-800">{formatCurrency(stats.averageOrderValue)}</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Top Spenders & Registration Trends */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top Spenders */}
              {stats.topSpenders && stats.topSpenders.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white rounded-xl p-4 shadow-sm"
                >
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FiStar className="text-yellow-500" />
                    Top Spenders
                  </h3>
                  <div className="space-y-2">
                    {stats.topSpenders.map((spender, idx) => (
                      <div key={spender._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-gray-700">{spender.name}</span>
                        </div>
                        <span className="font-semibold text-green-600">{formatCurrency(spender.totalSpent)}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Registration Trends */}
              {stats.registrationTrends && stats.registrationTrends.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                  className="bg-white rounded-xl p-4 shadow-sm"
                >
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FiTrendingUp className="text-blue-500" />
                    Registration Trends (6 months)
                  </h3>
                  <MiniBarChart 
                    data={stats.registrationTrends.map(t => ({ label: t.month, value: t.count }))} 
                    color="bg-blue-500"
                  />
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Search and Sort */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Customers</option>
                <option value="new">New (No Orders)</option>
                <option value="active">Active (Has Orders)</option>
                <option value="returns">Has Returns</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt">Join Date</option>
                <option value="name">Name</option>
                <option value="totalSpent">Total Spent</option>
                <option value="totalOrders">Orders</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Customers List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FiLoader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Customer</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden md:table-cell">Joined</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Orders</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 hidden lg:table-cell">Items</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Total Spent</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 hidden md:table-cell">Last Order</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 hidden lg:table-cell">Avg Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCustomers.map((customer) => (
                    <motion.tr
                      key={customer._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => handleCustomerClick(customer)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{customer.name}</p>
                            <p className="text-sm text-gray-500">{customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div>
                          <p className="text-gray-600">{formatDate(customer.createdAt)}</p>
                          <p className="text-xs text-gray-400">{customer.stats.accountAgeDays} days ago</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {customer.stats.totalOrders === 0 ? (
                          <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
                            New
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <span className="text-green-600 font-medium">{customer.stats.deliveredOrders}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-600">{customer.stats.totalOrders}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        <span className="text-gray-700 font-medium">{customer.stats.totalItems}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">
                        {formatCurrency(customer.stats.totalSpent)}
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        <span className="text-sm text-gray-600">
                          {customer.stats.lastOrderDate ? formatDate(customer.stats.lastOrderDate) : 'No orders'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        <span className="text-sm font-medium text-gray-700">
                          {formatCurrency(customer.stats.averageOrderValue)}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredCustomers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <FiUsers className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No customers found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={closeDetails}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <button onClick={closeDetails} className="p-2 hover:bg-white/20 rounded-lg">
                    <FiArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-lg font-semibold">Customer Details</h2>
                  <button onClick={closeDetails} className="p-2 hover:bg-white/20 rounded-lg">
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="mt-4 flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{selectedCustomer.name}</h3>
                    <p className="opacity-90 flex items-center gap-2">
                      <FiMail className="w-4 h-4" />
                      {selectedCustomer.email}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-1 text-sm opacity-75">
                      <span className="flex items-center gap-1">
                        <FiCalendar className="w-4 h-4" />
                        Joined {formatDate(selectedCustomer.createdAt)}
                      </span>
                      {selectedCustomer.authProvider && (
                        <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                          {selectedCustomer.authProvider === 'google' ? 'Google Account' : 'Email Account'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b bg-gray-50">
                {['overview', 'orders', 'returns', 'products', 'activity'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-4 py-3 text-sm font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab === 'returns' && customerDetails?.replacementStats?.total > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs bg-orange-500 text-white rounded-full mr-1">
                        {customerDetails.replacementStats.total}
                      </span>
                    )}
                    {tab}
                  </button>
                ))}
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[55vh]">
                {detailsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <FiLoader className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                ) : customerDetails ? (
                  <div className="space-y-6">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                      <>
                        {/* New Customer Banner */}
                        {customerDetails.stats?.totalOrders === 0 && (
                          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                              <FiStar className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-yellow-800">New Customer</p>
                              <p className="text-sm text-yellow-700">This customer has registered but hasn't placed any orders yet. Consider sending a welcome offer!</p>
                            </div>
                          </div>
                        )}

                        {/* Main Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                            <FiShoppingBag className="w-6 h-6 mx-auto text-blue-600 mb-2" />
                            <p className="text-2xl font-bold text-gray-800">{customerDetails.stats?.totalOrders || 0}</p>
                            <p className="text-sm text-gray-500">Total Orders</p>
                          </div>
                          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
                            <FiDollarSign className="w-6 h-6 mx-auto text-green-600 mb-2" />
                            <p className="text-2xl font-bold text-gray-800">{formatCurrency(customerDetails.stats?.totalSpent)}</p>
                            <p className="text-sm text-gray-500">Total Spent</p>
                          </div>
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
                            <FiPackage className="w-6 h-6 mx-auto text-purple-600 mb-2" />
                            <p className="text-2xl font-bold text-gray-800">{customerDetails.stats?.totalItems || 0}</p>
                            <p className="text-sm text-gray-500">Items Bought</p>
                          </div>
                          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 text-center">
                            <FiTrendingUp className="w-6 h-6 mx-auto text-orange-600 mb-2" />
                            <p className="text-2xl font-bold text-gray-800">{formatCurrency(customerDetails.stats?.averageOrderValue)}</p>
                            <p className="text-sm text-gray-500">Avg. Order</p>
                          </div>
                        </div>

                        {/* Secondary Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-lg font-bold text-gray-700">{customerDetails.stats?.accountAgeDays || 0}</p>
                            <p className="text-xs text-gray-500">Days as Member</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-lg font-bold text-gray-700">{customerDetails.stats?.orderFrequencyDays || 'N/A'}</p>
                            <p className="text-xs text-gray-500">Avg Days Between Orders</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-lg font-bold text-green-600">{formatCurrency(customerDetails.stats?.totalCouponSavings)}</p>
                            <p className="text-xs text-gray-500">Coupon Savings</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-lg font-bold text-indigo-600">{formatCurrency(customerDetails.stats?.estimatedLifetimeValue)}</p>
                            <p className="text-xs text-gray-500">Est. Lifetime Value</p>
                          </div>
                        </div>

                        {/* Order Status Breakdown */}
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-3">Order Status Breakdown</h4>
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                            <div className="bg-green-50 rounded-lg p-3 text-center">
                              <p className="text-lg font-bold text-green-600">{customerDetails.stats?.deliveredOrders || 0}</p>
                              <p className="text-xs text-gray-500">Delivered</p>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-3 text-center">
                              <p className="text-lg font-bold text-blue-600">{customerDetails.stats?.shippedOrders || 0}</p>
                              <p className="text-xs text-gray-500">Shipped</p>
                            </div>
                            <div className="bg-yellow-50 rounded-lg p-3 text-center">
                              <p className="text-lg font-bold text-yellow-600">{customerDetails.stats?.processingOrders || 0}</p>
                              <p className="text-xs text-gray-500">Processing</p>
                            </div>
                            <div className="bg-gray-100 rounded-lg p-3 text-center">
                              <p className="text-lg font-bold text-gray-600">{customerDetails.stats?.pendingOrders || 0}</p>
                              <p className="text-xs text-gray-500">Pending</p>
                            </div>
                            <div className="bg-red-50 rounded-lg p-3 text-center">
                              <p className="text-lg font-bold text-red-600">{customerDetails.stats?.cancelledOrders || 0}</p>
                              <p className="text-xs text-gray-500">Cancelled</p>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-3 text-center">
                              <p className="text-lg font-bold text-purple-600">{customerDetails.stats?.returnedItemsCount || 0}</p>
                              <p className="text-xs text-gray-500">Returned Items</p>
                            </div>
                          </div>
                        </div>

                        {/* Returns & Refunds Section */}
                        {(customerDetails.stats?.returnedItemsCount > 0 || customerDetails.stats?.totalRefunded > 0) && (
                          <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
                            <h4 className="font-semibold text-orange-800 mb-3">Returns & Refunds Summary</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div className="text-center">
                                <p className="text-lg font-bold text-orange-600">{customerDetails.stats?.returnedItemsCount || 0}</p>
                                <p className="text-xs text-gray-600">Items Returned</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-bold text-orange-600">{formatCurrency(customerDetails.stats?.returnedItemsValue || 0)}</p>
                                <p className="text-xs text-gray-600">Items Value</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-bold text-blue-600">{formatCurrency(customerDetails.stats?.refundedDeliveryFees || 0)}</p>
                                <p className="text-xs text-gray-600">Delivery Refunded</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-bold text-green-600">{formatCurrency(customerDetails.stats?.totalRefunded || 0)}</p>
                                <p className="text-xs text-gray-600">Total Refunded</p>
                              </div>
                            </div>
                            {/* Net Spent After Refunds */}
                            <div className="border-t border-orange-200 pt-3 mt-3">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="text-center bg-white rounded-lg p-2">
                                  <p className="text-sm text-gray-600">Gross Spent</p>
                                  <p className="text-lg font-bold text-gray-700">{formatCurrency(customerDetails.stats?.grossSpent || 0)}</p>
                                </div>
                                <div className="text-center bg-white rounded-lg p-2">
                                  <p className="text-sm text-gray-600">Net Spent (After Refunds)</p>
                                  <p className="text-lg font-bold text-green-600">{formatCurrency(customerDetails.stats?.totalSpent || 0)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Delivery Fees Section */}
                        {(customerDetails.stats?.totalDeliveryFees > 0) && (
                          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-800 mb-3">Delivery Charges</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center">
                                <p className="text-lg font-bold text-blue-600">{formatCurrency(customerDetails.stats?.totalDeliveryFees || 0)}</p>
                                <p className="text-xs text-gray-600">Total Delivery Paid</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-bold text-green-600">{formatCurrency((customerDetails.stats?.totalDeliveryFees || 0) - (customerDetails.stats?.refundedDeliveryFees || 0))}</p>
                                <p className="text-xs text-gray-600">Net Delivery Revenue</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Monthly Spending Trends */}
                        {customerDetails.monthlySpending && customerDetails.monthlySpending.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                              <FiBarChart className="text-blue-500" />
                              Monthly Spending (Last 12 Months)
                            </h4>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <MiniBarChart 
                                data={customerDetails.monthlySpending.map(m => ({ label: m.month, value: m.spent }))}
                                color="bg-green-500"
                              />
                              <div className="flex justify-between mt-2 text-xs text-gray-500">
                                <span>Total: {formatCurrency(customerDetails.monthlySpending.reduce((s, m) => s + m.spent, 0))}</span>
                                <span>Orders: {customerDetails.monthlySpending.reduce((s, m) => s + m.orders, 0)}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Timeline Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                              <FiClock className="text-gray-500" />
                              Activity Timeline
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">First Order:</span>
                                <span className="text-gray-700 font-medium">{formatDate(customerDetails.stats?.firstOrderDate)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Last Order:</span>
                                <span className="text-gray-700 font-medium">{formatDate(customerDetails.stats?.lastOrderDate)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Account Created:</span>
                                <span className="text-gray-700 font-medium">{formatDate(customerDetails.customer?.createdAt)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Category Breakdown */}
                          {customerDetails.categoryBreakdown && customerDetails.categoryBreakdown.length > 0 && (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h4 className="font-medium text-gray-700 mb-2">Category Spending</h4>
                              <div className="space-y-2">
                                {customerDetails.categoryBreakdown.slice(0, 4).map((cat, idx) => (
                                  <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-gray-600">{cat.category}</span>
                                    <span className="font-medium text-gray-700">{formatCurrency(cat.totalSpent)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Cart & Wishlist Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {customerDetails.customer?.wishlist && customerDetails.customer.wishlist.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <FiHeart className="text-pink-500" />
                                Wishlist ({customerDetails.customer.wishlist.length} items)
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {customerDetails.customer.wishlist.slice(0, 6).map((product) => (
                                  <div key={product._id} className="bg-pink-50 text-pink-700 px-3 py-1 rounded-full text-sm">
                                    {product.name}
                                  </div>
                                ))}
                                {customerDetails.customer.wishlist.length > 6 && (
                                  <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                                    +{customerDetails.customer.wishlist.length - 6} more
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {customerDetails.customer?.cartItems && customerDetails.customer.cartItems.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <FiShoppingCart className="text-blue-500" />
                                Cart ({customerDetails.customer.cartItems.length} items)
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {customerDetails.customer.cartItems.slice(0, 6).map((item, idx) => (
                                  <div key={idx} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                                    {item.name} (×{item.quantity})
                                  </div>
                                ))}
                                {customerDetails.customer.cartItems.length > 6 && (
                                  <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                                    +{customerDetails.customer.cartItems.length - 6} more
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Orders Tab */}
                    {activeTab === 'orders' && (
                      <>
                        {customerDetails.orders && customerDetails.orders.length > 0 ? (
                          <div className="space-y-3">
                            {customerDetails.orders.map((order) => (
                              <div key={order._id} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <p className="font-semibold text-gray-800">Order #{order.orderNumber || order._id.slice(-8)}</p>
                                    <p className="text-sm text-gray-500">{formatDate(order.orderDate)}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-gray-800">{formatCurrency(order.grandTotal)}</p>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700' :
                                      order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                      order.orderStatus === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                                      order.orderStatus === 'Processing' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {order.orderStatus}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {order.items.slice(0, 3).map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-white px-2 py-1 rounded text-sm">
                                      {item.image && (
                                        <img src={item.image} alt={item.name} className="w-8 h-8 object-cover rounded" />
                                      )}
                                      <span className="text-gray-700">{item.name} (×{item.quantity})</span>
                                    </div>
                                  ))}
                                  {order.items.length > 3 && (
                                    <span className="text-sm text-gray-500 self-center">+{order.items.length - 3} more</span>
                                  )}
                                </div>
                                {order.couponCode && (
                                  <p className="text-sm text-green-600 mt-2">
                                    Coupon: {order.couponCode} (-{formatCurrency(order.couponDiscount)})
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            <FiShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No orders yet</p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Returns Tab */}
                    {activeTab === 'returns' && (
                      <>
                        {/* Replacement Stats Summary */}
                        {customerDetails.replacementStats && customerDetails.replacementStats.total > 0 && (
                          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 mb-6">
                            <h4 className="font-semibold text-gray-800 mb-3">Replacement/Return Statistics</h4>
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                              <div className="text-center bg-white rounded-lg p-2 shadow-sm">
                                <p className="text-xl font-bold text-gray-700">{customerDetails.replacementStats?.total || 0}</p>
                                <p className="text-xs text-gray-500">Total</p>
                              </div>
                              <div className="text-center bg-white rounded-lg p-2 shadow-sm">
                                <p className="text-xl font-bold text-yellow-600">{customerDetails.replacementStats?.pending || 0}</p>
                                <p className="text-xs text-gray-500">Pending</p>
                              </div>
                              <div className="text-center bg-white rounded-lg p-2 shadow-sm">
                                <p className="text-xl font-bold text-blue-600">{customerDetails.replacementStats?.approved || 0}</p>
                                <p className="text-xs text-gray-500">In Progress</p>
                              </div>
                              <div className="text-center bg-white rounded-lg p-2 shadow-sm">
                                <p className="text-xl font-bold text-green-600">{customerDetails.replacementStats?.completed || 0}</p>
                                <p className="text-xs text-gray-500">Replaced</p>
                              </div>
                              <div className="text-center bg-white rounded-lg p-2 shadow-sm">
                                <p className="text-xl font-bold text-purple-600">{customerDetails.replacementStats?.refunded || 0}</p>
                                <p className="text-xs text-gray-500">Refunded</p>
                              </div>
                              <div className="text-center bg-white rounded-lg p-2 shadow-sm">
                                <p className="text-xl font-bold text-red-600">{customerDetails.replacementStats?.rejected || 0}</p>
                                <p className="text-xs text-gray-500">Rejected</p>
                              </div>
                            </div>
                            {customerDetails.replacementStats?.totalRefundAmount > 0 && (
                              <div className="mt-4 text-center bg-green-100 rounded-lg p-3">
                                <p className="text-sm text-gray-600">Total Refund Amount</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(customerDetails.replacementStats.totalRefundAmount)}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Replacement History List */}
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <FiRefreshCw className="text-orange-500" />
                            Replacement/Return History
                          </h4>
                          {customerDetails.replacements && customerDetails.replacements.length > 0 ? (
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                              {customerDetails.replacements.map((replacement) => (
                                <div key={replacement._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                  {/* Header */}
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <span className="text-xs text-gray-500">Request #{replacement._id.slice(-8)}</span>
                                      <p className="font-medium text-gray-800">{replacement.productName}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                      replacement.status === 'Refunded' ? 'bg-green-100 text-green-700' :
                                      replacement.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                                      replacement.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                      replacement.status === 'Requested' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-purple-100 text-purple-700'
                                    }`}>
                                      {replacement.status}
                                    </span>
                                  </div>

                                  {/* Product & Reason */}
                                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                    <div>
                                      <span className="text-gray-500">Quantity:</span>
                                      <span className="ml-2 font-medium">{replacement.quantity}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Price:</span>
                                      <span className="ml-2 font-medium">{formatCurrency(replacement.price)}</span>
                                    </div>
                                    <div className="col-span-2">
                                      <span className="text-gray-500">Reason:</span>
                                      <span className="ml-2 font-medium text-orange-600">{replacement.reason}</span>
                                    </div>
                                  </div>

                                  {/* Order Info with Delivery Fee */}
                                  {replacement.order && (
                                    <div className="bg-white rounded p-3 mb-3 text-sm">
                                      <p className="text-gray-500 text-xs mb-2">Order Details:</p>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <span className="text-gray-500">Order ID:</span>
                                          <span className="ml-1 font-mono">#{replacement.order._id?.slice(-8)}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Order Date:</span>
                                          <span className="ml-1">{formatDate(replacement.order.orderDate)}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Items Total:</span>
                                          <span className="ml-1">{formatCurrency(replacement.order.itemsTotal)}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Delivery Fee:</span>
                                          <span className={`ml-1 ${replacement.order.deliveryFee > 0 ? '' : 'text-green-600'}`}>
                                            {replacement.order.deliveryFee > 0 ? formatCurrency(replacement.order.deliveryFee) : 'FREE'}
                                          </span>
                                        </div>
                                        {replacement.order.couponDiscount > 0 && (
                                          <div className="col-span-2">
                                            <span className="text-gray-500">Coupon Discount:</span>
                                            <span className="ml-1 text-green-600">-{formatCurrency(replacement.order.couponDiscount)}</span>
                                          </div>
                                        )}
                                        <div>
                                          <span className="text-gray-500">Grand Total:</span>
                                          <span className="ml-1 font-bold">{formatCurrency(replacement.order.grandTotal)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Refund Info */}
                                  {replacement.refund?.amount && (
                                    <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                                      <p className="text-sm font-medium text-green-800 mb-2">Refund Details</p>
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                          <span className="text-gray-600">Amount:</span>
                                          <span className="ml-2 font-bold text-green-600">{formatCurrency(replacement.refund.amount)}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-600">Method:</span>
                                          <span className="ml-2">{replacement.refund.method || 'N/A'}</span>
                                        </div>
                                        {replacement.refund.transactionId && (
                                          <div className="col-span-2">
                                            <span className="text-gray-600">Transaction ID:</span>
                                            <span className="ml-2 font-mono text-xs">{replacement.refund.transactionId}</span>
                                          </div>
                                        )}
                                        {replacement.refund.processedAt && (
                                          <div className="col-span-2">
                                            <span className="text-gray-600">Processed:</span>
                                            <span className="ml-2">{formatDate(replacement.refund.processedAt)}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Timeline */}
                                  <div className="text-xs text-gray-500">
                                    <span>Requested: {formatDate(replacement.createdAt)}</span>
                                    {replacement.updatedAt && replacement.updatedAt !== replacement.createdAt && (
                                      <span className="ml-3">Updated: {formatDate(replacement.updatedAt)}</span>
                                    )}
                                  </div>

                                  {/* Admin Notes */}
                                  {replacement.adminNotes && (
                                    <div className="mt-2 text-xs bg-blue-50 text-blue-800 p-2 rounded">
                                      <span className="font-medium">Admin Note:</span> {replacement.adminNotes}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <FiRefreshCw className="w-12 h-12 mx-auto mb-3 opacity-50" />
                              <p>No replacement/return requests</p>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Products Tab */}
                    {activeTab === 'products' && (
                      <>
                        {customerDetails.topProducts && customerDetails.topProducts.length > 0 ? (
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-4">Products Purchased</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {customerDetails.topProducts.map((product, index) => (
                                <div key={index} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                                  {product.image ? (
                                    <img 
                                      src={product.image} 
                                      alt={product.name} 
                                      className="w-14 h-14 object-cover rounded-lg"
                                    />
                                  ) : (
                                    <div className="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center">
                                      <FiPackage className="w-6 h-6 text-gray-400" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-800 truncate">{product.name}</p>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500">
                                        {product.quantity} units • {product.purchaseCount} orders
                                      </span>
                                      <span className="font-medium text-green-600">{formatCurrency(product.totalSpent)}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            <FiPackage className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No products purchased yet</p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Activity Tab */}
                    {activeTab === 'activity' && (
                      <>
                        {/* Addresses */}
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <FiMapPin className="text-blue-500" />
                            Saved Addresses ({customerDetails.customer?.addresses?.length || 0})
                          </h4>
                          {customerDetails.customer?.addresses && customerDetails.customer.addresses.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {customerDetails.customer.addresses.map((addr, idx) => (
                                <div key={idx} className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                                  <p className="font-medium text-gray-800">{addr.fullName}</p>
                                  <p>{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}</p>
                                  <p>{addr.city}, {addr.state} - {addr.zipCode}</p>
                                  <p className="text-gray-500">{addr.phone}</p>
                                  {addr.isDefault && (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded mt-1 inline-block">Default</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No saved addresses</p>
                          )}
                        </div>

                        {/* Account Settings Summary */}
                        {customerDetails.customer?.settings && (
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-3">Notification Preferences</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className={`rounded-lg p-3 text-center text-sm ${customerDetails.customer.settings?.emailNotifications ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                Email: {customerDetails.customer.settings?.emailNotifications ? 'On' : 'Off'}
                              </div>
                              <div className={`rounded-lg p-3 text-center text-sm ${customerDetails.customer.settings?.pushNotifications ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                Push: {customerDetails.customer.settings?.pushNotifications ? 'On' : 'Off'}
                              </div>
                              <div className={`rounded-lg p-3 text-center text-sm ${customerDetails.customer.settings?.orderUpdates ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                Order Updates: {customerDetails.customer.settings?.orderUpdates ? 'On' : 'Off'}
                              </div>
                              <div className={`rounded-lg p-3 text-center text-sm ${customerDetails.customer.settings?.promotionalEmails ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                Promos: {customerDetails.customer.settings?.promotionalEmails ? 'On' : 'Off'}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FiUsers className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium mb-2">Failed to load customer details</p>
                    <p className="text-sm">Please try clicking on the customer again or refresh the page.</p>
                    <button 
                      onClick={() => selectedCustomer && fetchCustomerDetails(selectedCustomer._id)}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCustomers;
