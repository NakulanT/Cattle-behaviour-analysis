import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const DrawZone = () => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [drawnZone, setDrawnZone] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    axios.get('http://127.0.0.1:5000/zone_image')
      .then(response => {
        console.log('Image URL fetched:', response.data.image_url);
        setImageUrl("http://127.0.0.1:5000" + response.data.image_url);
      })
      .catch(error => {
        console.error('There was an error fetching the image URL!', error);
        setError('Failed to fetch image URL.');
      });
  }, []);

  useEffect(() => {
    if (imageUrl) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctxRef.current = ctx;

      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        // Set canvas size to 640x640
        canvas.width = 640;
        canvas.height = 640;
        // Draw the image scaled to 640x640
        ctx.drawImage(img, 0, 0, 640, 640);
      };
      imageRef.current = img;
    }
  }, [imageUrl]);

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    setStartX(e.nativeEvent.offsetX);
    setStartY(e.nativeEvent.offsetY);
    ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctxRef.current.drawImage(imageRef.current, 0, 0, 640, 640);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;

    const currentX = e.nativeEvent.offsetX;
    const currentY = e.nativeEvent.offsetY;
    const width = currentX - startX;
    const height = currentY - startY;

    ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctxRef.current.drawImage(imageRef.current, 0, 0, 640, 640);
    ctxRef.current.strokeStyle = 'red';
    ctxRef.current.lineWidth = 2;
    ctxRef.current.strokeRect(startX, startY, width, height);
  };

  const finalizeBox = (e) => {
    const endX = e.nativeEvent.offsetX;
    const endY = e.nativeEvent.offsetY;
    const width = endX - startX;
    const height = endY - startY;
    const zone = { startX, startY, width, height };

    setDrawnZone(zone);
    setCoordinates(`Zone Coordinates: Start (${startX}, ${startY}), Width: ${width}, Height: ${height}`);
    setIsDrawing(false);
  };

  const handleMouseUp = (e) => {
    finalizeBox(e);
  };

  const handleMouseLeave = (e) => {
    if (isDrawing) {
      finalizeBox(e); // Finalize the box even if the mouse leaves the canvas
    }
  };

  const handleRedraw = () => {
    ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctxRef.current.drawImage(imageRef.current, 0, 0, 640, 640);
    setCoordinates(null);
    setDrawnZone(null);
  };

  const handleSave = async () => {
    if (drawnZone) {
      try {
        const response = await axios.post('http://127.0.0.1:5000/coordinates', drawnZone, {
          headers: { 'Content-Type': 'application/json' },
        });
  
        if (response.data) {
          alert(`Zone saved: ${JSON.stringify(response.data)}`);
        } else {
          console.error('Received an empty response.');
          alert('Failed to save zone. Received an empty response.');
        }
      } catch (error) {
        if (error.response) {
          console.error('Error response from server:', error.response.status, error.response.data);
          alert(`Failed to save zone. Server responded with status ${error.response.status}.`);
        } else if (error.request) {
          console.error('No response received:', error.request);
          alert('Failed to save zone. No response from server.');
        } else {
          console.error('Error while setting up request:', error.message);
          alert('Error saving zone.');
        }
      }
    }
  };

  const handleRefresh = () => {
    setDrawnZone(null);
    setCoordinates(null);
    axios.get('http://127.0.0.1:5000/zone_image')
      .then(response => {
        setImageUrl("http://127.0.0.1:5000" + response.data.image_url);
      })
      .catch(error => {
        setError('Failed to fetch image URL.');
      });
  };

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold my-4">Draw Zone on Image</h1>
      {error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className="border border-black cursor-crosshair"
          style={{ width: '640px', height: '640px' }}  // Ensure canvas size is always 640x640
        />
      )}
      <p className="mt-4">{coordinates}</p>

      <div className="mt-4">
        <button
          onClick={handleSave}
          className={`px-4 py-2 bg-green-500 text-white rounded ${!drawnZone ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!drawnZone}
        >
          Save
        </button>
        <button
          onClick={handleRedraw}
          className="px-4 py-2 bg-blue-500 text-white rounded ml-4"
        >
          Redraw
        </button>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-gray-500 text-white rounded ml-4"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default DrawZone;
