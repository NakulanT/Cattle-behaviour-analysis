import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Linecharts from '../components/Linecharts.jsx';
import CalendarHeatmap from "../components/CalanderHeatmap";
import Piechart from "../components/PieChart";
import DiseaseBarChart from '../components/DiseaseBarChart.jsx';
import CattleRadarChart from '../components/CattleRadarChart.jsx';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
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
    const [average_data, setAverage_data] = useState(null);
    const [selectedDateDay, setSelectedDateDay] = useState(null);
    const [calendarData, setCalendarData] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState({ chart: true, pie: true, radar: true, calendar: true });



    // console.log(response.data.condition_summary);
    // console.log(calendarData);
    

    useEffect(() => {
        const fetchData = async () => {
            setLoading((prevState) => ({ ...prevState, chart: true, pie: true, radar: true }));
            setError(null);

            try {
                const formattedDate = selectedDate.toISOString().split('T')[0];
                const response = await axios.get(`http://127.0.0.1:5000/cow/${cowId}`, {
                    params: {
                        date: formattedDate,
                        period: selectedPeriod,
                    },
                });

                const { daily, weeklyData, monthlyData, average_data, selected_day } = response.data;
                const formattedData = (selectedPeriod === 'daily' ? daily : (selectedPeriod === 'weekly' ? weeklyData : monthlyData))
                    .map(item => ({
                        name: item.name,
                        standing: item.standing,
                        eating: item.eating,
                        lyingDown: item.lyingDown,
                    }));

                setData(formattedData);
                setAverage_data(average_data);
                setSelectedDateDay(selected_day);

                setLoading((prevState) => ({ ...prevState, chart: false, pie: false, radar: false }));
            } catch (error) {
                setError(error.message || "Error fetching data");
                setLoading((prevState) => ({ ...prevState, chart: false, pie: false, radar: false }));
            }
        };

        fetchData();
    }, [selectedDate, selectedPeriod, cowId]);

    const handleDateChange = (date) => setSelectedDate(date);
    const handlePeriodChange = (e) => setSelectedPeriod(e.target.value);

    if (error) {
        return <div>Error: {error}</div>;
    }

    const Piedata = average_data || {};
    const raderdata = { avg: average_data || {}, selected_date: selectedDateDay || {} };

    return (
        <div className="bg-gray-900 p-4">
            <Navbar/>
            <div className="flex items-center space-x-4 mb-6 p-8">
                <div>
                    <label className="text-white">Select Date: </label>
                    <DatePicker 
                        selected={selectedDate} 
                        onChange={handleDateChange} 
                        dateFormat="yyyy-MM-dd"
                        className="p-2 rounded"
                    />
                </div>

                <div>
                    <label className="text-white">Select Period: </label>
                    <select
                        value={selectedPeriod}
                        onChange={handlePeriodChange}
                        className="p-2 rounded"
                    >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-12 grid-rows-3 gap-6 mb-6">
                <div className="col-span-5">
                    <Linecharts data={data} loading={loading.chart} />
                </div>

                <div className="col-span-7 row-span-1 items-center bg-gray-800">
                    <DiseaseBarChart cowId={cowId} date={selectedDate} />
                </div>

                <div className="col-span-4">
                    <CattleRadarChart data={raderdata} loading={loading.radar} />
                </div>

                <div className="col-span-4">
                    <Piechart data={Piedata} loading={loading.pie} />
                </div>

                <div className="col-span-4">
                < FeedingFrequencyChart/>
                </div>

                {/* <div className="col-start-2 col-span-10">
                    < FeedingFrequencyChart/>
                </div> */}
            </div>
        </div>
    );
};

export default CowInfoPage1;
