import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import FileUpload from'./pages/upload'
import AnalyzeCattle from './pages/dashboard'
import Dashboard1 from './pages/Dashboard1'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
        {/* <h1 className="text-3xl font-bold underline">
      Hello world!
    </h1>
    <FileUpload />
    <div class="border-t border-black w-200% my-4"></div>
    <AnalyzeCattle /> */}
    <Dashboard1/>
    </>
  )
}

export default App
