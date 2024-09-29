import React, { useState } from 'react';
import { PieChart } from '@mui/x-charts/PieChart';

const Piechart = ({ data }) => {
  // State to control tooltip visibility
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipTimeout, setTooltipTimeout] = useState(null);

  // Check if data is valid
  if (!data || Object.keys(data).length === 0) {
    return <div className="text-white">No data available</div>;
  }

  // Format data for the PieChart component
  const chartData = Object.keys(data).map((key, index) => ({
    id: index,
    value: data[key],
    label: key,
  }));

  // Pie chart parameters
  const pieParams = {
    series: [
      {
        data: chartData,
        highlightScope: { fade: 'global', highlight: 'item' },
        faded: { innerRadius: 30, additionalRadius: -30 },
        labels: false,
      },
    ],
    slotProps: { legend: { hidden: true } },
  };

  // Hover handlers
  const handleMouseEnter = () => {
    const timeout = setTimeout(() => {
      setShowTooltip(true);
    }, 1000); // Show tooltip after 5 seconds
    setTooltipTimeout(timeout);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
    clearTimeout(tooltipTimeout); // Clear the timeout
  };

  return (
    <div 
      className="bg-gray-800 p-4 rounded-lg w-full h-full flex flex-col items-center relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <h2 className="text-white text-2xl font-semibold">Average Activity Distribution</h2>
      <div className='ml-24 mt-16' style={{ width: '100%', height: '300px' }}>
        <PieChart {...pieParams} />
      </div>
      
      {showTooltip && (
        <div className="absolute bg-gray-700 text-white p-2 rounded-md mt-2">
          A pie chart showing the distribution of average activities such as standing, eating, and lying down.
        </div>
      )}
    </div>
  );
};

export default Piechart;
