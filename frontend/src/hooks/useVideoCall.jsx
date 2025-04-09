import { useState, useEffect, useRef } from 'react';
import { Peer } from 'peerjs';
import { useSelector } from 'react-redux';

const useVideoCall = () => {
    const [peer, setPeer] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [callStatus, setCallStatus] = useState('idle');
    const [currentCall, setCurrentCall] = useState(null);
    
    const { socket } = useSelector(store => store.socket);
    const { authUser } = useSelector(store => store.user);  // Update selector to match your store
    
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();

    // Initialize media stream when component mounts
    useEffect(() => {
        const initializeStream = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error('Failed to get media devices:', err);
            }
        };

        initializeStream();

        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Initialize peer connection
    useEffect(() => {
        if (!authUser?._id) return;

        let peerConnection = null;

        const createPeerConnection = () => {
            if (peerConnection) {
                peerConnection.destroy();
            }

            const newPeer = new Peer(authUser._id, {
                host: 'peerjs.herokuapp.com',
                secure: true,
                port: 443,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        {
                            urls: 'turn:numb.viagenie.ca',
                            username: 'webrtc@live.com',
                            credential: 'muazkh'
                        }
                    ]
                },
                debug: 3
            });

            newPeer.on('open', () => {
                console.log('Peer connection opened with ID:', authUser._id);
                setPeer(newPeer);
            });

            newPeer.on('disconnected', () => {
                console.log('Peer disconnected');
                // Instead of reconnecting the destroyed peer, create a new one
                setTimeout(createPeerConnection, 1000);
            });

            newPeer.on('error', (err) => {
                console.error('Peer connection error:', err);
                // Create new peer connection on error
                setTimeout(createPeerConnection, 1000);
            });

            // Handle incoming calls
            newPeer.on('call', async (call) => {
                try {
                    let stream = localStream;
                    if (!stream) {
                        stream = await navigator.mediaDevices.getUserMedia({
                            video: true,
                            audio: true
                        });
                        setLocalStream(stream);
                        if (localVideoRef.current) {
                            localVideoRef.current.srcObject = stream;
                        }
                    }
                    
                    call.answer(stream);
                    setCurrentCall(call);

                    call.on('stream', (remoteStream) => {
                        console.log('Received remote stream in incoming call');
                        if (remoteVideoRef.current) {
                            remoteVideoRef.current.srcObject = remoteStream;
                        }
                        setRemoteStream(remoteStream);
                        setCallStatus('connected');
                    });
                } catch (err) {
                    console.error('Error handling incoming call:', err);
                }
            });

            peerConnection = newPeer;
            return newPeer;
        };

        createPeerConnection();

        return () => {
            if (peerConnection) {
                peerConnection.destroy();
            }
        };
    }, [authUser?._id]);

    const makeCall = async (receiverId) => {
        try {
            if (!peer || !peer.connected) {
                console.log('Waiting for peer connection...');
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => reject(new Error('Peer connection timeout')), 5000);
                    const checkPeer = setInterval(() => {
                        if (peer?.connected) {
                            clearInterval(checkPeer);
                            clearTimeout(timeout);
                            resolve();
                        }
                    }, 100);
                });
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            setLocalStream(stream);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
                await localVideoRef.current.play().catch(e => console.error('Local play error:', e));
            }

            console.log('Making call to:', receiverId);
            const call = peer.call(receiverId, stream);
            setCurrentCall(call);
            setCallStatus('calling');

            call.on('stream', (remoteStream) => {
                console.log('Received remote stream in outgoing call');
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;
                    remoteVideoRef.current.play().catch(e => console.error('Remote play error:', e));
                }
                setRemoteStream(remoteStream);
                setCallStatus('connected');
            });

            call.on('error', (err) => {
                console.error('Call error:', err);
                setCallStatus('error');
            });

        } catch (err) {
            console.error('Error making call:', err);
            setCallStatus('error');
        }
    };

    const endCall = () => {
        if (currentCall) {
            currentCall.close();
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }
        setCallStatus('idle');
        setCurrentCall(null);
        setRemoteStream(null);
        setLocalStream(null);
    };

    return {
        callStatus,
        makeCall,
        endCall,
        localVideoRef,
        remoteVideoRef,
        localStream,
        remoteStream
    };
};

export default useVideoCall;