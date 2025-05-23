import React, { useState } from "react";
import { IoMdCloudUpload } from "react-icons/io"; //upload part
import { MdAddPhotoAlternate } from "react-icons/md"; //photo upload part
import { FaTrashAlt } from "react-icons/fa";// trash bin
import { IoMdCheckmarkCircle } from "react-icons/io"; //for success message
import { estimateMeasurements } from "./poseUtils"; //js  estMes function
import db from "./firebase";
import { collection, addDoc } from "firebase/firestore";
import tapeMeasureImage from './icons/tape-measure.png'; // mezura görseli

function UploadForm({ onShowMeasurements }) {
  const [front, setFront] = useState(null);
  const [back, setBack] = useState(null);
  const [left, setLeft] = useState(null);
  const [right, setRight] = useState(null);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [warning, setWarning] = useState("");
  const [latestMeasurement, setLatestMeasurement] = useState(null); // son ölçüm

  

  //base64e çevirme
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file); //filereader api base64 yapar
      reader.onload = () => resolve(reader.result); 
      reader.onerror = (error) => reject(error); 
    });
  };

  const resizeImageBase64 = (base64Str, maxWidth = 400, maxHeight = 400) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL()); // küçültülmüş base64
    };
  });
};

  //image yüklenince error mesajı yok olur
  const handleImageChange = (e, setImage, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };
 //error mesajları
  const validateFields = () => {
    const newErrors = {};
    if (!front) newErrors.front = "Front image is required.";
    if (!back) newErrors.back = "Back image is required.";
    if (!left) newErrors.left = "Left image is required.";
    if (!right) newErrors.right = "Right image is required.";
    if (!height) newErrors.height = "Height is required.";
    if (!weight) newErrors.weight = "Weight is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
 //upload part
  const uploadImage = async () => {
    if (!validateFields()) return;

    try {
      const frontBase64 = await convertToBase64(front);//processin tamamlanmasını beklemek için await
      const backBase64 = await convertToBase64(back);
      const leftBase64 = await convertToBase64(left);
      const rightBase64 = await convertToBase64(right);

      const resizedFront = await resizeImageBase64(frontBase64);
const resizedBack = await resizeImageBase64(backBase64);
const resizedLeft = await resizeImageBase64(leftBase64);
const resizedRight = await resizeImageBase64(rightBase64);

      const measurements = await estimateMeasurements(resizedFront, Number(height)); 
      if (!measurements) {
        setWarning("Couldn’t process the image. Please upload a clearer photo with full visibility.")
        setTimeout(() => setWarning(""), 4000);
        return;
      }
    // firabase e ekler
     await addDoc(collection(db, "measurements"), {
  frontImage: resizedFront,
  backImage: resizedBack,
  leftImage: resizedLeft,
  rightImage: resizedRight,
  height,
  weight,
  ...measurements,
  timestamp: new Date()
});

       //sonuncu
      setLatestMeasurement({
        frontImage: frontBase64,
        backImage: backBase64,
        leftImage: leftBase64,
        rightImage: rightBase64,
        height,
        weight,
        ...measurements
      });
      // success message
      setSuccessMessage("Upload and Measurement Successful!");
      setTimeout(() => setSuccessMessage(""), 4000);
      //formu sıfırlar
      setFront(null);
      setBack(null);
      setLeft(null);
      setRight(null);
      setHeight("");
      setWeight("");

    } catch (error) {
      console.error("Error while saving data:", error);
      alert("Something went wrong!");
    }
  };

  return (
    <div>
      <div className="navBar">
        <h1 className="welcomeMessage">
          <img src={tapeMeasureImage} alt="Tape measure Icon" className="measureIcon" />
          Welcome to the Patient Measurement System!
        </h1>
      </div>

      {successMessage && (
        <div className="successMessage">
          <IoMdCheckmarkCircle size={24} />
          {successMessage}
        </div>
      )}

      
{warning && (
        <div className="warningMessage">
          {warning}
        </div>
      )}

      <div className="uploadForm">
        {/* image upload part*/}
        <div className="imageRow">
          <div className="fileInputGroup">
            <label className="customFileInput" title="Please upload a front image">
              <MdAddPhotoAlternate size={24} />
              Front Image
              <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, setFront, "front")} style={{ display: "none" }} />
            </label>
            {/*yüklenmiş hali göstermek için */}
            {front && (
              <div className="previewWrapper">
                <img src={URL.createObjectURL(front)} alt="Front Preview" className="previewImage" />
                <button className="removeButton" onClick={() => setFront(null)}><FaTrashAlt size={18} /></button>
              </div>
            )}
            {errors.front && <p className="error">{errors.front}</p>}
          </div>

          <div className="fileInputGroup">
            <label className="customFileInput" title="Please upload a back image">
              <MdAddPhotoAlternate size={24} />
              Back Image
              <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, setBack, "back")} style={{ display: "none" }} />
            </label>
            {back && (
              <div className="previewWrapper">
                <img src={URL.createObjectURL(back)} alt="Back Preview" className="previewImage" />
                <button className="removeButton" onClick={() => setBack(null)}><FaTrashAlt size={18} /></button>
              </div>
            )}
            {errors.back && <p className="error">{errors.back}</p>}
          </div>
        </div>

        <div className="imageRow">
          <div className="fileInputGroup">
            <label className="customFileInput" title="Please upload a left side image">
              <MdAddPhotoAlternate size={24} />
              Left Side Image
              <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, setLeft, "left")} style={{ display: "none" }} />
            </label>
            {left && (
              <div className="previewWrapper">
                <img src={URL.createObjectURL(left)} alt="Left Preview" className="previewImage" />
                <button className="removeButton" onClick={() => setLeft(null)}><FaTrashAlt size={18} /></button>
              </div>
            )}
            {errors.left && <p className="error">{errors.left}</p>}
          </div>

          <div className="fileInputGroup">
            <label className="customFileInput" title="Please upload a right side image">
              <MdAddPhotoAlternate size={24} />
              Right Side Image
              <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, setRight, "right")} style={{ display: "none" }} />
            </label>
            {right && (
              <div className="previewWrapper">
                <img src={URL.createObjectURL(right)} alt="Right Preview" className="previewImage" />
                <button className="removeButton" onClick={() => setRight(null)}><FaTrashAlt size={18} /></button>
              </div>
            )}
            {errors.right && <p className="error">{errors.right}</p>}
          </div>
        </div>

        {/* height and weight part*/}
        <div className="infoRow">
          <div className="inputGroup" title="Please enter the height">
            <label>Height (cm):</label>
            <input
              type="number"
              value={height}
              onChange={(e) => {
                setHeight(e.target.value);
                if (e.target.value) {
                  setErrors((prev) => {
                    const updated = { ...prev };
                    delete updated.height;
                    return updated;
                  });
                }
              }}
            />
            {errors.height && <p className="error">{errors.height}</p>}
          </div>

          <div className="inputGroup" title="Please enter the weight">
            <label>Weight (kg):</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => {
                setWeight(e.target.value);
                if (e.target.value) {
                  setErrors((prev) => {
                    const updated = { ...prev };
                    delete updated.weight;
                    return updated;
                  });
                }
              }}
            />
            {errors.weight && <p className="error">{errors.weight}</p>}
          </div>
        </div>

        {/*buttons */}
        <div className="buttonGroup" title="Upload data for measurement">
          <button onClick={uploadImage} className="uploadButton">
            <IoMdCloudUpload style={{ marginRight: "8px" }} />
            Upload and Measure
          </button>

          <button onClick={onShowMeasurements} className="showDataButton" title="Shows old measurements">
            Show Old Measurements
          </button>
        </div>

        {/* last measurement*/}
        {latestMeasurement && (
          <div className="measurement-item">
            <h3>Latest Measurement</h3>
            <p>Height: {latestMeasurement.height} cm</p>
            <p>Weight: {latestMeasurement.weight} kg</p>
            <p>Waist: {latestMeasurement.waist} cm</p>
            <p>Under Chest: {latestMeasurement.underChestLength} cm</p>
            <p>Under Arm: {latestMeasurement.underArmLength} cm</p>
            <div className="images-container">
              <img src={latestMeasurement.frontImage} alt="Front" width="100" />
              <img src={latestMeasurement.backImage} alt="Back" width="100" />
              <img src={latestMeasurement.leftImage} alt="Left" width="100" />
              <img src={latestMeasurement.rightImage} alt="Right" width="100" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadForm;
