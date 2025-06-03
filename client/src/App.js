import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './App.css';
import './index.css';

// Import semua halaman yang diperlukan
import Home from './pages/Home';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Marketplace from './pages/Marketplace';
import SellAccount from './pages/SellAccount';
import Pesanan from './pages/Pesanan'; // Tetap pakai nama file Pesanan.js
import Orders from './pages/Orders';
import RiwayatTransaksi from './pages/RiwayatTransaksi';
import DetailAkun from './pages/DetailAkun';

// Komponen sementara untuk halaman yang belum dibuat
const Register = () => <div className="p-8"><h1 className="text-2xl">Register - Coming Soon</h1></div>;
const NotFound = () => <div className="p-8"><h1 className="text-2xl">404 - Page Not Found</h1></div>;

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <main className="min-h-screen">
            <Routes>
              <Route path="/orders" element={<Orders />} />

              {/* Main Pages */}
              <Route path="/" element={<Home />} />
              <Route path="/riwayat-transaksi" element={<RiwayatTransaksi />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/sell" element={<SellAccount />} />
              <Route path="/orders" element={<Pesanan />} /> {/* ✅ Perbaikan path */}
              <Route path="/detail-akun" element={<DetailAkun />} />

              {/* Auth Pages */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* User Pages */}
              <Route path="/profile" element={<Profile />} />

              {/* 404 Page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
