import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const WeatherImpactStackedBarChart = ({ trendType, date }) => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (trendType && date) {
      axios.get(`http://127.0.0.1:5000/api/behavior/weather_impact`, {
        params: {
          trend_type: trendType,
          date: date
        }
      })
        .then(response => {
          const weatherData = response.data.weather_impact;
          const weatherConditions = Object.keys(weatherData['Lying Time (min)']);

          const formattedData = weatherConditions.map(condition => ({
            name: condition,
            'Lying Time': weatherData['Lying Time (min)'][condition],
            'Standing Time': weatherData['Standing Time (min)'][condition],
            'Eating Time': weatherData['Eating Time (min)'][condition]
          }));

          setChartData(formattedData);
        })
        .catch(error => {
          console.error('Error fetching weather impact data:', error);
        });
    }
  }, [trendType, date]);  // Re-fetch data when trendType or date changes

  return (
    <div>
      {/* Stacked Bar Chart for Weather Impact */}
      <div style={{ width: '100%', height: 400, marginTop: '20px' }}>
        {chartData ? (
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Lying Time" stackId="a" fill="#8884d8" />
              <Bar dataKey="Standing Time" stackId="a" fill="#82ca9d" />
              <Bar dataKey="Eating Time" stackId="a" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p>Loading chart data...</p>
        )}
      </div>
    </div>
  );
};

export default WeatherImpactStackedBarChart;
