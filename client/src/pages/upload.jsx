import React, { useState } from 'react';
import axios from 'axios';

const Upload = () => {
    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleFileSubmit = async () => {
        if (!file) {
            alert('Please upload a file first.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('http://127.0.0.1:5000/process', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setResult(response.data);
        } catch (error) {
            console.error('Error uploading the file:', error);
        }
    };

    return (
        <div className="p-6 max-w-lg mx-auto bg-white rounded-lg shadow-md">
            <label htmlFor="fileUpload" className="block text-lg font-semibold mb-2 text-blue-500 cursor-pointer">
                Upload File
            </label>
            <input 
                id="fileUpload" 
                type="file" 
                onChange={handleFileChange} 
                className="hidden" 
            />

            <button 
                onClick={handleFileSubmit} 
                className="mt-4 px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600"
            >
                Submit
            </button>

            {result && (
                <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-2">Results</h3>
                    <ul className="list-disc pl-5 mb-4">
                        {result.results.map((r, index) => (
                            <li key={index} className="text-gray-700">{r}</li>
                        ))}
                    </ul>
                    <h3 className="text-xl font-semibold mb-2">Processed Images</h3>
                    <img 
                        src={`http://127.0.0.1:5000${result.image_url}`} 
                        alt="Boxed Result" 
                        className="w-full h-auto mb-4"
                    />
                    <h3 className="text-xl font-semibold mb-2">Pie Chart</h3>
                    <img 
                        src={`http://127.0.0.1:5000${result.pie_chart_url}`} 
                        alt="Behavior Pie Chart" 
                        className="w-full h-auto mb-4"
                    />
                    <h3 className="text-xl font-semibold mb-2">Bar Chart</h3>
                    <img 
                        src={`http://127.0.0.1:5000${result.bar_chart_url}`} 
                        alt="Behavior Bar Chart" 
                        className="w-full h-auto"
                    />
                </div>
            )}
        </div>
    );
};

export default Upload;
