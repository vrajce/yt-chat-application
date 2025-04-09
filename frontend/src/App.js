import Signup from './components/Signup';
import './App.css';
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import HomePage from './components/HomePage';
import Login from './components/Login';
import { useEffect } from 'react';
import { useSelector, useDispatch } from "react-redux";
import io from "socket.io-client";
import { setSocket } from './redux/socketSlice';
import { setOnlineUsers } from './redux/userSlice';
import { BASE_URL } from './config';  // Update this line

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const auth = useSelector(state => state.auth?.authUser);
  return auth ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const auth = useSelector(state => state.auth?.authUser);
  return auth ? <Navigate to="/" /> : children;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    )
  },
  {
    path: "/signup",
    element: (
      <PublicRoute>
        <Signup />
      </PublicRoute>
    )
  },
  {
    path: "/login",
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    )
  }
]);

function App() {
  const { authUser } = useSelector((state) => state.auth);  // Fixed selector
  const { socket } = useSelector((state) => state.socket);  // Consistent state naming
  const dispatch = useDispatch();

  useEffect(() => {
    if (authUser) {  // Now authUser is properly defined
      const socketio = io(`${BASE_URL}`, {
        query: {
          userId: authUser._id  // Now authUser is properly defined
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

        socketio.on('connect', () => {
            console.log('Socket connected');
            dispatch(setSocket(socketio));
        });

        socketio.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        socketio.on('getOnlineUsers', (onlineUsers) => {
            dispatch(setOnlineUsers(onlineUsers));
        });

        return () => {
            socketio.disconnect();
            dispatch(setSocket(null));
        };
    }
  }, [authUser, dispatch]);  // Now authUser is properly defined

  return (
    <div className="p-4 h-screen flex items-center justify-center">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
