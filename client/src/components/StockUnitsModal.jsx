import { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  X, Tag, User, Calendar, RotateCcw,
  CheckCircle, XCircle, RefreshCw, Search, Printer
} from 'lucide-react';

export default function StockUnitsModal({ item, onClose }) {
  const [units,   setUnits]   = useState([]);
  const [summary, setSummary] = useState({ available: 0, sold: 0, returned: 0 });
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all');
  const printRef = useRef();

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/stock-units/item/${item.item_id}`);
      setUnits(data.units);
      console.log('Units received:', data.units);
      setSummary(data.summary);
    } catch {
      toast.error('Failed to load serial numbers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUnits(); }, [item.item_id]);

  const handleReturn = async (unit) => {
    if (!confirm(`Mark ${unit.serial_number} as returned?`)) return;
    try {
      await api.patch(`/stock-units/${unit.unit_id}/return`);
      toast.success(`${unit.serial_number} returned. Stock restored.`);
      fetchUnits();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Return failed');
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('print-area').innerHTML;
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Stock Labels — ${item.name}</title>
      <style>
        body { font-family: monospace; }
        .label { display: inline-block; border: 2px solid #000;
                 padding: 8px 14px; margin: 6px; border-radius: 6px;
                 font-size: 14px; font-weight: bold; }
        .item-name { font-size: 10px; font-weight: normal; display: block; }
        @media print { body { margin: 0; } }
      </style></head>
      <body>${printContent}</body></html>
    `);
    w.document.close();
    w.print();
  };

  const filtered = units
    .filter(u => filter === 'all' || u.status === filter)
    .filter(u =>
      u.serial_number.toLowerCase().includes(search.toLowerCase()) ||
      (u.customer_name || '').toLowerCase().includes(search.toLowerCase())
    );

  const statusIcon = {
    available: <CheckCircle size={14} className="text-green-500" />,
    sold:      <XCircle    size={14} className="text-red-500"   />,
    returned:  <RefreshCw  size={14} className="text-yellow-500"/>,
  };

  const statusBadge = {
    available: 'bg-green-100  text-green-700',
    sold:      'bg-red-100    text-red-600',
    returned:  'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center
                    justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh]
                      flex flex-col shadow-2xl">

        {/* ── Header ── */}
        <div className="flex items-start justify-between p-5 border-b">
          <div>
            <h2 className="font-bold text-gray-800 text-lg">{item.name}</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {item.category} · SKU: {item.sku_code}
            </p>
            <div className="flex gap-3 mt-3">
              {[
                { label: `${summary.available} Available`, color: 'bg-green-100 text-green-700' },
                { label: `${summary.sold} Sold`,           color: 'bg-red-100   text-red-600'   },
                { label: `${summary.returned} Returned`,   color: 'bg-yellow-100 text-yellow-700'},
              ].map(b => (
                <span key={b.label}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${b.color}`}>
                  {b.label}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-sm bg-indigo-50
                         text-indigo-600 hover:bg-indigo-100 px-3 py-2 rounded-lg
                         font-medium transition"
            >
              <Printer size={15} /> Print Labels
            </button>
            <button onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="flex items-center gap-3 px-5 py-3 border-b bg-gray-50">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2
                                          -translate-y-1/2 text-gray-400"/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search serial or customer…"
              className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg
                         bg-white focus:outline-none focus:ring-2
                         focus:ring-indigo-300"
            />
          </div>
          {['all', 'available', 'sold', 'returned'].map(f => (
            <button key={f}
              onClick={() => setFilter(f)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize
                          transition ${filter === f
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border text-gray-500 hover:bg-gray-100'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ── Units list ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {loading ? (
            <p className="text-center text-gray-400 py-10">Loading…</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-14">
              <Tag size={36} className="text-gray-200 mx-auto mb-3"/>
              <p className="text-gray-400 font-medium">No serial numbers yet</p>
              <p className="text-sm text-gray-300 mt-1">
                Record a purchase for this item to auto-generate serials
              </p>
            </div>
          ) : filtered.map(unit => (
            <div key={unit.unit_id}
              className="flex items-center justify-between p-3.5 rounded-xl
                         border border-gray-100 hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                {statusIcon[unit.status]}
                <span className="font-mono font-bold text-indigo-700
                                 bg-indigo-50 px-2.5 py-1 rounded-lg text-sm
                                 tracking-widest">
                  {unit.serial_number}
                </span>
                <div>
                  {unit.status === 'sold' && (
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User size={11}/> {unit.customer_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={11}/>
                        {new Date(unit.sold_at)
                          .toLocaleDateString('en-IN',
                            { day:'2-digit', month:'short', year:'numeric' })}
                      </span>
                    </div>
                  )}
                  {unit.status === 'available' && (
                    <span className="text-xs text-gray-400">
                      Added {new Date(unit.created_at)
                        .toLocaleDateString('en-IN', { day:'2-digit',
                          month:'short', year:'numeric' })}
                    </span>
                  )}
                  {unit.status === 'returned' && (
                    <span className="text-xs text-yellow-600">
                      Returned to stock
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2.5 py-1
                                  rounded-full capitalize ${statusBadge[unit.status]}`}>
                  {unit.status}
                </span>
                {unit.status?.trim().toLowerCase() === 'sold' && (
                  <button
                     onClick={() => handleReturn(unit)}
                      title="Mark as returned"
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium
                                 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700
                                 border border-red-200 rounded-lg transition"
                  >
                 <RotateCcw size={12}/> Return
                 </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Print area (hidden) ── */}
        <div id="print-area" className="hidden" ref={printRef}>
          {units
            .filter(u => u.status === 'available')
            .map(u => (
              `<div class="label">
                 <span class="item-name">${item.name}</span>
                 ${u.serial_number}
               </div>`
            )).join('')}
        </div>

      </div>
    </div>
  );
}