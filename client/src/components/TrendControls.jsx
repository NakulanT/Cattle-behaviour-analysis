import React, { useState } from 'react';
import { Grid, TextField, MenuItem } from '@mui/material'; // Ensure TextField is imported here
import { Calendar, Alert } from 'antd';
import dayjs from 'dayjs';

const TrendControls = ({ trendType, setTrendType, date, setDate }) => {
  const [selectedValue, setSelectedValue] = useState(dayjs(date));

  const onSelect = (newValue) => {
    setSelectedValue(newValue);
    setDate(newValue.format('YYYY-MM-DD'));
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          select
          label="Trend Type"
          value={trendType}
          onChange={(e) => setTrendType(e.target.value)}
          fullWidth
        >
          <MenuItem value="daily">Daily</MenuItem>
          <MenuItem value="weekly">Weekly</MenuItem>
          <MenuItem value="monthly">Monthly</MenuItem>
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Alert message={`You selected date: ${selectedValue.format('YYYY-MM-DD')}`} />
        <Calendar value={selectedValue} onSelect={onSelect} />
      </Grid>
    </Grid>
  );
};

export default TrendControls;
