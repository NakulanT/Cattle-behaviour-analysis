import React, { useState } from 'react';
import Linecharts from '../components/Linecharts.jsx';
import CalendarHeatmap from "../components/CalanderHeatmap";
import Piechart from "../components/PieChart";
import DiseaseBarChart from '../components/DiseaseBarChart.jsx';
import CattleRadarChart from '../components/CattleRadarChart.jsx';


const Sample = () => {
  const [view, setView] = useState('weekly');

  // Sample weekly and monthly data
  const weeklyData = [
    { name: 'Day 1', standing: 15, eating: 5, lyingDown: 3 },
    { name: 'Day 2', standing: 16, eating: 6, lyingDown: 7 },
    { name: 'Day 3', standing: 5, eating: 7, lyingDown: 4},
    { name: 'Day 4', standing: 8, eating: 8, lyingDown: 6 },
    { name: 'Day 5', standing: 9, eating: 4, lyingDown: 3 },
    { name: 'Day 6', standing: 15, eating: 5, lyingDown: 2 },
    { name: 'Day 7', standing: 7, eating: 6, lyingDown: 8},
  ];

  const monthlyData = [
    { name: 'Jan', standing: 30, eating: 30, lyingDown: 30 },
    { name: 'Feb', standing: 45, eating: 45, lyingDown: 45 },
    { name: 'Mar', standing: 23, eating: 0, lyingDown: 0 },
    { name: 'Apr', standing: 50, eating: 50, lyingDown: 50 },
    { name: 'May', standing: 33, eating: 35, lyingDown: 35 },
    { name: 'Jun', standing: 64, eating: 30, lyingDown: 60 },
    { name: 'Jul', standing: 42, eating: 10, lyingDown: 40 },
    { name: 'Aug', standing: 22, eating: 85, lyingDown: 55 },
    { name: 'Sep', standing: 24, eating: 50, lyingDown: 20 },
    { name: 'Oct', standing: 45, eating: 45, lyingDown: 45 },
    { name: 'Nov', standing: 37, eating: 58, lyingDown: 38 },
    { name: 'Dec', standing: 58, eating: 30, lyingDown: 50 },
  ];

  const Piedata = {
    Standing: 12,
    Eating: 5,
    LyingDown: 6.6,
    'Out of Camera': 2,
  };

  const calendarData = [
    { date: '2024-01-01', value: 30 },
    { date: '2024-01-02', value: 45 },
    { date: '2024-01-03', value: 0 },
    // Add more data as needed...
  ];

  const monthlyDiseaseCount = [
    { name: 'Jan', Lameness: 0, 'Inadequate Bedding': 0, 'Postpartum Fatigue': 0, 'Depression or Illness': 0, Anorexia: 0, 'Boredom or Anxiety': 2, Fatigue: 0, 'Heat Stress': 0 },
    { name: 'Feb', Lameness: 3, 'Inadequate Bedding': 0, 'Postpartum Fatigue': 0, 'Depression or Illness': 0, Anorexia: 0, 'Boredom or Anxiety': 0, Fatigue: 0, 'Heat Stress': 0 },
    { name: 'Mar', Lameness: 0, 'Inadequate Bedding': 0, 'Postpartum Fatigue': 0, 'Depression or Illness': 0, Anorexia: 0, 'Boredom or Anxiety': 0, Fatigue: 0, 'Heat Stress': 0 },
    { name: 'Apr', Lameness: 0, 'Inadequate Bedding': 0, 'Postpartum Fatigue': 0, 'Depression or Illness': 0, Anorexia: 4, 'Boredom or Anxiety': 0, Fatigue: 0, 'Heat Stress': 0 },
    { name: 'May', Lameness: 0, 'Inadequate Bedding': 4, 'Postpartum Fatigue': 0, 'Depression or Illness': 0, Anorexia: 0, 'Boredom or Anxiety': 0, Fatigue: 0, 'Heat Stress': 2 },
    { name: 'Jun', Lameness: 0, 'Inadequate Bedding': 0, 'Postpartum Fatigue': 0, 'Depression or Illness': 0, Anorexia: 0, 'Boredom or Anxiety': 3, Fatigue: 0, 'Heat Stress': 0 },
    { name: 'Jul', Lameness: 2, 'Inadequate Bedding': 3, 'Postpartum Fatigue': 0, 'Depression or Illness': 0, Anorexia: 0, 'Boredom or Anxiety': 0, Fatigue: 0, 'Heat Stress': 0 },
    { name: 'Aug', Lameness: 0, 'Inadequate Bedding': 4, 'Postpartum Fatigue': 0, 'Depression or Illness': 0, Anorexia: 0, 'Boredom or Anxiety': 0, Fatigue: 0, 'Heat Stress': 0 },
    { name: 'Sep', Lameness: 0, 'Inadequate Bedding': 0, 'Postpartum Fatigue': 0, 'Depression or Illness': 0, Anorexia: 5, 'Boredom or Anxiety': 0, Fatigue: 0, 'Heat Stress': 0 },
    { name: 'Oct', Lameness: 0, 'Inadequate Bedding': 0, 'Postpartum Fatigue': 0, 'Depression or Illness': 0, Anorexia: 0, 'Boredom or Anxiety': 2, Fatigue: 0, 'Heat Stress': 0 },
    { name: 'Nov', Lameness: 0, 'Inadequate Bedding': 3, 'Postpartum Fatigue': 0, 'Depression or Illness': 0, Anorexia: 0, 'Boredom or Anxiety': 0, Fatigue: 0, 'Heat Stress': 0 },
    { name: 'Dec', Lameness: 0, 'Inadequate Bedding': 0, 'Postpartum Fatigue': 0, 'Depression or Illness': 2, Anorexia: 0, 'Boredom or Anxiety': 0, Fatigue: 0, 'Heat Stress': 0 },
  ];

  const raderdata = {
    avg: { eating: 4, standing: 3, lyingdown: 5, not_reconized: 2 },
    selected_date: { eating: 3, standing: 4, lyingdown: 4, not_reconized: 1 },
  };

  return (
    <div className="bg-gray-900 p-4">
      <Linecharts weeklyData={weeklyData} monthlyData={monthlyData} />
      <DiseaseBarChart data={monthlyDiseaseCount} />
      <CattleRadarChart data={raderdata} />
      <Piechart data={Piedata} />
      <CalendarHeatmap data={calendarData} />
    </div>
  );
};

export default Sample;
