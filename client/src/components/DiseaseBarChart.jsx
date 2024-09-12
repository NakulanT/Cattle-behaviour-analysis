import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';

const DiseaseStackedBarChart = ({ data }) => {
  return (
    <div className="bg-gray-800 p-4 h-96 w-2/4 rounded-lg ">
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, bottom: 5, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis
            dataKey="name"
            tick={{ fill: 'white' }}
            tickLine={{ stroke: '#444' }}
          />
          <YAxis
            tick={{ fill: 'white' }}
            tickLine={{ stroke: '#444' }}
            axisLine={{ stroke: '#444' }}
          />
          <Tooltip contentStyle={{ backgroundColor: '#333', color: 'white' }} />
          <Legend wrapperStyle={{ color: 'white' }} />
          <Bar dataKey="Lameness" stackId="a" fill="#FFB6C1" />
          <Bar dataKey="Inadequate Bedding" stackId="a" fill="#ADD8E6" />
          <Bar dataKey="Postpartum Fatigue" stackId="a" fill="#FFD700" />
          <Bar dataKey="Depression or Illness" stackId="a" fill="#98FB98" />
          <Bar dataKey="Anorexia" stackId="a" fill="#FF6347" />
          <Bar dataKey="Boredom or Anxiety" stackId="a" fill="#00BFFF" />
          <Bar dataKey="Fatigue" stackId="a" fill="#BA55D3" />
          <Bar dataKey="Heat Stress" stackId="a" fill="#FF69B4" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DiseaseStackedBarChart;
