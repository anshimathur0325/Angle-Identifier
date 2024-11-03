import React, { useState } from "react";
import HandAngleDetector from "./HandAngleDetector"; // Your existing angle detector component
import HandShapeDetector from "./HandShapeDetector"; // Placeholder for the shape detector component

const App = () => {
  const [showAngleDetector, setShowAngleDetector] = useState(true);

  const toggleDetector = () => {
    setShowAngleDetector((prev) => !prev);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <button onClick={toggleDetector} style={{ margin: "20px", padding: "10px 20px" }}>
        {showAngleDetector ? "Switch to Shape Detector" : "Switch to Angle Detector"}
      </button>
      {showAngleDetector ? <HandAngleDetector /> : <HandShapeDetector />}
    </div>
  );
};

export default App;