import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  ShoppingBag, Plus, Search, X,
  LogOut, Menu, FileText, Trash2,
  IndianRupee, User, Package
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BillsPage = () => {
  const [bills,       setBills]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [customers,   setCustomers]   = useState([]);
  const [items,       setItems]       = useState([]);
  const [searchCust,  setSearchCust]  = useState('');
  const [searchItem,  setSearchItem]  = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  const [showPayModal,  setShowPayModal]  = useState(false);
  const [payingBill,    setPayingBill]    = useState(null);
  const [payAmount,     setPayAmount]     = useState('');
  const [payMethod,     setPayMethod]     = useState('cash');

  const [form, setForm] = useState({
    customer_id:    '',
    customer_name:  '',
    items:          [],
    discount:       0,
    amount_paid:    0,
    payment_method: 'cash',
    notes:          ''
  });

  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  useEffect(() => { fetchBills(); }, []);

  const fetchBills = async () => {
    try {
      const res = await api.get('/bills');
      setBills(res.data.bills);
    } catch {
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  const openNewBill = async () => {
    setForm({
      customer_id: '', customer_name: '',
      items: [], discount: 0, amount_paid: 0,
      payment_method: 'cash', notes: ''
    });
    setSearchCust('');
    setSearchItem('');
    setCustomers([]);
    setItems([]);
    setShowModal(true);
  };

  const searchCustomers = async (q) => {
    setSearchCust(q);
    if (q.length < 2) { setCustomers([]); return; }
    try {
      const res = await api.get(`/customers/search?q=${q}`);
      setCustomers(res.data.customers);
    } catch {}
  };

  const selectCustomer = (customer) => {
    setForm({ ...form, customer_id: customer.customer_id, customer_name: customer.name });
    setSearchCust(customer.name);
    setCustomers([]);
  };

  const searchItems = async (q) => {
    setSearchItem(q);
    if (q.length < 2) { setItems([]); return; }
    try {
      const res = await api.get(`/items/search?q=${q}`);
      setItems(res.data.items);
    } catch {}
  };

  const addItemToBill = (item) => {
    const exists = form.items.find(i => i.item_id === item.item_id);
    if (exists) {
      setForm({
        ...form,
        items: form.items.map(i =>
          i.item_id === item.item_id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      });
    } else {
      setForm({
        ...form,
        items: [...form.items, {
          item_id:    item.item_id,
          item_name:  item.name,
          unit_price: Number(item.price),
          quantity:   1
        }]
      });
    }
    setSearchItem('');
    setItems([]);
  };

  const removeItem = (itemId) => {
    setForm({ ...form, items: form.items.filter(i => i.item_id !== itemId) });
  };

  const updateQty = (itemId, qty) => {
    if (qty < 1) return;
    setForm({
      ...form,
      items: form.items.map(i =>
        i.item_id === itemId ? { ...i, quantity: Number(qty) } : i
      )
    });
  };

  const getSubtotal = () =>
    form.items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

  const getTotal = () => getSubtotal() - Number(form.discount || 0);

  const getPending = () => getTotal() - Number(form.amount_paid || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_id) { toast.error('Please select a customer'); return; }
    if (form.items.length === 0) { toast.error('Please add at least one item'); return; }
    if (getPending() < 0) { toast.error('Amount paid cannot exceed total'); return; }

    try {
      await api.post('/bills', {
        customer_id:    form.customer_id,
        items:          form.items,
        discount:       Number(form.discount),
        amount_paid:    Number(form.amount_paid),
        payment_method: form.payment_method,
        notes:          form.notes
      });
      toast.success('Bill created successfully!');
      setShowModal(false);
      fetchBills();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create bill');
    }
  };
  const handleRecordPayment = async (e) => {
  e.preventDefault();
  if (!payAmount || Number(payAmount) <= 0) {
    toast.error('Enter a valid amount');
    return;
  }
  if (Number(payAmount) > Number(payingBill.pending_due)) {
    toast.error(`Amount cannot exceed pending due of ₹${Number(payingBill.pending_due).toLocaleString()}`);
    return;
  }
  try {
    await api.post('/payments', {
      customer_id: payingBill.customer_id,
      bill_id:     payingBill.bill_id,
      amount:      Number(payAmount),
      method:      payMethod,
      notes:       `Payment against bill dated ${new Date(payingBill.bill_date).toLocaleDateString('en-IN')}`
    });
    toast.success('Payment recorded successfully!');
    setShowPayModal(false);
    setPayingBill(null);
    setPayAmount('');
    fetchBills();
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to record payment');
  }
};
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <ShoppingBag size={24} />
          <span className="font-bold text-lg">Clothing Inventory</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <button onClick={() => navigate('/')}          className="hover:text-indigo-200 font-medium">Dashboard</button>
          <button onClick={() => navigate('/items')}     className="hover:text-indigo-200 font-medium">Items</button>
          <button onClick={() => navigate('/customers')} className="hover:text-indigo-200 font-medium">Customers</button>
          <button onClick={() => navigate('/bills')}     className="text-white font-bold border-b-2 border-white pb-0.5">Bills</button>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:block text-sm text-indigo-200">👋 {user?.name}</span>
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

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Bills</h2>
            <p className="text-gray-500 text-sm mt-1">{bills.length} bills total</p>
          </div>
          <button
            onClick={openNewBill}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium transition"
          >
            <Plus size={18} /> New Bill
          </button>
        </div>

        {/* Bills List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-400">Loading bills...</p>
          </div>
        ) : bills.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No bills yet</p>
            <p className="text-gray-400 text-sm">Click "New Bill" to create your first bill</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bills.map(bill => (
              <div
                key={bill.bill_id}
                onClick={() => setSelectedBill(selectedBill?.bill_id === bill.bill_id ? null : bill)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-100 rounded-full w-11 h-11 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-600 font-bold">
                        {bill.customer_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{bill.customer_name}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(bill.bill_date).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })} · {bill.payment_method?.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800 text-lg">₹{Number(bill.total_amount).toLocaleString()}</p>
                    {Number(bill.pending_due) > 0 ? (
                      <span className="text-xs text-red-500 font-medium">
                        Due: ₹{Number(bill.pending_due).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-xs text-green-500 font-medium">Paid ✓</span>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedBill?.bill_id === bill.bill_id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-gray-400 text-xs mb-1">Subtotal</p>
                        <p className="font-semibold">₹{Number(bill.subtotal).toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-gray-400 text-xs mb-1">Discount</p>
                        <p className="font-semibold text-orange-500">- ₹{Number(bill.discount).toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-gray-400 text-xs mb-1">Amount Paid</p>
                        <p className="font-semibold text-green-600">₹{Number(bill.amount_paid).toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-gray-400 text-xs mb-1">Pending Due</p>
                        <p className={`font-semibold ${Number(bill.pending_due) > 0 ? 'text-red-500' : 'text-green-600'}`}>
                          ₹{Number(bill.pending_due).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {bill.notes && (
                      <p className="text-sm text-gray-500 mt-3">📝 {bill.notes}</p>
                    )}

  
    {Number(bill.pending_due) > 0 && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setPayingBill(bill);
          setPayAmount('');
          setPayMethod('cash');
          setShowPayModal(true);
        }}
        className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl font-medium transition flex items-center justify-center gap-2"
      >
        <IndianRupee size={16} /> Record Payment · Due: ₹{Number(bill.pending_due).toLocaleString()}
      </button>
    )}

  </div>
)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Bill Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

            {/* Modal Header */}
            <div className="sticky top-0 bg-white rounded-t-2xl flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">Create New Bill</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">

              {/* Customer Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User size={14} className="inline mr-1" /> Select Customer *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchCust}
                    onChange={(e) => searchCustomers(e.target.value)}
                    placeholder="Type customer name or mobile..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {customers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 mt-1 max-h-40 overflow-y-auto">
                      {customers.map(c => (
                        <button
                          key={c.customer_id}
                          type="button"
                          onClick={() => selectCustomer(c)}
                          className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 flex items-center justify-between"
                        >
                          <span className="font-medium text-gray-800">{c.name}</span>
                          <span className="text-sm text-gray-400">{c.mobile}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {form.customer_name && (
                  <p className="text-sm text-green-600 mt-1">✓ Selected: {form.customer_name}</p>
                )}
              </div>

              {/* Item Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package size={14} className="inline mr-1" /> Add Items *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchItem}
                    onChange={(e) => searchItems(e.target.value)}
                    placeholder="Search cloth items to add..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {items.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 mt-1 max-h-40 overflow-y-auto">
                      {items.map(item => (
                        <button
                          key={item.item_id}
                          type="button"
                          onClick={() => addItemToBill(item)}
                          className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-medium text-gray-800">{item.name}</span>
                            <span className="text-xs text-gray-400 ml-2">{item.category}</span>
                          </div>
                          <span className="text-indigo-600 font-semibold">₹{Number(item.price).toLocaleString()}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bill Items Table */}
              {form.items.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-gray-600 font-medium">Item</th>
                        <th className="text-center px-4 py-2.5 text-gray-600 font-medium">Qty</th>
                        <th className="text-right px-4 py-2.5 text-gray-600 font-medium">Price</th>
                        <th className="text-right px-4 py-2.5 text-gray-600 font-medium">Total</th>
                        <th className="px-4 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map(item => (
                        <tr key={item.item_id} className="border-t border-gray-100">
                          <td className="px-4 py-3 font-medium text-gray-800">{item.item_name}</td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateQty(item.item_id, e.target.value)}
                              className="w-16 text-center border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">₹{item.unit_price.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-800">
                            ₹{(item.quantity * item.unit_price).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button type="button" onClick={() => removeItem(item.item_id)} className="text-red-400 hover:text-red-600">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount (₹)</label>
                  <input
                    type="number" min="0"
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={form.payment_method}
                    onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="credit">Credit (Due)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (₹)</label>
                <input
                  type="number" min="0"
                  value={form.amount_paid}
                  onChange={(e) => setForm({ ...form, amount_paid: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any remarks..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Bill Summary */}
              {form.items.length > 0 && (
                <div className="bg-indigo-50 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{getSubtotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-orange-500">
                    <span>Discount</span>
                    <span>- ₹{Number(form.discount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-800 text-base border-t border-indigo-200 pt-2">
                    <span>Total</span>
                    <span>₹{getTotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Amount Paid</span>
                    <span>₹{Number(form.amount_paid || 0).toLocaleString()}</span>
                  </div>
                  <div className={`flex justify-between font-bold text-base ${getPending() > 0 ? 'text-red-500' : 'text-green-600'}`}>
                    <span>Pending Due</span>
                    <span>₹{getPending().toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-xl font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition"
                >
                  Create Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        {/* Record Payment Modal */}
        {showPayModal && payingBill && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">

      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-gray-800">Record Payment</h3>
        <button onClick={() => setShowPayModal(false)} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      {/* Bill Summary */}
      <div className="bg-gray-50 rounded-xl p-4 mb-5">
        <p className="font-semibold text-gray-800">{payingBill.customer_name}</p>
        <p className="text-sm text-gray-400 mt-0.5">
          Bill date: {new Date(payingBill.bill_date).toLocaleDateString('en-IN')}
        </p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm text-gray-500">Total Bill</span>
          <span className="font-medium">₹{Number(payingBill.total_amount).toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm text-gray-500">Already Paid</span>
          <span className="font-medium text-green-600">₹{Number(payingBill.amount_paid).toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between mt-1 pt-2 border-t border-gray-200">
          <span className="text-sm font-semibold text-red-500">Pending Due</span>
          <span className="font-bold text-red-500">₹{Number(payingBill.pending_due).toLocaleString()}</span>
        </div>
      </div>

      <form onSubmit={handleRecordPayment} className="space-y-4">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount Receiving (₹) *
          </label>
          <input
            type="number"
            required
            min="1"
            max={payingBill.pending_due}
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            placeholder={`Max: ₹${Number(payingBill.pending_due).toLocaleString()}`}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {/* Quick fill buttons */}
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => setPayAmount(payingBill.pending_due)}
              className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-100 transition"
            >
              Pay Full (₹{Number(payingBill.pending_due).toLocaleString()})
            </button>
            <button
              type="button"
              onClick={() => setPayAmount(Math.floor(payingBill.pending_due / 2))}
              className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
            >
              Pay Half (₹{Math.floor(payingBill.pending_due / 2).toLocaleString()})
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
          <select
            value={payMethod}
            onChange={(e) => setPayMethod(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
          </select>
        </div>

        {/* Preview */}
        {payAmount > 0 && (
          <div className="bg-green-50 rounded-xl p-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Paying now</span>
              <span className="font-semibold text-green-600">₹{Number(payAmount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600 mt-1">
              <span>Remaining after payment</span>
              <span className={`font-semibold ${
                Number(payingBill.pending_due) - Number(payAmount) === 0
                  ? 'text-green-600' : 'text-red-500'
              }`}>
                ₹{(Number(payingBill.pending_due) - Number(payAmount)).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => setShowPayModal(false)}
            className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl font-medium transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl font-medium transition"
          >
            Confirm Payment
          </button>
        </div>
      </form>
    </div>
  </div>
      )}
    </div>
  );
};

export default BillsPage;