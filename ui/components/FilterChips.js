import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './FilterChips.css'; // Import the CSS file for styling

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

  const handleChipClick = (chip) => {
    console.log(`Chip clicked: ${chip}`);
    // Add logic to handle chip click event
  };

  const handleChipClose = (chip) => {
    console.log(`Chip closed: ${chip}`);
    // Add logic to handle chip close event
  };

  return (
    <div className="filter-chips-container">
      {filterChips.map(chip => (
        <div key={chip} className="filter-chip" onClick={() => handleChipClick(chip)}>
          {chip}
          <span className="filter-chip-close" onClick={(e) => {
            e.stopPropagation();
            handleChipClose(chip);
          }}>&times;</span>
        </div>
      ))}
    </div>
  );
};

export default FilterChips;
