// App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BehaviorDurationChart, AverageBehaviorDurationChart } from '../components/Dashboard/BehaviorCharts';

const Dashboard1 = () => {
  const [behaviorDurationPerCow, setBehaviorDurationPerCow] = useState([]);
  const [averageBehaviorDurationPerBreed, setAverageBehaviorDurationPerBreed] = useState([]);

  // Fetch data from Flask API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const behaviorResponse = await axios.get('http://localhost:5000/api/behavior-duration');
        const averageResponse = await axios.get('http://localhost:5000/api/average-behavior-duration');
        setBehaviorDurationPerCow(behaviorResponse.data);
        setAverageBehaviorDurationPerBreed(averageResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>Behavior Duration Analysis</h1>

      {/* Bar chart for behaviorDurationPerCow */}
      <h2>Total Time Spent on Each Activity (per Cattle)</h2>
      <BehaviorDurationChart data={behaviorDurationPerCow} />

      {/* Line chart for averageBehaviorDurationPerBreed */}
      <h2>Average Behavior Duration (per Breed)</h2>
      <AverageBehaviorDurationChart data={averageBehaviorDurationPerBreed} />
    </div>
  );
};

export default Dashboard1;
