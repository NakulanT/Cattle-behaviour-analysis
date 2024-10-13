import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Linecharts from '../components/Linecharts.jsx';
import CalendarHeatmap from "../components/CalanderHeatmap";
import Piechart from "../components/PieChart";
import DiseaseBarChart from '../components/DiseaseBarChart.jsx';
import CattleRadarChart from '../components/CattleRadarChart.jsx';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import FeedingFrequencyChart from '../components/FeedingFrequencyChart.jsx';
import Navbar from '../components/Navbar.jsx';

const CowInfoPage1 = () => {
  const { cowId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { period: initialPeriod, date: initialDate } = location.state || {};

  const [selectedDate, setSelectedDate] = useState(initialDate ? new Date(initialDate) : new Date());
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod || "daily");
  const [data, setData] = useState(null);
  const [averageData, setAverageData] = useState(null);
  const [selectedDateDay, setSelectedDateDay] = useState(null);
  const [calendarData, setCalendarData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState({
    chart: true,
    pie: true,
    radar: true,
    calendar: true,
  });

  // Modularize fetching logic for better code reuse and readability
  const fetchData = useCallback(async () => {
    setLoading((prevState) => ({ ...prevState, chart: true, pie: true, radar: true }));
    setError(null);

    try {
        const dateObject = new Date(selectedDate);
        const formattedDate = `${dateObject.getFullYear()}-${String(dateObject.getMonth() + 1).padStart(2, '0')}-${String(dateObject.getDate()).padStart(2, '0')}`;

        // console.log(formattedDate);
        
      
    //   const formattedDate = selectedDate.toISOString().split('T')[0];
      const response = await axios.get(`http://127.0.0.1:5000/cow/${cowId}`, {
        params: {
          date: formattedDate,
          period: selectedPeriod,
        },
      });

      const { daily, weeklyData, monthlyData, average_data, selected_day } = response.data;
      const formattedData = (selectedPeriod === 'daily' ? daily : selectedPeriod === 'weekly' ? weeklyData : monthlyData)
        .map(item => ({
          name: item.name,
          standing: item.standing,
          eating: item.eating,
          lyingDown: item.lyingDown,
        }));

      setData(formattedData);
      setAverageData(average_data);
      setSelectedDateDay(selected_day);
      setLoading((prevState) => ({ ...prevState, chart: false, pie: false, radar: false }));
    } catch (err) {
      setError(err.message || "Error fetching data");
      setLoading((prevState) => ({ ...prevState, chart: false, pie: false, radar: false }));
    }
  }, [selectedDate, selectedPeriod, cowId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);




  if (error) {
    return <div>Error: {error}</div>;
  }

  const pieData = averageData || {};
  const radarData = { avg: averageData || {}, selected_date: selectedDateDay || {} };

  return (
    <div className="bg-gray-900 p-4">
      <Navbar
        trendType={selectedPeriod}
        setTrendType={setSelectedPeriod}
        date={selectedDate}
        setDate={setSelectedDate}
      />

      <div className="grid grid-cols-12 grid-rows-2 gap-6 mb-6">
        {/* Line chart component */}
        <div className="col-span-5 ">
          <Linecharts data={data} loading={loading.chart} />
        </div>

        {/* Disease Bar chart */}
        <div className="col-span-7  items-center bg-gray-800">
          <DiseaseBarChart cowId={cowId} date={selectedDate} />
        </div>

        {/* Radar and Pie charts */}
        <div className="col-span-4">
          <CattleRadarChart data={radarData} loading={loading.radar} />
        </div>

        <div className="col-span-4">
          <Piechart data={pieData} loading={loading.pie} />
        </div>

        {/* Feeding Frequency Chart */}
        <div className="col-span-4 w-full bg-gray-800 flex justify-center items-center mx-auto p-6 ">
          <FeedingFrequencyChart cowId={cowId} date={selectedDate} selectedPeriod={selectedPeriod} />
        </div>
      </div>
    </div>
  );
};

export default CowInfoPage1;
