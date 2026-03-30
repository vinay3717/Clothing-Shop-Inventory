import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  ShoppingBag, Users, FileText, AlertCircle,
  TrendingUp, Clock, LogOut, Package,
  IndianRupee, Menu, X
} from 'lucide-react';

const Dashboard = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout }      = useAuth();
  const navigate              = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/reports/dashboard');
        setData(res.data.dashboard);
      } catch (err) {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <ShoppingBag size={24} />
          <span className="font-bold text-lg">Clothing Inventory</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <button onClick={() => navigate('/')}          className="hover:text-indigo-200 font-medium">Dashboard</button>
          <button onClick={() => navigate('/items')}     className="hover:text-indigo-200 font-medium">Items</button>
          <button onClick={() => navigate('/customers')} className="hover:text-indigo-200 font-medium">Customers</button>
          <button onClick={() => navigate('/bills')}     className="hover:text-indigo-200 font-medium">Bills</button>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:block text-sm text-indigo-200"> {user?.name}</span>
          <button onClick={handleLogout} className="flex items-center gap-1 bg-indigo-700 hover:bg-indigo-800 px-3 py-2 rounded-lg text-sm">
            <LogOut size={16} /> Logout
          </button>
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="bg-indigo-700 text-white flex flex-col md:hidden">
          <button onClick={() => { navigate('/');          setMenuOpen(false); }} className="px-6 py-3 text-left hover:bg-indigo-800">Dashboard</button>
          <button onClick={() => { navigate('/items');     setMenuOpen(false); }} className="px-6 py-3 text-left hover:bg-indigo-800">Items</button>
          <button onClick={() => { navigate('/customers'); setMenuOpen(false); }} className="px-6 py-3 text-left hover:bg-indigo-800">Customers</button>
          <button onClick={() => { navigate('/bills');     setMenuOpen(false); }} className="px-6 py-3 text-left hover:bg-indigo-800">Bills</button>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Good day, {user?.name}! </h2>
          <p className="text-gray-500 mt-1">Here's what's happening in your shop today.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Today's Sales</span>
              <div className="bg-green-100 p-2 rounded-xl">
                <TrendingUp size={18} className="text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">₹{Number(data?.today?.total_sales || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">{data?.today?.total_bills || 0} bills today</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">This Month</span>
              <div className="bg-blue-100 p-2 rounded-xl">
                <IndianRupee size={18} className="text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">₹{Number(data?.this_month?.total_sales || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">{data?.this_month?.total_bills || 0} bills this month</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Pending Dues</span>
              <div className="bg-red-100 p-2 rounded-xl">
                <AlertCircle size={18} className="text-red-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-red-500">₹{Number(data?.total_pending || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">Across all customers</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Total Customers</span>
              <div className="bg-purple-100 p-2 rounded-xl">
                <Users size={18} className="text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{data?.total_customers || 0}</p>
            <p className="text-xs text-gray-400 mt-1">{data?.total_items || 0} cloth items</p>
          </div>

        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Recent Bills */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <FileText size={18} className="text-indigo-600" /> Recent Bills
              </h3>
              <button onClick={() => navigate('/bills')} className="text-sm text-indigo-600 hover:underline">
                View all
              </button>
            </div>

            {data?.recent_bills?.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No bills yet</p>
            ) : (
              <div className="space-y-3">
                {data?.recent_bills?.map(bill => (
                  <div key={bill.bill_id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{bill.customer_name}</p>
                      <p className="text-xs text-gray-400">{new Date(bill.bill_date).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800 text-sm">₹{Number(bill.total_amount).toLocaleString()}</p>
                      {bill.pending_due > 0
                        ? <span className="text-xs text-red-500">Due: ₹{Number(bill.pending_due).toLocaleString()}</span>
                        : <span className="text-xs text-green-500">Paid </span>
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Dues + Low Stock */}
          <div className="space-y-6">

            {/* Top Dues */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                <AlertCircle size={18} className="text-red-500" /> Customers with Dues
              </h3>
              {data?.top_dues?.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-2">No pending dues </p>
              ) : (
                <div className="space-y-2">
                  {data?.top_dues?.map(c => (
                    <div key={c.customer_id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.mobile}</p>
                      </div>
                      <span className="text-red-500 font-bold text-sm">₹{Number(c.total_due).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Low Stock */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Package size={18} className="text-orange-500" /> Low Stock Alert
              </h3>
              {data?.low_stock?.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-2">All items well stocked ✓</p>
              ) : (
                <div className="space-y-2">
                  {data?.low_stock?.map(item => (
                    <div key={item.item_id} className="flex items-center justify-between">
                      <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                      <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full font-medium">
                        {item.stock_qty} left
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;