// src/components/TrendControls.js
import React from 'react';
import { Grid, TextField, MenuItem } from '@mui/material';

const TrendControls = ({ trendType, setTrendType, date, setDate }) => {
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
        <TextField
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          fullWidth
          InputLabelProps={{
            shrink: true,
          }}
        />
      </Grid>
    </Grid>
  );
};

export default TrendControls;
