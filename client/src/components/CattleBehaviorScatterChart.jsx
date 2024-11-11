import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Box, Typography, Paper, createTheme, ThemeProvider } from '@mui/material';

// Sample behavior data of 10 cattle (in minutes)
const cattleData = [
  { cowNumber: 1, lying: 200, eating: 150 },
  { cowNumber: 2, lying: 100, eating: 300 },
  { cowNumber: 3, lying: 300, eating: 250 },
  { cowNumber: 4, lying: 250, eating: 400 },
  { cowNumber: 5, lying: 150, eating: 380 },
  { cowNumber: 6, lying: 220, eating: 200 },
  { cowNumber: 7, lying: 180, eating: 180 },
  { cowNumber: 8, lying: 260, eating: 350 },
  { cowNumber: 9, lying: 140, eating: 220 },
  { cowNumber: 10, lying: 270, eating: 310 },
];

// Define thresholds for high and low lying/eating times (in minutes)
const lyingThreshold = 200;
const eatingThreshold = 250;

// Function to group cattle by lying and eating times
const groupByLyingAndEating = (cow) => {
  if (cow.lying > lyingThreshold && cow.eating > eatingThreshold) {
    return 'High Lying, High Eating';
  } else if (cow.lying > lyingThreshold && cow.eating <= eatingThreshold) {
    return 'High Lying, Low Eating';
  } else if (cow.lying <= lyingThreshold && cow.eating > eatingThreshold) {
    return 'Low Lying, High Eating';
  } else {
    return 'Low Lying, Low Eating';
  }
};

// Prepare data with group assignment (convert minutes to hours)
const prepareData = () => {
  return cattleData.map((cow) => ({
    cowNumber: cow.cowNumber,
    x: (cow.lying / 60).toFixed(2), // Convert lying time to hours
    y: (cow.eating / 60).toFixed(2), // Convert eating time to hours
    group: groupByLyingAndEating(cow),
  }));
};

// Define colors for each group
const groupColors = {
  'High Lying, High Eating': '#4F81BD',
  'High Lying, Low Eating': '#C0504D',
  'Low Lying, High Eating': '#9BBB59',
  'Low Lying, Low Eating': '#8064A2',
};

// Custom tooltip to show cow number and times
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const cow = payload[0].payload;
    return (
      <div
        className="custom-tooltip"
        style={{
          backgroundColor: '#1f2937',
          padding: '5px',
          borderRadius: '5px',
          color: '#FFF',
        }}
      >
        <p>{`Cow ID: ${cow.cowNumber}`}</p>
      </div>
    );
  }
  return null;
};

// Create a dark theme and light theme using MUI
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const lightTheme = createTheme({
  palette: {
    mode: 'light',
  },
});

export default function CattleBehaviorScatterChart({ isLightTheme }) {
  const scatterData = prepareData();

  return (
    <ThemeProvider theme={isLightTheme ? lightTheme : darkTheme}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          bgcolor: 'background.default',
          p: 4,
          borderRadius: '8px',
          backgroundColor: isLightTheme ? '#f1f2f4' : '#1f2937', // Change background color based on theme
        }}
      >
        <Paper elevation={3} sx={{ width: '100%', p: 2, bgcolor: isLightTheme ? '#f1f2f4' : '#1f2937' }}>
          <Typography variant="h6" color={isLightTheme ? 'black' : 'white'} align="center" gutterBottom>
            Cattle Behavior Scatter Chart
          </Typography>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid stroke={isLightTheme ? "#ccc" : "#444"} strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                name="Lying Time"
                label={{
                  value: 'Lying Time (hours)',
                  position: 'insideBottom',
                  offset: -5,
                  fill: isLightTheme ? '#000000' : '#FFFFFF',
                }}
                stroke={isLightTheme ? '#000000' : '#FFFFFF'}
                tick={{ fill: isLightTheme ? '#000000' : '#FFFFFF' }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Eating Time"
                label={{
                  value: 'Eating Time (hours)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: isLightTheme ? '#000000' : '#FFFFFF',
                }}
                stroke={isLightTheme ? '#000000' : '#FFFFFF'}
                tick={{ fill: isLightTheme ? '#000000' : '#FFFFFF' }}
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />

              {/* Scatter points with different colors based on the group */}
              {scatterData.map((cow, index) => (
                <Scatter
                  key={index}
                  name={cow.group}
                  data={[cow]}
                  fill={groupColors[cow.group]}
                  shape="circle"
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
