import React, { useState } from 'react';
import TrendControls from '../components/TrendControls';
import CowBehaviorDetails from '../components/CowBehaviorDetails/CowBehaviorDetails';
import Comunicating from '../components/Comunicating';
import Navbar from '../components/Navbar';
import CowDataGrid from '../components/CowDataGrid';

const Dashboard1 = () => {
  const [trendType, setTrendType] = useState('daily');
  const [date, setDate] = useState('2022-09-15');

  return (
    <>
      <div className="bg-gray-900 min-h-screen p-4">
        {/* Navbar */}
        <Navbar />

        {/* First Row: Health Alerts Header and Trend Controls */}
        <div className="flex items-center justify-between mb-4">
          {/* <h1 className="text-2xl font-bold text-white">Health Alerts ({trendType})</h1> */}
          <TrendControls
            trendType={trendType}
            setTrendType={setTrendType}
            date={date}
            setDate={setDate}
          />
        </div>

        {/* Second Row: CowBehaviorDetails and Comunicating */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 mb-4">
  {/* CowBehaviorDetails */}
            <div className="col-span-1 lg:col-span-4 bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col h-full">
              <CowBehaviorDetails trendType={trendType} date={date} />
            </div>

            {/* Comunicating Component */}
            <div className="col-span-1 lg:col-span-2 bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col h-full">
              <Comunicating />
            </div>
        </div>


        {/* Third Row: CowDataGrid */}

        <div className="grid grid-cols-1 lg:grid-cols-8 gap-4 mb-4">
  {/* CowBehaviorDetails */}
            <div className="col-span-1 lg:col-span-4 bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col justify-center items-center h-full">
              <CowDataGrid />
            </div>

            {/* Comunicating Component */}
            <div className="col-span-1 lg:col-span-1 bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col h-full">
         
            </div>
        </div>
        
      </div>
    </>
  );
};

export default Dashboard1;
