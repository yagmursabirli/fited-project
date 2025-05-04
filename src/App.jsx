import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import UploadForm from './UploadForm'
import ShowMeasurements from './ShowMeasurements'

function App() {
  const [showMeasurements, setShowMeasurements] = useState(false)

  return (
    <div>
      <UploadForm onShowMeasurements={() => setShowMeasurements(true)} />
      {showMeasurements && <ShowMeasurements />}
    </div>
  )
}
export default App
