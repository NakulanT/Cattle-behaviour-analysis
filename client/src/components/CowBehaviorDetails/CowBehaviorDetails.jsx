import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useNavigate } from 'react-router-dom';
import ProgressCard from './ProgressCard';
import { hourglass } from 'ldrs';
import { AiFillAlert } from "react-icons/ai";
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Register hourglass component
hourglass.register();

// Function to calculate threshold based on the period type
const getThresholds = (period, daysInPeriod) => {
  const dailyLyingThreshold = { min: 8, max: 12 };
  const dailyEatingThreshold = { min: 3, max: 6 };
  const dailyStandingThreshold = { min: 4, max: 8 };

  const multiplier = period === 'daily' ? 1 : daysInPeriod;

  return {
    lyingThreshold: {
      min: dailyLyingThreshold.min * multiplier,
      max: dailyLyingThreshold.max * multiplier,
    },
    eatingThreshold: {
      min: dailyEatingThreshold.min * multiplier,
      max: dailyEatingThreshold.max * multiplier,
    },
    standingThreshold: {
      min: dailyStandingThreshold.min * multiplier,
      max: dailyStandingThreshold.max * multiplier,
    },
  };
};

// Define light and dark themes
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      paper: '#1e293b',
      default: '#0f172a',
    },
    text: {
      primary: '#e2e8f0',
    },
  },
});

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      paper: '#ffffff',
      default: '#f5f5f5',
    },
    text: {
      primary: '#000000',
    },
  },
});

const CowBehaviorDetails = ({ trendType, date, isLightTheme }) => {
  const [cowBehaviorData, setCowBehaviorData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const daysInPeriod =
    trendType === 'weekly' ? 7 : trendType === 'monthly' ? new Date(date).getDate() : 1;

  useEffect(() => {
    const fetchCowBehaviorData = async () => {
      if (date && trendType) {
        try {
          const apiUrl = `http://localhost:5000/cow_behavior?date=${date}&period=${trendType}`;
          const response = await axios.get(apiUrl);

          if (response.data.error) {
            setError(response.data.error);
            setCowBehaviorData(null);
          } else {
            setCowBehaviorData(response.data);
            setError(null);
          }
          setLoading(false);
        } catch (err) {
          setError('Unable to fetch data. Please try again later.');
          setLoading(false);
        }
      }
    };

    fetchCowBehaviorData();
  }, [date, trendType]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center w-full h-full ">
        <l-hourglass bg-opacity="0.1" size="96" speed="1.5" color="#ff99cc"></l-hourglass>
      </div>
    );
  }

  const { lyingThreshold, eatingThreshold, standingThreshold } = getThresholds(trendType, daysInPeriod);

  return (
    <ThemeProvider theme={isLightTheme ? lightTheme : darkTheme}>
      <div className="container mx-auto p-4 bg-gray-800">
        <div className='text-2xl font-bold mb-4  flex gap-3 items-center'>
          <h1>Cattle Health Alerts ({trendType})</h1>
          <AiFillAlert className='text-3xl' />
        </div>

        {error ? (
          <div className="text-red-400 mb-4">{error}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <ProgressCard
              id={1}
              date={date}
              trendType={trendType}
              title='Lameness'
              data={cowBehaviorData?.lying_less_than_8}
              isLightTheme={isLightTheme}
            />
            <ProgressCard
              id={2}
              date={date}
              trendType={trendType}
              title='Postpartum Fatigue or Metabolic Disorders'
              data={cowBehaviorData?.lying_more_than_12}
              isLightTheme={isLightTheme}
            />
            <ProgressCard
              date={date}
              trendType={trendType}
              title='Anorexia or Social Dominance Issues'
              data={cowBehaviorData?.eating_less_than_3}
              isLightTheme={isLightTheme}
            />
            <ProgressCard
              date={date}
              trendType={trendType}
              title='Nutritional Deficiency or Anxiety'
              data={cowBehaviorData?.eating_more_than_6}
              isLightTheme={isLightTheme}
            />
            <ProgressCard
              date={date}
              trendType={trendType}
              title='Weakness or Fatigue'
              data={cowBehaviorData?.standing_less_than_4}
              isLightTheme={isLightTheme}
            />
            <ProgressCard
              date={date}
              trendType={trendType}
              title='Heat Stress'
              data={cowBehaviorData?.standing_more_than_8}
              isLightTheme={isLightTheme}
            />
          </div>
        )}
      </div>
    </ThemeProvider>
  );
};

export default CowBehaviorDetails;
