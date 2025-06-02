// Pesanan.jsx (updated unified version)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const statusLabels = {
  pending: { text: 'Menunggu Pembayaran', color: 'bg-yellow-100 text-yellow-800' },
  completed: { text: 'Selesai', color: 'bg-green-100 text-green-800' },
  failed: { text: 'Gagal', color: 'bg-red-100 text-red-800' },
  expired: { text: 'Kadaluarsa', color: 'bg-gray-100 text-gray-800' }
};

const Pesanan = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const updateOrders = () => {
      const now = Date.now();
      const savedOrders = JSON.parse(localStorage.getItem('orders')) || [];
      
      const updated = savedOrders.map(order => {
        // Handle expired orders
        if (order.status === 'pending' && now > order.paymentDeadline) {
          return { ...order, status: 'expired' };
        }
        return order;
      });
      
      setOrders(updated);
      localStorage.setItem('orders', JSON.stringify(updated));
    };

    updateOrders();
    const interval = setInterval(updateOrders, 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePayNow = (order) => {
    // Simulate payment process
    const updated = orders.map(o => 
      o.id === order.id ? { ...o, status: 'completed' } : o
    );
    
    setOrders(updated);
    localStorage.setItem('orders', JSON.stringify(updated));
    setSelectedOrder(null);
  };

  const formatTimeLeft = (deadline) => {
    if (!deadline) return '00:00';
    const now = Date.now();
    if (now >= deadline) return '00:00';
    
    const secondsLeft = Math.floor((deadline - now) / 1000);
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Daftar Pesanan</h1>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {orders.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Belum ada pesanan</p>
              <button 
                onClick={() => navigate('/marketplace')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Belanja Sekarang
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img className="h-10 w-10 rounded" src={order.image} alt={order.title} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{order.title}</div>
                          <div className="text-sm text-gray-500">{order.gameName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        statusLabels[order.status]?.color || 'bg-gray-100 text-gray-800'
                      }`}>
                        {statusLabels[order.status]?.text || order.status}
                      </span>
                      {order.status === 'pending' && (
                        <div className="text-xs text-red-600 mt-1">
                          {formatTimeLeft(order.paymentDeadline)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handlePayNow(order)}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Bayar
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-bold">{selectedOrder.title}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            
            <div className="mt-4 space-y-2">
              <p><strong>Game:</strong> {selectedOrder.gameName}</p>
              <p><strong>Harga:</strong> {selectedOrder.price}</p>
              <p><strong>Status:</strong> 
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  statusLabels[selectedOrder.status]?.color || 'bg-gray-100 text-gray-800'
                }`}>
                  {statusLabels[selectedOrder.status]?.text || selectedOrder.status}
                </span>
              </p>
              {selectedOrder.status === 'pending' && (
                <p className="text-red-600">
                  <strong>Sisa Waktu:</strong> {formatTimeLeft(selectedOrder.paymentDeadline)}
                </p>
              )}
              <p><strong>Deskripsi:</strong> {selectedOrder.description}</p>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              {selectedOrder.status === 'pending' && (
                <button
                  onClick={() => handlePayNow(selectedOrder)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Bayar Sekarang
                </button>
              )}
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pesanan;