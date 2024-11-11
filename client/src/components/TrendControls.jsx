import React, { useState } from 'react';
import { Grid, TextField, MenuItem } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
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

// Custom light theme for MUI
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      paper: '#ffffff', // Light background for the card
      default: '#f5f5f5', // Lighter background for the entire page
    },
    text: {
      primary: '#000000', // Dark text
    },
    info: {
      main: '#1976d2', // Default primary color
    },
  },
});

const TrendControls = ({ trendType, setTrendType, date, setDate, isLightTheme }) => {
  const [selectedValue, setSelectedValue] = useState(dayjs(date));
  const [trend, setTrend] = useState(trendType);


  
  const onSelectDate = (newValue) => {
    setSelectedValue(newValue);
    setDate(newValue.format('YYYY-MM-DD'));
  };

  const onSelectTrend = (event) => {
    const newTrend = event.target.value;
    setTrend(newTrend);
    setTrendType(newTrend); // Update the parent component's trendType
  };

  return (
    <ThemeProvider theme={isLightTheme ? lightTheme : darkTheme}>
      <div className="p-4  flex" style={{ backgroundColor: 'background.paper' }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={2} alignItems="center">
            {/* Date Picker */}
            <Grid item>
              <div className="p-2 rounded-lg">
                <DatePicker
                  label="Select Date"
                  value={selectedValue}
                  onChange={onSelectDate}
                  renderInput={(params) => <TextField {...params} variant="outlined" />}
                />
              </div>
            </Grid>

            {/* Trend Type Dropdown */}
            <Grid item>
              <TextField
                label="Trend Type"
                select
                value={trend}
                onChange={onSelectTrend}
                variant="outlined"
                sx={{ width: '250px' }}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </div>
    </ThemeProvider>
  );
};

export default TrendControls;
