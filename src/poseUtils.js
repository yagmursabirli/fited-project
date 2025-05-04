import * as mpPose from '@mediapipe/pose';
import { Timestamp, setDoc, doc } from 'firebase/firestore';
import db from './firebase';

let poseInstance = null;
let processing = false;

export const estimateMeasurements = async (imageBase64, height, saveToFirestore = false) => {
  if (processing) {
    console.warn('Already processing another image');
    return null;
  }

  processing = true;

  if (!poseInstance) {
    poseInstance = new mpPose.Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    poseInstance.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageBase64;

    image.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);

      poseInstance.onResults(async (results) => {
        processing = false;

        if (results.poseLandmarks) {
          const landmarks = results.poseLandmarks;

          const getDistance = (p1, p2) => {
            const dx = (p1.x - p2.x) * image.width;
            const dy = (p1.y - p2.y) * image.height;
            return Math.sqrt(dx * dx + dy * dy);
          };

          const scale = height / image.height;

          const underArmLength = getDistance(landmarks[11], landmarks[13]) * scale;
          const underChestLength = getDistance(landmarks[11], landmarks[23]) * scale;
          const waist = getDistance(landmarks[23], landmarks[24]) * scale;

          const measurementData = {
            height,
            waist: waist.toFixed(2),
            underChestLength: underChestLength.toFixed(2),
            underArmLength: underArmLength.toFixed(2),
            frontImage: imageBase64,
            timestamp: Timestamp.now()
          };

          if (saveToFirestore) {
            try {
              await setDoc(doc(db, 'measurements', `${Date.now()}`), measurementData);
            } catch (err) {
              console.error("Firestore write failed:", err);
            }
          }

          resolve(measurementData);
        } else {
          processing = false;
          resolve(null);
        }
      });

      await poseInstance.send({ image });
    };

    image.onerror = () => {
      processing = false;
      reject("Image loading failed");
    };
  });
};
