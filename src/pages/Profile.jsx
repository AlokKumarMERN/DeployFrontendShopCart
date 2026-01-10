import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ordersAPI, authAPI, productsAPI, couponsAPI, replacementsAPI } from '../api/api';
import { getGoogleDriveImageUrl } from '../utils/imageHelper';
import LocationPicker from '../components/LocationPicker';
import { useToast } from '../context/ToastContext';
import html2pdf from 'html2pdf.js';

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const { clearCart } = useCart();
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // New states for wishlist, coupons, notifications, settings
  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [settings, setSettings] = useState({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // States for replacement and invoice
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [replacementItem, setReplacementItem] = useState(null);
  const [replacementOrder, setReplacementOrder] = useState(null);
  const [replacementEligibility, setReplacementEligibility] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [replacementForm, setReplacementForm] = useState({
    reason: '',
    description: '',
  });
  const [submittingReplacement, setSubmittingReplacement] = useState(false);
  const [userReplacements, setUserReplacements] = useState([]);
  const [downloadingInvoice, setDownloadingInvoice] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchOrders();
    fetchWishlist();
    fetchNotifications();
    fetchSettings();
    fetchUserReplacements();
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getAll();
      console.log('Orders fetched:', response.data);
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      console.error('Error response:', error.response?.data);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      setWishlistLoading(true);
      const response = await authAPI.getWishlist();
      setWishlist(response.data.data || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setWishlist([]);
    } finally {
      setWishlistLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const response = await authAPI.getNotifications();
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setSettingsLoading(true);
      const response = await authAPI.getSettings();
      setSettings(response.data.data || {});
    } catch (error) {
      console.error('Error fetching settings:', error);
      setSettings({});
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchUserReplacements = async () => {
    try {
      const response = await replacementsAPI.getUserReplacements();
      setUserReplacements(response.data.data || []);
    } catch (error) {
      console.error('Error fetching user replacements:', error);
      setUserReplacements([]);
    }
  };

  // Invoice download function
  const handleDownloadInvoice = async (order) => {
    try {
      setDownloadingInvoice(order._id);
      const response = await ordersAPI.getInvoice(order._id);
      const invoiceData = response.data.data;
      
      // Generate HTML content
      const invoiceHTML = generateInvoiceHTML(invoiceData);
      
      // Create a temporary container for the HTML
      const container = document.createElement('div');
      container.innerHTML = invoiceHTML;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);
      
      // PDF options
      const options = {
        margin: 10,
        filename: `Invoice-${invoiceData.invoiceNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      // Generate and download PDF
      await html2pdf().set(options).from(container).save();
      
      // Cleanup
      document.body.removeChild(container);
      
      addToast('Invoice downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      addToast('Failed to download invoice', 'error');
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const generateInvoiceHTML = (invoice) => {
    const orderStatusColors = {
      'Pending': '#f59e0b',
      'Processing': '#3b82f6',
      'Shipped': '#8b5cf6',
      'Delivered': '#22c55e',
      'Cancelled': '#ef4444',
    };
    
    const statusColor = orderStatusColors[invoice.orderStatus] || '#666';
    const isCancelled = invoice.orderStatus === 'Cancelled';
    const isDelivered = invoice.orderStatus === 'Delivered';
    const hasRefunds = invoice.hasRefunds || false;

    const itemsHTML = invoice.items.map(item => {
      const isRefunded = item.returnStatus === 'refunded';
      const rowStyle = isRefunded ? 'background: #fef2f2;' : '';
      return `
      <tr style="${rowStyle}">
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${item.name || 'Product'}
          ${item.size ? `<br><span style="font-size: 11px; color: #888;">Size: ${item.size}</span>` : ''}
          ${isRefunded ? '<br><span style="font-size: 11px; color: #ef4444; font-weight: 500;">⟳ Refunded</span>' : ''}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity || 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price || 0).toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; ${isRefunded ? 'text-decoration: line-through; color: #999;' : ''}">₹${(item.subtotal || 0).toFixed(2)}</td>
      </tr>
    `}).join('');

    // Refunded items section
    let refundSectionHTML = '';
    if (hasRefunds && invoice.refundedItems && invoice.refundedItems.length > 0) {
      const refundItemsHTML = invoice.refundedItems.map(item => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #fecaca; font-size: 12px;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #fecaca; font-size: 12px; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #fecaca; font-size: 12px;">${item.reason}</td>
          <td style="padding: 8px; border-bottom: 1px solid #fecaca; font-size: 12px; text-align: right; color: #dc2626; font-weight: 500;">₹${(item.refundAmount || 0).toFixed(2)}</td>
        </tr>
      `).join('');

      refundSectionHTML = `
      <div style="margin: 25px 0; padding: 15px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
        <h3 style="margin: 0 0 12px; color: #dc2626; font-size: 14px; display: flex; align-items: center;">
          ↩ Refund Details
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding: 8px; text-align: left; border-bottom: 2px solid #fecaca; font-size: 12px; color: #991b1b;">Item</th>
              <th style="padding: 8px; text-align: center; border-bottom: 2px solid #fecaca; font-size: 12px; color: #991b1b;">Qty</th>
              <th style="padding: 8px; text-align: left; border-bottom: 2px solid #fecaca; font-size: 12px; color: #991b1b;">Reason</th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #fecaca; font-size: 12px; color: #991b1b;">Refund</th>
            </tr>
          </thead>
          <tbody>
            ${refundItemsHTML}
          </tbody>
        </table>
        ${invoice.deliveryFeeRefunded ? `
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #fecaca; display: flex; justify-content: space-between; font-size: 12px;">
          <span style="color: #991b1b;">Delivery Fee Refunded:</span>
          <span style="color: #dc2626; font-weight: 500;">₹${(invoice.deliveryFee || 0).toFixed(2)}</span>
        </div>
        ` : ''}
        <div style="margin-top: 10px; padding-top: 10px; border-top: 2px solid #dc2626; display: flex; justify-content: space-between; font-weight: bold;">
          <span style="color: #991b1b;">Total Refunded:</span>
          <span style="color: #dc2626;">₹${(invoice.totalRefundedAmount || 0).toFixed(2)}</span>
        </div>
      </div>
      `;
    }

    // Cancellation section
    let cancellationHTML = '';
    if (isCancelled && invoice.cancellation) {
      cancellationHTML = `
      <div style="margin: 25px 0; padding: 15px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
        <h3 style="margin: 0 0 8px; color: #dc2626; font-size: 14px;">Order Cancelled</h3>
        <p style="margin: 0; font-size: 13px; color: #991b1b;">
          <strong>Reason:</strong> ${invoice.cancellation.reason || 'Not specified'}
        </p>
        <p style="margin: 5px 0 0; font-size: 12px; color: #888;">
          Cancelled on: ${invoice.cancellation.cancelledAt ? new Date(invoice.cancellation.cancelledAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
        </p>
      </div>
      `;
    }

    // Document title based on status
    let documentTitle = 'INVOICE';
    let documentSubtitle = '';
    if (isCancelled) {
      documentTitle = 'CANCELLED ORDER';
      documentSubtitle = '<p style="margin: 5px 0; color: #ef4444; font-weight: bold;">This order has been cancelled</p>';
    } else if (!isDelivered) {
      documentTitle = 'ORDER RECEIPT';
      documentSubtitle = `<p style="margin: 5px 0; color: ${statusColor}; font-weight: 500;">Status: ${invoice.orderStatus}</p>`;
    } else if (hasRefunds) {
      documentTitle = 'INVOICE (WITH REFUNDS)';
    }

    return `
<div style="font-family: Arial, sans-serif; padding: 30px; max-width: 800px; margin: 0 auto; background: white;">
  <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid ${statusColor}; padding-bottom: 15px;">
    <h1 style="margin: 0; color: #333; font-size: 28px;">${documentTitle}</h1>
    ${documentSubtitle}
    <p style="margin: 8px 0 0; color: #666;"><strong>Invoice No:</strong> ${invoice.invoiceNumber}</p>
    <p style="margin: 5px 0; color: #666;"><strong>Order No:</strong> ${invoice.orderNumber}</p>
    <p style="margin: 5px 0; color: #666;"><strong>Order Date:</strong> ${new Date(invoice.orderDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    ${isDelivered && invoice.deliveryDate ? `<p style="margin: 5px 0; color: #22c55e;"><strong>Delivered:</strong> ${new Date(invoice.deliveryDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
  </div>

  ${cancellationHTML}

  <div style="display: flex; justify-content: space-between; margin-bottom: 25px;">
    <div style="width: 48%;">
      <h3 style="margin: 0 0 10px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; font-size: 14px;">Bill To</h3>
      <p style="margin: 5px 0; color: #555; font-size: 13px;"><strong>${invoice.customer?.name || 'Customer'}</strong></p>
      <p style="margin: 5px 0; color: #555; font-size: 13px;">${invoice.customer?.email || ''}</p>
      <p style="margin: 5px 0; color: #555; font-size: 13px;">${invoice.shippingAddress?.phone || ''}</p>
    </div>
    <div style="width: 48%;">
      <h3 style="margin: 0 0 10px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; font-size: 14px;">Ship To</h3>
      <p style="margin: 5px 0; color: #555; font-size: 13px;">${invoice.shippingAddress?.fullName || ''}</p>
      <p style="margin: 5px 0; color: #555; font-size: 13px;">${invoice.shippingAddress?.addressLine1 || ''}</p>
      ${invoice.shippingAddress?.addressLine2 ? `<p style="margin: 5px 0; color: #555; font-size: 13px;">${invoice.shippingAddress.addressLine2}</p>` : ''}
      <p style="margin: 5px 0; color: #555; font-size: 13px;">${invoice.shippingAddress?.city || ''}, ${invoice.shippingAddress?.state || ''} - ${invoice.shippingAddress?.zipCode || ''}</p>
    </div>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
    <thead>
      <tr>
        <th style="background: #f5f5f5; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; font-size: 13px;">Item</th>
        <th style="background: #f5f5f5; padding: 10px; text-align: center; border-bottom: 2px solid #ddd; font-size: 13px;">Qty</th>
        <th style="background: #f5f5f5; padding: 10px; text-align: right; border-bottom: 2px solid #ddd; font-size: 13px;">Price</th>
        <th style="background: #f5f5f5; padding: 10px; text-align: right; border-bottom: 2px solid #ddd; font-size: 13px;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>

  ${refundSectionHTML}

  <div style="margin-left: auto; width: 300px;">
    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 13px;">
      <span>Subtotal:</span>
      <span>₹${(invoice.itemsTotal || 0).toFixed(2)}</span>
    </div>
    ${(invoice.couponDiscount || 0) > 0 ? `
    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 13px; color: #16a34a;">
      <span>Discount${invoice.couponCode ? ` (${invoice.couponCode})` : ''}:</span>
      <span>-₹${(invoice.couponDiscount || 0).toFixed(2)}</span>
    </div>
    ` : ''}
    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 13px;">
      <span>Delivery Charges:</span>
      <span ${invoice.deliveryFeeRefunded ? 'style="text-decoration: line-through; color: #999;"' : ''}>${(invoice.deliveryFee || 0) > 0 ? '₹' + (invoice.deliveryFee || 0).toFixed(2) : 'FREE'}</span>
    </div>
    <div style="display: flex; justify-content: space-between; padding: 10px 0; font-size: 16px; font-weight: bold; color: #333; border-top: 2px solid #333; margin-top: 5px;">
      <span>Order Total:</span>
      <span ${hasRefunds ? 'style="text-decoration: line-through; color: #999;"' : ''}>₹${(invoice.grandTotal || 0).toFixed(2)}</span>
    </div>
    ${hasRefunds ? `
    <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #dc2626;">
      <span>Total Refunded:</span>
      <span>-₹${(invoice.totalRefundedAmount || 0).toFixed(2)}</span>
    </div>
    <div style="display: flex; justify-content: space-between; padding: 10px 0; font-size: 18px; font-weight: bold; color: #22c55e; border-top: 2px solid #22c55e;">
      <span>Net Payable:</span>
      <span>₹${(invoice.netPayable || 0).toFixed(2)}</span>
    </div>
    ` : ''}
  </div>

  <div style="margin-top: 25px; padding: 12px; background: #f9f9f9; border-radius: 5px; font-size: 13px;">
    <p style="margin: 0;"><strong>Payment Method:</strong> ${invoice.paymentMethod || 'COD'}</p>
    <p style="margin: 5px 0 0;"><strong>Payment Status:</strong> <span style="color: ${invoice.paymentStatus === 'Paid' ? '#22c55e' : invoice.paymentStatus === 'Failed' ? '#ef4444' : '#f59e0b'}">${invoice.paymentStatus || 'Pending'}</span></p>
    <p style="margin: 5px 0 0;"><strong>Order Status:</strong> <span style="color: ${statusColor}; font-weight: 500;">${invoice.orderStatus}</span></p>
  </div>

  <div style="text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; color: #888; font-size: 12px;">
    ${isCancelled ? '<p style="margin: 0; color: #ef4444;">This order was cancelled.</p>' : '<p style="margin: 0;">Thank you for your purchase!</p>'}
    <p style="margin: 5px 0 0;">For any queries, please contact our support team.</p>
    <p style="margin: 5px 0 0; color: #aaa;">Generated on: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
  </div>
</div>
    `;
  };

  // Replacement functions
  const checkReplacementEligibility = async (order, item) => {
    try {
      setCheckingEligibility(true);
      const productId = typeof item.product === 'object' ? item.product._id : item.product;
      const response = await replacementsAPI.checkEligibility(order._id, productId);
      setReplacementEligibility(response.data);
      return response.data;
    } catch (error) {
      console.error('Error checking eligibility:', error);
      setReplacementEligibility({ eligible: false, message: error.response?.data?.message || 'Error checking eligibility' });
      return { eligible: false };
    } finally {
      setCheckingEligibility(false);
    }
  };

  const openReplacementModal = async (order, item) => {
    setReplacementOrder(order);
    setReplacementItem(item);
    setReplacementForm({ reason: '', description: '' });
    setShowReplacementModal(true);
    await checkReplacementEligibility(order, item);
  };

  const handleSubmitReplacement = async () => {
    if (!replacementForm.reason) {
      addToast('Please select a reason for replacement', 'error');
      return;
    }
    if (!replacementForm.description.trim()) {
      addToast('Please provide a description', 'error');
      return;
    }

    try {
      setSubmittingReplacement(true);
      const productId = typeof replacementItem.product === 'object' ? replacementItem.product._id : replacementItem.product;
      
      await replacementsAPI.request({
        orderId: replacementOrder._id,
        productId: productId,
        reason: replacementForm.reason,
        description: replacementForm.description,
      });

      addToast('Replacement request submitted successfully', 'success');
      setShowReplacementModal(false);
      fetchUserReplacements();
    } catch (error) {
      console.error('Error submitting replacement:', error);
      addToast(error.response?.data?.message || 'Failed to submit replacement request', 'error');
    } finally {
      setSubmittingReplacement(false);
    }
  };

  const getReplacementStatus = (orderId, productId) => {
    const replacement = userReplacements.find(r => 
      r.order._id === orderId && r.productId === productId
    );
    return replacement;
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      await authAPI.removeFromWishlist(productId);
      setWishlist(wishlist.filter(item => item._id !== productId));
      addToast('Removed from wishlist', 'success');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      addToast('Failed to remove from wishlist', 'error');
    }
  };

  const handleMarkNotificationRead = async (notificationId) => {
    try {
      await authAPI.markNotificationRead(notificationId);
      setNotifications(notifications.map(n => 
        n._id === notificationId ? { ...n, isRead: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await authAPI.markAllNotificationsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      addToast('All notifications marked as read', 'success');
      // Dispatch event to update notification count in Header
      window.dispatchEvent(new CustomEvent('notificationsMarkedRead'));
    } catch (error) {
      console.error('Error marking all notifications read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await authAPI.deleteNotification(notificationId);
      setNotifications(notifications.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      await authAPI.updateSettings(settings);
      addToast('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      addToast('Failed to save settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogout = () => {
    logout(clearCart);
    navigate('/');
  };

  const openCancelModal = (order) => {
    setSelectedOrder(order);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    try {
      setCancelling(true);
      await ordersAPI.cancel(selectedOrder._id, cancelReason);
      
      // Update local state
      setOrders(orders.map(order => 
        order._id === selectedOrder._id 
          ? { 
              ...order, 
              orderStatus: 'Cancelled',
              cancellation: {
                reason: cancelReason,
                cancelledAt: new Date(),
                cancelledBy: 'user'
              }
            } 
          : order
      ));
      
      setShowCancelModal(false);
      alert('Order cancelled successfully');
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const openReviewModal = (item) => {
    console.log('Opening review modal for item:', item);
    
    let productId = null;
    let productName = item.name || 'Product';
    let productImage = item.image || '';
    
    // Try multiple ways to get the product ID
    if (item.product) {
      if (typeof item.product === 'object' && item.product !== null) {
        productId = item.product._id || item.product.id;
        productName = item.product.name || productName;
        productImage = item.product.images?.[0] || productImage;
      } else if (typeof item.product === 'string') {
        productId = item.product;
      }
    }
    
    // Fallback: use item's _id as product reference
    if (!productId && item._id) {
      productId = item._id;
    }
    
    console.log('Product ID extracted:', productId);
    
    if (!productId) {
      console.error('Failed to extract product ID from item:', item);
      alert('Unable to load product information for review.');
      return;
    }
    
    setReviewProduct({ 
      id: productId, 
      name: productName, 
      image: productImage 
    });
    setReviewData({ rating: 5, comment: '' });
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewData.comment.trim()) {
      alert('Please write a comment');
      return;
    }

    try {
      setSubmittingReview(true);
      await productsAPI.addReview(reviewProduct.id, reviewData);
      setShowReviewModal(false);
      alert('Thank you for your review!');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const openAddressModal = (address = null, index = null) => {
    if (address) {
      setEditingAddress(index);
      setAddressForm(address);
    } else {
      setEditingAddress(null);
      setAddressForm({
        fullName: user?.name || '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: '',
      });
    }
    setShowAddressModal(true);
  };

  const handleLocationSelect = (locationData) => {
    console.log('📍 Location data received in Profile:', locationData);
    
    // Auto-fill address fields with detected location
    setAddressForm(prev => {
      const updated = {
        ...prev,
        city: locationData.city || prev.city,
        state: locationData.state || prev.state,
        zipCode: locationData.zipCode || prev.zipCode,
        addressLine1: locationData.streetAddress || prev.addressLine1,
      };
      console.log('✅ Updated address form:', updated);
      return updated;
    });
  };

  const handleSaveAddress = async () => {
    // Validate form
    if (!addressForm.fullName || !addressForm.phone || !addressForm.addressLine1 || 
        !addressForm.city || !addressForm.state || !addressForm.zipCode) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const updatedAddresses = [...(user.addresses || [])];
      
      if (editingAddress !== null) {
        updatedAddresses[editingAddress] = addressForm;
      } else {
        updatedAddresses.push(addressForm);
      }

      console.log('Sending addresses to backend:', updatedAddresses);
      const response = await authAPI.updateAddresses(updatedAddresses);
      console.log('Backend response:', response.data);
      
      updateUser(response.data.data);
      setShowAddressModal(false);
      alert(editingAddress !== null ? 'Address updated successfully' : 'Address added successfully');
    } catch (error) {
      console.error('Error saving address:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert(error.response?.data?.message || 'Failed to save address');
    }
  };

  const handleDeleteAddress = async (index) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      const updatedAddresses = user.addresses.filter((_, i) => i !== index);
      const response = await authAPI.updateAddresses(updatedAddresses);
      updateUser(response.data.data);
      alert('Address deleted successfully');
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Failed to delete address');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Processing: 'bg-blue-100 text-blue-800',
      Shipped: 'bg-purple-100 text-purple-800',
      Delivered: 'bg-green-100 text-green-800',
      Cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const canCancelOrder = (order) => {
    return order.orderStatus !== 'Cancelled' && 
           order.orderStatus !== 'Delivered' && 
           order.orderStatus !== 'Shipped';
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6 mb-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Welcome, {user?.name}!
              </h1>
              <p className="text-gray-600">{user?.email}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {user?.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Admin Dashboard
                </button>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex flex-wrap border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 min-w-max py-4 px-4 font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'orders'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="hidden sm:inline">Orders</span>
            </button>
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`flex-1 min-w-max py-4 px-4 font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'wishlist'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="hidden sm:inline">Wishlist</span>
              {wishlist.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{wishlist.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`flex-1 min-w-max py-4 px-4 font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'addresses'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline">Addresses</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 min-w-max py-4 px-4 font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'notifications'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="hidden sm:inline">Notifications</span>
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 min-w-max py-4 px-4 font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'settings'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button
              onClick={() => setActiveTab('help')}
              className={`flex-1 min-w-max py-4 px-4 font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'help'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">Help</span>
            </button>
          </div>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <svg
                  className="w-20 h-20 mx-auto text-gray-300 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No Orders Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  You haven't placed any orders. Start shopping now!
                </p>
                <button
                  onClick={() => navigate('/shopping')}
                  className="btn-primary"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order, index) => (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg shadow-md p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1">
                          Order #{order._id.slice(-8)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(order.orderDate).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          order.orderStatus
                        )}`}
                      >
                        {order.orderStatus}
                      </span>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-3 mb-4">
                      {order.items && order.items.map((item, idx) => (
                        <div key={idx} className="border-b pb-3 last:border-b-0">
                          <div 
                            className="flex gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                            onClick={() => {
                              const productId = typeof item.product === 'object' ? item.product._id : item.product;
                              if (productId) {
                                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                                document.documentElement.scrollTop = 0;
                                document.body.scrollTop = 0;
                                navigate(`/product/${productId}`);
                              }
                            }}
                          >
                            {item.image && (
                              <img
                                src={getGoogleDriveImageUrl(item.image)}
                                alt={item.name || 'Product'}
                                className="w-16 h-16 object-cover rounded hover:scale-105 transition-transform"
                                crossOrigin="anonymous"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/images/products/placeholder.svg';
                                }}
                              />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900 hover:text-primary-600 transition-colors">{item.name}</p>
                                {/* Return Status Badge */}
                                {item.returnStatus && item.returnStatus !== 'none' && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    item.returnStatus === 'returned' ? 'bg-purple-100 text-purple-700' :
                                    item.returnStatus === 'refunded' ? 'bg-green-100 text-green-700' :
                                    item.returnStatus === 'requested' ? 'bg-yellow-100 text-yellow-700' :
                                    item.returnStatus === 'approved' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {item.returnStatus === 'returned' && '↩ Returned'}
                                    {item.returnStatus === 'refunded' && '💰 Refunded'}
                                    {item.returnStatus === 'requested' && '⏳ Return Requested'}
                                    {item.returnStatus === 'approved' && '✓ Return Approved'}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                Qty: {item.quantity} × ₹{(item.price || 0).toFixed(2)}
                                {item.size && ` (${item.size})`}
                              </p>
                              {item.refundAmount && item.returnStatus === 'refunded' && (
                                <p className="text-sm text-green-600 font-medium">
                                  Refund: ₹{item.refundAmount.toFixed(2)}
                                </p>
                              )}
                            </div>
                            <p className={`font-semibold ${item.returnStatus === 'refunded' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                              ₹{(item.subtotal || 0).toFixed(2)}
                            </p>
                          </div>
                          {/* Review Button for Delivered Orders */}
                          {order.orderStatus === 'Delivered' && (
                            <div className="mt-2 flex flex-wrap justify-end gap-2">
                              {/* Show Replace button only if not already returned/refunded */}
                              {item.returnStatus !== 'returned' && item.returnStatus !== 'refunded' && (
                                <>
                                  {/* Check if replacement already requested */}
                                  {(() => {
                                    const productId = typeof item.product === 'object' ? item.product._id : item.product;
                                    const existingReplacement = userReplacements.find(r => 
                                      r.order?._id === order._id && r.productId === productId
                                    );
                                    
                                    if (existingReplacement) {
                                      return (
                                        <span className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                                          existingReplacement.status === 'Completed' || existingReplacement.status === 'Refunded' 
                                            ? 'bg-green-100 text-green-700'
                                            : existingReplacement.status === 'Rejected'
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-blue-100 text-blue-700'
                                        }`}>
                                          Replacement: {existingReplacement.status}
                                        </span>
                                      );
                                    }
                                    return (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openReplacementModal(order, item);
                                        }}
                                        className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Replace
                                      </button>
                                    );
                                  })()}
                                </>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openReviewModal(item);
                                }}
                                className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                Write Review
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Order Summary */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Total Items:</span>
                        <span className="font-medium">
                          {order.items ? order.items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Items Total:</span>
                        <span className="font-medium">₹{(order.itemsTotal || 0).toFixed(2)}</span>
                      </div>
                      {(order.deliveryFee || 0) > 0 && (
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-600">Delivery Fee:</span>
                          <span className="font-medium">₹{(order.deliveryFee || 0).toFixed(2)}</span>
                        </div>
                      )}
                      {(order.deliveryFee === 0 || order.deliveryFee === undefined) && (
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-600">Delivery Fee:</span>
                          <span className="font-medium text-green-600">FREE</span>
                        </div>
                      )}
                      {(order.couponDiscount || 0) > 0 && (
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-600">Coupon Discount{order.couponCode ? ` (${order.couponCode})` : ''}:</span>
                          <span className="font-medium text-green-600">-₹{(order.couponDiscount || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="font-medium">{order.paymentMethod || 'COD'}</span>
                      </div>
                      <div className="flex justify-between items-center text-lg font-bold border-t pt-2 mt-2">
                        <span>Grand Total:</span>
                        <span className="text-primary-600">₹{(order.grandTotal || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="mt-4 pt-4 border-t">
                      <p className="font-medium text-gray-700 mb-1">
                        Shipping Address:
                      </p>
                      {order.shippingAddress && (
                        <p className="text-sm text-gray-600">
                          {order.shippingAddress.fullName},{' '}
                          {order.shippingAddress.phone}
                          <br />
                          {order.shippingAddress.addressLine1}
                          {order.shippingAddress.addressLine2 &&
                            `, ${order.shippingAddress.addressLine2}`}
                          <br />
                          {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                          {order.shippingAddress.zipCode}
                        </p>
                      )}
                    </div>

                    {/* Cancellation Info */}
                    {order.cancellation && (
                      <div className="mt-4 pt-4 border-t bg-red-50 -mx-6 px-6 py-4">
                        <p className="font-medium text-red-900 mb-2">
                          ❌ Order Cancelled
                        </p>
                        <p className="text-sm text-red-700 mb-1">
                          <span className="font-medium">Reason:</span> {order.cancellation.reason || 'Not specified'}
                        </p>
                        <p className="text-sm text-red-600">
                          Cancelled on {new Date(order.cancellation.cancelledAt).toLocaleDateString('en-IN')} by{' '}
                          <span className="font-medium">
                            {order.cancellation.cancelledBy === 'admin' ? 'Store Admin' : 'You'}
                          </span>
                        </p>
                        {order.cancellation.cancelledBy === 'admin' && (
                          <p className="text-xs text-red-500 mt-2 italic">
                            This order was cancelled by the store admin. If you have any questions, please contact support.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Delivery Information */}
                    {(order.deliveryAgent || order.estimatedDeliveryDate) && order.orderStatus !== 'Cancelled' && (
                      <div className="mt-4 pt-4 border-t bg-blue-50 px-6 py-4 -mx-6">
                        <p className="font-medium text-gray-900 mb-2">
                          🚚 Delivery Information
                        </p>
                        {order.deliveryAgent && (
                          <div className="mb-2">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Delivery Agent:</span> {order.deliveryAgent.name}
                            </p>
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Contact:</span> {order.deliveryAgent.phone}
                            </p>
                          </div>
                        )}
                        {order.estimatedDeliveryDate && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Estimated Delivery:</span>{' '}
                            {new Date(order.estimatedDeliveryDate).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Cancel Order Button */}
                    {canCancelOrder(order) && (
                      <div className="mt-4 pt-4 border-t">
                        <button
                          onClick={() => openCancelModal(order)}
                          className="w-full sm:w-auto px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                        >
                          Cancel Order
                        </button>
                      </div>
                    )}

                    {/* Download Invoice Button for Delivered Orders */}
                    {order.orderStatus === 'Delivered' && (
                      <div className="mt-4 pt-4 border-t">
                        <button
                          onClick={() => handleDownloadInvoice(order)}
                          disabled={downloadingInvoice === order._id}
                          className="w-full sm:w-auto px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {downloadingInvoice === order._id ? (
                            <>
                              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Downloading...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Download Invoice
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Saved Addresses</h2>
              <button
                onClick={() => openAddressModal()}
                className="btn-primary"
              >
                + Add New Address
              </button>
            </div>
            {user?.addresses && user.addresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.addresses.map((addr, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:border-primary-500 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-gray-900">{addr.fullName}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openAddressModal(addr, index)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {addr.phone}
                      <br />
                      {addr.addressLine1}
                      {addr.addressLine2 && `, ${addr.addressLine2}`}
                      <br />
                      {addr.city}, {addr.state} - {addr.zipCode}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No saved addresses yet.</p>
                <button
                  onClick={() => openAddressModal()}
                  className="btn-primary"
                >
                  Add Your First Address
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Wishlist Tab */}
        {activeTab === 'wishlist' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-bold mb-6">My Wishlist</h2>
            {wishlistLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse border rounded-lg p-4">
                    <div className="h-40 bg-gray-200 rounded mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : wishlist.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Your Wishlist is Empty</h3>
                <p className="text-gray-600 mb-6">Save items you love by clicking the heart icon on products</p>
                <button onClick={() => navigate('/shopping')} className="btn-primary">
                  Browse Products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {wishlist.map((product) => (
                  <div key={product._id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    <div 
                      className="relative aspect-square cursor-pointer"
                      onClick={() => navigate(`/product/${product._id}`)}
                    >
                      <img
                        src={getGoogleDriveImageUrl(product.images?.[0])}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                        onError={(e) => { e.target.onerror = null; e.target.src = '/images/products/placeholder.svg'; }}
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveFromWishlist(product._id); }}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
                      <p className="text-primary-600 font-bold">₹{product.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Notifications</h2>
              {notifications.length > 0 && (
                <button
                  onClick={handleMarkAllNotificationsRead}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Mark all as read
                </button>
              )}
            </div>
            {notificationsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse border rounded-lg p-4">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Notifications</h3>
                <p className="text-gray-600">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`border rounded-lg p-4 ${!notification.isRead ? 'bg-blue-50 border-blue-200' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full ${!notification.isRead ? 'bg-blue-500' : 'bg-gray-300'}`} />
                          <h3 className="font-medium text-gray-900">{notification.title}</h3>
                        </div>
                        <p className="text-gray-600 text-sm">{notification.message}</p>
                        {/* Show coupon code prominently for coupon notifications */}
                        {notification.type === 'coupon' && notification.data?.couponCode && (
                          <div className="mt-3 p-3 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg">
                            <p className="text-white text-xs mb-1">Your Exclusive Coupon Code:</p>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-lg text-white bg-white/20 px-3 py-1 rounded">
                                {notification.data.couponCode}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(notification.data.couponCode);
                                  alert('Coupon code copied!');
                                }}
                                className="text-white hover:bg-white/20 p-1 rounded"
                                title="Copy code"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                            {notification.data.minOrderAmount > 0 && (
                              <p className="text-white/80 text-xs mt-2">Min. order: ₹{notification.data.minOrderAmount}</p>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notification.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkNotificationRead(notification._id)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-bold mb-6">Settings</h2>
            {settingsLoading ? (
              <div className="space-y-4 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Phone Number for SMS */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number <span className="text-gray-400 text-xs">(for SMS notifications & offers)</span>
                      </label>
                      <input
                        type="tel"
                        value={settings.phone || ''}
                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="+91 9876543210"
                      />
                    </div>
                  </div>
                </div>

                {/* Notification Settings */}
                <div className="border-t pt-6">
                  <h3 className="font-medium text-gray-900 mb-4">Notification Preferences</h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <span className="text-gray-700">Email Notifications</span>
                      <input
                        type="checkbox"
                        checked={settings.emailNotifications ?? true}
                        onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-gray-700">Push Notifications</span>
                      <input
                        type="checkbox"
                        checked={settings.pushNotifications ?? true}
                        onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-gray-700">Order Updates</span>
                      <input
                        type="checkbox"
                        checked={settings.orderUpdates ?? true}
                        onChange={(e) => setSettings({ ...settings, orderUpdates: e.target.checked })}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-gray-700">Promotional Emails</span>
                      <input
                        type="checkbox"
                        checked={settings.promotionalEmails ?? false}
                        onChange={(e) => setSettings({ ...settings, promotionalEmails: e.target.checked })}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                      />
                    </label>
                  </div>
                </div>

                {/* Language & Currency */}
                <div className="border-t pt-6">
                  <h3 className="font-medium text-gray-900 mb-4">Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                      <select
                        value={settings.language ?? 'en'}
                        onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="en">English</option>
                        <option value="hi">हिंदी</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                      <select
                        value={settings.currency ?? 'INR'}
                        onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="INR">₹ INR</option>
                        <option value="USD">$ USD</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <button
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="btn-primary w-full md:w-auto"
                  >
                    {savingSettings ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Help Center Tab */}
        {activeTab === 'help' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-bold mb-6">Help Center</h2>
            <div className="space-y-4">
              <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/contact')}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Contact Us</h3>
                    <p className="text-sm text-gray-600">Send us a message or feedback</p>
                  </div>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Call Support</h3>
                    <p className="text-sm text-gray-600">+91 1800-123-4567 (Mon-Sat, 9AM-6PM)</p>
                  </div>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">FAQs</h3>
                    <p className="text-sm text-gray-600">Find answers to common questions</p>
                  </div>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Return & Refund Policy</h3>
                    <p className="text-sm text-gray-600">Learn about our return and refund process</p>
                  </div>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Privacy & Security</h3>
                    <p className="text-sm text-gray-600">Your data is safe with us</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Cancel Order Modal */}
      <AnimatePresence>
        {showCancelModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Cancel Order</h2>
              <p className="text-gray-600 mb-4">
                Order #{selectedOrder._id.slice(-8)}
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Cancellation *
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please tell us why you want to cancel this order..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelling}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Keep Order
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling || !cancelReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Address Modal */}
      <AnimatePresence>
        {showAddressModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddressModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingAddress !== null ? 'Edit Address' : 'Add New Address'}
              </h2>

              {/* Location Detection Button */}
              <div className="mb-6 pb-6 border-b">
                <LocationPicker 
                  onLocationSelect={handleLocationSelect}
                  buttonText="📍 Detect My Location"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Click to auto-fill city, state, and pincode from your current location
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={addressForm.fullName}
                      onChange={(e) => setAddressForm({...addressForm, fullName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    value={addressForm.addressLine1}
                    onChange={(e) => setAddressForm({...addressForm, addressLine1: e.target.value})}
                    placeholder="House No., Building Name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={addressForm.addressLine2}
                    onChange={(e) => setAddressForm({...addressForm, addressLine2: e.target.value})}
                    placeholder="Road Name, Area, Colony"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      value={addressForm.zipCode}
                      onChange={(e) => setAddressForm({...addressForm, zipCode: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAddress}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                >
                  Save Address
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && reviewProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowReviewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Write a Review</h2>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Product Info */}
              <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg">
                {reviewProduct.image && (
                  <img
                    src={getGoogleDriveImageUrl(reviewProduct.image)}
                    alt={reviewProduct.name}
                    className="w-16 h-16 object-cover rounded"
                    crossOrigin="anonymous"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{reviewProduct.name}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Your Rating *
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewData({ ...reviewData, rating: star })}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <svg
                        className={`w-10 h-10 ${
                          star <= reviewData.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {reviewData.rating === 1 && 'Poor'}
                  {reviewData.rating === 2 && 'Fair'}
                  {reviewData.rating === 3 && 'Good'}
                  {reviewData.rating === 4 && 'Very Good'}
                  {reviewData.rating === 5 && 'Excellent'}
                </p>
              </div>

              {/* Comment */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Review *
                </label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                  placeholder="Share your experience with this product..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReviewModal(false)}
                  disabled={submittingReview}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Replacement Request Modal */}
        {showReplacementModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowReplacementModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">Request Replacement</h2>

              {/* Product Info */}
              {replacementItem && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                  {replacementItem.image && (
                    <img
                      src={getGoogleDriveImageUrl(replacementItem.image)}
                      alt={replacementItem.name}
                      className="w-16 h-16 object-cover rounded"
                      crossOrigin="anonymous"
                      onError={(e) => { e.target.onerror = null; e.target.src = '/images/products/placeholder.svg'; }}
                    />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{replacementItem.name}</p>
                    <p className="text-sm text-gray-500">Qty: {replacementItem.quantity}</p>
                  </div>
                </div>
              )}

              {/* Eligibility Check */}
              {checkingEligibility ? (
                <div className="flex items-center justify-center py-8">
                  <svg className="w-8 h-8 animate-spin text-primary-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="ml-2 text-gray-600">Checking eligibility...</span>
                </div>
              ) : replacementEligibility ? (
                <>
                  {!replacementEligibility.eligible ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 text-red-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Not Eligible for Replacement</span>
                      </div>
                      <p className="text-sm text-red-600 mt-2">{replacementEligibility.message}</p>
                      {replacementEligibility.daysRemaining !== undefined && replacementEligibility.daysRemaining < 0 && (
                        <p className="text-xs text-red-500 mt-1">
                          Replacement window expired {Math.abs(replacementEligibility.daysRemaining)} days ago
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 text-green-700">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="font-medium">Eligible for Replacement</span>
                        </div>
                        <p className="text-sm text-green-600 mt-1">
                          {replacementEligibility.daysRemaining} days remaining in replacement window
                        </p>
                      </div>

                      {/* Reason Selection */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reason for Replacement *
                        </label>
                        <select
                          value={replacementForm.reason}
                          onChange={(e) => setReplacementForm({ ...replacementForm, reason: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">Select a reason</option>
                          <option value="Damaged Product">Damaged / Defective Product</option>
                          <option value="Wrong Product">Wrong Product Received</option>
                          <option value="Quality Issue">Quality Issue</option>
                          <option value="Size Issue">Size Issue</option>
                          <option value="Missing Parts">Missing Parts / Accessories</option>
                          <option value="Not as Described">Not as Described</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Description */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Describe the Issue *
                        </label>
                        <textarea
                          value={replacementForm.description}
                          onChange={(e) => setReplacementForm({ ...replacementForm, description: e.target.value })}
                          placeholder="Please provide details about the issue..."
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowReplacementModal(false)}
                          disabled={submittingReplacement}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSubmitReplacement}
                          disabled={submittingReplacement}
                          className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                          {submittingReplacement ? 'Submitting...' : 'Submit Request'}
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : null}

              {/* Close button for ineligible */}
              {replacementEligibility && !replacementEligibility.eligible && (
                <button
                  onClick={() => setShowReplacementModal(false)}
                  className="w-full mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
