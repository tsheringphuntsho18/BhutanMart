import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sellerAPI } from '../api/authAPI';
import toast from 'react-hot-toast';
import { Store, FileText } from 'lucide-react';
import '../styles/pages/Auth.css';

export default function SellerSetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ storeName: '', description: '' });

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sellerAPI.becomeSeller(form);
      toast.success('Store created! Welcome, seller.');
      navigate('/dashboard/seller');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create store');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-header">
          <Store size={40} />
          <h1>Set Up Your Store</h1>
          <p>Create your seller profile to start listing products</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Store Name <span style={{ color: '#ef4444' }}>*</span></label>
            <div className="input-wrapper">
              <Store size={16} />
              <input
                type="text"
                name="storeName"
                value={form.storeName}
                onChange={handleChange}
                placeholder="e.g. Druk Handicrafts"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Store Description</label>
            <div className="input-wrapper" style={{ alignItems: 'flex-start', paddingTop: 10 }}>
              <FileText size={16} style={{ marginTop: 2 }} />
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe what your store sells..."
                rows={3}
                style={{ border: 'none', outline: 'none', width: '100%', resize: 'vertical', fontFamily: 'inherit', fontSize: 14, background: 'transparent' }}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating Store...' : 'Create Store'}
          </button>
        </form>
      </div>
    </div>
  );
}
