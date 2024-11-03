import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import * as Hands from "@mediapipe/hands";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import axios from "axios";
import styles from './HandAngleDetector.module.css'; // Import custom CSS module

const HandAngleDetector = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [angle, setAngle] = useState(null);
  const [isObtuse, setIsObtuse] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [mathEquation, setMathEquation] = useState(null);
  const [guessFeedback, setGuessFeedback] = useState(null); // New state for feedback
  const [userAnswer, setUserAnswer] = useState(""); // New state for user answer
  const [answerFeedback, setAnswerFeedback] = useState(null); // New state for feedback
  const [problemStatement, setProblemStatement] = useState(null); // New state for problem statement


  const OPENAI_API_KEY = "ENTER YOUR OWN KEY";

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

  const generateMathEquation = async () => {
    const equationType = isObtuse ? "obtuse" : "acute";
    let prompt = `Generate a geometric math equation related to angle of ${angle} degrees.
    For the generated problem, provide:
        
    Problem: [Problem statement]
        
    Answer: [Numeric Answer]
        
    Solution: [Solution explanation]
        
    Please format your response exactly as above, and do not include any additional text or explanations. Ensure that the answer is a correct numeric value only, without any units or symbols. Double-check your calculations to maintain accuracy.`;

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
      });

      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const generatedEquation = response.data.choices[0].message.content.trim();
        setMathEquation(generatedEquation);
        // Extract only the "Problem" part from the generated equation
        const problemMatch = generatedEquation.match(/Problem:\s*(.*)/);
        const problem = problemMatch ? problemMatch[1].trim() : "Problem not found.";

        setProblemStatement(problem);
        
      } else {
        setProblemStatement("Failed to generate a problem.");

      }
    } catch (error) {
        console.error("Error generating equation:", error);
        setProblemStatement("Error generating problem.");
    }
  };
  const checkAnswer = () => {
    // Extract the correct answer from the generated equation
    const correctAnswerMatch = mathEquation && mathEquation.match(/Answer:\s*(\d+)/);
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
  const startTimer = () => {
    setTimerActive(true);
    setTimeout(() => {
      setTimerActive(false);
    }, 5000);
  };

  const handleGuess = (guess) => {
    const correctGuess = (guess === "obtuse" && isObtuse) || (guess === "acute" && !isObtuse);
    setGuessFeedback(correctGuess ? "Correct!" : "Incorrect. Try again!");
  };

  return (
    <div className={styles.container}>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&display=swap" rel="stylesheet" />
      <h1 className={styles.title}>Hand Angle Detector</h1>

      <div className={styles.webcamContainer}>
        <Webcam ref={webcamRef} className={styles.webcam} />
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>

      <div className={styles.controls}>
        <button onClick={startTimer} disabled={timerActive} className={styles.button}>
          {timerActive ? "Detecting..." : "Start 5-Second Angle Detection"}
        </button>
      </div>

      <div className={styles.info}>
        <h2>Detected Angle: {angle ? `${angle}°` : "N/A"}</h2>

        <button
          onClick={generateMathEquation}
          disabled={!angle}
          className={styles.button}
        >
          Generate Math Equation
        </button>
        
        {problemStatement && (
          <div className={styles.equationSection}>
            <h4>Generated Math Equation:</h4>
            <p className={styles.equationText}>{problemStatement}</p>

            <div className={styles.answerInput}>
              <input
                type="text"
                placeholder="Enter your answer"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className={styles.input}
              />
              <button onClick={checkAnswer} className={styles.submitButton}>
                Submit Answer
              </button>
            </div>
            
            {answerFeedback && <h4 className={styles.feedback}>{answerFeedback}</h4>}
          </div>
        )}
      </div>
    </div>
  );
};


export default HandAngleDetector;
