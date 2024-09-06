import React, { useState, useEffect } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';

const HealthMonitoring = ({ data }) => {
  const [cattleHealth, setCattleHealth] = useState([]);

  useEffect(() => {
    const healthData = analyzeHealth(data);
    setCattleHealth(healthData);
  }, [data]);

  const analyzeHealth = (data) => {
    const healthSummary = {};

    data.forEach((entry) => {
      const { CattleID, BehaviorType, StartTime, EndTime } = entry;
      if (!healthSummary[CattleID]) {
        healthSummary[CattleID] = { CattleID, healthStatus: 'good', behaviorCount: 0, lyingDownDuration: 0 };
      }

      if (BehaviorType === 'Lying Down') {
        healthSummary[CattleID].behaviorCount++;
        const duration = new Date(EndTime) - new Date(StartTime);
        healthSummary[CattleID].lyingDownDuration += duration;
      }

      if (healthSummary[CattleID].behaviorCount > 10 || healthSummary[CattleID].lyingDownDuration > 8 * 60 * 60 * 1000) {
        healthSummary[CattleID].healthStatus = 'concern';
      }
    });

    return Object.values(healthSummary);
  };

  const chartData = cattleHealth.map((cattle) => ({
    id: cattle.CattleID,
    healthStatus: cattle.healthStatus,
    lyingDownDuration: (cattle.lyingDownDuration / (60 * 60 * 1000)).toFixed(2),
  }));

  return (
    <div>
      <h2>Health Monitoring</h2>
      <div style={{ height: 400, width: '100%' }}>
        <BarChart
          dataset={chartData}
          xAxis={[
            {
              dataKey: 'id',
              label: 'Cattle ID',
              scaleType: 'band',
            },
          ]}
          yAxis={[
            {
              label: 'Lying Down Duration (hours)',
            },
          ]}
          series={[
            {
              type: 'bar',
              dataKey: 'lyingDownDuration',
              label: 'Lying Down Duration (hours)',
              color: ({ healthStatus }) => (healthStatus === 'concern' ? 'red' : 'green'), // Conditional coloring
            },
          ]}
        />
      </div>
      <table>
        <thead>
          <tr>
            <th>Cattle ID</th>
            <th>Health Status</th>
            <th>Lying Down Duration (hours)</th>
          </tr>
        </thead>
        <tbody>
          {cattleHealth.map((cattle) => (
            <tr key={cattle.CattleID}>
              <td>{cattle.CattleID}</td>
              <td style={{ color: cattle.healthStatus === 'concern' ? 'red' : 'green' }}>
                {cattle.healthStatus}
              </td>
              <td>{(cattle.lyingDownDuration / (60 * 60 * 1000)).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HealthMonitoring;
