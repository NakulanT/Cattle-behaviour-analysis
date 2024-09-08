import React, { useEffect, useState } from 'react';
import axios from 'axios';

const DailyWeeklyTrends = ({ date }) => {
  const [behaviorTrends, setBehaviorTrends] = useState([]);

  useEffect(() => {
    fetchBehaviorTrends();
  }, [date]);

  const fetchBehaviorTrends = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:5000/api/behavior/trends?date=${date}`);
      setBehaviorTrends(response.data.trends);
    } catch (error) {
      console.error('Error fetching behavior trends data:', error);
    }
  };

  return (
    <div className="card">
      <h3>Daily and Weekly Behavior Trends</h3>
      <ul>
        {behaviorTrends.map((trend, index) => (
          <li key={index}>{trend}</li>
        ))}
      </ul>
    </div>
  );
};

export default DailyWeeklyTrends;
