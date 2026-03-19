// components/FilterChip.js

import React from 'react';
import './FilterChip.css';

const FilterChip = ({ label, onClick }) => {
  return (
    <div className="filter-chip" onClick={onClick}>
      {label}
      <span className="filter-chip-close" onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}>&times;</span>
    </div>
  );
};

export default FilterChip;
