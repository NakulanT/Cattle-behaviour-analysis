import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const FeedingFrequencyChart = ({ cowId, date, selectedPeriod }) => {
  const [data, setData] = useState([]);
  const dateObject = new Date(date);
  const formattedDate = `${dateObject.getFullYear()}-${String(dateObject.getMonth() + 1).padStart(2, '0')}-${String(dateObject.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    const fetchFeedingFrequency = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/feedingFrequency', {
          params: {
            date: formattedDate,
            period: selectedPeriod,
            cow_id: cowId
          }
        });

        const transformedData = response.data.map(item => ({
          "Period": item["Period"],
          "Feeding Frequency": item["Feeding Frequency"]
        }));

        setData(transformedData);
      } catch (error) {
        console.error('Error fetching feeding frequency data:', error);
      }
    };

    fetchFeedingFrequency();
  }, [formattedDate, selectedPeriod, cowId]);
  // console.log('Chart Data:', data);


  return (
    <div className='h-full w-full'>
      <h1 className="text-white text-2xl font-semibold m-2">
      Feeding Frequency Analysis
      </h1>

      <ResponsiveContainer width="100%" height={400}>
        {data.length > 0 ? (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="4 4" />
            <XAxis dataKey="Period" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="Feeding Frequency" stroke="#8884d8" fill="#8884d8" />
          </AreaChart>
        ) : (
          <div>No data available for the selected cow and period.</div>
        )}
      </ResponsiveContainer>
    </div>
  );
  
};

export default FeedingFrequencyChart;
