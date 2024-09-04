import React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

const ProgressBar = ({ current, total, color }) => {
  const percentage = (current / total) * 100;

  const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
    height: 10,
    borderRadius: 5,
    [`&.${linearProgressClasses.colorPrimary}`]: {
      backgroundColor: theme.palette.grey[300],
      ...(theme.palette.mode === 'dark' && {
        backgroundColor: theme.palette.grey[800],
      }),
    },
    [`& .${linearProgressClasses.bar}`]: {
      borderRadius: 5,
      backgroundColor: color || '#1a90ff', // Use the color prop or default color
    },
  }));

  return (
    <Box sx={{ flexGrow: 1, width: 400 }}>
    <h2>{`${current} / ${total}`}</h2>
      <BorderLinearProgress variant="determinate" value={percentage} />
    </Box>
  );
};

export default ProgressBar;
