import * as mpPose from '@mediapipe/pose';
import { Timestamp, setDoc, doc } from 'firebase/firestore';
import db from './firebase';

let poseInstance = null;
let processing = false; //aynı anda birden fazla işlemi engellmek için

// landmark ekleme
const drawLandmarks = (ctx, landmarks) => {
  landmarks.forEach((point) => {
    const { x, y } = point;
    ctx.beginPath();
    ctx.arc(x * ctx.canvas.width, y * ctx.canvas.height, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "red";
    ctx.fill();
  });
};



//meausurement tahmini
export const estimateMeasurements = async (imageBase64, height, saveToFirestore = false) => {
  if (processing) {
    console.warn('Already processing another image');
    return null;
  }

  processing = true;

  if (!poseInstance) {
    poseInstance = new mpPose.Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`//internetten alarak çalışır (pose.wasm, pose.binary)
    });

    poseInstance.setOptions({
      modelComplexity: 1, //complexity of the model şu an hızlı ama daha az doğruluk payı
      smoothLandmarks: true, //sabit ölçümler 
      enableSegmentation: false,
      minDetectionConfidence: 0.5,//vücudu algılama seviyesi
      minTrackingConfidence: 0.5 //landmark takibi için
    });
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageBase64; //yüklenen görsel

    // görsel yüklenince 
    image.onload = async () => {
      const canvas = document.createElement('canvas'); //yeni bir canvas DOMda
      canvas.width = image.width;
      canvas.height = image.height;//canvas boyutları görselle aynı 
      const ctx = canvas.getContext('2d');// 2d işlem içim context object
      ctx.drawImage(image, 0, 0);//görseli canvasa çizer

      poseInstance.onResults(async (results) => {
        processing = false;

        if (results.poseLandmarks) { //landmarklar bulunduysa devam eder 
          const landmarks = results.poseLandmarks;

          // Landmark noktaları
          drawLandmarks(ctx, landmarks);//kırmıxı noktaları canvas üzerine çizer 

          //İki nokta arası mesafe hesaplama eucladian
          const getDistance = (p1, p2) => {
            const dx = (p1.x - p2.x) * image.width;
            const dy = (p1.y - p2.y) * image.height;
            return Math.sqrt(dx * dx + dy * dy);
          };

          const scale = height / image.height; //scale eder

          // vücut ölçümleri MediaPipe standarts
          const underArmLength = getDistance(landmarks[11], landmarks[13]) * scale;
          const underChestLength = getDistance(landmarks[11], landmarks[23]) * scale;
          const waist = getDistance(landmarks[23], landmarks[24]) * scale; //scale ile çarparak cm ye çevirir

          // ölçümleri json olarak kaydetme
          const measurementData = {
            height,
            waist: waist.toFixed(2),
            underChestLength: underChestLength.toFixed(2),
            underArmLength: underArmLength.toFixed(2),
            frontImage: canvas.toDataURL(),  // landmark eklenmiş görsel saklanır
            timestamp: Timestamp.now()
          };

          // firebase e kaydetme
          if (saveToFirestore) {
            try {
              await setDoc(doc(db, 'measurements', `${Date.now()}`), measurementData);
            } catch (err) {
              console.error("Firestore write failed:", err);
            }
          }
          //promise tamamlanınca
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
