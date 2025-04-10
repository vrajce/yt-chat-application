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
    const { authUser, selectedUser, onlineUsers } = useSelector(store => store.user);
    useGetMessages();
    useGetRealTimeMessage();
    const { messages } = useSelector(store => store.message);
    // 重複した selectedUser の宣言を削除

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
            <div className="flex items-center justify-between p-4 bg-zinc-800">
                <div className="flex items-center gap-3">
                    <div className={`avatar ${onlineUsers?.includes(selectedUser?._id) ? 'online' : ''}`}>
                        <div className="w-12 rounded-full">
                            <img src={selectedUser?.profilePhoto} alt="user-profile" />
                        </div>
                    </div>
                    <div className="flex flex-col flex-1">
                        <div className="flex gap-2">
                            <p className="text-white">{selectedUser?.fullName}</p>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={handleMakeCall}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                    <BsCameraVideo size={20} />
                    <span>Video Call</span>
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