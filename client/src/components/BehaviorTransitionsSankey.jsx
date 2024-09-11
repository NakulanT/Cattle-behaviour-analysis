import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography } from '@mui/material';
import { Sankey, Tooltip } from 'recharts';

// Function to format the transition data for the Sankey diagram
const formatSankeyData = (transitions) => {
  const nodes = [];
  const links = [];

  const behaviorSet = new Set();

  // Collect all behavior types
  Object.keys(transitions).forEach((cowId) => {
    Object.keys(transitions[cowId]).forEach((behavior) => {
      behaviorSet.add(behavior);
      Object.keys(transitions[cowId][behavior]).forEach((nextBehavior) => {
        behaviorSet.add(nextBehavior);
      });
    });
  });

  // Create nodes
  behaviorSet.forEach((behavior, index) => {
    nodes.push({ name: behavior });
  });

  // Create links
  Object.keys(transitions).forEach((cowId) => {
    Object.keys(transitions[cowId]).forEach((behavior) => {
      Object.keys(transitions[cowId][behavior]).forEach((nextBehavior) => {
        const count = transitions[cowId][behavior][nextBehavior];
        if (count > 0) {
          links.push({
            source: behavior,
            target: nextBehavior,
            value: count,
          });
        }
      });
    });
  });

  return { nodes, links };
};

const BehaviorTransitionsSankey = ({ trendType, date }) => {
  const [transitions, setTransitions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch the transitions data from the API
  const fetchTransitions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/behavior/transitions', {
        params: { trend_type: trendType, date },
      });
      setTransitions(response.data);
    } catch (error) {
      setError('Error fetching transitions data.');
      console.error('Error fetching transitions data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransitions();
  }, [trendType, date]);

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  // Format the data for the Sankey diagram
  const sankeyData = formatSankeyData(transitions);

  return (
    <Box mt={4}>
      <Typography variant="h6">Behavior Transitions Sankey Diagram</Typography>
      <Sankey
        width={600}
        height={400}
        data={sankeyData}
        nodePadding={10}
        link={{ stroke: '#77c', strokeWidth: 2 }}
      >
        <Tooltip />
      </Sankey>
    </Box>
  );
};

export default BehaviorTransitionsSankey;
