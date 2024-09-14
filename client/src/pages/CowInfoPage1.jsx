import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Linecharts from '../components/Linecharts.jsx';
import CalendarHeatmap from "../components/CalanderHeatmap";
import Piechart from "../components/PieChart";
import DiseaseBarChart from '../components/DiseaseBarChart.jsx';
import CattleRadarChart from '../components/CattleRadarChart.jsx';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const CowInfoPage1 = () => {

    const { cowId } = useParams();  // Get cow ID from the route
    const navigate = useNavigate();
    const location = useLocation(); // Get location object
    const { period: initialPeriod, date: initialDate } = location.state || {}; // Destructure period (trendType) and date

    // States for selected date and period
    const [selectedDate, setSelectedDate] = useState(initialDate ? new Date(initialDate) : new Date());
    const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod || "daily");

    // Other states
    const [data, setData] = useState(null);
    const [Monthly_data, setMonthly_data] = useState(null);
    const [average_data, setAverage_data] = useState(null);
    const [selectedDateDay, setSelectedDateDay] = useState(null);
    const [calendarData, setCalendarData] = useState([]); // State for the calendar data
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetching Monthly Conditions
    useEffect(() => {
        const fetchMonthlyConditions = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`http://127.0.0.1:5000/cow_all_data/${cowId}`);
                console.log("API Response:", response.data);
            
                // Get today's date and calculate the date 365 days ago
                const today = new Date();
                const oneYearAgo = new Date();
                oneYearAgo.setDate(today.getDate() - 365);
        
                // Transform and filter the condition_summary to include only the last 365 days
                const conditionSummary = response.data.condition_summary;
                const filteredCalendarData = Object.keys(conditionSummary)
                    .filter(date => {
                        const entryDate = new Date(date);
                        return entryDate >= oneYearAgo && entryDate <= today;
                    })
                    .map(date => ({
                        date: date, // Use the date as the key
                        value: conditionSummary[date].value // Use the value from the condition summary
                    }));
                
                setCalendarData(filteredCalendarData); // Store the filtered calendar data
                console.log("Formatted calendarData:", filteredCalendarData);
        
                setLoading(false);
            } catch (err) {
                console.error("Error fetching data:", err.message);
                setError(err.message);
                setLoading(false);
            }
        };
    
        fetchMonthlyConditions();
    }, [cowId]);

    // Fetching data based on selected date and period
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const formattedDate = selectedDate.toISOString().split('T')[0]; // Format date as YYYY-MM-DD
                const response = await axios.get(`http://127.0.0.1:5000/cow/${cowId}`, {
                    params: {
                        date: formattedDate,
                        period: selectedPeriod,
                    },
                });

                console.log(response.data);

                if (selectedPeriod === 'daily' && response.data.daily) {
                    const formattedDailyData = response.data.daily.map(day => ({
                        name: day.name,
                        standing: day.standing,
                        eating: day.eating,
                        lyingDown: day.lyingDown,
                    }));

                    setData([...formattedDailyData]);
                    setAverage_data(response.data.average_data);
                    setSelectedDateDay(response.data.selected_day);

                } else if (selectedPeriod === 'weekly' && response.data.weeklyData) {
                    const formattedWeeklyData = response.data.weeklyData.map(week => ({
                        name: week.name,
                        standing: week.standing,
                        eating: week.eating,
                        lyingDown: week.lyingDown,
                    }));
                    setData([...formattedWeeklyData]);
                    setAverage_data(response.data.average_data);
                    setSelectedDateDay(response.data.selected_day);

                } else if (selectedPeriod === 'monthly' && response.data.monthlyData) {
                    const formattedMonthlyData = response.data.monthlyData.map(month => ({
                        name: month.name,
                        standing: month.standing,
                        eating: month.eating,
                        lyingDown: month.lyingDown,
                    }));
                    setData([...formattedMonthlyData]);
                    setAverage_data(response.data.average_data);
                    setSelectedDateDay(response.data.selected_day);
                }

                setLoading(false);
            } catch (error) {
                setError(error.message || "Error fetching data");
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedDate, selectedPeriod, cowId]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    const Piedata = average_data;
    const raderdata = {
        avg: average_data,
        selected_date: selectedDateDay,
    };
    console.log(calendarData);

    return (
        <div className="bg-gray-900 p-4">
            {/* Date Picker and Period Dropdown */}
            <div className="flex items-center space-x-4 mb-6">
                <div>
                    <label className="text-white">Select Date: </label>
                    <DatePicker 
                        selected={selectedDate} 
                        onChange={(date) => setSelectedDate(date)} 
                        dateFormat="yyyy-MM-dd"
                        className="p-2 rounded"
                    />
                </div>

                <div>
                    <label className="text-white">Select Period: </label>
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="p-2 rounded"
                    >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>
            </div>

            {/* Data Charts */}
            <div className="grid grid-cols-12 grid-rows-3 gap-6 mb-6">
                
                <div className="col-span-5">
                    <Linecharts data={data} /> {/* Line charts for standing, eating, lying down */}
                </div>
                <div className="col-span-7 row-span-1 items-center bg-gray-800">
                    {/* <h2 className="text-white mb-2">Monthly Disease Count</h2> */}
                    <DiseaseBarChart className="items-center" monthlyConditionsdata={Monthly_data} cowId={cowId} date={selectedDate} />
                </div>
                
                <div className="col-span-4 ">
                    <CattleRadarChart data={raderdata} /> {/* Radar chart for comparison */}
                </div>
                
                <div className="col-span-4">
                    <Piechart data={Piedata} /> {/* Pie chart for average data */}
                </div>
                <div className="col-span-4">
                    <Piechart data={Piedata} /> {/* Pie chart for average data */}
                </div>
                <div className="col-start-2 col-span-10">
                    {/* <h2 className="text-white mb-2">Condition Calendar</h2> */}
                    <CalendarHeatmap data={calendarData} /> {/* Heatmap showing condition summary */}
                </div>
            </div>


            {/* Disease Bar Chart */}

            {/* Calendar Heatmap */}
        </div>
    );
};

export default CowInfoPage1;
