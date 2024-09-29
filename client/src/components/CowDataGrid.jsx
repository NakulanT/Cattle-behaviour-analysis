import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid'; // Updated import
import { Box, createTheme, ThemeProvider } from '@mui/material';
import axios from 'axios';

// Create a dark theme
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});

const CowDataGrid = ({ date }) => {
    const [cowBehaviorData, setCowBehaviorData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Define columns for the data grid
    const columns = [
        { field: 'id', headerName: 'Cow ID', flex: 1 },
        { field: 'standing', headerName: 'Standing (min)', flex: 1 },
        { field: 'eating', headerName: 'Eating (min)', flex: 1 },
        { field: 'lying', headerName: 'Lying (min)', flex: 1 },
        { field: 'notRecognized', headerName: 'Not Recognized (min)', flex: 1 },
    ];

    // Fetch data based on the selected date
    useEffect(() => {
        const fetchCowBehaviorData = async () => {
            if (date) {
                setLoading(true);
                try {
                    const apiUrl = `http://localhost:5000/get_cattle_behavior?date=${date}`;
                    console.log(apiUrl);
                    
                    const response = await axios.get(apiUrl);

                    if (response.data.error) {
                        setError(response.data.error);
                        setCowBehaviorData([]);
                    } else {
                        console.log(response.data);
                        
                        // Map the response data to match the grid rows format
                        const mappedData = response.data.map((item) => ({
                            id: item['Cow ID'], // Assuming the cow ID is the primary key
                            standing: item['Standing Time (min)'],
                            eating: item['Eating Time (min)'],
                            lying: item['Lying Time (min)'],
                            notRecognized: item['Not Recognized Time (min)'],
                        }));
                        setCowBehaviorData(mappedData);
                        setError(null);
                    }
                } catch (err) {
                    setError('Unable to fetch data. Please try again later.');
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchCowBehaviorData();
    }, [date]);

    return (
        <div className="container  bg-gray-800 text-gray-100 rounded-lg shadow-lg">
            <div className="text-2xl mx-auto font-bold mb-6 flex items-center gap-3">
                <h1>Cattle Behavior Data</h1>
            </div>
            <ThemeProvider theme={darkTheme}>
                <Box sx={{ height: 400, width: '100%' }}>
                    {error ? (
                        <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>
                    ) : (
                        <DataGrid // Changed to DataGrid
                            rows={cowBehaviorData}
                            columns={columns}
                            pageSize={5}
                            rowsPerPageOptions={[5]}
                            loading={loading}
                            sx={{
                                '& .MuiDataGrid-cell': {
                                    color: 'white', // Text color for cells
                                },
                                '& .MuiDataGrid-columnHeader': {
                                    backgroundColor: '#374151', // Header background color
                                    color: 'white', // Header text color
                                },
                                '& .MuiDataGrid-footerContainer': {
                                    backgroundColor: '#374151', // Footer background color
                                },
                            }}
                        />
                    )}
                </Box>
            </ThemeProvider>
        </div>
    );
};

export default CowDataGrid;
