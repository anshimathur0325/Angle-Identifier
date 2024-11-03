import React, { useState } from "react";
import HandAngleDetector from "./HandAngleDetector"; // Your existing angle detector component
import HandShapeDetector from "./HandShapeDetector"; // Placeholder for the shape detector component

const App = () => {
  const [showAngleDetector, setShowAngleDetector] = useState(true);

  const toggleDetector = () => {
    setShowAngleDetector((prev) => !prev);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background:"linear-gradient(to right, #42D38C, #753FC9)" }}>
      <button onClick={toggleDetector} style={{ margin: "20px", padding: "10px 20px", backgroundColor: "#42D38C", /* Purple button background */
    color: "white", /* White text for buttons */
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "background-color 0.3s",
    fontSize: "20px",
    fontFamily: "'Fredoka', cursive" }}>
        {showAngleDetector ? "Switch to Shape Detector" : "Switch to Angle Detector"}
      </button>
      {showAngleDetector ? <HandAngleDetector /> : <HandShapeDetector />}
    </div>
  );
};

export default App;