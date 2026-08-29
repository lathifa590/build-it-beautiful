import React from 'react';
import { useParams } from 'react-router-dom';

const StoreDetail = () => {
  const { listingId } = useParams();
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Detail Modul</h1>
      <p>ID Modul: {listingId}</p>
    </div>
  );
};

export default StoreDetail;
