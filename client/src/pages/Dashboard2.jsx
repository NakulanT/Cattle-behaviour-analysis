// src/components/Dashboard.js
import React, { useState } from 'react';
import BehaviorChart from '..components/BehaviorChart';

const Dashboard = () => {
  const [trendType, setTrendType] = useState('weekly'); // or 'daily' or 'monthly'
  const [date, setDate] = useState('2022-09-15'); // Change the date accordingly

  return (
    <div>
      <h1>Cattle Behavior Dashboard</h1>
      <label>
        Select Trend Type:
        <select value={trendType} onChange={(e) => setTrendType(e.target.value)}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </label>
      <label>
        Select Date:
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <BehaviorChart trendType={trendType} date={date} />
    </div>
  );
};

export default Dashboard;
