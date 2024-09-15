
import React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';

const SmallerRadiusPiechart = ({ data }) => {
  // Convert data to the format expected by the PieChart component
  const chartData = Object.keys(data).map((key, index) => ({
    id: index,
    value: data[key],
    label: key,
  }));

  // Parameters for the pie chart with a doughnut (ring) shape by default
  const pieParams = {
    series: [
      {
        data: chartData,
        innerRadius: 60, // Set default inner radius for ring shape
        outerRadius: 150, // Optional: Define outer radius for size control
        highlightScope: { fade: 'global', highlight: 'item' },
        labels: true, // Show labels
      },
    ],
    slotProps: {
      legend: {
        hidden: false, // Show the legend
        item: {
          style: {
            color: 'white', // Set the legend text color to white
          },
        },
      },
    },
    height: 300,
    width: 600,
  };

  return (
    <div className='bg-gray-800 p-6 rounded-lg h-96 w-full flex items-center justify-center'>
    <h1>Basic Info</h1>
      <PieChart {...pieParams} />
    </div>
  );
};

export default SmallerRadiusPiechart;
