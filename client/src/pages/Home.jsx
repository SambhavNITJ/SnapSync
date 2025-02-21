import React, {useCallback, useState, useEffect} from 'react'
import { useSocket } from '../providers/Socket'
import {useNavigate} from 'react-router-dom'

function Home() {
  const [email, setEmail] = useState('');
  const [room, setRoom] = useState('');
  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    socket.emit("room-join", {email, room})
  }, [email, room, socket])

  const handleJoinRoom = useCallback((data) => {
    const {email, room} = data;
    console.log('you joined client side', email, 'Room:', room);
    navigate(`/room/${room}`)
  }, [navigate])


  useEffect(() => {
    socket.on('room-join', handleJoinRoom)

    return () => {
      socket.off('room-join', handleJoinRoom)
    }
  }, [socket, handleJoinRoom])

  return (
    <div>
      <h1>Lobby</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor='email'>E-Mail Id</label>
        <input type = 'email' id = 'email' value = {email} onChange={e => setEmail(e.target.value)}/>
        <label htmlFor='room'></label>
        <input type = 'text' id = 'room' value = {room} onChange = {e => setRoom(e.target.value)}/>
        <br/>
        <button type = 'submit'>Join Room</button>
      </form>
    </div>
  )
}

export default Home