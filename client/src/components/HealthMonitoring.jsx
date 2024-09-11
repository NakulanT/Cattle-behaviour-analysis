import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography } from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector
} from 'recharts';

const HealthMonitoring = ({ trendType, date }) => {
  const [healthIssues, setHealthIssues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0); // For pie chart hover effect

  // Fetch health issues from API
  const fetchHealthIssues = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/behavior/health', {
        params: { trend_type: trendType, date },
      });
      setHealthIssues(response.data.health_issues);
    } catch (error) {
      setError('Error fetching health data.');
      console.error('Error fetching health data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthIssues();
  }, [trendType, date]);

  // Prepare the data for the LineChart visualization
  const formatHealthDataForChart = () => {
    if (!healthIssues) return [];
    return Object.entries(healthIssues).map(([cowId, issues]) => ({
      cowId,
      issuesCount: issues.length
    }));
  };

  // Prepare data for PieChart visualization
  const formatPieChartData = () => {
    if (!healthIssues) return [];
    const cowsWithIssues = Object.entries(healthIssues).filter(([, issues]) => issues.length > 0).length;
    const totalCows = Object.entries(healthIssues).length;
    return [
      { name: 'Cows with Issues', value: cowsWithIssues },
      { name: 'Healthy Cows', value: totalCows - cowsWithIssues },
    ];
  };

  const chartData = formatHealthDataForChart();
  const pieChartData = formatPieChartData();

  const COLORS = ['#FF8042', '#0088FE'];

  // Custom Active Shape for PieChart
  const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 12 : -12)} y={ey} textAnchor={textAnchor} fill="#333">{`${value} Cows`}</text>
        <text x={ex + (cos >= 0 ? 12 : -12)} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
          {`(${(percent * 100).toFixed(2)}%)`}
        </text>
      </g>
    );
  };

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box mt={4}>
      <Typography variant="h6">Health Monitoring - Cow Issues</Typography>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData}
            margin={{
              top: 5, right: 30, left: 20, bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="cowId" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="issuesCount" stroke="#8884d8" name="Number of Issues" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <Typography>No health issues detected for the selected period.</Typography>
      )}

      <Box mt={4}>
        <Typography variant="h6">Cows with and without Health Issues</Typography>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={pieChartData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
              onMouseEnter={onPieEnter}
              isAnimationActive={true} // Enable smooth animation
            >
              {pieChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default HealthMonitoring;
