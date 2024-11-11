import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid'; // Updated import
import { Box, createTheme, ThemeProvider, Typography } from '@mui/material';
import axios from 'axios';

// Create themes
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});

const lightTheme = createTheme({
    palette: {
        mode: 'light',
    },
});

const CowDataGrid = ({ date, isLightTheme }) => {
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
        { field: 'Camera Field', headerName: 'Camera Field', flex: 1 } 
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
                            'Camera Field': item['Camera Field'] // Use quotes since there's a space in the key
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
        <div className={`container ${isLightTheme ? 'bg-gray-200' : 'bg-gray-900'} text-gray-100 `}>
            <Typography 
                variant="h5" 
                component="div" 
                gutterBottom
                sx={{ color: isLightTheme ? '#000000' : '#ffffff', textAlign: 'center', margin: '0' }}
            >
                <h2 className={isLightTheme ? 'bg-gray-200 p-4' : 'bg-gray-800 p-4 ' } >

                    Cattle Behavior Data
                </h2>
            </Typography>
            <ThemeProvider theme={isLightTheme ? lightTheme : darkTheme}>
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
                                    color: isLightTheme ? '#000' : 'white', // Text color for cells based on theme
                                },
                                '& .MuiDataGrid-columnHeader': {
                                    backgroundColor: isLightTheme ? '#e0e0e0' : '#324773', // Header background color based on theme
                                    color: isLightTheme ? '#000' : 'white', // Header text color based on theme
                                },
                                '& .MuiDataGrid-footerContainer': {
                                    backgroundColor: isLightTheme ? '#e0e0e0' : '#324773', // Footer background color based on theme
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
