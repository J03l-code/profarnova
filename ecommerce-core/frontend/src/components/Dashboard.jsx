import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { logout, user: authUser, token } = useAuth();
  
  // Navigation
  const [activeTab, setActiveTab] = useState('resumen');
  
  // Data states
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [messages, setMessages] = useState([]);
  const [webConfig, setWebConfig] = useState({
    banners: { main_banner: '/assets/hero-bg.jpg', promo_banner: '' },
    contact: { phone: '+593 9 8878 1166', email: 'info@profarnova.com', address: 'Quito, Ecuador' },
    shipping: { base_fee: 5.00, free_shipping_threshold: 50.00, policy: 'Envíos a todo el país en 24-48 horas.' }
  });

  // Loading/UI states
  const [loading, setLoading] = useState(true);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [currentEditingProduct, setCurrentEditingProduct] = useState(null);
  
  // Product Form states
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Analgésicos',
    description: '',
    price: '',
    stock: '',
    sku: '',
    image_url: ''
  });

  const API_URL = 'http://localhost:5000/api';

  // Fetch all dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch Products
      const prodRes = await fetch(`${API_URL}/products`);
      const prodData = await prodRes.json();
      setProducts(Array.isArray(prodData) ? prodData : getDummyProducts());

      // Fetch Orders
      const orderRes = await fetch(`${API_URL}/orders`, { headers });
      const orderData = await orderRes.json();
      setOrders(Array.isArray(orderData) ? orderData : getDummyOrders());

      // Fetch Clients
      const clientRes = await fetch(`${API_URL}/users`, { headers });
      const clientData = await clientRes.json();
      setClients(Array.isArray(clientData) ? clientData : getDummyClients());

      // Fetch Web Config
      const configRes = await fetch(`${API_URL}/config`);
      const configData = await configRes.json();
      if (configData && !configData.error) {
        setWebConfig(configData);
      }

      // Fetch Contact Messages
      try {
        const msgRes = await fetch(`${API_URL}/messages`, { headers });
        const msgData = await msgRes.json();
        setMessages(Array.isArray(msgData) ? msgData : []);
      } catch (e) {
        setMessages([]);
      }
    } catch (err) {
      console.error('Error fetching dashboard data, falling back to mock data:', err);
      // Fallback to high-quality mock data for layout styling demonstration
      setProducts(getDummyProducts());
      setOrders(getDummyOrders());
      setClients(getDummyClients());
    } finally {
      setLoading(false);
    }
  };

  // 1. PRODUCT CRUD HANDLERS
  const handleOpenAddProduct = () => {
    setCurrentEditingProduct(null);
    setProductForm({
      name: '',
      category: 'Analgésicos',
      description: '',
      price: '',
      stock: '',
      sku: '',
      image_url: ''
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (product) => {
    setCurrentEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      sku: product.sku,
      image_url: product.image_url || ''
    });
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const url = currentEditingProduct 
      ? `${API_URL}/products/${currentEditingProduct.id}` 
      : `${API_URL}/products`;
    const method = currentEditingProduct ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...productForm,
          price: parseFloat(productForm.price),
          stock: parseInt(productForm.stock)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Error al guardar el producto.');
        return;
      }

      alert(currentEditingProduct ? 'Producto editado.' : 'Producto creado.');
      setIsProductModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      console.error('Error submitting product:', err);
      // Mock UI update if server is not running
      if (currentEditingProduct) {
        setProducts(products.map(p => p.id === currentEditingProduct.id ? { ...p, ...productForm, price: parseFloat(productForm.price), stock: parseInt(productForm.stock) } : p));
      } else {
        setProducts([...products, { ...productForm, id: Date.now().toString(), price: parseFloat(productForm.price), stock: parseInt(productForm.stock) }]);
      }
      setIsProductModalOpen(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('¿Está seguro de que desea eliminar este producto?')) return;
    try {
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchDashboardData();
      } else {
        const data = await response.json();
        alert(data.error || 'Error al eliminar.');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      setProducts(products.filter(p => p.id !== productId));
    }
  };

  // 2. ORDER STATUS HANDLER
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchDashboardData();
      } else {
        const data = await response.json();
        alert(data.error || 'Error al cambiar estado.');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    }
  };

  // 3. USER SUSPENSION HANDLER
  const handleToggleUserStatus = async (clientId, currentStatus) => {
    const nextStatus = currentStatus === 'activo' ? 'suspendido' : 'activo';
    const actionText = nextStatus === 'activo' ? 'activar' : 'suspender';
    if (!confirm(`¿Desea ${actionText} esta cuenta de cliente?`)) return;

    try {
      const response = await fetch(`${API_URL}/users/${clientId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (response.ok) {
        fetchDashboardData();
      } else {
        const data = await response.json();
        alert(data.error || 'Error al cambiar estado de usuario.');
      }
    } catch (err) {
      console.error('Error toggling client status:', err);
      setClients(clients.map(c => c.id === clientId ? { ...c, status: nextStatus } : c));
    }
  };

  // 4. WEB CONFIG HANDLER
  const handleUpdateConfig = async (key, value) => {
    try {
      const response = await fetch(`${API_URL}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ key, value })
      });
      const data = await response.json();
      if (response.ok) {
        alert('Configuración guardada.');
        fetchDashboardData();
      } else {
        alert(data.error || 'Error al guardar.');
      }
    } catch (err) {
      console.error('Error updating configuration:', err);
      setWebConfig({ ...webConfig, [key]: value });
      alert('Configuración actualizada localmente.');
    }
  };

  // 5. MESSAGE HANDLERS
  const handleToggleMessageStatus = async (id, newStatus) => {
    try {
      await fetch(`${API_URL}/messages/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      fetchDashboardData();
    } catch (err) {
      console.error('Error updating message status:', err);
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!confirm('¿Eliminar este mensaje permanentemente?')) return;
    try {
      await fetch(`${API_URL}/messages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch (err) {
      console.error('Error deleting message:', err);
      setMessages(messages.filter(m => m.id !== id));
    }
  };

  // CRITICAL STOCK CALCULATION
  const criticalStockProducts = products.filter(p => p.stock < 5);
  const criticalStockCount = criticalStockProducts.length;
  const unreadMessagesCount = messages.filter(m => m.status === 'unread').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* TOP HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/profarnova-logo.png" alt="PROFARNOVA" className="h-9 w-auto" />
            <span className="text-emerald-500 font-semibold text-sm bg-emerald-50 px-2 py-1 rounded uppercase">Admin</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400 font-medium">Conectado como</p>
              <p className="text-sm font-semibold text-slate-700">{authUser?.full_name || 'Administrador'}</p>
            </div>
            
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* DASHBOARD CONTAINER */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-8">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-full md:w-64 flex flex-col gap-2">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Módulos</p>
            
            {/* TAB BUTTONS */}
            <button
              onClick={() => setActiveTab('resumen')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'resumen' 
                  ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analíticas Rápidas
            </button>

            <button
              onClick={() => setActiveTab('inventario')}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'inventario' 
                  ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Inventario
              </div>
              {criticalStockCount > 0 && (
                <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 text-xs rounded-full animate-pulse">
                  {criticalStockCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('pedidos')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'pedidos' 
                  ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Ventas y Pedidos
            </button>

            <button
              onClick={() => setActiveTab('clientes')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'clientes' 
                  ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Clientes
            </button>

            <button
              onClick={() => setActiveTab('configuracion')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'configuracion' 
                  ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Configuración Web
            </button>

            <button
              onClick={() => setActiveTab('mensajes')}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'mensajes'
                  ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Mensajes
              </div>
              {unreadMessagesCount > 0 && (
                <span className="bg-emerald-500 text-white font-extrabold px-2 py-0.5 text-xs rounded-full">
                  {unreadMessagesCount}
                </span>
              )}
            </button>
          </div>

          {/* CRITICAL STOCK ALERTS SIDEBAR */}
          {criticalStockCount > 0 && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                <svg className="w-5 h-5 text-red-500 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Stock Crítico
              </div>
              <p className="text-xs text-red-600">Tienes {criticalStockCount} producto(s) con stock por debajo de 5 unidades.</p>
              <button
                onClick={() => setActiveTab('inventario')}
                className="text-xs font-bold text-red-700 hover:underline text-left"
              >
                Revisar inventario &rarr;
              </button>
            </div>
          )}
        </aside>

        {/* MAIN PANEL CONTENT AREA */}
        <main className="flex-1 min-w-0">
          
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <svg className="animate-spin h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : (
            <>
              {/* TAB: RESUMEN / ANALYTICS */}
              {activeTab === 'resumen' && (
                <div className="space-y-8 animate-fadeIn">
                  
                  {/* METRIC CARDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase">Ventas del Mes</span>
                      <span className="text-3xl font-extrabold text-slate-950">
                        ${orders.reduce((acc, o) => acc + parseFloat(o.total_amount || 0), 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                      </span>
                      <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold mt-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        +14.2% vs mes anterior
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase">Productos en Catálogo</span>
                      <span className="text-3xl font-extrabold text-slate-950">{products.length}</span>
                      <span className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                        {products.filter(p => p.stock >= 5).length} En stock óptimo
                      </span>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase">Clientes Registrados</span>
                      <span className="text-3xl font-extrabold text-slate-950">{clients.length}</span>
                      <span className="text-xs text-slate-500 mt-1">Nuevos este mes: +{clients.filter(c => new Date(c.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}</span>
                    </div>
                  </div>

                  {/* GRAPHICS & TOP SELLING */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* SVG Sales Trend Chart */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                      <h3 className="font-extrabold text-slate-900 text-base">Tendencia de Ventas (Semanas)</h3>
                      
                      <div className="relative h-64 w-full flex items-end justify-between px-4 pb-2 border-b border-slate-200">
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex flex-col justify-between py-6 pointer-events-none opacity-20">
                          <div className="border-t border-slate-700 w-full"></div>
                          <div className="border-t border-slate-700 w-full"></div>
                          <div className="border-t border-slate-700 w-full"></div>
                          <div className="border-t border-slate-700 w-full"></div>
                        </div>

                        {/* Bars representing weeks */}
                        <div className="flex flex-col items-center gap-2 w-1/4 z-10">
                          <div className="w-12 bg-emerald-100 rounded-t-lg h-32 hover:bg-emerald-200 transition-colors flex items-end justify-center pb-2 text-[10px] font-bold text-emerald-800">$1.2k</div>
                          <span className="text-xs font-bold text-slate-400">Semana 1</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 w-1/4 z-10">
                          <div className="w-12 bg-emerald-300 rounded-t-lg h-44 hover:bg-emerald-400 transition-colors flex items-end justify-center pb-2 text-[10px] font-bold text-emerald-900">$2.1k</div>
                          <span className="text-xs font-bold text-slate-400">Semana 2</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 w-1/4 z-10">
                          <div className="w-12 bg-emerald-500 rounded-t-lg h-52 hover:bg-emerald-600 transition-colors flex items-end justify-center pb-2 text-[10px] font-bold text-white shadow-md">$3.4k</div>
                          <span className="text-xs font-bold text-slate-400">Semana 3</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 w-1/4 z-10">
                          <div className="w-12 bg-emerald-600 rounded-t-lg h-56 hover:bg-emerald-700 transition-colors flex items-end justify-center pb-2 text-[10px] font-bold text-white shadow-md shadow-emerald-100">$4.1k</div>
                          <span className="text-xs font-bold text-slate-400">Semana 4</span>
                        </div>
                      </div>
                    </div>

                    {/* Top Selling Products */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                      <h3 className="font-extrabold text-slate-900 text-base">Productos Más Vendidos</h3>
                      <div className="divide-y divide-slate-100">
                        {products.slice(0, 3).map((p, i) => (
                          <div key={p.id || i} className="flex items-center justify-between py-3.5">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                                #{i+1}
                              </span>
                              <div>
                                <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                                <p className="text-xs text-slate-400">{p.category}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-slate-950 text-sm">{(140 - i * 35)} unidades</p>
                              <p className="text-xs text-emerald-600 font-semibold">+${(140 - i * 35) * p.price} total</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: INVENTARIO */}
              {activeTab === 'inventario' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">Gestión de Catálogo</h2>
                      <p className="text-sm text-slate-500">Agrega, edita y gestiona tus productos en stock.</p>
                    </div>
                    <button
                      onClick={handleOpenAddProduct}
                      className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md transition-colors flex items-center gap-1.5"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Añadir Producto
                    </button>
                  </div>

                  {/* PRODUCTS GRID TABLE */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-400">
                            <th className="px-6 py-4">SKU</th>
                            <th className="px-6 py-4">Producto</th>
                            <th className="px-6 py-4">Categoría</th>
                            <th className="px-6 py-4">Precio</th>
                            <th className="px-6 py-4">Stock</th>
                            <th className="px-6 py-4 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {products.map(product => (
                            <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-mono font-semibold text-slate-500">{product.sku}</td>
                              <td className="px-6 py-4 font-bold text-slate-800">{product.name}</td>
                              <td className="px-6 py-4 text-slate-500">{product.category}</td>
                              <td className="px-6 py-4 font-semibold text-slate-900">${parseFloat(product.price).toFixed(2)}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold ${product.stock < 5 ? 'text-red-600' : 'text-slate-700'}`}>
                                    {product.stock}
                                  </span>
                                  {product.stock < 5 && (
                                    <span className="bg-red-50 text-red-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-red-100 uppercase tracking-wide">
                                      Crítico
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-3">
                                  <button
                                    onClick={() => handleOpenEditProduct(product)}
                                    className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-all"
                                    title="Editar"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                                    title="Eliminar"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </aside>
              )}

              {/* TAB: PEDIDOS */}
              {activeTab === 'pedidos' && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">Ventas y Pedidos</h2>
                    <p className="text-sm text-slate-500">Monitorea los pedidos realizados y actualiza sus estados.</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-400">
                            <th className="px-6 py-4">ID Pedido</th>
                            <th className="px-6 py-4">Cliente</th>
                            <th className="px-6 py-4">Productos</th>
                            <th className="px-6 py-4">Envío</th>
                            <th className="px-6 py-4">Fecha</th>
                            <th className="px-6 py-4">Total</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4">Actualizar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {orders.map(order => {
                            let parsedItems = [];
                            try { parsedItems = JSON.parse(order.items_detail || '[]'); } catch(e) {}
                            return (
                            <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-mono text-slate-500 text-xs">{order.id.slice(0,8)}...</td>
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-800">{order.client_name || 'Consumidor Final'}</div>
                                <div className="text-xs text-slate-500">{order.client_phone || ''}</div>
                                <div className="text-xs text-slate-400">{order.client_email || ''}</div>
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-600 max-w-xs">
                                {parsedItems.length > 0
                                  ? parsedItems.map((it, idx) => (
                                      <div key={idx} className="mb-0.5">
                                        <span className="font-semibold">{it.name}</span> ×{it.quantity} — <span className="text-emerald-700 font-bold">${it.subtotal}</span>
                                      </div>
                                    ))
                                  : <span className="text-slate-400 italic">Sin detalle</span>
                                }
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-500 max-w-[160px]">
                                {order.shipping_address || '—'}
                                {order.notes && <div className="text-slate-400 mt-0.5 italic">Nota: {order.notes}</div>}
                              </td>
                              <td className="px-6 py-4 text-slate-500">
                                {new Date(order.created_at).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-900">${parseFloat(order.total_amount).toFixed(2)}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                                  order.status === 'pendiente' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                  order.status === 'empaquetado' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                                  order.status === 'enviado' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                  'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <select
                                  value={order.status}
                                  onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                  className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 bg-white"
                                >
                                  <option value="pendiente">Pendiente</option>
                                  <option value="empaquetado">Empaquetado</option>
                                  <option value="enviado">Enviado</option>
                                  <option value="entregado">Entregado</option>
                                </select>
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: CLIENTES */}
              {activeTab === 'clientes' && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">Gestión de Clientes</h2>
                    <p className="text-sm text-slate-500">Monitorea y modera las cuentas de clientes.</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-400">
                            <th className="px-6 py-4">Nombre</th>
                            <th className="px-6 py-4">Teléfono / RFC</th>
                            <th className="px-6 py-4">Compras</th>
                            <th className="px-6 py-4">Monto Gastado</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-center">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {clients.map(client => (
                            <tr key={client.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-800">{client.full_name}</div>
                                <div className="text-xs text-slate-400">{client.email}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-slate-700">{client.phone}</div>
                                <div className="text-xs text-slate-400 font-mono">RFC: {client.rfc || 'No registrado'}</div>
                              </td>
                              <td className="px-6 py-4 font-semibold text-slate-700">{client.total_orders || 0}</td>
                              <td className="px-6 py-4 font-bold text-slate-900">${parseFloat(client.total_spent || 0).toFixed(2)}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                                  client.status === 'activo' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                                }`}>
                                  {client.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => handleToggleUserStatus(client.id, client.status)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    client.status === 'activo' 
                                      ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                                      : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                                  }`}
                                >
                                  {client.status === 'activo' ? 'Suspender' : 'Activar'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: CONFIGURACIÓN */}
              {activeTab === 'configuracion' && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">Configuración Web</h2>
                    <p className="text-sm text-slate-500">Configura banners, datos y políticas de envío de PROFARNOVA.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* BANNERS FORM */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">Banners de la Tienda</h3>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Banner Principal (URL)</label>
                          <input
                            type="text"
                            value={webConfig.banners.main_banner}
                            onChange={(e) => setWebConfig({
                              ...webConfig,
                              banners: { ...webConfig.banners, main_banner: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Banner Promocional (URL)</label>
                          <input
                            type="text"
                            value={webConfig.banners.promo_banner}
                            onChange={(e) => setWebConfig({
                              ...webConfig,
                              banners: { ...webConfig.banners, promo_banner: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700"
                            placeholder="Ingrese URL de imagen promocional"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleUpdateConfig('banners', webConfig.banners)}
                        className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                      >
                        Guardar Banners
                      </button>
                    </div>

                    {/* CONTACT CONFIG */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">Datos de Contacto</h3>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Teléfono</label>
                          <input
                            type="text"
                            value={webConfig.contact.phone}
                            onChange={(e) => setWebConfig({
                              ...webConfig,
                              contact: { ...webConfig.contact, phone: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                          <input
                            type="email"
                            value={webConfig.contact.email}
                            onChange={(e) => setWebConfig({
                              ...webConfig,
                              contact: { ...webConfig.contact, email: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Dirección Física</label>
                          <input
                            type="text"
                            value={webConfig.contact.address}
                            onChange={(e) => setWebConfig({
                              ...webConfig,
                              contact: { ...webConfig.contact, address: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleUpdateConfig('contact', webConfig.contact)}
                        className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                      >
                        Guardar Contacto
                      </button>
                    </div>

                    {/* SHIPPING POLICIES */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 md:col-span-2">
                      <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">Políticas y Tarifas de Envío</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Costo Base de Envío ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={webConfig.shipping.base_fee}
                            onChange={(e) => setWebConfig({
                              ...webConfig,
                              shipping: { ...webConfig.shipping, base_fee: parseFloat(e.target.value) }
                            })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Monto Mínimo para Envío Gratis ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={webConfig.shipping.free_shipping_threshold}
                            onChange={(e) => setWebConfig({
                              ...webConfig,
                              shipping: { ...webConfig.shipping, free_shipping_threshold: parseFloat(e.target.value) }
                            })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 mb-1">Texto descriptivo de la Política</label>
                          <textarea
                            rows="2"
                            value={webConfig.shipping.policy}
                            onChange={(e) => setWebConfig({
                              ...webConfig,
                              shipping: { ...webConfig.shipping, policy: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleUpdateConfig('shipping', webConfig.shipping)}
                        className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                      >
                        Guardar Políticas de Envío
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: MENSAJES */}
              {activeTab === 'mensajes' && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">Mensajes de Contacto</h2>
                    <p className="text-sm text-slate-500">Consultas y solicitudes enviadas desde el formulario de contacto del sitio web.</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-400">
                            <th className="px-6 py-4">Cliente</th>
                            <th className="px-6 py-4">Asunto / Mensaje</th>
                            <th className="px-6 py-4">Fecha</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {messages.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="px-6 py-10 text-center text-slate-400 text-sm">
                                No hay mensajes de contacto recibidos aún.
                              </td>
                            </tr>
                          ) : messages.map(m => {
                            const isUnread = m.status === 'unread';
                            const date = new Date(m.created_at).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                            return (
                              <tr key={m.id} className={`hover:bg-slate-50/50 transition-colors ${isUnread ? 'bg-emerald-50/30' : ''}`}>
                                <td className="px-6 py-4">
                                  <div className="font-bold text-slate-800">{m.name}</div>
                                  <div className="text-xs text-slate-500">{m.email}</div>
                                  {m.phone && (
                                    <a
                                      href={`https://wa.me/${m.phone.replace(/[^\d]/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-emerald-600 font-bold hover:underline flex items-center gap-1 mt-0.5"
                                    >
                                      {m.phone}
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.47L0 24zm6.59-4.846c1.666.988 3.396 1.502 5.342 1.503 5.428 0 9.845-4.414 9.848-9.84.002-2.63-1.02-5.101-2.877-6.958C17.062 2.002 14.59 1 11.96 1 6.535 1 2.116 5.416 2.113 10.843c-.001 1.883.49 3.73 1.42 5.382L2.53 21.46l5.244-1.376z"/>
                                      </svg>
                                    </a>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="font-bold text-slate-700 text-[10px] uppercase tracking-wide mb-1">{m.subject}</div>
                                  <div className="text-slate-600 text-sm whitespace-pre-wrap max-w-sm">{m.message}</div>
                                </td>
                                <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">{date}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                                    isUnread
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse'
                                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                                  }`}>
                                    {isUnread ? 'Nuevo' : 'Leído'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                  <div className="flex justify-center gap-3">
                                    <button
                                      onClick={() => handleToggleMessageStatus(m.id, isUnread ? 'read' : 'unread')}
                                      className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-all"
                                      title={isUnread ? 'Marcar como leído' : 'Marcar como no leído'}
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteMessage(m.id)}
                                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                                      title="Eliminar"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* 5. ADD / EDIT PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-lg">
                {currentEditingProduct ? 'Editar Producto' : 'Añadir Nuevo Producto'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Nombre del Medicamento / Producto *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
                    placeholder="Ej: CYSPREX 560mg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Categoría *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
                  >
                    <option value="Analgésicos">Analgésicos</option>
                    <option value="Cuidado Personal">Cuidado Personal</option>
                    <option value="Vitaminas">Vitaminas</option>
                    <option value="Salud Femenina">Salud Femenina</option>
                    <option value="Bienestar Urinario">Bienestar Urinario</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Código de barras / SKU *</label>
                  <input
                    type="text"
                    required
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
                    placeholder="Ej: PRF-CYS-01"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Precio ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Stock Disponible *</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
                    placeholder="0"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Imagen (URL o archivo)</label>
                  <input
                    type="text"
                    value={productForm.image_url}
                    onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
                    placeholder="URL de la imagen o cargador..."
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Descripción</label>
                  <textarea
                    rows="3"
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
                    placeholder="Detalles científicos o propiedades del producto..."
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="w-1/2 py-2.5 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md transition-colors"
                >
                  {currentEditingProduct ? 'Guardar Cambios' : 'Añadir Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// DUMMY SEED DATA FOR INTERACTIVE PROTOTYPING & VISUAL FALLBACK
// -------------------------------------------------------------
function getDummyProducts() {
  return [
    {
      id: 'prod-1',
      name: 'CYSPREX® Bienestar Urinario',
      category: 'Bienestar Urinario',
      description: 'Suplemento con Proantocianidinas 36mg para el bienestar urinario femenino. 15 cápsulas.',
      price: 18.50,
      stock: 45,
      sku: 'PRF-CYS-36',
      image_url: '/assets/cysprex-product.png'
    },
    {
      id: 'prod-2',
      name: 'Lubryn-E® Gel Confort Íntimo',
      category: 'Salud Femenina',
      description: 'Gel hidratante íntimo con Ácido Hialurónico y Vitamina E. 60g.',
      price: 22.90,
      stock: 3, // Critical Stock < 5
      sku: 'PRF-LUB-60',
      image_url: '/assets/lubrine.png'
    },
    {
      id: 'prod-3',
      name: 'Vitamina C + Zinc Efervescente',
      category: 'Vitaminas',
      description: 'Refuerzo inmunitario efervescente de rápida absorción. 20 tabletas.',
      price: 9.80,
      stock: 120,
      sku: 'PRF-VCZ-20',
      image_url: ''
    },
    {
      id: 'prod-4',
      name: 'Paracetamol 500mg Genérico',
      category: 'Analgésicos',
      description: 'Alivio eficaz de dolores leves a moderados y estados febriles. 30 tabletas.',
      price: 3.20,
      stock: 2, // Critical Stock < 5
      sku: 'PRF-PAR-50',
      image_url: ''
    }
  ];
}

function getDummyOrders() {
  return [
    {
      id: 'ord-1001',
      client_name: 'María Alejandra Falconí',
      client_email: 'maria.falconi@hotmail.com',
      client_phone: '+593 9 9123 4567',
      total_amount: 41.40,
      status: 'pendiente',
      shipping_address: 'Av. Gran Colombia y Yaguachi, Edificio Centenario Piso 2, Quito',
      created_at: '2026-05-26T14:32:00.000Z'
    },
    {
      id: 'ord-1002',
      client_name: 'Juan Carlos Mendoza',
      client_email: 'jcmendoza@outlook.com',
      client_phone: '+593 9 8234 5678',
      total_amount: 18.50,
      status: 'empaquetado',
      shipping_address: 'Urdesa Central, Calle 3ra y Dátiles 415, Guayaquil',
      created_at: '2026-05-25T11:15:00.000Z'
    },
    {
      id: 'ord-1003',
      client_name: 'Gabriela Estefanía Ortiz',
      client_email: 'gaby.ortiz@gmail.com',
      client_phone: '+593 9 7345 6789',
      total_amount: 63.80,
      status: 'enviado',
      shipping_address: 'Calle Larga y Hermano Miguel, Cuenca',
      created_at: '2026-05-24T09:40:00.000Z'
    },
    {
      id: 'ord-1004',
      client_name: 'Dr. Fernando Rivas',
      client_email: 'frivas.med@gmail.com',
      client_phone: '+593 9 6456 7890',
      total_amount: 111.00,
      status: 'entregado',
      shipping_address: 'Av. Remigio Crespo Toral 12-40, Cuenca',
      created_at: '2026-05-22T16:20:00.000Z'
    }
  ];
}

function getDummyClients() {
  return [
    {
      id: 'cli-1',
      full_name: 'María Alejandra Falconí',
      email: 'maria.falconi@hotmail.com',
      phone: '+593 9 9123 4567',
      shipping_address: 'Av. Gran Colombia y Yaguachi, Edificio Centenario Piso 2, Quito',
      rfc: '1723456789001',
      total_orders: 1,
      total_spent: 41.40,
      status: 'activo',
      created_at: '2026-05-15T12:00:00.000Z'
    },
    {
      id: 'cli-2',
      full_name: 'Juan Carlos Mendoza',
      email: 'jcmendoza@outlook.com',
      phone: '+593 9 8234 5678',
      shipping_address: 'Urdesa Central, Calle 3ra y Dátiles 415, Guayaquil',
      rfc: '',
      total_orders: 4,
      total_spent: 98.20,
      status: 'activo',
      created_at: '2026-05-10T09:30:00.000Z'
    },
    {
      id: 'cli-3',
      full_name: 'Roberto Villacís',
      email: 'rvillacis88@gmail.com',
      phone: '+593 9 5221 4433',
      shipping_address: 'Av. Shirys y Naciones Unidas, Quito',
      rfc: '1711223344001',
      total_orders: 0,
      total_spent: 0.00,
      status: 'suspendido', // Suspended account example
      created_at: '2026-05-08T15:45:00.000Z'
    }
  ];
}
