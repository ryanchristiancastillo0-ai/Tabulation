
import { Route, Routes } from 'react-router-dom'
import './index.css'
import Home from './components/home'
import JudgeTable from './components/judge/JudgeTable'
import Dashboard from './pages/admin/Dashboard'
export default function App() {
  return (
 Routers()
  )
}

function Routers(){
  return (
    <Routes>
      <Route path='/' element={<Home/>} />
       <Route path='/admin' element={<Dashboard/>} />
        <Route path='/judge' element={<JudgeTable/>} />
    </Routes>
  )
}