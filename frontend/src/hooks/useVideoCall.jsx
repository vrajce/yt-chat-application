import { useState, useEffect, useRef } from 'react';
import { Peer } from 'peerjs';
import { useSelector } from 'react-redux';

const useVideoCall = () => {
    // Add new state for peer status
    const [peerStatus, setPeerStatus] = useState('disconnected');
    const [peer, setPeer] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [callStatus, setCallStatus] = useState('idle');
    const [currentCall, setCurrentCall] = useState(null);
    
    const { socket } = useSelector(store => store.socket);
    const { authUser } = useSelector(store => store.user);
    
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();

    const endCall = () => {
        if (currentCall) {
            currentCall.close();
            setCurrentCall(null);
        }
        if (remoteStream) {
            remoteStream.getTracks().forEach(track => track.stop());
            setRemoteStream(null);
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
        setCallStatus('idle');
    };

    // Initialize media stream first
    useEffect(() => {
        let mounted = true;
        const initStream = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true
                    }
                });
                if (mounted) {
                    setLocalStream(stream);
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                        await localVideoRef.current.play().catch(e => console.error('Local play error:', e));
                    }
                }
            } catch (err) {
                console.error('Failed to get media devices:', err);
            }
        };
        initStream();
        return () => {
            mounted = false;
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Initialize peer connection
    useEffect(() => {
        if (!authUser?._id || !localStream) return;

        const newPeer = new Peer(authUser._id, {
            host: '0.peerjs.com',
            secure: true,
            port: 443,
            debug: 3,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { 
                        urls: 'turn:numb.viagenie.ca',
                        username: 'webrtc@live.com',
                        credential: 'muazkh'
                    }
                ]
            },
            pingInterval: 3000,
            retryTimer: 1000,
            reconnectTimer: 3000
        });

        // Add connection timeout handler
        const connectionTimeout = setTimeout(() => {
            if (!newPeer.open) {
                console.error('Initial peer connection timeout');
                setPeerStatus('error');
                newPeer.destroy();
                setPeer(null);
            }
        }, 15000);

        newPeer.on('open', (id) => {
            clearTimeout(connectionTimeout);
            console.log('Peer connection opened with ID:', id);
            setPeer(newPeer);
            setPeerStatus('connected');
        });

        newPeer.on('error', (error) => {
            console.error('Peer connection error:', error);
            setPeerStatus('error');
            if (error.type !== 'network' && error.type !== 'disconnected') {
                setPeer(null);
            }
        });

        newPeer.on('disconnected', () => {
            console.log('Peer disconnected');
            setPeerStatus('disconnected');
            newPeer.reconnect();
        });

        newPeer.on('call', async (call) => {
            console.log('Receiving call from:', call.peer);
            try {
                call.answer(localStream);
                setCurrentCall(call);
                setCallStatus('connected');

                call.on('stream', (incomingStream) => {
                    console.log('Received remote stream in call answer');
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = incomingStream;
                        setRemoteStream(incomingStream);
                    }
                });

                call.on('close', () => {
                    console.log('Call closed by peer');
                    endCall();
                });

                call.on('error', (err) => {
                    console.error('Call error:', err);
                    endCall();
                });
            } catch (err) {
                console.error('Error answering call:', err);
                endCall();
            }
        });

        return () => {
            clearTimeout(connectionTimeout);
            if (newPeer) {
                newPeer.destroy();
            }
        };
    }, [authUser?._id, localStream]);

    const makeCall = async (receiverId) => {
        try {
            if (!peer || !peer.open) {
                const connectionPromise = new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Peer connection timeout'));
                    }, 10000);

                    const checkConnection = setInterval(() => {
                        if (peer?.open) {
                            clearInterval(checkConnection);
                            clearTimeout(timeout);
                            resolve();
                        }
                    }, 500);

                    peer?.once('open', () => {
                        clearInterval(checkConnection);
                        clearTimeout(timeout);
                        resolve();
                    });
                });

                await connectionPromise;
            }

            if (!localStream) {
                throw new Error('Local stream not available');
            }

            console.log('Making call to:', receiverId);
            const call = peer.call(receiverId, localStream);
            
            // Add call timeout
            const callTimeout = setTimeout(() => {
                if (callStatus !== 'connected') {
                    call.close();
                    throw new Error('Call connection timeout');
                }
            }, 30000);

            call.on('stream', (incomingStream) => {
                clearTimeout(callTimeout);
                setRemoteStream(incomingStream);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = incomingStream;
                }
                setCallStatus('connected');
            });

            call.on('close', () => {
                clearTimeout(callTimeout);
                endCall();
            });

            call.on('error', (error) => {
                clearTimeout(callTimeout);
                console.error('Call error:', error);
                endCall();
            });

            setCurrentCall(call);
            setCallStatus('calling');

        } catch (err) {
            console.error('Error making call:', err);
            setCallStatus('error');
            throw err;
        }
    };

    const toggleAudio = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
            }
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
            }
        }
    };

    return {
        localVideoRef,
        remoteVideoRef,
        callStatus,
        makeCall,
        endCall,
        peerStatus,
        toggleAudio,
        toggleVideo
    };
};

export default useVideoCall;