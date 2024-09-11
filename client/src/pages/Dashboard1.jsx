import React, { useState } from 'react';
import TrendControls from '../components/TrendControls';
import CowBehaviorDetails from '../components/CowBehaviorDetails/CowBehaviorDetails';
import Comunicating from '../components/Comunicating';

const Dashboard1 = () => {
  const [trendType, setTrendType] = useState('daily');
  const [date, setDate] = useState('2022-09-15');

  return (
    <>
      <div className="bg-gray-900 min-h-screen p-4">
        {/* Cattle Behavior Dashboard */}
        <div className="w-full flex justify-center p-4">
          <div className="flex flex-col items-center lg:flex-row gap-5 w-full lg:w-4/5">
            {/* Trend Controls */}
            <div className="w-full lg:w-1/3 ">
              <TrendControls
                trendType={trendType}
                setTrendType={setTrendType}
                date={date}
                setDate={setDate}
              />
            </div>

            {/* Cow Behavior Details */}
            <div className="w-full lg:w-2/3">
              <CowBehaviorDetails trendType={trendType} date={date} />
            </div>
          </div>
        </div>

        {/* Second Row */}
        <div className="w-full flex justify-center p-4">
          <div className="flex flex-col lg:flex-row gap-5 w-full lg:w-4/5">
            {/* Cow Behavior Details (Duplicate if needed) */}
            <div className="w-full lg:w-1/2">
              <CowBehaviorDetails trendType={trendType} date={date} />
            </div>

            {/* Comunicating Component */}
            <div className="w-full lg:w-1/2">
              <Comunicating />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard1;
