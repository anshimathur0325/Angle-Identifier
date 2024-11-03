// TestWebcam.js

import React from "react";
import Webcam from "react-webcam";

const TestWebcam = () => {
  return (
    <div style={{ textAlign: "center", paddingTop: "20px" }}>
      <h1>Testing Webcam</h1>
      <Webcam
        audio={false}
        screenshotFormat="image/jpeg"
        width="100%"
        style={{ border: "2px solid black" }}
      />
    </div>
  );
};

export default TestWebcam;
