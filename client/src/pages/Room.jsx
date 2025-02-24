import React, { useCallback, useEffect, useState } from 'react'
import { useSocket } from '../providers/Socket'
import ReactPlayer from 'react-player'
import peer from '../service/peer.js'
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom'
import Chat from '../components/Chat.jsx'
import { toast } from "react-hot-toast";
import { useParams } from "react-router-dom";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Timer } from 'lucide-react';

function Room() {
  const socket = useSocket()
  const navigate = useNavigate()
  const [remoteSocketId, setRemoteSocketId] = useState(null)
  const [myStream, setMyStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [isCaller, setIsCaller] = useState(null)
  const [isCalling, setIsCalling] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)
  const location = useLocation();
  const { email, room } = location.state || {};
  const { roomId } = useParams();

  // States for audio/video toggling
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isVideoStopped, setIsVideoStopped] = useState(false)
  // States to trigger fade effect for toggles
  const [audioFade, setAudioFade] = useState(false)
  const [videoFade, setVideoFade] = useState(false)

  // Call duration states
  const [callStartTime, setCallStartTime] = useState(null)
  const [callDuration, setCallDuration] = useState(0)

  const handleUserJoined = useCallback((data) => {
    const { email, id } = data
    setRemoteSocketId(id)
    console.log('Another user joined:', email, 'SocketId:', id)
    toast.success('Another User joined room')
  }, [])

  const handleCallUser = useCallback(async () => {
    setIsCaller(true)
    setIsCalling(true)
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    })
    setMyStream(stream)
    const offer = await peer.getOffer()
    socket.emit('call-user', { offer, to: remoteSocketId })
  }, [remoteSocketId, socket])

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

  const sendStream = useCallback(() => {
    if (myStream) {
      for (const track of myStream.getTracks()) {
        peer.peer.addTrack(track, myStream)
      }
    }
  }, [myStream])

  const handleAcceptCall = useCallback(() => {
    setIsAccepting(true)
    sendStream()
  }, [sendStream])

  const handleCallAccepted = useCallback(
    async ({ ans, from }) => {
      await peer.setLocalDescription(ans)
      console.log('Call accepted from:', from)
      sendStream()
    },
    [sendStream]
  )

  const handleNegotiationNeeded = useCallback(async () => {
    const offer = await peer.getOffer()
    socket.emit('peer-nego-needed', { offer, to: remoteSocketId })
  }, [remoteSocketId, socket])

  const handleNegotiationIncoming = useCallback(
    async ({ offer, from }) => {
      const ans = await peer.getAnswer(offer)
      socket.emit('peer-nego-done', { ans, to: from })
    },
    [socket]
  )

  const handleNegoFinal = useCallback(async ({ ans }) => {
    console.log('Final negotiation:', ans)
    await peer.setLocalDescription(ans)
  }, [])

  const handleDisconnectCall = useCallback(() => {
    if (myStream) {
      myStream.getTracks().forEach((track) => track.stop())
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop())
    }
    if (peer.peer) {
      peer.peer.close()
    }
    socket.emit('disconnect feature')
    toast.success('Disconnecting Call')
    setTimeout(() => {
      navigate('/')
    }, 1000)
  }, [myStream, remoteStream, navigate, socket])

  // Toggle audio with fade effect and icon swap
  const handleToggleMute = () => {
    if (myStream) {
      setAudioFade(true)
      setTimeout(() => {
        const newMutedState = !isAudioMuted
        myStream.getAudioTracks().forEach((track) => {
          track.enabled = !newMutedState
        })
        setIsAudioMuted(newMutedState)
        setAudioFade(false)
      }, 300)
    }
  }

  // Toggle video with fade effect and icon swap
  const handleToggleVideo = () => {
    if (myStream) {
      setVideoFade(true)
      setTimeout(() => {
        const newVideoState = !isVideoStopped
        myStream.getVideoTracks().forEach((track) => {
          track.enabled = !newVideoState
        })
        setIsVideoStopped(newVideoState)
        setVideoFade(false)
      }, 300)
    }
  }

  // Start the call timer once remoteStream is available (call established)
  useEffect(() => {
    if (remoteStream && !callStartTime) {
      setCallStartTime(Date.now())
    }
  }, [remoteStream, callStartTime])

  // Update call duration every second
  useEffect(() => {
    let interval
    if (callStartTime) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime) / 1000))
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [callStartTime])

  // Helper to format call duration as mm:ss
  const formatDuration = (duration) => {
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

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

  useEffect(() => {
    const handleUserDisconnected = () => {
      console.log('User disconnected. Closing streams...')
      if (myStream) {
        myStream.getTracks().forEach((track) => track.stop())
      }
      if (remoteStream) {
        remoteStream.getTracks().forEach((track) => track.stop())
      }
      setRemoteSocketId(null)
      setIsCalling(false)
      setIsCaller(null)
      setMyStream(null)
      setRemoteStream(null)
      setCallStartTime(null)
      setCallDuration(0)
      setTimeout(() => {
        toast.error('User disconnected. Create a new room...')
        navigate('/')
      }, 2000)
    }
    socket.on('user-disconnected', handleUserDisconnected)
    return () => {
      socket.off('user-disconnected', handleUserDisconnected)
    }
  }, [socket, navigate, myStream, remoteStream])

  useEffect(() => {
    const storageKey = `roomAlertShown-${roomId}`;
    const alertShown = sessionStorage.getItem(storageKey);
    if (!alertShown) {
      toast.success(`Room ID: ${roomId}\n`);
      sessionStorage.setItem(storageKey, "true");
    }
  }, [roomId])
  
  useEffect(() => {
    socket.on('room-joined', handleUserJoined)
    socket.on('incoming-call', handleIncomingCall)
    socket.on('call-accepted', handleCallAccepted)
    socket.on('peer-nego-needed', handleNegotiationIncoming)
    socket.on('peer-nego-final', handleNegoFinal)
    return () => {
      socket.off('room-joined', handleUserJoined)
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
    <div className="h-screen bg-gray-900 flex relative">
      {/* Call Duration Display (visible after call starts) */}
      {callStartTime && (
        <div className="absolute top-4 right-4 text-white flex items-center gap-2 z-10">
          <Timer size={18} />
          <span>{formatDuration(callDuration)}</span>
        </div>
      )}

      {/* Video Call Section (Left 75%) */}
      <div className="flex-grow w-3/4 flex flex-col items-center justify-center pb-20">
        <div className="bg-gray-800 shadow-lg rounded-lg p-6 w-full max-w-3xl">
          <h1 className="text-3xl font-bold mb-3 mt-1 text-center text-white">Room</h1>
          <div className="text-center mb-6">
            <h2 className="text-xl">
              {remoteSocketId ? (
                <span className="text-green-400">Connected</span>
              ) : (
                <span className="text-red-400">Disconnected</span>
              )}
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            {!isCaller && myStream && (
              <button
                onClick={handleAcceptCall}
                disabled={isAccepting}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Accept Call
              </button>
            )}
            {remoteSocketId && isCaller !== false && (
              <button
                onClick={handleCallUser}
                disabled={isCalling}
                className="px-4 py-2 bg-indigo-700 text-white rounded hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Call
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myStream && (
              <div className="flex flex-col items-center">
                <h2 className="mb-2 font-semibold text-white">My Stream</h2>
                <div className="border rounded-lg overflow-hidden border-gray-700">
                  <ReactPlayer
                    height="220px"
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
                <h2 className="mb-2 font-semibold text-white">Remote Stream</h2>
                <div className="border rounded-lg overflow-hidden border-gray-700">
                  <ReactPlayer
                    height="220px"
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
      
      {/* Fixed Footer Controls (spanning Left 75%) */}
      {myStream && (
        <footer className="fixed bottom-0 left-0 w-3/4 bg-gray-800 p-4">
          <div className="flex justify-center gap-4">
            <button
              onClick={handleToggleMute}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 flex items-center"
            >
              <div className={`flex items-center transition-opacity duration-300 ${audioFade ? 'opacity-0' : 'opacity-100'}`}>
                {isAudioMuted ? <MicOff size={18} className="mr-2" /> : <Mic size={18} className="mr-2" />}
                {isAudioMuted ? "Unmute" : "Mute"}
              </div>
            </button>
            <button
              onClick={handleToggleVideo}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
            >
              <div className={`flex items-center transition-opacity duration-300 ${videoFade ? 'opacity-0' : 'opacity-100'}`}>
                {isVideoStopped ? <VideoOff size={18} className="mr-2" /> : <Video size={18} className="mr-2" />}
                {isVideoStopped ? "Start Video" : "Stop Video"}
              </div>
            </button>
            {(myStream || remoteStream) && (
              <button
                onClick={handleDisconnectCall}
                className="px-2 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center"
              >
                <PhoneOff size={20} className="mr-2 ml-2" />
              </button>
            )}
          </div>
        </footer>
      )}
      
      {/* Chat Section (Right 25%) */}
      <div className="w-1/4 bg-gray-800 p-4 border-l border-gray-700 h-full flex flex-col">
        <h2 className="text-white text-lg font-bold mb-3">In-Call Chats</h2>
        <div className="flex-1 min-h-0 overflow-hidden">
        <Chat email={email} room={room} />
        </div>
      </div>

    </div>
  )
}

export default Room
