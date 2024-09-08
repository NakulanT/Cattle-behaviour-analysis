// src/components/BehaviorChart.js
import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';

// Helper function to parse the API response for chart rendering
const parseTrendsData = (data) => {
  return Object.keys(data).map((cowID) => ({
    name: cowID,
    'Lying Time': data[cowID]['Lying Time (min)'],
    'Standing Time': data[cowID]['Standing Time (min)'],
    'Eating Time': data[cowID]['Eating Time (min)']
  }));
};

const BehaviorChart = ({ trendType, date }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/behavior/trends', {
          params: { trend_type: trendType, date }
        });
        const parsedData = parseTrendsData(response.data.trends);
        setChartData(parsedData);
      } catch (error) {
        console.error('Error fetching behavior trends:', error);
      }
      setLoading(false);
    };

    fetchTrends();
  }, [trendType, date]);

  return (
    <div style={{ width: '100%', height: 400 }}>
      {loading ? (
        <p>Loading data...</p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Lying Time" fill="#8884d8" />
            <Bar dataKey="Standing Time" fill="#82ca9d" />
            <Bar dataKey="Eating Time" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default BehaviorChart;
