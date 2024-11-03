import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import * as Hands from "@mediapipe/hands";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import axios from "axios";

const HandAngleDetector = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [angle, setAngle] = useState(null);
  const [isObtuse, setIsObtuse] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [mathEquation, setMathEquation] = useState(null);

  const OPENAI_API_KEY =
  ENTER_API_KEY_HERE;

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
      if (results.multiHandLandmarks.length === 2 && timerActive) {
        calculateAngle(results.multiHandLandmarks);
      }
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
  }, [timerActive]);

  const drawHands = (results) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    results.multiHandLandmarks.forEach((landmarks) => {
      const selectedLandmarks = [landmarks[0], landmarks[20]];
      drawConnectors(ctx, selectedLandmarks, [[0, 1]], { color: "#00FF00", lineWidth: 2 });
      drawLandmarks(ctx, selectedLandmarks, { color: "#FF0000", lineWidth: 2 });
    });
  };

  const calculateAngle = (landmarks) => {
    const hand1 = landmarks[0];
    const hand2 = landmarks[1];
    const wrist1 = hand1[0];
    const pinkyTip1 = hand1[20];
    const wrist2 = hand2[0];
    const pinkyTip2 = hand2[20];

    const angle = calculateAngleBetweenLines(wrist1, pinkyTip1, wrist2, pinkyTip2);
    setAngle(angle);
    setIsObtuse(angle > 90);
    generateMathEquation(angle, angle > 90); // Call the function to generate the equation
  };

  const calculateAngleBetweenLines = (p1, p2, p3, p4) => {
    const vector1 = { x: p2.x - p1.x, y: p2.y - p1.y };
    const vector2 = { x: p4.x - p3.x, y: p4.y - p3.y };
    const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
    const magnitude1 = Math.sqrt(vector1.x ** 2 + vector1.y ** 2);
    const magnitude2 = Math.sqrt(vector2.x ** 2 + vector2.y ** 2);
    const cosTheta = dotProduct / (magnitude1 * magnitude2);
    const angleInDegrees = Math.acos(cosTheta) * (180 / Math.PI);

    return Math.round(angleInDegrees);
  };

  const generateMathEquation = async (angle, isObtuse) => {
    const equationType = isObtuse ? "obtuse" : "acute";
    let prompt = `Generate a math equation related to a ${equationType} angle of ${angle} degrees.`;
  
    try {
      const response = await axios.post("https://api.openai.com/v1/chat/completions", {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that generates real-world math problems for students. Ensure that each problem considers the applications, underlying science, and relevant mathematics related to the given objects.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
      );
  
      console.log("API Response:", response.data); // Log the full response
  
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        console.log("hew");
        const generatedEquation = response.data.choices[0].message.content.trim();
        setMathEquation(generatedEquation);
      } else {
        console.error("No choices returned in the response.");
        setMathEquation("Failed to generate an equation.");
      }
    } catch (error) {
      console.error("Error generating equation:", error);
      setMathEquation("Error generating equation.");
    }
  };

  const startTimer = () => {
    setTimerActive(true);
    setTimeout(() => {
      setTimerActive(false);
    }, 5000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", textAlign: "center" }}>
      <h1>Hand Angle Detector</h1>
      <div style={{ position: "relative", width: "640px", height: "480px" }}>
        <Webcam ref={webcamRef} style={{ position: "absolute", width: "100%", height: "100%" }} />
        <canvas ref={canvasRef} style={{ position: "absolute", width: "100%", height: "100%" }} />
      </div>
      <div style={{ marginTop: "20px" }}>
        <button onClick={startTimer} disabled={timerActive} style={{ padding: "10px", fontSize: "16px" }}>
          {timerActive ? "Detecting..." : "Start 5-Second Angle Detection"}
        </button>
      </div>
      <div style={{ marginTop: "20px" }}>
        <h2>Detected Angle: {angle ? `${angle}°` : "N/A"}</h2>
        {angle !== null && (
          <h3>Angle is {isObtuse ? "Obtuse" : "Not Obtuse"}</h3>
        )}
        {mathEquation && <h4>Generated Math Equation: {mathEquation}</h4>}
      </div>
    </div>
  );
};

export default HandAngleDetector;
