import React, { useState } from 'react';
import BehaviorChart from './BehaviorChart';

const ParentComponent = () => {
  const [trendType, setTrendType] = useState('daily'); // Example state
  const [date, setDate] = useState('2022-09-07'); // Example state

  return (
    <div>
      <h2>Behavior Trends for {trendType} ({date})</h2>

      {/* Dropdown or input controls for trendType and date */}
      <select value={trendType} onChange={(e) => setTrendType(e.target.value)}>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
      </select>

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        style={{ marginLeft: '20px' }}
      />

      {/* Render the BehaviorChart component */}
      <BehaviorChart trendType={trendType} date={date} />
    </div>
  );
};

export default ParentComponent;
