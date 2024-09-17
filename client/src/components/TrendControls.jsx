import React, { useState } from 'react';
import { Grid, TextField, MenuItem, Alert } from '@mui/material'; // Import MUI's Alert component
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import dayjs from 'dayjs';

// Custom dark theme for MUI
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      paper: '#1e293b', // Custom dark background for the card
      default: '#0f172a', // Darker background for the entire page
    },
    text: {
      primary: '#e2e8f0', // Light text
    },
    info: {
      main: '#38bdf8', // Cyan color for info alerts
    },
  },
});

const TrendControls = ({ trendType, setTrendType, date, setDate }) => {
  const [selectedValue, setSelectedValue] = useState(dayjs(date));

  const onSelect = (newValue) => {
    setSelectedValue(newValue);
    setDate(newValue.format('YYYY-MM-DD'));
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg transition-all duration-500 ease-in-out transform hover:scale-105">
        <TextField
          select
          label="Trend Type"
          value={trendType}
          onChange={(e) => setTrendType(e.target.value)}
          fullWidth
          variant="filled"
          className="mb-4"
          InputLabelProps={{ className: 'text-gray-300' }}
          sx={{
            '& .MuiFilledInput-root': {
              backgroundColor: '#1e293b',
            },
          }}
        >
          <MenuItem value="daily">Daily</MenuItem>
          <MenuItem value="weekly">Weekly</MenuItem>
          <MenuItem value="monthly">Monthly</MenuItem>
        </TextField>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Alert severity="info" style={{ marginBottom: '10px' }}>
            You selected date: {selectedValue.format('YYYY-MM-DD')}
          </Alert>
          <div className="bg-gray-700 p-2 rounded-lg">
            <DateCalendar value={selectedValue} onChange={onSelect} />
          </div>
        </LocalizationProvider>
      </div>
    </ThemeProvider>
  );
};

export default TrendControls;
