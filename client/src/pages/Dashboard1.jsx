import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import CowBehaviorDetails from '../components/CowBehaviorDetails/CowBehaviorDetails';
import Comunicating from '../components/Comunicating';
import SmallerRadiusPiechart from '../components/SmallerRadiusPiechart';
import CowDataGrid from '../components/CowDataGrid';
import CustomPieChart from '../components/CowBehaviorDetails/CustomPieChart';
import MultipleYAxesScatterChart from '../components/CattleBehaviorScatterChart';

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
      <div className="bg-gray-900 min-h-screen p-1">
        {/* Pass trendType and date state along with their setters to Navbar */}
        <Navbar 
          trendType={trendType}
          setTrendType={setTrendType}
          date={date}
          setDate={setDate}
        />

        {/* Second Row: CowBehaviorDetails and Comunicating */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 mb-4">
          {/* CowBehaviorDetails */}
          <div className="col-span-1 lg:col-span-4 bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col h-full">
            <CowBehaviorDetails trendType={trendType} date={date} />
          </div>
          <div className='col-span-1 lg:col-span-2 bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col h-full'>
            <CustomPieChart/>
          </div>

          {/* Comunicating Component */}
      
        </div>

        {/* Third Row: CowDataGrid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
  {/* CowDataGrid */}
  <div className="col-span-1 lg:col-span-6 bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col justify-center items-center h-full">
    <CowDataGrid date={date} />
  </div>
  
  {/* Centering MultipleYAxesScatterChart */}
  <div className="col-span-4 bg-gray-800 p-4 rounded-lg shadow-lg flex justify-center items-center h-full">
    <MultipleYAxesScatterChart />
  </div>

  <div className="col-span-2 bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col h-full">
    <Comunicating />
  </div>
</div>

      </div>
    </>
  );
};

export default Dashboard1;
