import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';
import { helix } from 'ldrs';

helix.register();

const DiseaseBarChart = ({ cowId, date }) => {
  const [monthlyConditions, setMonthlyConditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDescription, setShowDescription] = useState(false);
  const [descriptionTimeout, setDescriptionTimeout] = useState(null);

  const fetchCowData = async (endDate) => {
    try {
      const response = await axios.get(`http://127.0.0.1:5000/cow_all_data/${cowId}`, {
        params: {
          end_date: endDate,
        },
      });

      const newData = response.data.monthly_conditions;
      console.log("newData : ",newData);

      if (!newData || Object.keys(newData).length === 0) {
        throw new Error('No data available');
      }

      const transformedData = Object.entries(newData)
        .map(([key, value]) => ({
          name: key,
          ...value,
        }))
        .slice(0, 12);

      setMonthlyConditions(transformedData);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    const dateObject = new Date(date);
    const formattedDate = `${dateObject.getFullYear()}-${String(dateObject.getMonth() + 1).padStart(2, '0')}`;
    const endDate = formattedDate;

    fetchCowData(endDate);
  }, [cowId, date]);

  const handleMouseEnter = () => {
    const timeout = setTimeout(() => {
      setShowDescription(true);
    }, 1000);
    setDescriptionTimeout(timeout);
  };

  const handleMouseLeave = () => {
    setShowDescription(false);
    clearTimeout(descriptionTimeout);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center w-full h-full">
        <l-helix size="96" speed="1.5" color="#ff99cc"></l-helix>
        <h1 className="text-[#ff99cc] m-4 text-xl">Analysing....</h1>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!monthlyConditions || monthlyConditions.length === 0) {
    return <div>No data available</div>;
  }

  return (
    <div
      className="w-full h-[450px] bg-gray-800 p-2 rounded-lg relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <h2 className="text-white text-2xl font-semibold mb-2">Disease Status Overview</h2>
      <div className="bg-gray-800 h-full rounded-lg">
        {/* Absolute positioning for the description */}
        {showDescription && (
          <p className="text-gray-300 bg-slate-100 mb-2 absolute top-0 left-0 p-4">
            An overview of any diseases affecting the cow, displayed in a bar chart format.
          </p>
        )}
        <ResponsiveContainer>
          <BarChart data={monthlyConditions} margin={{ top: 20, right: 30, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="name" tick={{ fill: 'white' }} tickLine={{ stroke: '#444' }} />
            <YAxis tick={{ fill: 'white' }} tickLine={{ stroke: '#444' }} axisLine={{ stroke: '#444' }} />
            <Tooltip contentStyle={{ backgroundColor: '#333', color: 'white' }} />
            <Legend wrapperStyle={{ color: 'white' }} />

          {/* Stack the bars with the condition data */}
          <Bar dataKey="Anorexia" stackId="a" fill="#FFB6C1" name="Anorexia" />
          <Bar dataKey="Anxiety" stackId="a" fill="#ADD8E6" name="Anxiety" />
          <Bar dataKey="Lameness" stackId="a" fill="#FFD700" name="Lameness" />
          <Bar dataKey="Postpartum Fatigue" stackId="a" fill="#98FB98" name="Postpartum Fatigue" />
          <Bar dataKey="Weakness or Fatigue" stackId="a" fill="#FF6347" name="Weakness or Fatigue" />
          <Bar dataKey="Heat Stress" stackId="a" fill="#00BFFF" name="Heat Stress" />
        </BarChart>
      </ResponsiveContainer>
    </div>
    </div>
  );
};

export default DiseaseBarChart;
