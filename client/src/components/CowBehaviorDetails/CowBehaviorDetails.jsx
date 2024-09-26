import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useNavigate } from 'react-router-dom';
import ProgressCard from './ProgressCard';
import { hourglass } from 'ldrs'
import { AiFillAlert } from "react-icons/ai";


hourglass.register()

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

const CowBehaviorDetails = ({ trendType, date }) => {
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
          // const apiUrl1 = `http://localhost:5000/cow_behavior?date=${date}&period=${'one'}`;
          
          const response = await axios.get(apiUrl);
          // const response1 = await axios.get(apiUrl1);
          // console.log(response1);
          

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
    return <div className="flex flex-col justify-center items-center w-full h-full ">
<l-hourglass  bg-opacity="0.1" size="96" speed="1.5" color="#ff99cc"></l-hourglass>
    </div>;
  }

  const { lyingThreshold, eatingThreshold, standingThreshold } = getThresholds(trendType, daysInPeriod);

  return (
    <div className="container mx-auto p-4 bg-gray-800 text-gray-100 rounded-lg shadow-lg ">
      <div className='text-2xl font-bold mb-4 text-white flex gap-3 items-center'>
        <h1 className="">Cattle Health Alerts ({trendType})</h1>
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
            title={`Lying Less Than ${lyingThreshold.min} Hours`}
            data={cowBehaviorData?.lying_less_than_8}
          />
          <ProgressCard
            id={2}
            date={date}
            trendType={trendType}
            title={`Lying More Than ${lyingThreshold.max} Hours`}
            data={cowBehaviorData?.lying_more_than_12}
          />
          <ProgressCard
            date={date}
            trendType={trendType}
            title={`Eating Less Than ${eatingThreshold.min} Hours`}
            data={cowBehaviorData?.eating_less_than_3}
          />
          <ProgressCard
            date={date}
            trendType={trendType}
            title={`Eating More Than ${eatingThreshold.max} Hours`}
            data={cowBehaviorData?.eating_more_than_6}
          />
          <ProgressCard
            date={date}
            trendType={trendType}
            title={`Standing Less Than ${standingThreshold.min} Hours`}
            data={cowBehaviorData?.standing_less_than_4}
          />
          <ProgressCard
            date={date}
            trendType={trendType}
            title={`Standing More Than ${standingThreshold.max} Hours`}
            data={cowBehaviorData?.standing_more_than_8}
          />
        </div>
      )}
    </div>
  );
};



export default CowBehaviorDetails;
