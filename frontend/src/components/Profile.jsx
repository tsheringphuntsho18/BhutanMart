import { useState, useEffect } from 'react';
import { Heart, MapPin, LogOut, Edit2, Check, X, Plus, Trash2, Camera } from 'lucide-react';
import { useAuthStore } from '../context/AuthContext';
import { userAPI, sellerAPI } from '../api/authAPI';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../styles/components/Profile.css';

export default function Profile() {
  const { user, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', paymentPreference: 'COD', avatar: '' });
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const blankAddress = { label: 'Home', street: '', city: '', state: '', country: 'Bhutan', postalCode: '' };
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState(blankAddress);
  const [savingAddress, setSavingAddress] = useState(false);

  // Fetch fresh profile (includes populated wishlist) on mount
  useEffect(() => {
    if (!user) return;
    userAPI.getUserProfile()
      .then(res => {
        setProfile(res.data);
        // Sync fresh data into auth store so wishlist count stays accurate
        updateUser({ ...user, ...res.data });
      })
      .catch(() => setProfile(user));
  }, []);

  // Pre-fill edit form from current store user
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        paymentPreference: user.paymentPreference || 'COD',
        avatar: user.avatar || '',
      });
      setAvatarPreview(user.avatar || null);
    }
  }, [user]);

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to log out?')) return;
    logout();
    navigate('/');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    setSaving(true);
    try {
      const res = await userAPI.updateProfile(form);
      const updated = res.data.user || res.data;
      updateUser({ ...user, ...updated });
      setProfile(prev => ({ ...prev, ...updated }));
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);
    try {
      const res = await sellerAPI.uploadImage(file);
      setForm(p => ({ ...p, avatar: res.data.url }));
      toast.success('Avatar uploaded');
    } catch {
      toast.error('Failed to upload avatar');
      setAvatarPreview(user?.avatar || null);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name: user.name || '',
      email: user.email || '',
      paymentPreference: user.paymentPreference || 'COD',
      avatar: user.avatar || '',
    });
    setAvatarPreview(user?.avatar || null);
    setEditing(false);
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!addressForm.street.trim() || !addressForm.city.trim()) {
      toast.error('Street and city are required');
      return;
    }
    setSavingAddress(true);
    try {
      const res = await userAPI.addAddress(addressForm);
      const updated = { ...displayUser, addresses: res.data.user?.addresses || res.data.addresses || displayUser.addresses };
      setProfile(updated);
      updateUser({ ...user, addresses: updated.addresses });
      setAddressForm(blankAddress);
      setShowAddressForm(false);
      toast.success('Address added!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add address');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleRemoveAddress = async (addressId) => {
    try {
      const res = await userAPI.removeAddress(addressId);
      const newAddresses = res.data.addresses;
      setProfile(prev => ({ ...prev, addresses: newAddresses }));
      updateUser({ ...user, addresses: newAddresses });
      toast.success('Address removed');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove address');
    }
  };

  if (!user) return <div>Loading...</div>;

  const displayUser = profile || user;
  const wishlistCount = displayUser.wishlist?.length ?? 0;

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {displayUser.avatar ? (
              <img src={displayUser.avatar} alt={displayUser.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              displayUser.name?.charAt(0).toUpperCase()
            )}
          </div>
          <div className="profile-info">
            <h1>{displayUser.name}</h1>
            <p>{displayUser.email}</p>
            <span className="role-badge">{displayUser.role}</span>
          </div>
        </div>

        {/* Edit form */}
        {editing ? (
          <form className="edit-form" onSubmit={handleSave}>
            <h3>Edit Profile</h3>

            {/* Avatar upload */}
            <div className="avatar-upload-section">
              <label className="avatar-upload-label" title="Change avatar">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
                <div className="avatar-upload-preview">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" />
                  ) : (
                    <span className="avatar-initials-lg">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="avatar-upload-overlay">
                    <Camera size={20} />
                    {avatarUploading ? 'Uploading...' : 'Change'}
                  </div>
                </div>
              </label>
              {avatarPreview && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => { setAvatarPreview(null); setForm(p => ({ ...p, avatar: '' })); }}
                >
                  <X size={13} /> Remove
                </button>
              )}
            </div>

            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Payment Preference</label>
              <select
                value={form.paymentPreference}
                onChange={e => setForm(p => ({ ...p, paymentPreference: e.target.value }))}
                className="form-input"
              >
                <option value="COD">Cash on Delivery</option>
                <option value="Card">Card</option>
                <option value="Online">Online Transfer</option>
              </select>
            </div>
            <div className="edit-actions">
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                <Check size={16} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={handleCancel}>
                <X size={16} /> Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-sections">
            <section className="profile-section">
              <h2>
                <MapPin size={20} /> Addresses
                <button
                  className="add-address-btn"
                  onClick={() => setShowAddressForm(v => !v)}
                  title="Add new address"
                >
                  <Plus size={15} />
                </button>
              </h2>

              {showAddressForm && (
                <form className="address-form" onSubmit={handleAddAddress}>
                  <div className="address-form-row">
                    <select
                      value={addressForm.label}
                      onChange={e => setAddressForm(p => ({ ...p, label: e.target.value }))}
                      className="form-input"
                    >
                      <option value="Home">Home</option>
                      <option value="Office">Office</option>
                      <option value="Other">Other</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Street / Area"
                      value={addressForm.street}
                      onChange={e => setAddressForm(p => ({ ...p, street: e.target.value }))}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="address-form-row">
                    <input
                      type="text"
                      placeholder="City"
                      value={addressForm.city}
                      onChange={e => setAddressForm(p => ({ ...p, city: e.target.value }))}
                      className="form-input"
                      required
                    />
                    <input
                      type="text"
                      placeholder="State / Province"
                      value={addressForm.state}
                      onChange={e => setAddressForm(p => ({ ...p, state: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                  <div className="address-form-row">
                    <input
                      type="text"
                      placeholder="Country"
                      value={addressForm.country}
                      onChange={e => setAddressForm(p => ({ ...p, country: e.target.value }))}
                      className="form-input"
                    />
                    <input
                      type="text"
                      placeholder="Postal Code"
                      value={addressForm.postalCode}
                      onChange={e => setAddressForm(p => ({ ...p, postalCode: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                  <div className="edit-actions">
                    <button type="submit" className="btn btn-primary btn-sm" disabled={savingAddress}>
                      <Check size={14} /> {savingAddress ? 'Saving...' : 'Save Address'}
                    </button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowAddressForm(false)}>
                      <X size={14} /> Cancel
                    </button>
                  </div>
                </form>
              )}

              {displayUser.addresses?.length > 0 ? (
                <ul className="address-list">
                  {displayUser.addresses.map((addr) => (
                    <li key={addr._id || addr.street} className="address-item">
                      <div className="address-text">
                        <span className="address-label">{addr.label || 'Address'}</span>
                        <span>
                          {[addr.street, addr.city, addr.state, addr.country, addr.postalCode]
                            .filter(Boolean).join(', ')}
                        </span>
                      </div>
                      <button
                        className="btn-remove-addr"
                        onClick={() => handleRemoveAddress(addr._id)}
                        title="Remove address"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No addresses saved. Click + to add one.</p>
              )}
            </section>

            <section className="profile-section">
              <h2><Heart size={20} /> Wishlist</h2>
              {wishlistCount > 0 ? (
                <div>
                  <p>{wishlistCount} item{wishlistCount !== 1 ? 's' : ''} in wishlist</p>
                  <div className="wishlist-preview">
                    {displayUser.wishlist.slice(0, 3).map((item) => (
                      <Link
                        key={item._id || item}
                        to={`/products/${item._id || item}`}
                        className="wishlist-item-link"
                      >
                        {item.name || 'View product'}
                      </Link>
                    ))}
                    {wishlistCount > 3 && (
                      <span className="wishlist-more">+{wishlistCount - 3} more</span>
                    )}
                  </div>
                </div>
              ) : (
                <p>Wishlist is empty</p>
              )}
            </section>
          </div>
        )}

        <div className="profile-actions">
          {!editing && (
            <button className="btn btn-outline" onClick={() => setEditing(true)}>
              <Edit2 size={16} /> Edit Profile
            </button>
          )}
          <button className="btn btn-danger" onClick={handleLogout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
