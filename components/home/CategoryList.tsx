
import React from 'react';
import { CATEGORIES } from '../../constants';
import { useNavigate } from 'react-router-dom';

const CategoryList: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide no-scrollbar">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => navigate(`/shop?category=${cat}`)}
          className="flex-shrink-0 px-6 py-3 bg-white border border-gray-100 rounded-xl shadow-sm font-semibold text-gray-800 hover:border-red-800 hover:text-red-800 transition-all active:scale-95"
        >
          {cat}
        </button>
      ))}
    </div>
  );
};

export default CategoryList;
