import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

const CattleRadarChart = ({ data }) => {
  // Calculate Movement by adding Standing and Eating values
  const radarChartData = [
    { behavior: 'Eating', avg: data.avg.eating, selected: data.selected_date.eating },
    { behavior: 'Standing', avg: data.avg.standing, selected: data.selected_date.standing },
    { behavior: 'Lying Down', avg: data.avg.lyingDown, selected: data.selected_date.lyingdown },
    { behavior: 'Not Recognized', avg: data.avg.not_reconized, selected: data.selected_date.not_reconized },
    { behavior: 'Movement', avg: data.avg.eating + data.avg.standing, selected: data.selected_date.eating + data.selected_date.standing },
  ];

  return (
    <div className="bg-gray-800 p-6 rounded-lg w-full h-full flex justify-center items-center">
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
            domain={[0, 10]}
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
  );
};

export default CattleRadarChart;
