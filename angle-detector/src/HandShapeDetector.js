import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import * as Hands from "@mediapipe/hands";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

const HandShapeDetector = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [shape, setShape] = useState("No shape detected");

  useEffect(() => {
    const hands = new Hands.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results) => {
      drawHands(results);
      detectShape(results.multiHandLandmarks);
    });

    const captureFrame = async () => {
      if (
        typeof webcamRef.current !== "undefined" &&
        webcamRef.current !== null &&
        webcamRef.current.video.readyState === 4
      ) {
        await hands.send({ image: webcamRef.current.video });
      }
    };

    const interval = setInterval(captureFrame, 100);
    return () => clearInterval(interval);
  }, []);

  const drawHands = (results) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    results.multiHandLandmarks.forEach((landmarks) => {
      drawConnectors(ctx, landmarks, Hands.HAND_CONNECTIONS, { color: "#00FF00", lineWidth: 2 });
      drawLandmarks(ctx, landmarks, { color: "#FF0000", lineWidth: 1 });
    });
  };

  const detectShape = (landmarksArray) => {
    if (landmarksArray.length === 2) {
      const hand1 = landmarksArray[0];
      const hand2 = landmarksArray[1];

      // Circle Detection
      if (isCircle(hand1, hand2)) {
        setShape("Circle detected");
      }
      // Triangle Detection
      else if (isTriangle(hand1, hand2)) {
        setShape("Triangle detected");
      }
      // Rectangle Detection
      else if (isRectangle(hand1, hand2)) {
        setShape("Rectangle detected");
      } else {
        setShape("No shape detected");
      }
    } else {
      setShape("No shape detected");
    }
  };

  const isCircle = (hand1, hand2) => {
    // Check if fingertips are roughly equidistant from the center (wrist)
    const wrist1 = hand1[0];
    const wrist2 = hand2[0];
    const fingertips = [hand1[8], hand1[12], hand1[16], hand1[20], hand2[8], hand2[12], hand2[16], hand2[20]];

    const avgDistance = fingertips.reduce((acc, fingertip) => acc + calculateDistance(wrist1, fingertip), 0) / fingertips.length;
    return fingertips.every(fingertip => Math.abs(calculateDistance(wrist1, fingertip) - avgDistance) / avgDistance < 0.1);
  };

  const isTriangle = (hand1, hand2) => {
    // Check if index fingers and thumbs form a triangle shape
    const indexFinger1 = hand1[8];
    const indexFinger2 = hand2[8];
    const thumb1 = hand1[4];
    const thumb2 = hand2[4];

    const distanceIndex = calculateDistance(indexFinger1, indexFinger2);
    const distanceThumbIndex1 = calculateDistance(indexFinger1, thumb1);
    const distanceThumbIndex2 = calculateDistance(indexFinger2, thumb2);

    return (
      Math.abs(distanceThumbIndex1 - distanceIndex) / distanceIndex < 0.2 &&
      Math.abs(distanceThumbIndex2 - distanceIndex) / distanceIndex < 0.2
    );
  };

  const isRectangle = (hand1, hand2) => {
    // Check if index fingers and thumbs are parallel to each other to form a rectangle
    const indexFinger1 = hand1[8];
    const indexFinger2 = hand2[8];
    const thumb1 = hand1[4];
    const thumb2 = hand2[4];

    const distanceThumbs = calculateDistance(thumb1, thumb2);
    const distanceIndexes = calculateDistance(indexFinger1, indexFinger2);

    return Math.abs(distanceThumbs - distanceIndexes) / distanceThumbs < 0.2;
  };

  const calculateDistance = (point1, point2) => {
    return Math.sqrt((point2.x - point1.x) ** 2 + (point2.y - point1.y) ** 2);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", textAlign: "center" }}>
      <h1>Hand Shape Detector</h1>
      <div style={{ position: "relative", width: "640px", height: "480px" }}>
        <Webcam ref={webcamRef} style={{ position: "absolute", width: "100%", height: "100%" }} />
        <canvas ref={canvasRef} style={{ position: "absolute", width: "100%", height: "100%" }} />
      </div>
      <div style={{ marginTop: "20px" }}>
        <h2>{shape}</h2>
      </div>
    </div>
  );
};

export default HandShapeDetector;
