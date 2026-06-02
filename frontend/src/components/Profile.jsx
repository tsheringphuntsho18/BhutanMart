import { Heart, MapPin, LogOut } from 'lucide-react';
import { useAuthStore } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/components/Profile.css';

export default function Profile() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h1>{user.name}</h1>
            <p>{user.email}</p>
            <span className="role-badge">{user.role}</span>
          </div>
        </div>

        <div className="profile-sections">
          <section className="profile-section">
            <h2>
              <MapPin size={20} /> Addresses
            </h2>
            {user.addresses && user.addresses.length > 0 ? (
              <ul>
                {user.addresses.map((addr, i) => (
                  <li key={i}>{addr}</li>
                ))}
              </ul>
            ) : (
              <p>No addresses saved</p>
            )}
          </section>

          <section className="profile-section">
            <h2>
              <Heart size={20} /> Wishlist
            </h2>
            {user.wishlist && user.wishlist.length > 0 ? (
              <p>{user.wishlist.length} items in wishlist</p>
            ) : (
              <p>Wishlist is empty</p>
            )}
          </section>
        </div>

        <div className="profile-actions">
          <button className="btn btn-outline">Edit Profile</button>
          <button className="btn btn-danger" onClick={handleLogout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
