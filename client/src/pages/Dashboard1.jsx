import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import CowBehaviorDetails from '../components/CowBehaviorDetails/CowBehaviorDetails';
import Comunicating from '../components/Comunicating';
import CowDataGrid from '../components/CowDataGrid';
import CustomPieChart from '../components/CowBehaviorDetails/CustomPieChart';
import MultipleYAxesScatterChart from '../components/CattleBehaviorScatterChart';

const Dashboard1 = ({ isLightTheme, toggleTheme }) => {
  const [trendType, setTrendType] = useState('daily');
  const [date, setDate] = useState('2022-09-15');

  return (
    <div className="min-h-screen p-1">
      {/* Pass theme state and toggle function to Navbar */}
      <Navbar 
        trendType={trendType}
        setTrendType={setTrendType}
        date={date}
        setDate={setDate}
        isLightTheme={isLightTheme} // Pass theme state
        toggleTheme={toggleTheme} // Pass toggle function
      />

      {/* Second Row: CowBehaviorDetails and Comunicating */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 mb-4">
        <div className="col-span-1 lg:col-span-4 bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col h-full">
          <CowBehaviorDetails trendType={trendType} date={date} isLightTheme={isLightTheme} />
        </div>
        <div className='col-span-1 lg:col-span-2 bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col h-full'>
          <CustomPieChart isLightTheme={isLightTheme} />
        </div>
      </div>

      {/* Third Row: CowDataGrid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        <div className="col-span-1 lg:col-span-6 bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col justify-center items-center h-full">
          <CowDataGrid date={date} isLightTheme={isLightTheme} />
        </div>
        
        <div className="col-span-4 bg-gray-800 p-4 rounded-lg shadow-lg flex justify-center items-center h-full">
          <MultipleYAxesScatterChart isLightTheme={isLightTheme} />
        </div>

        <div className="col-span-2 bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col h-full">
          <Comunicating isLightTheme={isLightTheme} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard1;
