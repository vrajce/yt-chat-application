import React from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const VideoCallNotification = ({ callerId, onAccept, onReject }) => {
  const { otherUsers } = useSelector(store => store.user);
  const caller = otherUsers?.find(user => user._id === callerId);

  return (
    <div className="fixed top-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50">
      <h3 className="text-lg font-semibold mb-2">Incoming Call</h3>
      <p className="mb-4">{caller?.fullName} is calling...</p>
      <div className="flex gap-2">
        <button 
          onClick={onAccept}
          className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded"
        >
          Accept
        </button>
        <button 
          onClick={onReject}
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
        >
          Reject
        </button>
      </div>
    </div>
  );
};

export default VideoCallNotification;