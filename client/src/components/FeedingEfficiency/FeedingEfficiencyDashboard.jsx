import React, { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs'; // To handle date calculations
import FeedingEfficiencyChart from './FeedingEfficiencyChart'; // Import the chart component
import TrendControls from '../../components/TrendControls'; // Import trend controls

const FeedingEfficiencyDashboard = () => {
  const [trendType, setTrendType] = useState('daily');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD')); // Set today's date as default
  const [feedingData, setFeedingData] = useState([]);
  const [herdAverage, setHerdAverage] = useState(0);

  // Function to calculate date range based on trend type
  const calculateDateRange = (selectedDate, type) => {
    const startDate = dayjs(selectedDate);
    let endDate = startDate;

    if (type === 'weekly') {
      endDate = startDate.add(6, 'day');
    } else if (type === 'monthly') {
      endDate = startDate.endOf('month');
    }

    return {
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD'),
    };
  };

  // Fetch data based on trend type and date
  useEffect(() => {
    const { startDate, endDate } = calculateDateRange(date, trendType);

    axios
      .get('/api/feeding_efficiency', {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      })
      .then((response) => {
        setFeedingData(response.data.feedingData);
        setHerdAverage(response.data.herdAverage);
      })
      .catch((error) => {
        console.error('Error fetching feeding efficiency data:', error);
      });
  }, [trendType, date]); // Re-fetch data when trendType or date changes

  return (
    <div>
      <h1>Feeding Efficiency Dashboard</h1>

      {/* Pass the trendType and date state to the TrendControls component */}
      <TrendControls
        trendType={trendType}
        setTrendType={setTrendType}
        date={date}
        setDate={setDate}
      />

      {/* Pass the feedingData and herdAverage to the FeedingEfficiencyChart component */}
      <FeedingEfficiencyChart feedingData={feedingData} herdAverage={herdAverage} />
    </div>
  );
};

export default FeedingEfficiencyDashboard;
