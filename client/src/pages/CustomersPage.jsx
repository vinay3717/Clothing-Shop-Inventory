import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  ShoppingBag, Plus, Search, Edit2,
  Trash2, X, LogOut, Menu, Phone,
  MapPin, AlertCircle, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CustomersPage = () => {
  const [customers,  setCustomers]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [showModal,  setShowModal]  = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [filterDues, setFilterDues] = useState(false);
  const [form, setForm] = useState({
    name: '', mobile: '', address: '', birthday: ''
  });

  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data.customers);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (q) => {
    setSearch(q);
    if (q.length === 0) { fetchCustomers(); return; }
    if (q.length < 2)   return;
    try {
      const res = await api.get(`/customers/search?q=${q}`);
      setCustomers(res.data.customers);
    } catch {
      toast.error('Search failed');
    }
  };

  const handleFilterDues = async () => {
    setFilterDues(!filterDues);
    if (!filterDues) {
      try {
        const res = await api.get('/customers/dues');
        setCustomers(res.data.customers);
      } catch {
        toast.error('Failed to filter');
      }
    } else {
      fetchCustomers();
    }
  };

  const openAddModal = () => {
    setEditCustomer(null);
    setForm({ name: '', mobile: '', address: '', birthday: '' });
    setShowModal(true);
  };

  const openEditModal = (customer) => {
    setEditCustomer(customer);
    setForm({
      name:     customer.name,
      mobile:   customer.mobile,
      address:  customer.address  || '',
      birthday: customer.birthday ? customer.birthday.split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editCustomer) {
        await api.put(`/customers/${editCustomer.customer_id}`, form);
        toast.success('Customer updated!');
      } else {
        await api.post('/customers', form);
        toast.success('Customer added!');
      }
      setShowModal(false);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  };

  const handleDelete = async (customerId) => {
    if (!confirm('Delete this customer?')) return;
    try {
      await api.delete(`/customers/${customerId}`);
      toast.success('Customer deleted');
      fetchCustomers();
    } catch {
      toast.error('Failed to delete');
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
          <button onClick={() => navigate('/customers')} className="text-white font-bold border-b-2 border-white pb-0.5">Customers</button>
          <button onClick={() => navigate('/bills')}     className="hover:text-indigo-200 font-medium">Bills</button>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:block text-sm text-indigo-200">👋 {user?.name}</span>
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

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Customers</h2>
            <p className="text-gray-500 text-sm mt-1">{customers.length} customers total</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleFilterDues}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition border ${
                filterDues
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <AlertCircle size={16} />
              {filterDues ? 'Show All' : 'Pending Dues'}
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium transition"
            >
              <Plus size={18} /> Add Customer
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or mobile number..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>

        {/* Customers Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-400">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-20">
            <User size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No customers found</p>
            <p className="text-gray-400 text-sm">Click "Add Customer" to add your first customer</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {customers.map(customer => (
              <div key={customer.customer_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">

                {/* Avatar */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-indigo-100 rounded-full w-11 h-11 flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-600 font-bold text-lg">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">{customer.name}</h3>
                    <p className="text-xs text-gray-400">
                      Since {new Date(customer.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={14} className="text-gray-400 flex-shrink-0" />
                    <span>{customer.mobile}</span>
                  </div>
                  {customer.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{customer.address}</span>
                    </div>
                  )}
                </div>

                {/* Due Badge */}
                {Number(customer.total_due) > 0 ? (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-4 flex items-center justify-between">
                    <span className="text-xs text-red-500 font-medium">Pending Due</span>
                    <span className="text-red-600 font-bold text-sm">₹{Number(customer.total_due).toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2 mb-4">
                    <span className="text-xs text-green-600 font-medium">✓ No pending dues</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(customer)}
                    className="flex-1 flex items-center justify-center gap-1 border border-gray-200 hover:bg-gray-50 text-gray-600 py-2 rounded-xl text-sm transition"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(customer.customer_id)}
                    className="flex items-center justify-center border border-red-100 hover:bg-red-50 text-red-400 p-2 rounded-xl transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">

            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-800">
                {editCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ramesh Shah"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="e.g. 123 MG Road, Pune"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Birthday (optional)</label>
                <input
                  type="date"
                  value={form.birthday}
                  onChange={(e) => setForm({ ...form, birthday: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-medium transition"
                >
                  {editCustomer ? 'Update' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;