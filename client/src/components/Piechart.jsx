import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF'];

const Piechart = ({ data }) => {
  // Convert data to the format expected by the PieChart component
  const chartData = Object.keys(data).map((key) => ({
    name: key,
    value: data[key],
  }));

  // Check if there is valid data
  if (!chartData || chartData.length === 0) {
    return <p className="text-white">No data available for the pie chart</p>;
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg w-full h-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            label
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Piechart;
