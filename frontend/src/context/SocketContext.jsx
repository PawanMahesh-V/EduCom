import React, { createContext, useContext, useEffect, useState } from 'react';
import socketService from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const { user } = useAuth(); // consume user from AuthContext

  useEffect(() => {
    // Only connect if we have a valid logged-in user
    if (user?.id) {
       console.log('[SocketProvider] Initializing socket for user:', user.id);
       const socketInstance = socketService.connect(user.id);
       setSocket(socketInstance);
       
       const onConnect = () => {
         console.log('[SocketProvider] Socket connected');
         setIsConnected(true);
       };

       const onDisconnect = () => {
         console.log('[SocketProvider] Socket disconnected');
         setIsConnected(false);
       };

       socketInstance.on('connect', onConnect);
       socketInstance.on('disconnect', onDisconnect);

       // Check initial state
       if (socketInstance.connected) {
         setIsConnected(true);
       }

       return () => {
         socketInstance.off('connect', onConnect);
         socketInstance.off('disconnect', onDisconnect);
         // Optionally disconnect on unmount or user change
         socketService.disconnect();
       };
    } else {
        // If no user, ensure socket is disconnected
        socketService.disconnect();
        setIsConnected(false);
        setSocket(null);
    }
  }, [user]); // Re-run when user changes (login/logout)

  return (
    <SocketContext.Provider value={{ socket, isConnected, socketService }}>
      {children}
    </SocketContext.Provider>
  );
};
