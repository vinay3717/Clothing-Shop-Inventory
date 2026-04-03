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
  const [purchaseData, setPurchaseData] = useState(null);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout }      = useAuth();
  const navigate              = useNavigate();
  const [showSupplierPayModal, setShowSupplierPayModal] = useState(false);
  const [payingPurchase,       setPayingPurchase]       = useState(null);
  const [supplierPayAmount,    setSupplierPayAmount]    = useState('');
  const [supplierPayMethod,    setSupplierPayMethod]    = useState('cash');

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

  const fetchPurchases = async () => {
    try {
      const res = await api.get('/purchases/stats/summary');
      setPurchaseData(res.data.summary);
    } catch (err) {
      console.error('Purchase summary error');
    }
  };

  fetchDashboard();
  fetchPurchases();
}, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSupplierPayment = async (e) => {
  e.preventDefault();
  if (!supplierPayAmount || Number(supplierPayAmount) <= 0) {
    toast.error('Enter a valid amount');
    return;
  }
  try {
    await api.post(`/purchases/${payingPurchase.purchase_id}/pay`, {
      amount: Number(supplierPayAmount),
      method: supplierPayMethod,
    });
    toast.success('Supplier payment recorded!');
    setShowSupplierPayModal(false);
    setPayingPurchase(null);
    // Refresh purchase data
    const res = await api.get('/purchases/stats/summary');
    setPurchaseData(res.data.summary);
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to record payment');
  }
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
          <button onClick={() => navigate('/suppliers')} className="hover:text-indigo-200 font-medium">Suppliers</button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="bg-indigo-700 text-white flex flex-col md:hidden">
          <button onClick={() => { navigate('/');          setMenuOpen(false); }} className="px-6 py-3 text-left hover:bg-indigo-800">Dashboard</button>
          <button onClick={() => { navigate('/items');     setMenuOpen(false); }} className="px-6 py-3 text-left hover:bg-indigo-800">Items</button>
          <button onClick={() => { navigate('/customers'); setMenuOpen(false); }} className="px-6 py-3 text-left hover:bg-indigo-800">Customers</button>
          <button onClick={() => { navigate('/bills');     setMenuOpen(false); }} className="px-6 py-3 text-left hover:bg-indigo-800">Bills</button>
          <button onClick={() => { navigate('/suppliers'); setMenuOpen(false); }} className="px-6 py-3 text-left hover:bg-indigo-800">Suppliers</button>
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">

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
              <span className="text-sm text-gray-500">This Month Sales</span>
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
              <span className="text-sm text-gray-500">This Month Spent</span>
              <div className="bg-orange-100 p-2 rounded-xl">
                <Package size={18} className="text-orange-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">₹{Number(purchaseData?.this_month?.total_spent || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">{purchaseData?.this_month?.total_purchases || 0} purchases</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Net Profit (Month)</span>
              <div className="bg-emerald-100 p-2 rounded-xl">
                <TrendingUp size={18} className="text-emerald-600" />
              </div>
            </div>
            <p className={`text-2xl font-bold ${Number(purchaseData?.profit?.net_profit || 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              ₹{Number(purchaseData?.profit?.net_profit || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Revenue ₹{Number(purchaseData?.profit?.revenue || 0).toLocaleString()} · Cost ₹{Number(purchaseData?.profit?.cost || 0).toLocaleString()}
            </p>
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
              {/* Purchases & Profit Section */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">

  {/* Recent Purchases */}
<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
  <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
    <Package size={18} className="text-orange-500" /> Recent Purchases
  </h3>
  {!purchaseData?.recent_purchases?.length ? (
    <p className="text-gray-400 text-sm text-center py-4">No purchases recorded yet</p>
  ) : (
    <div className="space-y-3">
      {purchaseData.recent_purchases.map(p => (
        <div key={p.purchase_id} className="border border-gray-100 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800 text-sm">
                {p.supplier_name || 'Unknown Supplier'}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(p.purchase_date).toLocaleDateString('en-IN')}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-800 text-sm">
                ₹{Number(p.total_amount).toLocaleString()}
              </p>
              {Number(p.pending_due) > 0 ? (
                <span className="text-xs text-red-500">
                  Due: ₹{Number(p.pending_due).toLocaleString()}
                </span>
              ) : (
                <span className="text-xs text-green-500">Paid ✓</span>
              )}
            </div>
          </div>

          {/* Pay Supplier Button */}
          {Number(p.pending_due) > 0 && (
            <button
              onClick={() => {
                setPayingPurchase(p);
                setSupplierPayAmount('');
                setSupplierPayMethod('cash');
                setShowSupplierPayModal(true);
              }}
              className="mt-2 w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
            >
              <IndianRupee size={14} /> Pay Supplier · Due: ₹{Number(p.pending_due).toLocaleString()}
            </button>
          )}
        </div>
      ))}
    </div>
  )}
</div>

  {/* Item Profit Margins */}
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
    <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
      <TrendingUp size={18} className="text-emerald-500" /> Profit Per Item
    </h3>
    {!purchaseData?.item_profits?.length ? (
      <p className="text-gray-400 text-sm text-center py-4">Add cost price to items to see profit margins</p>
    ) : (
      <div className="space-y-3">
        {purchaseData.item_profits.slice(0, 5).map(item => (
          <div key={item.item_id} className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-800 text-sm truncate">{item.name}</p>
              <p className="text-xs text-gray-400">
                Cost ₹{Number(item.cost_price).toLocaleString()} → 
                Sell ₹{Number(item.selling_price).toLocaleString()}
              </p>
            </div>
            <div className="text-right ml-3">
              <p className="font-bold text-emerald-600 text-sm">
                +₹{Number(item.profit_per_unit).toLocaleString()}
              </p>
              <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
                {item.profit_margin_pct}%
              </span>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
  {/* Pay Supplier Modal */}
{showSupplierPayModal && payingPurchase && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">

      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-gray-800">Pay Supplier</h3>
        <button onClick={() => setShowSupplierPayModal(false)} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      {/* Purchase Summary */}
      <div className="bg-gray-50 rounded-xl p-4 mb-5">
        <p className="font-semibold text-gray-800">
          {payingPurchase.supplier_name || 'Unknown Supplier'}
        </p>
        <p className="text-sm text-gray-400 mt-0.5">
          Purchase date: {new Date(payingPurchase.purchase_date).toLocaleDateString('en-IN')}
        </p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm text-gray-500">Total Purchase</span>
          <span className="font-medium">₹{Number(payingPurchase.total_amount).toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm text-gray-500">Already Paid</span>
          <span className="font-medium text-green-600">₹{Number(payingPurchase.amount_paid).toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between mt-1 pt-2 border-t border-gray-200">
          <span className="text-sm font-semibold text-red-500">Pending Due</span>
          <span className="font-bold text-red-500">₹{Number(payingPurchase.pending_due).toLocaleString()}</span>
        </div>
      </div>

      <form onSubmit={handleSupplierPayment} className="space-y-4">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount Paying (₹) *
          </label>
          <input
            type="number"
            required
            min="1"
            max={payingPurchase.pending_due}
            value={supplierPayAmount}
            onChange={(e) => setSupplierPayAmount(e.target.value)}
            placeholder={`Max: ₹${Number(payingPurchase.pending_due).toLocaleString()}`}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          {/* Quick fill */}
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => setSupplierPayAmount(payingPurchase.pending_due)}
              className="text-xs bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition"
            >
              Pay Full (₹{Number(payingPurchase.pending_due).toLocaleString()})
            </button>
            <button
              type="button"
              onClick={() => setSupplierPayAmount(Math.floor(payingPurchase.pending_due / 2))}
              className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
            >
              Pay Half (₹{Math.floor(payingPurchase.pending_due / 2).toLocaleString()})
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
          <select
            value={supplierPayMethod}
            onChange={(e) => setSupplierPayMethod(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
          </select>
        </div>

        {/* Preview */}
        {supplierPayAmount > 0 && (
          <div className="bg-orange-50 rounded-xl p-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Paying now</span>
              <span className="font-semibold text-orange-600">
                ₹{Number(supplierPayAmount).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-gray-600 mt-1">
              <span>Remaining after payment</span>
              <span className={`font-semibold ${
                Number(payingPurchase.pending_due) - Number(supplierPayAmount) === 0
                  ? 'text-green-600' : 'text-red-500'
              }`}>
                ₹{(Number(payingPurchase.pending_due) - Number(supplierPayAmount)).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => setShowSupplierPayModal(false)}
            className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl font-medium transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl font-medium transition"
          >
            Confirm Payment
          </button>
        </div>
      </form>
    </div>
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