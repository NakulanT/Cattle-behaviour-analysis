import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const TrendChart = ({ trends }) => {
  // State to track visibility of each dataset
  const [visibility, setVisibility] = useState({
    'Lying Time': true,
    'Eating Time': true,
    'Standing Time': true,
  });

  // Toggle the visibility of a dataset
  const handleLegendClick = (dataKey) => {
    setVisibility((prevVisibility) => ({
      ...prevVisibility,
      [dataKey]: !prevVisibility[dataKey],
    }));
  };

  // Format the data to display in the chart
  const formattedData = Object.entries(trends['Lying Time (min)']).map(
    ([cow, value]) => ({
      name: cow,
      'Lying Time': Math.floor(value),
      'Eating Time': Math.floor(trends['Eating Time (min)'][cow]),
      'Standing Time': Math.floor(trends['Standing Time (min)'][cow]),
    })
  );

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={formattedData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend
          onClick={(e) => handleLegendClick(e.dataKey)}
          wrapperStyle={{ cursor: 'pointer' }}
        />
        
        {/* Conditionally render each Bar based on visibility state */}
        {visibility['Lying Time'] && (
          <Bar dataKey="Lying Time" fill="#8884d8" />
        )}
        {visibility['Eating Time'] && (
          <Bar dataKey="Eating Time" fill="#82ca9d" />
        )}
        {visibility['Standing Time'] && (
          <Bar dataKey="Standing Time" fill="#ffc658" />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TrendChart;
