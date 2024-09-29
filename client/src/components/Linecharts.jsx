import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';

const Linecharts = ({ data }) => {
  // State to control tooltip visibility
  const [showDescription, setShowDescription] = useState(false);
  const [descriptionTimeout, setDescriptionTimeout] = useState(null);

  // If there's no data, display a message
  if (!data || data.length === 0) {
    return <p className="text-white">No data available</p>;
  }

  // Hover handlers
  const handleMouseEnter = () => {
    const timeout = setTimeout(() => {
      setShowDescription(true);
    }, 1000); // Show description after 5 seconds
    setDescriptionTimeout(timeout);
  };

  const handleMouseLeave = () => {
    setShowDescription(false);
    clearTimeout(descriptionTimeout); // Clear the timeout
  };

  return (
    <div className="flex flex-col justify-start h-full items-start bg-gray-800 p-2 rounded-lg"
    onMouseEnter={handleMouseEnter} 
    onMouseLeave={handleMouseLeave}
    >
      <h2 className="text-white text-2xl font-semibold mb-2">Activity Overview</h2>
      {/* <p className="text-gray-300 mb-4">
        
      </p> */}
      <div className="w-[100%] h-full p-4 bg-gray-800 rounded-lg">
        {/* Area Chart */}
        <div className="w-[100%] h-full bg-gray-800 border border-gray-600 pr-4 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={data} 

            >
              {/* Define Gradients */}
              <defs>
                <linearGradient id="colorStanding" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#32a852" stopOpacity={0.8} /> {/* Green */}
                  <stop offset="95%" stopColor="#32a852" stopOpacity={0.2} />
                </linearGradient>
                <linearGradient id="colorEating" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#32a8a8" stopOpacity={0.8} /> {/* Blue */}
                  <stop offset="95%" stopColor="#32a8a8" stopOpacity={0.2} />
                </linearGradient>
                <linearGradient id="colorLyingDown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff99cc" stopOpacity={0.8} /> {/* Pink */}
                  <stop offset="95%" stopColor="#ff99cc" stopOpacity={0.2} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                label={{ value: 'Date', position: 'insideBottomRight', offset: -5 }} 
                tick={{ fill: '#ccc' }}
              />
              <YAxis 
                label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} 
                tick={{ fill: '#ccc' }}
              />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="standing" 
                stroke="#32a852" 
                fill="url(#colorStanding)" 
                name="Standing Hours" 
                fillOpacity={1} 
              />
              <Area 
                type="monotone" 
                dataKey="eating" 
                stroke="#32a8a8" 
                fill="url(#colorEating)" 
                name="Eating Hours" 
                fillOpacity={1} 
              />
              <Area 
                type="monotone" 
                dataKey="lyingDown" 
                stroke="#ff99cc" 
                fill="url(#colorLyingDown)" 
                name="Lying Down Hours" 
                fillOpacity={1} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      {showDescription && (
        <div className="absolute bg-gray-700 text-white p-2 rounded-md mt-2">
          A visual representation of  activities of the cow, showing standing, eating, and lying down times.
        </div>
      )}
    </div>
  );
};

export default Linecharts;
