import { useState } from 'react'
import './App.css'
import UploadForm from './UploadForm'
import ShowMeasurements from './ShowMeasurements'

function App() {
  const [showMeasurements, setShowMeasurements] = useState(false)

  return (
    <div>
      {/*uploadformda çağrılınca true olur ve gösterilmeye başlar*/}
      <UploadForm onShowMeasurements={() => setShowMeasurements(true)} />
      {showMeasurements && <ShowMeasurements />}
    </div>
  )
}
export default App
