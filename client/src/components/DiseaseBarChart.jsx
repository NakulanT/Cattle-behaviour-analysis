import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';
import { subMonths, format } from 'date-fns';

const DiseaseBarChart = ({ cowId, date }) => {
  const [monthlyConditions, setMonthlyConditions] = useState(null); // Store the monthly conditions data
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error handling

  // Utility function to filter the last 12 months of data based on the given date
  const filterLast12Months = (data, date) => {
    const last12Months = Array.from({ length: 12 }, (_, i) => format(subMonths(new Date(date), i), 'yyyy-MM'));
    return Object.entries(data)
      .filter(([month]) => last12Months.includes(month))
      .map(([month, values]) => ({
        name: month, // Use the month as the label
        eating_less_than_5: values.eating_less_than_5,
        eating_more_than_6: values.eating_more_than_6,
        lying_less_than_8: values.lying_less_than_8,
        lying_more_than_12: values.lying_more_than_12,
        standing_less_than_4: values.standing_less_than_4,
        standing_more_than_8: values.standing_more_than_8
      }));
  };

  useEffect(() => {
    const fetchMonthlyConditions = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://127.0.0.1:5000/cow_all_data/${cowId}`);
        const conditions = response.data.monthly_conditions;

        // Filter the data to include only the last 12 months based on the given date
        const filteredData = filterLast12Months(conditions, date);

        setMonthlyConditions(filteredData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchMonthlyConditions();
  }, [cowId, date]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="bg-gray-800 p-4 h-96 w-2/4 rounded-lg">
      <ResponsiveContainer>
        <BarChart
          data={monthlyConditions}
          margin={{ top: 20, right: 30, bottom: 5, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis
            dataKey="name"
            tick={{ fill: 'white' }}
            tickLine={{ stroke: '#444' }}
          />
          <YAxis
            tick={{ fill: 'white' }}
            tickLine={{ stroke: '#444' }}
            axisLine={{ stroke: '#444' }}
          />
          <Tooltip contentStyle={{ backgroundColor: '#333', color: 'white' }} />
          <Legend wrapperStyle={{ color: 'white' }} />

          {/* Stack the bars with the condition data */}
          <Bar dataKey="eating_less_than_5" stackId="a" fill="#FFB6C1" name="Eating < 5h" />
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
