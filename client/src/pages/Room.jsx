import React, {useCallback, useEffect, useState} from 'react'
import { useSocket } from '../providers/Socket'
import ReactPlayer from 'react-player'
import peer from '../service/peer.js'

function Room() {
    const socket = useSocket();
    const [remoteSocketId, setRemoteSocketId] = useState(null);
    const [myStream, setMyStream] = useState(null);

    /// Function to handle user joined
    const handleUserJoined = useCallback((data) => {
        const {email, id} = data;
        setRemoteSocketId(id);
        console.log('another Email joined room', email, 'SocketId:', id);
    }, [])



    /// Function to handle call user
    const handleCallUser = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true, audio: true
    });
    const offer = await peer.getOffer();
    socket.emit('call-user', {offer, to: remoteSocketId});
    setMyStream(stream);

    }, [remoteSocketId, socket])


    /// Function to handle incoming call
    const handleIncomingCall = useCallback(async({from, offer}) => {
        setRemoteSocketId(from);
        console.log('Incoming call from:', from);
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true, audio: true
        });
        setMyStream(stream);

        const ans = await peer.getAnswer(offer);
        socket.emit('answer-call', {ans, to: from});
    }, [socket]);


    const handleCallAccepted = useCallback(async({ans, from}) => {
        peer.setLocalDescription(ans);
        console.log('Call accepted from:', from);
    }, []);


    /// useEffect to listen to room-join event
    useEffect(() => {
        socket.on('room-join', handleUserJoined)
        socket.on('incoming-call', handleIncomingCall);
        socket.on('call-accepted', handleCallAccepted);
        return () => {
            socket.off('room-join', handleUserJoined)
            socket.off('incoming-call', handleIncomingCall)
            socket.off('call-accepted', handleCallAccepted)
        }
    }, [socket, handleUserJoined, handleIncomingCall, handleCallAccepted])

  return (
    <div>
        <h1>Room</h1>
        <h2>{remoteSocketId ? 'connected' : 'no one in room'}</h2>
        {
            remoteSocketId && 
            <button onClick={handleCallUser}>Call</button>
        }
        {
            myStream &&
            <>
            <h2>My Stream</h2>
            <ReactPlayer height = "200px" width = "200px" url={myStream} playing/>
            </>
        }
    </div>
  )
}

export default Room