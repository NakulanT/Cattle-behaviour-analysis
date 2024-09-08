import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const WeatherImpactLineChart = () => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    axios.get('http://127.0.0.1:5000/api/behavior/weather_impact')
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
  }, []);

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="Lying Time" stroke="#8884d8" />
          <Line type="monotone" dataKey="Standing Time" stroke="#82ca9d" />
          <Line type="monotone" dataKey="Eating Time" stroke="#ffc658" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeatherImpactLineChart;
