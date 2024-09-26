import React from 'react';
import ReactApexChart from 'react-apexcharts';
import PropTypes from 'prop-types';

// Function to transform data into series format required by ApexCharts
const transformData = (data) => {
  const months = [
    { name: 'Jan', days: 31 },
    { name: 'Feb', days: 28 },
    { name: 'Mar', days: 31 },
    { name: 'Apr', days: 30 },
    { name: 'May', days: 31 },
    { name: 'Jun', days: 30 },
    { name: 'Jul', days: 31 },
    { name: 'Aug', days: 31 },
    { name: 'Sep', days: 30 },
    { name: 'Oct', days: 31 },
    { name: 'Nov', days: 30 },
    { name: 'Dec', days: 31 }
  ];

  const series = months.map(month => {
    const monthData = data.filter(entry => {
      const date = new Date(entry.date);
      return date.getMonth() === months.indexOf(month);
    });

    const seriesData = monthData.map(entry => ({
      x: new Date(entry.date).getDate(),  // Day of the month
      y: entry.value  // Value for the heatmap
    }));

    return {
      name: month.name,
      data: seriesData
    };
  });

  return series;
};

const ApexChart = ({ data }) => {
  const today = new Date();
  const currentMonth = today.getMonth(); // JavaScript months are 0-based
  const currentDay = today.getDate();

  const filteredMonths = transformData(data).filter((_, index) => index <= currentMonth).reverse();

  const options = {
    chart: {
      height: 350,
      type: 'heatmap',
      background: '#1F2937'  // Background color
    },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.5,
        radius: 0,
        useFillColorAsStroke: true,
        colorScale: {
          ranges: [
            {
              from: 0,
              to: 1,
              name: 'Low Value',
              color: '#FFFFFF'  // White for low values
            },
            {
              from:2,
              to: 3,
              name: 'Medium Value',
              color: '#A3E635'  // Green for medium values
            },
            {
              from: 4,
              to: Infinity,
              name: 'High Value',
              color: '#1E293B'  // Dark green for high values
            }
          ]
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: 1,  // Border width
      colors: ['#000000']  // Border color for each cell
    },
    xaxis: {
      type: 'category',
      title: {
        text: 'Days of the Month',
        style: {
          color: '#FFFFFF'  // Text color
        }
      },
      labels: {
        style: {
          colors: '#FFFFFF'  // Text color for labels
        }
      }
    },
    yaxis: {
      title: {
        text: 'Month',
        style: {
          color: '#FFFFFF'  // Text color
        }
      },
      labels: {
        style: {
          colors: '#FFFFFF'  // Text color for labels
        }
      }
    },
    title: {
      text: `Monthly Heatmap for diease from (Jan to ${today.toLocaleString('default', { month: 'short' })} ${currentDay})`,
      style: {
        color: '#FFFFFF'  // Text color
      }
    },
    legend: {
      labels: {
        colors: '#FFFFFF'  // Text color for legend labels
      }
    }
  };

  return (
    <div>
      <div id="chart">
        <ReactApexChart options={options} series={filteredMonths} type="heatmap" height={400} />
      </div>
    </div>
  );
};

ApexChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired
    })
  ).isRequired
};

export default ApexChart;
