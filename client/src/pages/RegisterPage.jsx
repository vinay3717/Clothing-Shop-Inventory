import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  ShoppingBag, Phone, Lock, Eye,
  EyeOff, User, MapPin, Store
} from 'lucide-react';

const RegisterPage = () => {
  const [form, setForm] = useState({
    name:         '',
    shop_name:    '',
    shop_address: '',
    mobile:       '',
    password:     '',
    confirm:      ''
  });
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (form.mobile.length !== 10) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        name:         form.name,
        shop_name:    form.shop_name,
        shop_address: form.shop_address,
        mobile:       form.mobile,
        password:     form.password
      });
      toast.success('Account created! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const update = (field, value) => setForm({ ...form, [field]: value });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 p-4 rounded-2xl mb-4">
            <ShoppingBag className="text-white" size={36} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Create Shop Account</h1>
          <p className="text-gray-500 text-sm mt-1">Set up your clothing inventory system</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Owner Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Owner Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text" required
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Your full name"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Shop Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shop Name *
            </label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text" required
                value={form.shop_name}
                onChange={(e) => update('shop_name', e.target.value)}
                placeholder="e.g. Vinay Cloth House"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Shop Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shop Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <textarea
                value={form.shop_address}
                onChange={(e) => update('shop_address', e.target.value)}
                placeholder="Shop address (optional)"
                rows={2}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="tel" required
                value={form.mobile}
                onChange={(e) => update('mobile', e.target.value)}
                placeholder="10-digit mobile number"
                maxLength={10}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPass ? 'text' : 'password'} required
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showConfirm ? 'text' : 'password'} required
                value={form.confirm}
                onChange={(e) => update('confirm', e.target.value)}
                placeholder="Re-enter your password"
                className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  form.confirm && form.password !== form.confirm
                    ? 'border-red-400 bg-red-50'
                    : 'border-gray-300'
                }`}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {form.confirm && form.password !== form.confirm && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 rounded-xl transition duration-200 mt-2"
          >
            {loading ? 'Creating Account...' : 'Create Shop Account'}
          </button>

        </form>

        {/* Login Link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">
            Sign In
          </Link>
        </p>

      </div>
    </div>
  );
};

export default RegisterPage;