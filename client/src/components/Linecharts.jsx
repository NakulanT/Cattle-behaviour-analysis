import React from 'react';
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

  // If there's no data, display a message
  if (!data || data.length === 0) {
    return <p className="text-white">No data available</p>;
  }

  return (
    <div className="flex justify-start h-full items-start  bg-gray-800 p-2 rounded-lg">
      <div className="w-[100%] h-full p-4 bg-gray-800 rounded-lg">
        {/* Area Chart */}
        <div className="w-[100%] h-full bg-gray-800 border border-gray-600 pr-4 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
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
    </div>
  );
};

export default Linecharts;
