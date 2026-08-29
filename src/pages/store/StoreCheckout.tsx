import React from 'react';
import { useParams } from 'react-router-dom';

const StoreCheckout = () => {
  const { orderId } = useParams();
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Checkout & Pembayaran</h1>
      <p>Order ID: {orderId}</p>
    </div>
  );
};

export default StoreCheckout;
