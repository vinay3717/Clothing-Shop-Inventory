import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  ShoppingBag, Plus, X, LogOut, Menu,
  Phone, MapPin, Truck, IndianRupee,
  Package, Trash2, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SuppliersPage = () => {
  const [suppliers,       setSuppliers]       = useState([]);
  const [purchases,       setPurchases]       = useState([]);
  const [items,           setItems]           = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [menuOpen,        setMenuOpen]        = useState(false);
  const [showSupModal,    setShowSupModal]    = useState(false);
  const [showPurModal,    setShowPurModal]    = useState(false);
  const [expandedSup,     setExpandedSup]     = useState(null);
  const [searchItem,      setSearchItem]      = useState('');
  const [itemResults,     setItemResults]     = useState([]);
  const [showPayModal,    setShowPayModal]    = useState(false);
  const [payingPurchase,  setPayingPurchase]  = useState(null);
  const [payAmount,       setPayAmount]       = useState('');
  const [payMethod,       setPayMethod]       = useState('cash');

  const [supForm, setSupForm] = useState({
    name: '', mobile: '', address: ''
  });

  const [purForm, setPurForm] = useState({
    supplier_id:  '',
    items:        [],
    amount_paid:  0,
    notes:        ''
  });

  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [supRes, purRes, itemRes] = await Promise.all([
        api.get('/suppliers'),
        api.get('/purchases'),
        api.get('/items')
      ]);
      setSuppliers(supRes.data.suppliers);
      setPurchases(purRes.data.purchases);
      setItems(itemRes.data.items);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Supplier form
  const handleAddSupplier = async (e) => {
    e.preventDefault();
    try {
      await api.post('/suppliers', supForm);
      toast.success('Supplier added!');
      setShowSupModal(false);
      setSupForm({ name: '', mobile: '', address: '' });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add supplier');
    }
  };

  // Item search for purchase
  const handleItemSearch = (q) => {
    setSearchItem(q);
    if (q.length < 1) { setItemResults([]); return; }
    const filtered = items.filter(i =>
      i.name.toLowerCase().includes(q.toLowerCase())
    );
    setItemResults(filtered);
  };

  const addItemToPurchase = (item) => {
    const exists = purForm.items.find(i => i.item_id === item.item_id);
    if (exists) {
      setPurForm({
        ...purForm,
        items: purForm.items.map(i =>
          i.item_id === item.item_id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      });
    } else {
      setPurForm({
        ...purForm,
        items: [...purForm.items, {
          item_id:    item.item_id,
          item_name:  item.name,
          cost_price: '',
          quantity:   1
        }]
      });
    }
    setSearchItem('');
    setItemResults([]);
  };

  const removeItemFromPurchase = (itemId) => {
    setPurForm({
      ...purForm,
      items: purForm.items.filter(i => i.item_id !== itemId)
    });
  };

  const updatePurItem = (itemId, field, value) => {
    setPurForm({
      ...purForm,
      items: purForm.items.map(i =>
        i.item_id === itemId ? { ...i, [field]: value } : i
      )
    });
  };

  const getPurTotal = () =>
    purForm.items.reduce((sum, i) =>
      sum + (Number(i.quantity) * Number(i.cost_price || 0)), 0
    );

  // Create purchase
  const handleCreatePurchase = async (e) => {
    e.preventDefault();
    if (!purForm.supplier_id) {
      toast.error('Please select a supplier'); return;
    }
    if (purForm.items.length === 0) {
      toast.error('Add at least one item'); return;
    }
    for (const item of purForm.items) {
      if (!item.cost_price || Number(item.cost_price) <= 0) {
        toast.error(`Enter cost price for ${item.item_name}`); return;
      }
    }
    try {
      await api.post('/purchases', {
        supplier_id: purForm.supplier_id,
        items:       purForm.items.map(i => ({
          item_id:    i.item_id,
          item_name:  i.item_name,
          quantity:   Number(i.quantity),
          cost_price: Number(i.cost_price)
        })),
        amount_paid: Number(purForm.amount_paid),
        notes:       purForm.notes
      });
      toast.success('Purchase recorded! Stock updated.');
      setShowPurModal(false);
      setPurForm({ supplier_id: '', items: [], amount_paid: 0, notes: '' });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create purchase');
    }
  };

  // Pay supplier
  const handlePaySupplier = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) {
      toast.error('Enter valid amount'); return;
    }
    try {
      await api.post(`/purchases/${payingPurchase.purchase_id}/pay`, {
        amount: Number(payAmount),
        method: payMethod
      });
      toast.success('Payment recorded!');
      setShowPayModal(false);
      setPayingPurchase(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  // Get purchases for a supplier
  const getSupplierPurchases = (supplierId) =>
    purchases.filter(p => p.supplier_id === supplierId);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <ShoppingBag size={24} />
          <span className="font-bold text-lg">Clothing Inventory</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <button onClick={() => navigate('/')}           className="hover:text-indigo-200 font-medium">Dashboard</button>
          <button onClick={() => navigate('/items')}      className="hover:text-indigo-200 font-medium">Items</button>
          <button onClick={() => navigate('/customers')}  className="hover:text-indigo-200 font-medium">Customers</button>
          <button onClick={() => navigate('/bills')}      className="hover:text-indigo-200 font-medium">Bills</button>
          <button onClick={() => navigate('/suppliers')}  className="text-white font-bold border-b-2 border-white pb-0.5">Suppliers</button>
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
          <button onClick={() => { navigate('/suppliers'); setMenuOpen(false); }} className="px-6 py-3 text-left hover:bg-indigo-800">Suppliers</button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Suppliers & Purchases</h2>
            <p className="text-gray-500 text-sm mt-1">
              {suppliers.length} suppliers · {purchases.length} purchases
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setPurForm({ supplier_id: '', items: [], amount_paid: 0, notes: '' });
                setShowPurModal(true);
              }}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-medium transition"
            >
              <Package size={18} /> New Purchase
            </button>
            <button
              onClick={() => {
                setSupForm({ name: '', mobile: '', address: '' });
                setShowSupModal(true);
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium transition"
            >
              <Plus size={18} /> Add Supplier
            </button>
          </div>
        </div>

        {/* Suppliers List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-20">
            <Truck size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No suppliers yet</p>
            <p className="text-gray-400 text-sm">Click "Add Supplier" to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {suppliers.map(supplier => {
              const supPurchases = getSupplierPurchases(supplier.supplier_id);
              const totalSpent   = supPurchases.reduce((s, p) => s + Number(p.total_amount), 0);
              const totalDue     = supPurchases.reduce((s, p) => s + Number(p.pending_due), 0);
              const isExpanded   = expandedSup === supplier.supplier_id;

              return (
                <div key={supplier.supplier_id} className="bg-white rounded-2xl shadow-sm border border-gray-100">

                  {/* Supplier Header */}
                  <div
                    className="p-5 cursor-pointer"
                    onClick={() => setExpandedSup(isExpanded ? null : supplier.supplier_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0">
                          <span className="text-orange-600 font-bold text-lg">
                            {supplier.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 text-lg">{supplier.name}</h3>
                          <div className="flex items-center gap-4 mt-1">
                            {supplier.mobile && (
                              <span className="flex items-center gap-1 text-sm text-gray-500">
                                <Phone size={13} /> {supplier.mobile}
                              </span>
                            )}
                            {supplier.address && (
                              <span className="flex items-center gap-1 text-sm text-gray-500">
                                <MapPin size={13} /> {supplier.address}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right hidden md:block">
                          <p className="text-sm text-gray-400">Total Purchased</p>
                          <p className="font-bold text-gray-800">₹{totalSpent.toLocaleString()}</p>
                        </div>
                        {totalDue > 0 ? (
                          <div className="text-right">
                            <p className="text-xs text-red-400">Pending Due</p>
                            <p className="font-bold text-red-500">₹{totalDue.toLocaleString()}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-green-500 font-medium bg-green-50 px-3 py-1 rounded-full">
                            All Paid ✓
                          </span>
                        )}
                        {isExpanded
                          ? <ChevronUp size={20} className="text-gray-400" />
                          : <ChevronDown size={20} className="text-gray-400" />
                        }
                      </div>
                    </div>
                  </div>

                  {/* Expanded Purchases */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-5">
                      <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Package size={16} className="text-orange-500" />
                        Purchase History ({supPurchases.length})
                      </h4>

                      {supPurchases.length === 0 ? (
                        <p className="text-gray-400 text-sm">No purchases from this supplier yet</p>
                      ) : (
                        <div className="space-y-3">
                          {supPurchases.map(p => (
                            <div key={p.purchase_id} className="bg-gray-50 rounded-xl p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-800">
                                    {new Date(p.purchase_date).toLocaleDateString('en-IN', {
                                      day: 'numeric', month: 'short', year: 'numeric'
                                    })}
                                  </p>
                                  {p.notes && (
                                    <p className="text-xs text-gray-400 mt-0.5">📝 {p.notes}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-gray-800">₹{Number(p.total_amount).toLocaleString()}</p>
                                  <p className="text-xs text-green-600">
                                    Paid: ₹{Number(p.amount_paid).toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              {/* Pay button if due */}
                              {Number(p.pending_due) > 0 && (
                                <button
                                  onClick={() => {
                                    setPayingPurchase(p);
                                    setPayAmount('');
                                    setPayMethod('cash');
                                    setShowPayModal(true);
                                  }}
                                  className="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
                                >
                                  <IndianRupee size={14} />
                                  Pay Due · ₹{Number(p.pending_due).toLocaleString()}
                                </button>
                              )}
                              {Number(p.pending_due) === 0 && (
                                <p className="text-xs text-green-600 text-center mt-2">✓ Fully Paid</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Supplier Modal */}
      {showSupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-800">Add New Supplier</h3>
              <button onClick={() => setShowSupModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                <input
                  type="text" required
                  value={supForm.name}
                  onChange={(e) => setSupForm({ ...supForm, name: e.target.value })}
                  placeholder="e.g. Surat Textile Mills"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={supForm.mobile}
                  onChange={(e) => setSupForm({ ...supForm, mobile: e.target.value })}
                  placeholder="e.g. 9876500000"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={supForm.address}
                  onChange={(e) => setSupForm({ ...supForm, address: e.target.value })}
                  placeholder="e.g. Ring Road, Surat, Gujarat"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowSupModal(false)}
                  className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl font-medium transition">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-medium transition">
                  Add Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Purchase Modal */}
      {showPurModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

            <div className="sticky top-0 bg-white rounded-t-2xl flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">Record New Purchase</h3>
              <button onClick={() => setShowPurModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="p-6 space-y-5">

              {/* Select Supplier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Supplier *
                </label>
                <select
                  value={purForm.supplier_id}
                  onChange={(e) => setPurForm({ ...purForm, supplier_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Choose supplier...</option>
                  {suppliers.map(s => (
                    <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => { setShowPurModal(false); setShowSupModal(true); }}
                  className="text-xs text-indigo-600 hover:underline mt-1 inline-block"
                >
                  + Add new supplier
                </button>
              </div>

              {/* Search Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add Cloth Items *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchItem}
                    onChange={(e) => handleItemSearch(e.target.value)}
                    placeholder="Search items to add..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {itemResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 mt-1 max-h-40 overflow-y-auto">
                      {itemResults.map(item => (
                        <button
                          key={item.item_id}
                          type="button"
                          onClick={() => addItemToPurchase(item)}
                          className="w-full text-left px-4 py-2.5 hover:bg-orange-50 flex items-center justify-between"
                        >
                          <span className="font-medium text-gray-800">{item.name}</span>
                          <span className="text-xs text-gray-400">{item.category} · {item.stock_qty} in stock</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              {purForm.items.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-gray-600 font-medium">Item</th>
                        <th className="text-center px-4 py-2.5 text-gray-600 font-medium">Qty</th>
                        <th className="text-center px-4 py-2.5 text-gray-600 font-medium">Cost Price (₹)</th>
                        <th className="text-right px-4 py-2.5 text-gray-600 font-medium">Total</th>
                        <th className="px-4 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {purForm.items.map(item => (
                        <tr key={item.item_id} className="border-t border-gray-100">
                          <td className="px-4 py-3 font-medium text-gray-800">{item.item_name}</td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number" min="1"
                              value={item.quantity}
                              onChange={(e) => updatePurItem(item.item_id, 'quantity', e.target.value)}
                              className="w-16 text-center border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number" min="0"
                              value={item.cost_price}
                              onChange={(e) => updatePurItem(item.item_id, 'cost_price', e.target.value)}
                              placeholder="0"
                              className="w-24 text-center border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-800">
                            ₹{(Number(item.quantity) * Number(item.cost_price || 0)).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button type="button" onClick={() => removeItemFromPurchase(item.item_id)}
                              className="text-red-400 hover:text-red-600">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Payment */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (₹)</label>
                  <input
                    type="number" min="0"
                    value={purForm.amount_paid}
                    onChange={(e) => setPurForm({ ...purForm, amount_paid: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input
                    type="text"
                    value={purForm.notes}
                    onChange={(e) => setPurForm({ ...purForm, notes: e.target.value })}
                    placeholder="Optional..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Summary */}
              {purForm.items.length > 0 && (
                <div className="bg-orange-50 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Total Purchase Cost</span>
                    <span className="font-bold text-gray-800">₹{getPurTotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Amount Paying Now</span>
                    <span>₹{Number(purForm.amount_paid || 0).toLocaleString()}</span>
                  </div>
                  <div className={`flex justify-between font-bold border-t border-orange-200 pt-2 ${
                    getPurTotal() - Number(purForm.amount_paid || 0) > 0 ? 'text-red-500' : 'text-green-600'
                  }`}>
                    <span>Pending Due to Supplier</span>
                    <span>₹{(getPurTotal() - Number(purForm.amount_paid || 0)).toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowPurModal(false)}
                  className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-xl font-medium transition">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-medium transition">
                  Record Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Supplier Modal */}
      {showPayModal && payingPurchase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-800">Pay Supplier</h3>
              <button onClick={() => setShowPayModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <p className="font-semibold text-gray-800">{payingPurchase.supplier_name}</p>
              <p className="text-sm text-gray-400">
                {new Date(payingPurchase.purchase_date).toLocaleDateString('en-IN')}
              </p>
              <div className="flex justify-between mt-3">
                <span className="text-sm text-gray-500">Total</span>
                <span className="font-medium">₹{Number(payingPurchase.total_amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-sm text-gray-500">Already Paid</span>
                <span className="text-green-600 font-medium">₹{Number(payingPurchase.amount_paid).toLocaleString()}</span>
              </div>
              <div className="flex justify-between mt-1 pt-2 border-t border-gray-200">
                <span className="text-sm font-semibold text-red-500">Pending Due</span>
                <span className="font-bold text-red-500">₹{Number(payingPurchase.pending_due).toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handlePaySupplier} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                <input
                  type="number" required min="1"
                  max={payingPurchase.pending_due}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder={`Max ₹${Number(payingPurchase.pending_due).toLocaleString()}`}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <div className="flex gap-2 mt-2">
                  <button type="button"
                    onClick={() => setPayAmount(payingPurchase.pending_due)}
                    className="text-xs bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-100">
                    Pay Full (₹{Number(payingPurchase.pending_due).toLocaleString()})
                  </button>
                  <button type="button"
                    onClick={() => setPayAmount(Math.floor(payingPurchase.pending_due / 2))}
                    className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100">
                    Pay Half
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowPayModal(false)}
                  className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl font-medium">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl font-medium">
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

export default SuppliersPage;