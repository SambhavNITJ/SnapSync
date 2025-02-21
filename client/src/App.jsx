import {Routes, Route} from 'react-router-dom'
import Home from './pages/Home.jsx'
import { SocketProvider } from './providers/Socket.jsx'
import Room from './pages/Room.jsx'

function App() {
  return (
    <div className="App">
      <SocketProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
      </SocketProvider>
    </div>
  )
}

export default App
