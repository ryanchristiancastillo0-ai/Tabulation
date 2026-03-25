
import { Route, Routes } from 'react-router-dom'
import './index.css'
import Home from './components/home'
import JudgeTable from './components/judge/JudgeTable'
import Dashboard from './pages/admin/Dashboard'
import JudgeScoreboard from './pages/judge/JudgeScoreboard'
import LeaderBoard from './components/admin/Leaderboard'
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
         <Route path='/admin/leaderboard' element={<LeaderBoard/>} />
        <Route path='/judge' element={<JudgeTable/>} />
        <Route path='/judge/scoreboard' element={<JudgeScoreboard/>} />
    </Routes>
  )
}