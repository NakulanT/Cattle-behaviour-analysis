// src/components/Dashboard.js
import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import TrendControls from '../components/TrendControls';
import BehaviorTrends from '../components/BehaviorTrends';
import WeatherImpactChart from '../components/WeatherImpactChart';

const Dashboard1 = () => {
  const [trendType, setTrendType] = useState('daily');
  const [date, setDate] = useState('2022-09-15');

  return (
    <>
    <div className=''>

    <Box p={4}>
      <Typography variant="h4" gutterBottom>
        Cattle Behavior Dashboard
      </Typography>

      <TrendControls
        trendType={trendType}
        setTrendType={setTrendType}
        date={date}
        setDate={setDate}
      />

      <BehaviorTrends trendType={trendType} date={date} />
    </Box>

    <WeatherImpactChart/>
    </div>
    
    </>

  );
};

export default Dashboard1;
