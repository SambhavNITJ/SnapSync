import React, { useCallback, useState, useEffect } from 'react'
import { useSocket } from '../providers/Socket'
import { useNavigate } from 'react-router-dom'

function Home() {
  const [email, setEmail] = useState('')
  const [room, setRoom] = useState('')
  const socket = useSocket()
  const navigate = useNavigate()

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      socket.emit("room-join", { email, room })
    },
    [email, room, socket]
  )

  const handleJoinRoom = useCallback(
    (data) => {
      const { email, room } = data
      console.log('you joined client side', email, 'Room:', room)
      navigate(`/room/${room}`)
    },
    [navigate]
  )

  useEffect(() => {
    socket.on('room-join', handleJoinRoom)
    return () => {
      socket.off('room-join', handleJoinRoom)
    }
  }, [socket, handleJoinRoom])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Lobby</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              E-Mail Id
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="room" className="block text-sm font-medium text-gray-700">
              Room
            </label>
            <input
              type="text"
              id="room"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter room name"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Join Room
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Home
