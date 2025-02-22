import React, { useCallback, useEffect, useState } from 'react'
import { useSocket } from '../providers/Socket'
import ReactPlayer from 'react-player'
import peer from '../service/peer.js'

function Room() {
  const socket = useSocket()
  const [remoteSocketId, setRemoteSocketId] = useState(null)
  const [myStream, setMyStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  // New state to track if this peer is the caller (sender) or not
  const [isCaller, setIsCaller] = useState(null)

  // Handle when another user joins the room
  const handleUserJoined = useCallback((data) => {
    const { email, id } = data
    setRemoteSocketId(id)
    console.log('Another user joined:', email, 'SocketId:', id)
  }, [])

  // Function to initiate a call to a remote user (caller side)
  const handleCallUser = useCallback(async () => {
    setIsCaller(true)
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    })
    setMyStream(stream)
    const offer = await peer.getOffer()
    socket.emit('call-user', { offer, to: remoteSocketId })
  }, [remoteSocketId, socket])

  // Handle incoming call request (receiver side)
  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      setIsCaller(false)
      setRemoteSocketId(from)
      console.log('Incoming call from:', from)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      setMyStream(stream)
      const ans = await peer.getAnswer(offer)
      socket.emit('answer-call', { ans, to: from })
    },
    [socket]
  )

  // Send the local stream tracks to the peer connection
  const sendStream = useCallback(() => {
    if (myStream) {
      for (const track of myStream.getTracks()) {
        peer.peer.addTrack(track, myStream)
      }
    }
  }, [myStream])

  // Handle call acceptance from the remote user
  const handleCallAccepted = useCallback(
    async ({ ans, from }) => {
      await peer.setLocalDescription(ans)
      console.log('Call accepted from:', from)
      sendStream()
    },
    [sendStream]
  )

  // Handle negotiation needed event
  const handleNegotiationNeeded = useCallback(async () => {
    const offer = await peer.getOffer()
    socket.emit('peer-nego-needed', { offer, to: remoteSocketId })
  }, [remoteSocketId, socket])

  // Handle incoming negotiation request
  const handleNegotiationIncoming = useCallback(
    async ({ offer, from }) => {
      const ans = await peer.getAnswer(offer)
      socket.emit('peer-nego-done', { ans, to: from })
    },
    [socket]
  )

  // Handle final negotiation answer
  const handleNegoFinal = useCallback(async ({ ans }) => {
    console.log('Final negotiation:', ans)
    await peer.setLocalDescription(ans)
  }, [])

  useEffect(() => {
    peer.peer.addEventListener('negotiationneeded', handleNegotiationNeeded)
    return () => {
      peer.peer.removeEventListener('negotiationneeded', handleNegotiationNeeded)
    }
  }, [handleNegotiationNeeded])

  useEffect(() => {
    peer.peer.addEventListener('track', (e) => {
      console.log('Received remote track')
      setRemoteStream(e.streams[0])
    })
  }, [])

  // Listen for socket events
  useEffect(() => {
    socket.on('room-join', handleUserJoined)
    socket.on('incoming-call', handleIncomingCall)
    socket.on('call-accepted', handleCallAccepted)
    socket.on('peer-nego-needed', handleNegotiationIncoming)
    socket.on('peer-nego-final', handleNegoFinal)

    return () => {
      socket.off('room-join', handleUserJoined)
      socket.off('incoming-call', handleIncomingCall)
      socket.off('call-accepted', handleCallAccepted)
      socket.off('peer-nego-needed', handleNegotiationIncoming)
      socket.off('peer-nego-final', handleNegoFinal)
    }
  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleCallAccepted,
    handleNegotiationIncoming,
    handleNegoFinal,
  ])

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-3xl">
        <h1 className="text-3xl font-bold mb-4 text-center">Room</h1>
        <div className="text-center mb-6">
          <h2 className="text-xl">
            {remoteSocketId ? (
              <span className="text-green-600">Connected</span>
            ) : (
              <span className="text-red-600">Disconnected</span>
            )}
          </h2>
        </div>
        <div className="flex justify-center space-x-4 mb-6">
          {/* Only show the Accept Call button (which triggers sendStream) if myStream exists and this peer is the receiver */}
          {!isCaller && myStream && (
            <button
              onClick={sendStream}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              Accept Call
            </button>
          )}
          {remoteSocketId && (
            <button
              onClick={handleCallUser}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              Call
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myStream && (
            <div className="flex flex-col items-center">
              <h2 className="mb-2 font-semibold">My Stream</h2>
              <div className="border rounded-lg overflow-hidden">
                <ReactPlayer
                  height="200px"
                  width="300px"
                  url={myStream}
                  playing
                  controls
                />
              </div>
            </div>
          )}
          {remoteStream && (
            <div className="flex flex-col items-center">
              <h2 className="mb-2 font-semibold">Remote Stream</h2>
              <div className="border rounded-lg overflow-hidden">
                <ReactPlayer
                  height="200px"
                  width="300px"
                  url={remoteStream}
                  playing
                  controls
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Room
