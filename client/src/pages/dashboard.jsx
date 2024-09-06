import React, { useState, useEffect } from 'react';
import AnalysisSummaryCard from '../components/AnalysisSummaryCard';

import axios from 'axios';

const Dashboard = () => {
    const [selectedCattle, setSelectedCattle] = useState('');
    const [cattleColumns, setCattleColumns] = useState([]);
    const [analysisResults, setAnalysisResults] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        axios.get('http://127.0.0.1:5000/get_csv_data')
            .then(response => {
                setCattleColumns(response.data.cattle_columns);
            })
            .catch(error => {
                console.error("There was an error fetching the cattle columns!", error);
                setError("Failed to fetch cattle columns.");
            });
    }, []);

    const handleAnalyze = () => {
        axios.post('http://127.0.0.1:5000/analyze_cattle', { cattle: selectedCattle })
            .then(response => {
                setAnalysisResults(response.data);
                setError('');
            })
            .catch(error => {
                console.error("There was an error analyzing the cattle!", error);
                setError("Failed to analyze the selected cattle.");
            });
    };

    return (
        <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Cattle Behavior Analysis Dashboard</h2>

            <div className="mb-4">
                <label htmlFor="cattleSelect" className="block text-lg font-medium text-gray-700 mb-2">Select Cattle:</label>
                <select 
                    id="cattleSelect"
                    value={selectedCattle} 
                    onChange={(e) =>{ 
                        setSelectedCattle(e.target.value);
                        handleAnalyze();
                    }}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">Select a cattle</option>
                    {cattleColumns.map(cattle => (
                        <option key={cattle} value={cattle}>{cattle}</option>
                    ))}
                </select>
           
            </div>

            {error && <p className="text-red-500">{error}</p>}

            {analysisResults && (
                <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-4">Analysis Results for {selectedCattle}</h3>
                    {/* <p className="mb-2">Average Eating Time (Previous Days): <span className="font-medium">{analysisResults.avg_eating_previous} hours</span></p>
                    <p className="mb-2">Average Lying Down Time (Previous Days): <span className="font-medium">{analysisResults.avg_lying_previous} hours</span></p>
                    <p className="mb-2">Eating Time (Today): <span className="font-medium">{analysisResults.eating_today} hours</span></p>
                    <p className="mb-4">Lying Down Time (Today): <span className="font-medium">{analysisResults.lying_today} hours</span></p> */}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <AnalysisSummaryCard title="Average Eating Time (Previous Days)" value={parseFloat(analysisResults.avg_eating_previous).toFixed(2)} unit="hours" />
                        <AnalysisSummaryCard title="Average Lying Down Time (Previous Days)" value={parseFloat(analysisResults.avg_lying_previous).toFixed(2)} unit="hours" />
                        <AnalysisSummaryCard title="Eating Time (Today)" value={analysisResults.eating_today} unit="hours" />
                        <AnalysisSummaryCard title="Lying Down Time (Today)" value={analysisResults.lying_today} unit="hours" />
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Comparison Charts</h3>
                        <div className="space-y-2">
                            <h4 className="text-md font-medium">Eating</h4>
                            <img 
                                src={`http://127.0.0.1:5000${analysisResults.comparison_chart_eating}`} 
                                alt="Comparison Chart Eating" 
                                className="w-full h-auto"
                            />
                            <h4 className="text-md font-medium">Lying</h4>
                            <img 
                                src={`http://127.0.0.1:5000${analysisResults.comparison_chart_lying}`} 
                                alt="Comparison Chart Lying" 
                                className="w-full h-auto"
                            />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-md font-medium">Pie Chart</h4>
                            <img 
                                src={`http://127.0.0.1:5000${analysisResults.pie_chart}`} 
                                alt="Pie Chart" 
                                className="w-full h-auto"
                            />
                            <h4 className="text-md font-medium">Behavior Analysis Over Days</h4>
                            <img 
                                src={`http://127.0.0.1:5000${analysisResults.time_series}`} 
                                alt="Behavior Analysis Over Days" 
                                className="w-full h-auto"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;