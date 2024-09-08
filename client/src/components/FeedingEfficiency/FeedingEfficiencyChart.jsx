import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

const FeedingEfficiencyChart = ({ feedingData, herdAverage }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={feedingData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="Cow ID" />
        <YAxis />
        <Tooltip />
        <Legend />
        
        {/* Add a reference line for herd average */}
        <ReferenceLine y={herdAverage} label={`Herd Avg: ${Math.floor(herdAverage)} min`} stroke="blue" strokeDasharray="3 3" />
        
        {/* Conditional Bar colors based on whether cow is below or above the average */}
        <Bar dataKey="Eating Time (min)" fill={(data) => data.belowAverage ? 'red' : 'green'} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default FeedingEfficiencyChart;
