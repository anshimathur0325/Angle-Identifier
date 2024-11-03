// AngleDetection.js

// Ensure OpenCV is loaded
const waitForCV = new Promise((resolve) => {
    const checkCV = setInterval(() => {
      if (window.cv) {
        clearInterval(checkCV);
        resolve(window.cv);
      }
    }, 50);
  });
  
  export const detectAngles = async (imageSrc) => {
    // Wait for OpenCV to be ready
    const cv = await waitForCV;
  
    const img = new Image();
    img.src = imageSrc;
  
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
  
      const src = cv.imread(canvas);
      const gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
  
      // Detect edges
      const edges = new cv.Mat();
      cv.Canny(gray, edges, 50, 150, 3, false);
  
      // Detect lines
      const lines = new cv.Mat();
      cv.HoughLinesP(edges, lines, 1, Math.PI / 180, 50, 50, 10);
  
      const angles = [];
      for (let i = 0; i < lines.rows; i++) {
        const [x1, y1, x2, y2] = lines.data32S.slice(i * 4, i * 4 + 4);
        const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
        angles.push(angle);
      }
  
      // Clean up
      src.delete(); gray.delete(); edges.delete(); lines.delete();
  
      console.log('Detected angles:', angles);
      return angles;
    };
  };
  