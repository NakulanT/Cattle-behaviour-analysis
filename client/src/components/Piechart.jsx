import React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';

const Piechart = ({ data }) => {
  // Convert data to the format expected by the PieChart component
  const chartData = Object.keys(data).map((key, index) => ({
    id: index,
    value: data[key],
    label: key,
  }));

  // Parameters for the pie chart
  const pieParams = {
    series: [
      {
        data: chartData,
        highlightScope: { fade: 'global', highlight: 'item' },
        faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
        labels: false, // Remove this line to show labels
      }
    ],
    slotProps: { legend: { hidden: true } },
    height: 300,
    width: 600,
  };

  return (
    <div className='bg-gray-800 p-6 rounded-lg h-96 w-2/4 flex items-center justify-center'>
      <PieChart {...pieParams} />
    </div>
  );
  
};

export default Piechart;
