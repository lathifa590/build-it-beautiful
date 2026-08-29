import React from 'react';
import { useParams } from 'react-router-dom';

const StoreProfile = () => {
  const { storeSlug } = useParams();
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Store Profile: {storeSlug}</h1>
      <p>Halaman publik untuk toko {storeSlug}</p>
    </div>
  );
};

export default StoreProfile;
