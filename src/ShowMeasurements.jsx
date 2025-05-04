import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import db from './firebase';

function ShowMeasurements() {
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMeasurements = async () => {
      setLoading(true);
      const q = query(collection(db, 'measurements'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => doc.data());
      setMeasurements(data);
      setLoading(false);
    };

    fetchMeasurements();
  }, []);

  return (
    <div>
      {loading && <div className="spinner"></div>}


      {!loading && (
        measurements.length > 0 ? (
          <div className="measurements-container">
            {measurements.map((m, index) => (
              <div key={index} className="measurement-item">
                <h3>Measurement {index + 1}</h3>
                <p>Height: {m.height || 'N/A'} cm</p>
                <p>Weight: {m.weight || 'N/A'} kg</p>
                <p>Waist: {m.waist || 'N/A'} cm</p>
                <p>Under Chest: {m.underChestLength || 'N/A'} cm</p>
                <p>Under Arm: {m.underArmLength || 'N/A'} cm</p>
                <div className="images-container">
                  {m.frontImage && <img src={m.frontImage} alt="Front" width="100" />}
                  {m.backImage && <img src={m.backImage} alt="Back" width="100" />}
                  {m.leftImage && <img src={m.leftImage} alt="Left" width="100" />}
                  {m.rightImage && <img src={m.rightImage} alt="Right" width="100" />}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className='noMes'>No measurements available.</p>
        )
      )}
    </div>
  );
}

export default ShowMeasurements;
