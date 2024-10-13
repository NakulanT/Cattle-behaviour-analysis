import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

const CattleBehaviorComparisonChart = ({ data }) => {
  // Check if data is available
  if (!data || !data.avg || !data.selected_date) {
    return <div className="text-white">No data available</div>; // Show message if no data
  }

  // Calculate Movement by adding Standing and Eating values
  const radarChartData = [
    { behavior: 'Eating', avg: data.avg.eating || 0, selected: data.selected_date.eating || 0 },
    { behavior: 'Standing', avg: data.avg.standing || 0, selected: data.selected_date.standing || 0 },
    { behavior: 'Lying Down', avg: data.avg.lyingDown || 0, selected: data.selected_date.lyingdown || 0 },
    { behavior: 'Not Recognized', avg: data.avg.not_reconized || 0, selected: data.selected_date.not_reconized || 0 },
    { behavior: 'Movement', avg: (data.avg.eating || 0) + (data.avg.standing || 0), selected: (data.selected_date.eating || 0) + (data.selected_date.standing || 0) },
  ];

  return (
    <div className="bg-gray-800 p-6 rounded-lg w-full h-full flex flex-col">
      <h2 className="text-2xl font-bold text-white mb-4 text-center">Cattle Behavior Comparison</h2>
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarChartData}>
            <PolarGrid stroke="#4A5568" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="behavior"
              tick={{ fill: '#A0AEC0', fontSize: 14 }}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, Math.max(...radarChartData.map(item => Math.max(item.avg, item.selected))) || 10]} // Dynamic max range
              tick={{ fill: '#E2E8F0', fontSize: 12 }}
              axisLine={false}
            />
            <Radar
              name="Average"
              dataKey="avg"
              stroke="#4299E1"
              fill="#4299E1"
              fillOpacity={0.6}
            />
            <Radar
              name="Selected Date"
              dataKey="selected"
              stroke="#ED64A6"
              fill="#ED64A6"
              fillOpacity={0.6}
            />
            <Legend
              wrapperStyle={{ color: '#F0F0F0', fontSize: 14 }}
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CattleBehaviorComparisonChart;

