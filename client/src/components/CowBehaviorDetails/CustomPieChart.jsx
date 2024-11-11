import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Box, Typography } from '@mui/material';

const data = [
  { name: 'Eating', value: 13 },
  { name: 'Lying', value: 20 },
  { name: 'Standing', value: 17 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28']; // Color for each segment

const CustomPieChart = ({ isLightTheme }) => {
  return (
    <Box 
      sx={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: isLightTheme ? '#f1f2f4' : '#1f2937', // Background color based on theme
        p: 3, 
        borderRadius: 2, 
      }}
    >
      <Typography 
        variant="h5" 
        component="div" 
        gutterBottom
        sx={{ color: isLightTheme ? '#000000' : '#ffffff' }} // Text color based on theme
      >
        Cattle Behavior Distribution
      </Typography>

      {/* ResponsiveContainer allows the chart to adjust to the container size */}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill={isLightTheme ? '#f5f5f5' : '#1f2937'} // Fill color based on theme
            dataKey="value"
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default CustomPieChart;
