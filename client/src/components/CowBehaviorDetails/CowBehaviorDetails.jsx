import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useNavigate } from 'react-router-dom';

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
    return <div>Loading...</div>;
  }

  const { lyingThreshold, eatingThreshold, standingThreshold } = getThresholds(trendType, daysInPeriod);

  return (
    <div className="container mx-auto p-4 bg-gray-800 text-gray-100 rounded-lg shadow-lg transition-all duration-500 ease-in-out transform hover:scale-105">
      <h1 className="text-2xl font-bold mb-4 text-white">Cow Behavior Progress Cards ({trendType})</h1>

      {error ? (
        <div className="text-red-400 mb-4">{error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <ProgressCard
            date={date}
            trendType={trendType}
            title={`Lying Less Than ${lyingThreshold.min} Hours`}
            data={cowBehaviorData?.lying_less_than_8}
          />
          <ProgressCard
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

// ProgressCard Component
const ProgressCard = ({ title, data,trendType,date, totalCows = 50 }) => {
  const navigate = useNavigate(); // Use useNavigate instead of useHistory

  const cowsInCategory = data ? data.length : 0;
  const progress = cowsInCategory > 0 ? (cowsInCategory / totalCows) * 100 : 0;

  const handleClick = () => {
    // Navigate to the cow details page with the cow IDs as state
    navigate('/cow-details', { state: { title, cows: data,trendType,date} }); // Use navigate instead of history.push
  };

  return (
    <div
      className="bg-gray-700 shadow-md rounded-lg p-4 text-center text-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleClick} // Handle click to navigate
    >
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="w-24 mx-auto mb-4">
        <CircularProgressbar
          value={progress}
          text={`${Math.round(progress)}%`}
          styles={buildStyles({
            pathColor: progress > 50 ? "#4caf50" : "#f44336", // Green for > 50%, Red for < 50%
            textColor: "#f5f5f5",
            trailColor: "#2d3748", // Darker background for the progress trail
          })}
        />
      </div>
      <p className="text-gray-300">Cows in this category: {cowsInCategory}</p>
    </div>
  );
};


export default CowBehaviorDetails;
