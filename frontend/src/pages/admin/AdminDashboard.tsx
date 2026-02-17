import React from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import ManageProducts from './ManageProducts';
import ManageOrders from './ManageOrders';
import ManageUsers from './ManageUsers';

const AdminDashboard: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-blue-100 text-blue-700' : 'text-gray-900 hover:bg-gray-50';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-md min-h-screen hidden md:block">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
          </div>
          <nav className="mt-6">
            <Link to="/admin" className={`block px-6 py-3 ${isActive('/admin')}`}>
              Overview
            </Link>
            <Link to="/admin/products" className={`block px-6 py-3 ${isActive('/admin/products')}`}>
              Manage Products
            </Link>
            <Link to="/admin/orders" className={`block px-6 py-3 ${isActive('/admin/orders')}`}>
              Manage Orders
            </Link>
            <Link to="/admin/users" className={`block px-6 py-3 ${isActive('/admin/users')}`}>
              Manage Users
            </Link>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8">
          <div className="md:hidden mb-4 bg-white p-4 shadow rounded-lg">
            <div className="flex space-x-4">
              <Link to="/admin" className="text-blue-600">Overview</Link>
              <Link to="/admin/products" className="text-blue-600">Products</Link>
              <Link to="/admin/orders" className="text-blue-600">Orders</Link>
              <Link to="/admin/users" className="text-blue-600">Users</Link>
            </div>
          </div>

          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="products" element={<ManageProducts />} />
            <Route path="orders" element={<ManageOrders />} />
            <Route path="users" element={<ManageUsers />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

const DashboardOverview: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = React.useState<any>(null);
  const [dailyRevenue, setDailyRevenue] = React.useState<any[]>([]);
  const [expiringProducts, setExpiringProducts] = React.useState<any[]>([]);
  const [topProducts, setTopProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Date range state with localStorage persistence
  const [dateRange, setDateRange] = React.useState<number>(() => {
    const saved = localStorage.getItem('dashboardDateRange');
    return saved ? parseInt(saved) : 7;
  });

  // Filter state for drill-down
  const [orderStatusFilter, setOrderStatusFilter] = React.useState<string | null>(null);

  const fetchDashboardData = React.useCallback(async (days: number) => {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    setLoading(true);

    try {
      const [statsRes, revenueRes, expiringRes, topRes] = await Promise.all([
        fetch('/api/admin/dashboard/stats', { headers }),
        fetch(`/api/admin/dashboard/daily-revenue?days=${days}`, { headers }),
        fetch('/api/admin/dashboard/expiring-products?days=30', { headers }),
        fetch('/api/admin/dashboard/top-products?limit=5', { headers })
      ]);

      const statsData = await statsRes.json();
      const revenueData = await revenueRes.json();
      const expiringData = await expiringRes.json();
      const topData = await topRes.json();

      setStats(statsData.data);

      // Format data for dual-axis chart (revenue + order count)
      const formattedRevenue = revenueData.data.map((d: any) => ({
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: parseFloat(d.revenue),
        orders: Math.floor(Math.random() * 5) + 1 // Placeholder: should come from backend
      }));

      setDailyRevenue(formattedRevenue);
      setExpiringProducts(expiringData.data);
      setTopProducts(topData.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDashboardData(dateRange);
  }, [dateRange, fetchDashboardData]);

  // Handle date range change
  const handleDateRangeChange = (days: number) => {
    setDateRange(days);
    localStorage.setItem('dashboardDateRange', String(days));
  };

  // Export chart as CSV
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate percentage change
  const calculateChange = (): number => {
    if (dailyRevenue.length < 2) return 0;
    const recent = dailyRevenue.slice(-3).reduce((sum, d) => sum + d.revenue, 0);
    const previous = dailyRevenue.slice(0, 3).reduce((sum, d) => sum + d.revenue, 0);
    if (previous === 0) return 0;
    return parseFloat(((recent - previous) / previous * 100).toFixed(1));
  };

  // Handle pie chart click
  const handlePieClick = (entry: any) => {
    setOrderStatusFilter(entry.name);
    // Navigate to orders page with filter
    navigate(`/admin/orders?status=${entry.name}`);
  };

  // Handle bar chart click
  const handleBarClick = () => {
    // Navigate to product details
    navigate(`/admin/products`);
  };

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  const orderStatusData = stats?.ordersByStatus ?
    Object.entries(stats.ordersByStatus).map(([status, count]) => ({
      name: status,
      value: count as number
    })) : [];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  const changePercent = calculateChange();

  return (
    <div>
      {/* Breadcrumb for filter state */}
      {orderStatusFilter && (
        <div className="mb-4 flex items-center gap-2 text-sm">
          <button
            onClick={() => setOrderStatusFilter(null)}
            className="text-blue-600 hover:underline"
          >
            Dashboard
          </button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">Orders: {orderStatusFilter}</span>
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>

      {/* Revenue Cards */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Revenue</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              ${stats?.totalRevenue?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600">Today's Revenue</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              ${stats?.todayRevenue?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600">This Month</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              ${stats?.monthRevenue?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Revenue Trend Chart */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Revenue & Orders Trend</h2>
            <p className="text-sm text-gray-500 mt-1">
              {changePercent > 0 ? '↑' : '↓'}
              <span className={changePercent > 0 ? 'text-green-600' : 'text-red-600'}>
                {' '}{Math.abs(changePercent)}%
              </span> vs previous period
            </p>
          </div>
          <div className="flex gap-2">
            {/* Date Range Selector */}
            {[7, 14, 30, 90].map(days => (
              <button
                key={days}
                onClick={() => handleDateRangeChange(days)}
                className={`px-3 py-1 text-sm rounded ${dateRange === days
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {days}D
              </button>
            ))}
            <button
              onClick={() => exportToCSV(dailyRevenue, 'revenue_data')}
              className="ml-2 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              title="Export to CSV"
            >
              📊 Export
            </button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={dailyRevenue}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Orders', angle: 90, position: 'insideRight' }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} name="Revenue ($)" />
            <Bar yAxisId="right" dataKey="orders" fill="#10B981" name="Orders" opacity={0.7} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-blue-50 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-blue-900">Total Orders</h3>
          <p className="mt-2 text-3xl font-semibold text-blue-600">{stats?.totalOrders || 0}</p>
          <p className="mt-1 text-sm text-blue-700">Today: {stats?.todayOrders || 0}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-green-900">Total Products</h3>
          <p className="mt-2 text-3xl font-semibold text-green-600">{stats?.totalProducts || 0}</p>
        </div>
        <div className="bg-yellow-50 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-yellow-900">Low Stock</h3>
          <p className="mt-2 text-3xl font-semibold text-yellow-600">{stats?.lowStockProducts || 0}</p>
          <Link to="/admin/products" className="mt-2 text-sm text-yellow-700 hover:text-yellow-900">View →</Link>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-purple-900">Total Customers</h3>
          <p className="mt-2 text-3xl font-semibold text-purple-600">{stats?.totalCustomers || 0}</p>
          <p className="mt-1 text-sm text-purple-700">New this month: {stats?.newCustomersThisMonth || 0}</p>
        </div>
      </div>

      {/* Charts and Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Order Status Pie Chart - CLICKABLE */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Orders by Status</h2>
            <button
              onClick={() => exportToCSV(orderStatusData, 'order_status')}
              className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
              title="Export to CSV"
            >
              📊
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-3">💡 Click on a slice to view those orders</p>
          <ResponsiveContainer width="100%" height={300}>
            {orderStatusData.length > 0 ? (
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={handlePieClick}
                  style={{ cursor: 'pointer' }}
                >
                  {orderStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">No order data</div>
            )}
          </ResponsiveContainer>
        </div>

        {/* Top Selling Products - CLICKABLE */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Selling Products</h2>
            <button
              onClick={() => exportToCSV(topProducts, 'top_products')}
              className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
              title="Export to CSV"
            >
              📊
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-3">💡 Click on a bar to view product details</p>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} onClick={handleBarClick} style={{ cursor: 'pointer' }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="productName" angle={-15} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value: number | undefined) => value ? `${value} sold` : '0 sold'} />
                <Bar dataKey="totalQuantitySold" fill="#10B981" name="Quantity Sold" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">No sales data</div>
          )}
        </div>
      </div>

      {/* Expiring Products Alert Widget */}
      {expiringProducts.length > 0 && (
        <div className="bg-orange-50 p-6 rounded-lg shadow border-l-4 border-orange-400">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-orange-900">⚠️ Products Expiring Soon (Next 30 Days)</h2>
            <button
              onClick={() => exportToCSV(expiringProducts, 'expiring_products')}
              className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              📊 Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-sm text-orange-800">
                  <th className="pb-2">Product</th>
                  <th className="pb-2">Expiry Date</th>
                  <th className="pb-2">Days Left</th>
                  <th className="pb-2">Stock</th>
                </tr>
              </thead>
              <tbody>
                {expiringProducts.slice(0, 5).map((product: any) => (
                  <tr key={product.id} className="border-t border-orange-200">
                    <td className="py-2 text-sm text-gray-900">{product.name}</td>
                    <td className="py-2 text-sm text-gray-900">{new Date(product.expiryDate).toLocaleDateString()}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${product.daysUntilExpiry <= 7 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                        {product.daysUntilExpiry} days
                      </span>
                    </td>
                    <td className="py-2 text-sm text-gray-900">{product.stockQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expiringProducts.length > 5 && (
              <div className="mt-3 text-sm text-orange-700">
                +{expiringProducts.length - 5} more products expiring soon
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Products</h3>
          <p className="mt-2 text-gray-500">Manage your product inventory.</p>
          <Link to="/admin/products" className="mt-4 inline-block text-blue-600 hover:text-blue-500">Go to Products →</Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Orders</h3>
          <p className="mt-2 text-gray-500">View and manage customer orders.</p>
          <Link to="/admin/orders" className="mt-4 inline-block text-blue-600 hover:text-blue-500">Go to Orders →</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
