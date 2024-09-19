import React from 'react';
import { DataGridPro } from '@mui/x-data-grid-pro';
import { Box, createTheme, ThemeProvider } from '@mui/material';

// Create a dark theme
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});

const CowDataGrid = () => {
    const columns = [
        { field: 'id', headerName: 'Cow ID', flex: 1 },
        { field: 'standing', headerName: 'Standing', flex: 1 },
        { field: 'eating', headerName: 'Eating', flex: 1 },
        { field: 'lying', headerName: 'Lying', flex: 1 },
        { field: 'notRecognized', headerName: 'Not Recognized', flex: 1 },
    ];

    const rows = [
        { id: 1, standing: 5, eating: 3, lying: 2, notRecognized: 1 },
        { id: 2, standing: 4, eating: 2, lying: 3, notRecognized: 0 },
        // Add more rows as needed
    ];

    return (
        <ThemeProvider theme={darkTheme}>
            <Box sx={{ height: 300, width: '100%' }}>
                <DataGridPro
                    rows={rows}
                    columns={columns}
                    pageSize={5}
                    rowsPerPageOptions={[5]}
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
            </Box>
        </ThemeProvider>
    );
};

export default CowDataGrid;
