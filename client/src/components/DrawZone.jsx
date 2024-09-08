import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const DrawZone = () => {
  const defaultPoints = [
    { x: 270, y: 270 }, // top-left
    { x: 370, y: 270 }, // top-right
    { x: 270, y: 370 }, // bottom-left
    { x: 370, y: 370 }, // bottom-right
  ];

  const [points, setPoints] = useState(defaultPoints);
  const [draggingPointIndex, setDraggingPointIndex] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const imageRef = useRef(null);
  const [refreshFlag, setRefreshFlag] = useState(0); // Add refresh flag to trigger full component reload

  // Function to fetch the image URL
  const fetchImage = () => {
    axios.get('http://127.0.0.1:5000/zone_image')
      .then(response => {
        console.log('Image URL fetched:', response.data.image_url);
        setImageUrl("http://127.0.0.1:5000" + response.data.image_url);
      })
      .catch(error => {
        console.error('There was an error fetching the image URL!', error);
        setError('Failed to fetch image URL.');
      });
  };

  useEffect(() => {
    fetchImage();
  }, [refreshFlag]); // Re-fetch image when refreshFlag changes

  useEffect(() => {
    if (imageUrl) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctxRef.current = ctx;

      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        canvas.width = 640;
        canvas.height = 640;
        ctx.drawImage(img, 0, 0, 640, 640);
        drawQuadrilateral();
      };
      imageRef.current = img;
    }
  }, [imageUrl, points]);

  const drawQuadrilateral = () => {
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.drawImage(imageRef.current, 0, 0, 640, 640);

    // Draw the quadrilateral connecting the points
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y); // Move to top-left
    ctx.lineTo(points[1].x, points[1].y); // Line to top-right
    ctx.lineTo(points[3].x, points[3].y); // Line to bottom-right
    ctx.lineTo(points[2].x, points[2].y); // Line to bottom-left
    ctx.closePath(); // Close the quadrilateral
    ctx.stroke();

    // Draw the points
    points.forEach(point => {
      ctx.fillStyle = 'blue';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const handleMouseDown = (e) => {
    const mouseX = e.nativeEvent.offsetX;
    const mouseY = e.nativeEvent.offsetY;

    // Check if the mouse is over any point
    const pointIndex = points.findIndex(point => {
      return (
        Math.abs(mouseX - point.x) < 10 &&
        Math.abs(mouseY - point.y) < 10
      );
    });

    if (pointIndex !== -1) {
      setDraggingPointIndex(pointIndex);
    }
  };

  const handleMouseMove = (e) => {
    if (draggingPointIndex === null) return;

    const mouseX = e.nativeEvent.offsetX;
    const mouseY = e.nativeEvent.offsetY;

    const newPoints = [...points];
    newPoints[draggingPointIndex] = { x: mouseX, y: mouseY };
    setPoints(newPoints);
  };

  const handleMouseUp = () => {
    setDraggingPointIndex(null);
  };

  const handleSave = async () => {
    const zone = {
      topLeft: points[0],
      topRight: points[1],
      bottomLeft: points[2],
      bottomRight: points[3],
    };

    try {
      const response = await axios.post('http://127.0.0.1:5000/coordinates', zone, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.data) {
        alert(`Zone saved: ${JSON.stringify(response.data)}`);
      } else {
        console.error('Received an empty response.');
        alert('Failed to save zone. Received an empty response.');
      }
    } catch (error) {
      console.error('Error saving zone:', error);
      alert('Error saving zone.');
    }
  };

  // Function to refresh the entire component, including the image and points
  const handleRefresh = () => {
    setPoints(defaultPoints); // Reset points
    setRefreshFlag(prev => prev + 1); // Trigger a re-fetch by changing the refresh flag
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
          className="border border-black cursor-crosshair"
          style={{ width: '640px', height: '640px' }}
        />
      )}
      <div className="mt-4">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-green-500 text-white rounded mr-4"
        >
          Save
        </button>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default DrawZone;