import React, { useState } from 'react';
import TrendControls from '../components/TrendControls';
import CowBehaviorDetails from '../components/CowBehaviorDetails/CowBehaviorDetails';
import Comunicating from '../components/Comunicating';
import SmallerRadiusPiechart from '../components/SmallerRadiusPiechart';

const Dashboard1 = () => {
  const [trendType, setTrendType] = useState('daily');
  const [date, setDate] = useState('2022-09-15');
    const Piedata = {
    Standing: 12,
    Eating: 5,
    LyingDown: 6.6,
    'Out of Camera': 2,
  };

  return (
    <>
      <div className="bg-gray-900 min-h-screen p-4">
        {/* Main Container with Full Height */}
        <div className="flex flex-col lg:flex-row h-full w-full gap-5 justify-center p-4 lg:w-4/5 mx-auto">
          
          {/* Left Side: Cow Behavior Details - Full Height, Half Width */}
          <div className="w-full lg:w-1/2">
            <CowBehaviorDetails trendType={trendType} date={date} />
          </div>

          {/* Right Side: Half Width, Full Height */}
          <div className="flex flex-col w-full lg:w-1/2 gap-5 h-full">
            {/* Top Half: TrendControls */}
            <div className="w-full h-3/4">
              <TrendControls
                trendType={trendType}
                setTrendType={setTrendType}
                date={date}
                setDate={setDate}
              />
              
            </div>
            <div className="w-[100%] h-1/2">
              <SmallerRadiusPiechart data={Piedata} />              
            </div>
            

            {/* Bottom Half: Comunicating */}
            <div className="w-full h-1/2">
              <Comunicating />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard1;
