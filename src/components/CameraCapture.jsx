import { useState, useRef } from "react";
import { Box, Button, HStack, Image } from "@chakra-ui/react";

const CameraCapture = ({ onCapture }) => {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [preview, setPreview] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const streamRef = useRef(null);

  const startCamera = async () => {
    setCameraOpen(true);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });

    streamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const imageUrl = canvas.toDataURL("image/png");
    setPreview(imageUrl);

    canvas.toBlob((blob) => {
      const file = new File([blob], "photo.png", { type: "image/png" });
      onCapture(file, imageUrl);
    });

    stopCamera();
  };

  const retakePhoto = () => {
    setPreview(null);
    setCameraOpen(false);
  };

  return (
    <Box mt={2}>
      {/* Buttons */}
      {!preview && (
        <HStack>
          <Button size="sm" colorScheme="green" onClick={startCamera}>
            📷 Camera Open
          </Button>

          {cameraOpen && (
            <Button size="sm" colorScheme="blue" onClick={capturePhoto}>
              📸 Capture
            </Button>
          )}
        </HStack>
      )}

      {/* Camera view – ONLY after click */}
      {cameraOpen && !preview && (
        <Box mt={2}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              width: "100%",
              maxWidth: "300px",
              borderRadius: "8px"
            }}
          />
          <canvas ref={canvasRef} hidden />
        </Box>
      )}

      {/* Preview */}
      {preview && (
        <Box mt={2}>
          <Image src={preview} maxW="200px" borderRadius="md" />
          <Button mt={2} size="sm" colorScheme="orange" onClick={retakePhoto}>
            🔄 Retake
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default CameraCapture;
