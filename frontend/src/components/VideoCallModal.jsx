import React, { useEffect } from 'react';  // Add useEffect import
import useVideoCall from '../hooks/useVideoCall';
import { IoMdClose } from "react-icons/io";

const VideoCallModal = ({ receiverId, onClose }) => {
    const {
        localVideoRef,
        remoteVideoRef,
        callStatus,
        endCall,
        makeCall
    } = useVideoCall();

    // Call the receiver when modal opens
    useEffect(() => {
        if (receiverId) {
            makeCall(receiverId);
        }
    }, [receiverId]);

    const handleEndCall = () => {
        endCall();
        onClose();
    };

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
                <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover rounded-lg bg-gray-800"
                        />
                        <p className="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                            You
                        </p>
                    </div>
                    <div className="relative">
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover rounded-lg bg-gray-800"
                        />
                        <p className="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                            Remote User
                        </p>
                    </div>
                </div>
                <div className="flex justify-center mt-4">
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