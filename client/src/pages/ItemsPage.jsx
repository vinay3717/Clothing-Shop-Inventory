import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  ShoppingBag, Plus, Search, Edit2,
  Trash2, X, LogOut, Menu, Users, FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ItemsPage = () => {
  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [showModal,  setShowModal]  = useState(false);
  const [editItem,   setEditItem]   = useState(null);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [form,       setForm]       = useState({
    name: '', category: '', price: '',
    stock_qty: '', color: '', description: ''
  });

  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const categories = ['Saree', 'Kurti', 'Suit', 'Fabric', 'Dupatta', 'Lehenga', 'Shirt', 'Other'];

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get('/items');
      setItems(res.data.items);
    } catch {
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (q) => {
    setSearch(q);
    if (q.length === 0) { fetchItems(); return; }
    if (q.length < 2)   return;
    try {
      const res = await api.get(`/items/search?q=${q}`);
      setItems(res.data.items);
    } catch {
      toast.error('Search failed');
    }
  };

  const openAddModal = () => {
    setEditItem(null);
    setForm({ name: '', category: '', price: '', stock_qty: '', color: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setForm({
      name:        item.name,
      category:    item.category,
      price:       item.price,
      stock_qty:   item.stock_qty,
      color:       item.color || '',
      description: item.description || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.put(`/items/${editItem.item_id}`, form);
        toast.success('Item updated!');
      } else {
        await api.post('/items', form);
        toast.success('Item added!');
      }
      setShowModal(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  };

  const handleDelete = async (itemId) => {
    if (!confirm('Delete this item?')) return;
    try {
      await api.delete(`/items/${itemId}`);
      toast.success('Item deleted');
      fetchItems();
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
          <button onClick={() => navigate('/items')}     className="text-white font-bold border-b-2 border-white pb-0.5">Items</button>
          <button onClick={() => navigate('/customers')} className="hover:text-indigo-200 font-medium">Customers</button>
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
            <h2 className="text-2xl font-bold text-gray-800">Cloth Items</h2>
            <p className="text-gray-500 text-sm mt-1">{items.length} items in catalogue</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium transition"
          >
            <Plus size={18} /> Add Item
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name, color, category..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-400">Loading items...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No items found</p>
            <p className="text-gray-400 text-sm">Click "Add Item" to add your first cloth item</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map(item => (
              <div key={item.item_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">

                {/* Category Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-indigo-50 text-indigo-600 text-xs font-medium px-2.5 py-1 rounded-full">
                    {item.category}
                  </span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    item.stock_qty === 0   ? 'bg-red-50 text-red-500'    :
                    item.stock_qty < 3     ? 'bg-orange-50 text-orange-500' :
                    'bg-green-50 text-green-600'
                  }`}>
                    {item.stock_qty === 0 ? 'Out of Stock' : `${item.stock_qty} in stock`}
                  </span>
                </div>

                {/* Item Info */}
                <h3 className="font-semibold text-gray-800 mb-1 truncate">{item.name}</h3>
                {item.color && <p className="text-xs text-gray-400 mb-2">Color: {item.color}</p>}
                <p className="text-xl font-bold text-indigo-600 mb-4">₹{Number(item.price).toLocaleString()}</p>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(item)}
                    className="flex-1 flex items-center justify-center gap-1 border border-gray-200 hover:bg-gray-50 text-gray-600 py-2 rounded-xl text-sm transition"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.item_id)}
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
                {editItem ? 'Edit Item' : 'Add New Item'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Banarasi Silk Saree"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select...</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <input
                    type="text"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    placeholder="e.g. Red"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Qty</label>
                  <input
                    type="number"
                    value={form.stock_qty}
                    onChange={(e) => setForm({ ...form, stock_qty: e.target.value })}
                    placeholder="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional notes about this item..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
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
                  {editItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemsPage;