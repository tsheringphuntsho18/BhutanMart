import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './components/Profile';
import CustomerDashboard from './pages/CustomerDashboard';
import SellerDashboard from './pages/SellerDashboard';
import AddProduct from './pages/AddProduct';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminOrders from './pages/AdminOrders';
import SellerOrders from './pages/SellerOrders';
import AnalyticsReport from './pages/AnalyticsReport';
import SellerSetup from './pages/SellerSetup';
import { useAuthStore } from './context/AuthContext';
import './App.css';

function ProtectedRoute({ children, requiredRole, blockedRole }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/" />;
  if (blockedRole && user.role === blockedRole) return <Navigate to="/" />;
  return children;
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="app">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/orders"
              element={
                <ProtectedRoute blockedRole="admin">
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/customer"
              element={
                <ProtectedRoute requiredRole="customer">
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/seller"
              element={
                <ProtectedRoute requiredRole="seller">
                  <SellerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/seller/add-product"
              element={
                <ProtectedRoute requiredRole="seller">
                  <AddProduct />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/seller/orders"
              element={
                <ProtectedRoute requiredRole="seller">
                  <SellerOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/setup"
              element={
                <ProtectedRoute requiredRole="seller">
                  <SellerSetup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <AnalyticsReport />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
        <Toaster position="top-right" />
      </div>
    </BrowserRouter>
  );
}

export default App;
