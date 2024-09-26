import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const DrawZone = ({ setZoneSaved }) => {
  const defaultPoints = [
    { x: 270, y: 270 },
    { x: 370, y: 270 },
    { x: 270, y: 370 },
    { x: 370, y: 370 },
  ];

  const [points, setPoints] = useState(defaultPoints);
  const [draggingPointIndex, setDraggingPointIndex] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const imageRef = useRef(null);
  const [refreshFlag, setRefreshFlag] = useState(0);

  const fetchImage = () => {
    axios.get('http://127.0.0.1:5000/zone_image')
      .then(response => {
        setImageUrl("http://127.0.0.1:5000" + response.data.image_url);
      })
      .catch(error => {
        setError('Failed to fetch image URL.');
      });
  };

  useEffect(() => {
    fetchImage();
  }, [refreshFlag]);

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

    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.lineTo(points[3].x, points[3].y);
    ctx.lineTo(points[2].x, points[2].y);
    ctx.closePath();
    ctx.stroke();

    points.forEach(point => {
      ctx.fillStyle = 'blue';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
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
        setZoneSaved(true);  // Acknowledge that the zone has been saved
      } else {
        alert('Failed to save zone.');
      }
    } catch (error) {
      alert('Error saving zone.');
    }
  };

  const handleMouseDown = (e) => {
    const mouseX = e.nativeEvent.offsetX;
    const mouseY = e.nativeEvent.offsetY;

    const pointIndex = points.findIndex(point => {
      return Math.abs(mouseX - point.x) < 10 && Math.abs(mouseY - point.y) < 10;
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

  const handleRefresh = () => {
    setPoints(defaultPoints);
    setRefreshFlag(prev => prev + 1);
  };

  return (
<div className="bg-[#1e293b] rounded-lg shadow-lg p-6 w-full h-full flex flex-col items-center justify-center">
  <h1 className="text-2xl font-bold mb-4 text-[#e2e8f0] text-center">Draw Zone on Image</h1>
  {error ? (
    <p className="text-[#38bdf8] text-sm text-center">{error}</p>
  ) : (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="border border-[#e2e8f0] cursor-crosshair rounded-lg"
      style={{ width: '640px', height: '640px' }}
    />
  )}
  <div className="mt-4 flex w-[50%] justify-center gap-4">
    <button
      onClick={handleSave}
      className="w-full py-2 text-lg font-semibold rounded-lg bg-[#38bdf8] text-[#0f172a] hover:bg-blue-400 transition duration-300 ease-in-out"
    >
      Save
    </button>
    <button
      onClick={handleRefresh}
      className="w-full py-2 text-lg font-semibold rounded-lg bg-[#38bdf8] text-[#0f172a] hover:bg-blue-400 transition duration-300 ease-in-out"
    >
      Refresh
    </button>
  </div>
</div>

  );
};

export default DrawZone;
