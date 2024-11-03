// CameraView.js

import React from "react";
import Webcam from "react-webcam";

const CameraView = ({ onCapture }) => {
  const webcamRef = React.useRef(null);

  const capture = React.useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc);
    }
  }, [webcamRef, onCapture]);

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ textAlign: "center", paddingTop: "20px" }}>
      <h1>Testing Webcam</h1>
      <Webcam
        audio={false}
        screenshotFormat="image/jpeg"
        width="100%"
        style={{ border: "2px solid black" }}
      />
    </div>
      <button onClick={capture}>Capture</button>
    </div>
  );
};

export default CameraView;
