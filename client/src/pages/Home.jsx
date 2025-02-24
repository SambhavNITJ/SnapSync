import React, { useCallback, useState, useEffect } from 'react'
import { useSocket } from '../providers/Socket'
import { useNavigate } from 'react-router-dom'

function Home() {
  const [email, setEmail] = useState('')
  const [room, setRoom] = useState('')
  const [error, setError] = useState('')
  const socket = useSocket()
  const navigate = useNavigate()

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      if (!email.trim()) {
        setError('Email is required.')
        return
      }
      if (!room.trim()) {
        setError('Room ID is required.')
        return
      }
      setError('')
      socket.emit('room-join', { email, room })
    },
    [email, room, socket]
  )

  const handleJoinRoom = useCallback(
    (data) => {
      const { email, room } = data
      console.log('You joined client side', email, 'Room:', room)
      navigate(`/room/${room}`, {state: { email, room }})
    },
    [navigate]
  )

  useEffect(() => {
    socket.on('room-joined', handleJoinRoom)
    return () => {
      socket.off('room-joined', handleJoinRoom)
    }
  }, [socket, handleJoinRoom])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 shadow-xl rounded-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-white">Join a Room</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              E-Mail <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label htmlFor="room" className="block text-sm font-medium text-gray-300">
              Room Id <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="room"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter room id"
            />
          </div>
          {error && <p className="mt-2 text-sm text-red-500 text-center">{error}</p>}
          <div>
            <button
              type="submit"
              className="w-full py-2 px-4 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
