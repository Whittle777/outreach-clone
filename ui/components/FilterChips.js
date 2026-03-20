import React, { useEffect, useState } from 'react';
import axios from 'axios';

const FilterChips = () => {
  const [filterChips, setFilterChips] = useState([]);

  useEffect(() => {
    const fetchFilterChips = async () => {
      try {
        const response = await axios.get('/api/prospects/filter-chips');
        setFilterChips(response.data);
      } catch (error) {
        console.error('Error fetching filter chips:', error);
      }
    };

    fetchFilterChips();
  }, []);

  return (
    <div className="filter-chips-container">
      {filterChips.map(chip => (
        <div key={chip} className="filter-chip">
          {chip}
        </div>
      ))}
    </div>
  );
};

export default FilterChips;
