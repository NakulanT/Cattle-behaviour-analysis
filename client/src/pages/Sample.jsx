import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Linecharts from '../components/Linecharts.jsx';
import CalendarHeatmap from "../components/CalanderHeatmap";
import Piechart from "../components/PieChart";
import DiseaseBarChart from '../components/DiseaseBarChart.jsx';
import CattleRadarChart from '../components/CattleRadarChart.jsx';

const Sample = () => {
  const [view, setView] = useState('weekly');
  const [trendsData, setTrendsData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null); // State to store monthly data
  const [error, setError] = useState(null);

  // Declare constants
  const cowId = 'Cow_1'; // Replace with your actual cow ID or null if not needed

  // Fetch Weekly Data
  useEffect(() => {
    const fetchWeeklyData = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:5000/cow/${cowId}`, {
          params: {
            period: 'weekly',
            cow_id: cowId,
          },
        });
        const formattedWeeklyData = response.data.weeklyData.map((day) => ({
          name: day.name,
          standing: day.standing,
          eating: day.eating,
          lyingDown: day.lyingDown,
        }));
        setTrendsData(formattedWeeklyData);
        console.log("Weekly Data: ", formattedWeeklyData);
      } catch (error) {
        setError(error);
      }
    };
    fetchWeeklyData();
  }, [cowId]);

  // Fetch Monthly Data
  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:5000/cow/${cowId}`,
           {
          // params: {
          //   period: 'monthly',
          //   cow_id: cowId,
          // },
        });
        console.log(response.data)
        const formattedMonthlyData = response.data.monthlyData.map((month) => ({
          name: month.name,
          standing: month.standing,
          eating: month.eating,
          lyingDown: month.lyingDown,
        }));
        setMonthlyData(formattedMonthlyData);
        console.log("Monthly Data: ", formattedMonthlyData);
      } catch (error) {
        setError(error);
      }
    };
    fetchMonthlyData();
  }, [cowId]);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!trendsData || !monthlyData) {
    return <div>Loading...</div>;
  }

  const Piedata = {
    Standing: 12,
    Eating: 5,
    LyingDown: 6.6,
    'Out of Camera': 2,
  };


  const calendarData = [
        
    { "date": "2024-01-01", "value": 30 }, 
    { "date": "2024-01-02", "value": 45 },
    { "date": "2024-01-03", "value": 0 },
    { "date": "2024-01-04", "value": 50 },
    { "date": "2024-01-05", "value": 35 },
    { "date": "2024-01-06", "value": 60 },
    { "date": "2024-01-07", "value": 40 },
    { "date": "2024-01-08", "value": 55 },
    { "date": "2024-01-09", "value": 20 },
    { "date": "2024-01-10", "value": 45 },
    { "date": "2024-01-11", "value": 38 },
    { "date": "2024-01-12", "value": 50 },
    { "date": "2024-01-13", "value": 25 },
    { "date": "2024-01-14", "value": 60 },
    { "date": "2024-01-15", "value": 70 },
    { "date": "2024-01-16", "value": 42 },
    { "date": "2024-01-17", "value": 34 },
    { "date": "2024-01-18", "value": 60 },
    { "date": "2024-01-19", "value": 27 },
    { "date": "2024-01-20", "value": 65 },
    { "date": "2024-01-21", "value": 40 },
    { "date": "2024-01-22", "value": 30 },
    { "date": "2024-01-23", "value": 55 },
    { "date": "2024-01-24", "value": 35 },
    { "date": "2024-01-25", "value": 60 },
    { "date": "2024-01-26", "value": 50 },
    { "date": "2024-01-27", "value": 48 },
    { "date": "2024-01-28", "value": 25 },
    { "date": "2024-01-29", "value": 70 },
    { "date": "2024-01-30", "value": 38 },
    { "date": "2024-01-31", "value": 60 }
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
      <Linecharts weeklyData={trendsData} monthlyData={monthlyData} />
      <DiseaseBarChart data={monthlyDiseaseCount} />
      <CattleRadarChart data={raderdata} />
      <Piechart data={Piedata} />
      <CalendarHeatmap data={calendarData} />
    </div>
  );
};

export default Sample;
