import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

const CattleRadarChart = ({ data }) => {
  // Calculate Movement by adding Standing and Eating values
  const radarChartData = [
    { behavior: 'Eating', avg: data.avg.eating, selected: data.selected_date.eating },
    { behavior: 'Standing', avg: data.avg.standing, selected: data.selected_date.standing },
    { behavior: 'Lying Down', avg: data.avg.lyingdown, selected: data.selected_date.lyingdown },
    { behavior: 'Not Recognized', avg: data.avg.not_reconized, selected: data.selected_date.not_reconized },
    { behavior: 'Movement', avg: data.avg.eating + data.avg.standing, selected: data.selected_date.eating + data.selected_date.standing },
  ];

  return (
    <div className="bg-gray-800 p-6 rounded-lg h-96 w-2/4">
      <ResponsiveContainer>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarChartData}>
          <PolarGrid stroke="#444" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="behavior"
            tick={{ fill: '#B0E57C', fontSize: 14 }}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 10]}
            tick={{ fill: '#FFC0CB', fontSize: 12 }}
            axisLine={false}
          />
          <Radar
            name="Average"
            dataKey="avg"
            stroke="#00BFFF"
            fill="#00BFFF"
            fillOpacity={0.6}
          />
          <Radar
            name="Selected Date"
            dataKey="selected"
            stroke="#FF69B4"
            fill="#FF69B4"
            fillOpacity={0.6}
          />
          <Legend wrapperStyle={{ color: '#F0F0F0', fontSize: 14 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CattleRadarChart;
