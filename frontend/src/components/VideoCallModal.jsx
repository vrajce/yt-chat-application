import React, { useEffect, useState } from 'react';
import useVideoCall from '../hooks/useVideoCall';
import { IoMdClose } from "react-icons/io";
import { BsMicFill, BsMicMuteFill, BsCameraVideoFill, BsCameraVideoOffFill } from "react-icons/bs";
import { useTranslation } from '../hooks/useTranslation';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';  // Add this import

const VideoCallModal = ({ receiverId, onClose }) => {
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [showSubtitles, setShowSubtitles] = useState(true);
    const { socket } = useSelector(store => store.socket);  // Add this line
    
    const {
        localVideoRef,
        remoteVideoRef,
        callStatus,
        endCall,
        makeCall,
        peerStatus,
        toggleAudio,
        toggleVideo
    } = useVideoCall();

    const { startTranslation, stopTranslation, translatedText } = useTranslation();

    useEffect(() => {
        let mounted = true;
        let retryCount = 0;
        const maxRetries = 3;
        const retryInterval = 3000;

        const initializeCall = async () => {
            if (!receiverId || !mounted) return;
            
            const attemptCall = async () => {
                try {
                    await makeCall(receiverId);
                    return true;
                } catch (err) {
                    console.error('Call attempt failed:', err);
                    return false;
                }
            };

            const tryCall = async () => {
                while (retryCount < maxRetries && mounted) {
                    if (await attemptCall()) {
                        return;
                    }
                    retryCount++;
                    if (retryCount < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, retryInterval));
                    }
                }
                if (mounted) {
                    console.error('Failed to establish peer connection after retries');
                    toast.error('Failed to connect. Please try again.');
                    onClose();
                }
            };

            tryCall();
        };

        initializeCall();

        return () => {
            mounted = false;
            endCall();
        };
    }, [receiverId, peerStatus]);

    const handleEndCall = () => {
        if (socket) {
            socket.emit('endCall', { to: receiverId });
        }
        endCall();
        onClose();
    };

    useEffect(() => {
        let mounted = true;

        if (socket) {
            socket.on('callEnded', () => {
                if (mounted) {
                    endCall();
                    onClose();
                }
            });
        }

        return () => {
            mounted = false;
            if (socket) {
                socket.off('callEnded');
            }
        };
    }, [socket, onClose]);

    const handleToggleAudio = () => {
        toggleAudio();
        setIsAudioEnabled(!isAudioEnabled);
    };

    const handleToggleVideo = () => {
        toggleVideo();
        setIsVideoEnabled(!isVideoEnabled);
    };

    useEffect(() => {
        if (showSubtitles) {
            startTranslation();
        } else {
            stopTranslation();
        }
    }, [showSubtitles]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-4 rounded-lg w-[800px]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl text-white font-semibold">Video Call</h3>
                    <button 
                        onClick={handleEndCall}
                        className="text-white hover:text-red-500"
                    >
                        <IoMdClose size={24} />
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-4 h-[400px]">
                    <div className="relative h-full">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-contain rounded-lg bg-gray-800 ${!isVideoEnabled ? 'hidden' : ''}`}
                        />
                        {!isVideoEnabled && (
                            <div className="w-full h-full flex items-center justify-center bg-gray-700 rounded-lg">
                                <span className="text-white text-xl">Camera Off</span>
                            </div>
                        )}
                        <p className="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                            You
                        </p>
                    </div>
                    <div className="relative h-full">
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-contain rounded-lg bg-gray-800"
                        />
                        <p className="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                            Remote User
                        </p>
                        {showSubtitles && translatedText && (
                            <div className="absolute bottom-10 left-0 right-0 text-center">
                                <p className="text-white bg-black bg-opacity-75 px-4 py-2 rounded mx-2 text-sm">
                                    {translatedText}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex justify-center items-center gap-4 mt-4">
                    <button
                        onClick={handleToggleAudio}
                        className={`p-3 rounded-full ${isAudioEnabled ? 'bg-gray-600' : 'bg-red-500'}`}
                    >
                        {isAudioEnabled ? <BsMicFill size={20} className="text-white" /> : <BsMicMuteFill size={20} className="text-white" />}
                    </button>
                    <button
                        onClick={handleToggleVideo}
                        className={`p-3 rounded-full ${isVideoEnabled ? 'bg-gray-600' : 'bg-red-500'}`}
                    >
                        {isVideoEnabled ? <BsCameraVideoFill size={20} className="text-white" /> : <BsCameraVideoOffFill size={20} className="text-white" />}
                    </button>
                    <button
                        onClick={() => setShowSubtitles(!showSubtitles)}
                        className={`px-4 py-2 rounded ${showSubtitles ? 'bg-blue-500' : 'bg-gray-600'} text-white`}
                    >
                        {showSubtitles ? 'Hide Subtitles' : 'Show Subtitles'}
                    </button>
                    <button
                        onClick={handleEndCall}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                    >
                        End Call
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoCallModal;