// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Marketplace from './pages/Marketplace';
import SellAccount from './pages/SellAccount';
import Pesanan from './pages/Pesanan';
import Profile from './pages/Profile';
import RiwayatTransaksi from './pages/RiwayatTransaksi';
import AdminDashboard from './pages/AdminDashboard';
import EscrowPage from './pages/EscrowPage';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/sell" element={<SellAccount />} />
        <Route path="/pesanan" element={<Pesanan />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/riwayat-transaksi" element={<RiwayatTransaksi />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/escrow" element={<EscrowPage />} />
      </Routes>
    </div>
  );
}

export default App;