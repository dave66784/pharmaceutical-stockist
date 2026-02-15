import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
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
            <Link
              to="/admin"
              className={`block px-6 py-3 ${isActive('/admin')}`}
            >
              Overview
            </Link>
            <Link
              to="/admin/products"
              className={`block px-6 py-3 ${isActive('/admin/products')}`}
            >
              Manage Products
            </Link>
            <Link
              to="/admin/orders"
              className={`block px-6 py-3 ${isActive('/admin/orders')}`}
            >
              Manage Orders
            </Link>
            <Link
              to="/admin/users"
              className={`block px-6 py-3 ${isActive('/admin/users')}`}
            >
              Manage Users
            </Link>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8">
          <div className="md:hidden mb-4 bg-white p-4 shadow rounded-lg">
            {/* Mobile Nav Placeholder - simple links */}
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
  const [stats, setStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await fetch('/api/admin/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const result = await data.json();
        setStats(result.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading statistics...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>

      {/* Revenue Stats */}
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

      {/* Orders & Products Stats */}
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

      {/* Order Status Breakdown */}
      {stats?.ordersByStatus && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Orders by Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(stats.ordersByStatus).map(([status, count]) => (
              <div key={status} className="text-center p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">{status}</p>
                <p className="text-2xl font-bold text-gray-900">{count as number}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

