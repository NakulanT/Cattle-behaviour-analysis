// src/components/BehaviorTrends.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography } from '@mui/material';
import TrendChart from './TrendChart';

const BehaviorTrends = ({ trendType, date }) => {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch behavior trends from API
  const fetchTrends = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/behavior/trends', {
        params: { trend_type: trendType, date },
      });
      setTrends(response.data.trends);
    } catch (error) {
      setError('Error fetching trends.');
      console.error('Error fetching trends:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, [trendType, date]);

  // Handle loading and error states
  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box mt={4}>
      {trends ? (
        <TrendChart trends={trends} />
      ) : (
        <Typography variant="h6">No data available for the selected period.</Typography>
      )}
    </Box>
  );
};

export default BehaviorTrends;
