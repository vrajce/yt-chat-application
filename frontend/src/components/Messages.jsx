import React, { useState, useEffect } from 'react';
import Message from './Message';
import useGetMessages from '../hooks/useGetMessages';
import { useSelector } from "react-redux";
import useGetRealTimeMessage from '../hooks/useGetRealTimeMessage';
import { BsCameraVideo } from 'react-icons/bs';
import VideoCallModal from './VideoCallModal';
import VideoCallNotification from './VideoCallNotification';
import toast from 'react-hot-toast';

const Messages = () => {
    const [isVideoCallActive, setIsVideoCallActive] = useState(false);
    const [incomingCall, setIncomingCall] = useState(null);
    const { socket } = useSelector(store => store.socket);
    const { authUser } = useSelector(store => store.user);
    useGetMessages();
    useGetRealTimeMessage();
    const { messages } = useSelector(store => store.message);
    const { selectedUser } = useSelector(store => store.user);

    useEffect(() => {
        if (!socket) return;

        socket.on('incomingCall', ({ from }) => {
            setIncomingCall(from);
        });

        socket.on('callResponse', ({ accepted }) => {
            if (accepted) {
                setIsVideoCallActive(true);
            } else {
                toast.error('Call was rejected');
            }
        });

        return () => {
            socket.off('incomingCall');
            socket.off('callResponse');
        };
    }, [socket]);

    const handleMakeCall = () => {
        if (socket && selectedUser) {
            socket.emit('initiateCall', {
                from: authUser._id,
                to: selectedUser._id
            });
        }
    };

    const handleAcceptCall = () => {
        if (socket && incomingCall) {
            socket.emit('callResponse', {
                to: incomingCall,
                accepted: true
            });
            setIsVideoCallActive(true);
            setIncomingCall(null);
        }
    };

    const handleRejectCall = () => {
        if (socket && incomingCall) {
            socket.emit('callResponse', {
                to: incomingCall,
                accepted: false
            });
            setIncomingCall(null);
        }
    };

    return (
        <>
            <div className="flex justify-between items-center px-4 py-2 bg-gray-700">
                <h2 className="text-white">{selectedUser?.fullName}</h2>
                <button 
                    onClick={handleMakeCall}
                    className="text-white p-2 hover:bg-gray-600 rounded-full"
                >
                    <BsCameraVideo size={20} />
                </button>
            </div>
            <div className='px-4 flex-1 overflow-auto'>
                {messages && messages?.map((message) => (
                    <Message key={message._id} message={message} />
                ))}
            </div>
            {isVideoCallActive && (
                <VideoCallModal 
                    receiverId={selectedUser?._id}
                    onClose={() => setIsVideoCallActive(false)}
                />
            )}
            {incomingCall && (
                <VideoCallNotification
                    callerId={incomingCall}
                    onAccept={handleAcceptCall}
                    onReject={handleRejectCall}
                />
            )}
        </>
    );
};

export default Messages;