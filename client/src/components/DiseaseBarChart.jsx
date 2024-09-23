import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';
import { helix } from 'ldrs';

helix.register();

const DiseaseBarChart = ({ cowId, date }) => {
  const [monthlyConditions, setMonthlyConditions] = useState([]); // Ensure initial value is an empty array
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error handling

  const fetchCowData = async (endDate) => {
    try {
      const response = await axios.get(`http://127.0.0.1:5000/cow_all_data/${cowId}`, {
        params: {
          end_date: endDate, // Send only the end date (YYYY-MM)
        },
      });

      const newData = response.data.monthly_conditions;

      // Check if the data exists and is an array
      if (!newData || Object.keys(newData).length === 0) {
        throw new Error('No data available');
      }

      // Transform object to array and slice the first 12 entries
      const transformedData = Object.entries(newData)
        .map(([key, value]) => ({
          name: key,
          ...value,
        }))
        .slice(0, 12); // Only get the first 12 items

      // Set the data into state
      setMonthlyConditions(transformedData);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  // Initial loading of the latest 12 months of data using the date passed from props
  useEffect(() => {
    const dateObject = new Date(date);
    const formattedDate = `${dateObject.getFullYear()}-${String(dateObject.getMonth() + 1).padStart(2, '0')}`;
    
    // const endDate = date.toISOString().slice(0, 7); // Use the date prop and format it to YYYY-MM
    const endDate = formattedDate; // Use the date prop and format it to YYYY-MM
    
    fetchCowData(endDate); // Fetch data for the passed date and the last 12 months
  }, [cowId, date]);

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

  // Check if the data exists before rendering
  if (!monthlyConditions || monthlyConditions.length === 0) {
    return <div>No data available</div>;
  }

  return (
    <div className="bg-gray-800 p-4 h-full rounded-lg">
      <ResponsiveContainer>
        <BarChart data={monthlyConditions} margin={{ top: 20, right: 30, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="name" tick={{ fill: 'white' }} tickLine={{ stroke: '#444' }} />
          <YAxis tick={{ fill: 'white' }} tickLine={{ stroke: '#444' }} axisLine={{ stroke: '#444' }} />
          <Tooltip contentStyle={{ backgroundColor: '#333', color: 'white' }} />
          <Legend wrapperStyle={{ color: 'white' }} />

          {/* Stack the bars with the condition data */}
          <Bar dataKey="eating_less_than_5" stackId="a" fill="#FFB6C1" name="Eating < 3h" />
          <Bar dataKey="eating_more_than_6" stackId="a" fill="#ADD8E6" name="Eating > 6h" />
          <Bar dataKey="lying_less_than_8" stackId="a" fill="#FFD700" name="Lying < 8h" />
          <Bar dataKey="lying_more_than_12" stackId="a" fill="#98FB98" name="Lying > 12h" />
          <Bar dataKey="standing_less_than_4" stackId="a" fill="#FF6347" name="Standing < 4h" />
          <Bar dataKey="standing_more_than_8" stackId="a" fill="#00BFFF" name="Standing > 8h" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DiseaseBarChart;
