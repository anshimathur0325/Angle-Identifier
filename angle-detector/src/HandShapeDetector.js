import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import * as Hands from "@mediapipe/hands";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import styles from './HandShapeDetector.module.css'; // Import custom CSS module
import axios from "axios";

const HandShapeDetector = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const OPENAI_API_KEY = "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";
  const [shape, setShape] = useState("No shape detected");
  const [finalShape, setFinalShape] = useState(""); // State to lock in the final shape
  const [mathQuestion, setMathQuestion] = useState(null); // New state for math question
  const [userAnswer, setUserAnswer] = useState(""); // New state for user answer
  const [answerFeedback, setAnswerFeedback] = useState(null); // New state for answer feedback
  const [timerActive, setTimerActive] = useState(false); // State for timer
  const [timeLeft, setTimeLeft] = useState(5); // Timer duration
  const [shapeDetected, setShapeDetected] = useState(false); // New state to track shape detection
  const [problemStatement, setProblemStatement] = useState(null); // New state for problem statement

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
      if (isCircle(hand1)) {
        setShape("Circle detected");
        setShapeDetected(true);
        setFinalShape("Circle"); // Lock in the final shape immediately
      }
      // Triangle Detection
      else if (isTriangle(hand1, hand2)) {
        setShape("Triangle detected");
        setShapeDetected(true);
        setFinalShape("Triangle"); // Lock in the final shape immediately
      }
      // Rectangle Detection
      else if (isRectangle(hand1, hand2)) {
        setShape("Rectangle detected");
        setShapeDetected(true);
        setFinalShape("Rectangle"); // Lock in the final shape immediately
      } else {
        setShape("No shape detected");
        setShapeDetected(false);
      }
    } else {
      setShape("No shape detected");
      setShapeDetected(false);
    }
  };

  const generateMathQuestion = async (shape) => {
    console.log("hewiaof");
    let prompt = `Generate a geometric math question related to a ${shape}. 
    Provide:
    Problem: [Problem statement]
    Answer: [Numeric Answer]
    Solution: [Solution explanation]
    Format your response exactly as above, without additional text.`;

    try {
      const response = await axios.post("https://api.openai.com/v1/chat/completions", {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates math problems based on geometric shapes.",
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
      });

      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const generatedQuestion = response.data.choices[0].message.content.trim();
        setMathQuestion(generatedQuestion);
        const problemMatch = generatedQuestion.match(/Problem:\s*(.*)/);
        const problem = problemMatch ? problemMatch[1].trim() : "Problem not found.";
        setProblemStatement(problem);

      } else {
        setMathQuestion("Failed to generate a question.");
        setProblemStatement("Failed to generate a question.");

      }
    } catch (error) {
      console.error("Error generating question:", error);
      setMathQuestion("Error generating question.");
    }
  };

  const checkAnswer = () => {
    const correctAnswerMatch = mathQuestion && mathQuestion.match(/Answer:\s*(\d+)/);
    const correctAnswer = correctAnswerMatch ? parseInt(correctAnswerMatch[1], 10) : null;

    if (correctAnswer !== null) {
      if (parseInt(userAnswer, 10) === correctAnswer) {
        setAnswerFeedback("Correct!");
      } else {
        setAnswerFeedback(`Incorrect. The correct answer is ${correctAnswer}.`);
      }
    } else {
      setAnswerFeedback("Unable to check the answer.");
    }
  };

  const isCircle = (hand) => {
    const wrist = hand[0];
    const fingertips = [hand[8], hand[12], hand[16], hand[20]]; // Only consider one hand for circle

    const distances = fingertips.map(fingertip => calculateDistance(wrist, fingertip));
    const avgDistance = distances.reduce((acc, d) => acc + d, 0) / distances.length;

    return distances.every(distance => Math.abs(distance - avgDistance) / avgDistance < 0.2); // Tolerance level
  };

  const isTriangle = (hand1, hand2) => {
    const indexFinger1 = hand1[8];
    const indexFinger2 = hand2[8];
    const thumb1 = hand1[4];
    const thumb2 = hand2[4];

    const distanceIndex = calculateDistance(indexFinger1, indexFinger2);
    const distanceThumbIndex1 = calculateDistance(indexFinger1, thumb1);
    const distanceThumbIndex2 = calculateDistance(indexFinger2, thumb2);

    // Check if distances form a triangle using the triangle inequality theorem
    const isTriangle = 
      distanceIndex < (distanceThumbIndex1 + distanceThumbIndex2) &&
      distanceThumbIndex1 < (distanceIndex + distanceThumbIndex2) &&
      distanceThumbIndex2 < (distanceIndex + distanceThumbIndex1);

    return isTriangle;
  };

  const isRectangle = (hand1, hand2) => {
    const indexFinger1 = hand1[8];
    const indexFinger2 = hand2[8];
    const thumb1 = hand1[4];
    const thumb2 = hand2[4];

    const distanceThumbs = calculateDistance(thumb1, thumb2);
    const distanceIndexes = calculateDistance(indexFinger1, indexFinger2);

    // Check if thumb and index distances are roughly equal (parallel sides)
    const isParallel = Math.abs(distanceThumbs - distanceIndexes) / distanceThumbs < 0.2; // Tolerance level

    return isParallel;
  };

  const calculateDistance = (point1, point2) => {
    return Math.sqrt((point2.x - point1.x) ** 2 + (point2.y - point1.y) ** 2);
  };

  const startTimer = () => {
    setTimerActive(true);
    setTimeLeft(5); // Reset timer
    // Do not reset finalShape here to retain its value

    const countdown = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          setTimerActive(false);
          return 5; // Reset for the next time
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className={styles.container}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&display=swap" rel="stylesheet" />

      <h1 className={styles.title}>Hand Shape Detector</h1>
      <div className={styles.webcamContainer}>
        <Webcam
          ref={webcamRef}
          style={{ width: "100%", height: "auto" }}
          mirrored={true}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "auto",
          }}
        />
      </div>
      <div className={styles.infoContainer}>
        <div className={styles.info} >
        <button onClick={startTimer} className={styles.button}>Start Detection</button>

        <p >Shape Detected: {finalShape}</p>
        <p>Time Left: {timerActive ? timeLeft : "Stopped"}</p>
       
        <button className={styles.button} 
          onClick={() => {
              generateMathQuestion(finalShape); // Use final shape for the question
            
          }} 
          disabled={!finalShape }
        >
          Generate Math Question
        </button>
        <div className={styles.equationSection}>
        <h4>Generated Math Equation:</h4>
        <div className={styles.equationText}></div>
        {problemStatement && <p>Math Question: {problemStatement}</p>}
        <div className={styles.answerInput}>
        <input
                type="text"
                placeholder="Enter your answer"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className={styles.input}
              />
        <button onClick={checkAnswer} className={styles.button}>Check Answer</button>
        </div>

        {answerFeedback && <p>{answerFeedback}</p>}
        </div>
        </div>
      </div>
    </div>
  );
};

export default HandShapeDetector;
