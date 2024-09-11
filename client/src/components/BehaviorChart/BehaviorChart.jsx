import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import {
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material';

// Helper function to parse the API response for chart rendering
const parseTrendsData = (data) => {
  return Object.keys(data).map((cowID) => ({
    name: cowID,
    'Lying Time': data[cowID]['Lying Time (min)'],
    'Standing Time': data[cowID]['Standing Time (min)'],
    'Eating Time': data[cowID]['Eating Time (min)']
  }));
};

const BehaviorChart = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendType, setTrendType] = useState('daily');
  const [date, setDate] = useState('2022-09-07'); // Default date

  useEffect(() => {
    const fetchTrends = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/behavior/trends', {
          params: { trend_type: trendType, date }
        });
        const parsedData = parseTrendsData(response.data.trends);
        setChartData(parsedData);
      } catch (error) {
        console.error('Error fetching behavior trends:', error);
      }
      setLoading(false);
    };

    fetchTrends();
  }, [trendType, date]);

  return (
    <Box sx={{ width: '100%', padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Behavior Trends
      </Typography>

      {/* Form Controls for selecting trend type and date */}
      <Box sx={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        {/* Trend Type Dropdown */}
        <FormControl fullWidth>
          <InputLabel id="trend-type-label">Trend Type</InputLabel>
          <Select
            labelId="trend-type-label"
            value={trendType}
            label="Trend Type"
            onChange={(e) => setTrendType(e.target.value)}
          >
            <MenuItem value="daily">Daily</MenuItem>
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
          </Select>
        </FormControl>

        {/* Date Picker */}
        <TextField
          label="Select Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          InputLabelProps={{
            shrink: true,
          }}
          fullWidth
        />
      </Box>

      {/* Bar Chart or Loading Spinner */}
      <Box sx={{ width: '100%', height: 400 }}>
        {loading ? (
          <CircularProgress />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {/* Remove Temperature Bar */}
            <Bar dataKey="Lying Time" fill="#8884d8" />
            <Bar dataKey="Standing Time" fill="#82ca9d" />
            <Bar dataKey="Eating Time" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
        
        )}
      </Box>
    </Box>
  );
};

export default BehaviorChart;
