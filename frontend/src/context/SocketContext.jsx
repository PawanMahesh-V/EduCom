import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import socketService from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const { user } = useAuth(); // Safely consuming identity metadata vectors from centralized context

  /* ==========================================================================
     1. LIFECYCLE CONNECTION MANAGER (Tied to state mutations)
     ========================================================================== */
  useEffect(() => {
    const userId = user?.id || user?.userId;
    
    if (userId) {
       const socketInstance = socketService.connect(userId);
       setSocket(socketInstance);
       
       const onConnect = () => {
         setIsConnected(true);
       };

       const onDisconnect = () => {
         setIsConnected(false);
       };

       socketInstance.on('connect', onConnect);
       socketInstance.on('disconnect', onDisconnect);

       // Intercept immediate connection status states safely
       if (socketInstance.connected) {
         setIsConnected(true);
       }

       // Explicit unmount channel cleanup mapping prevents memory leaks or cross-session leakages
       return () => {
         socketInstance.off('connect', onConnect);
         socketInstance.off('disconnect', onDisconnect);
         socketService.disconnect();
       };
    } else {
        // Enforce safe teardowns immediately upon user sign-off actions
        socketService.disconnect();
        setIsConnected(false);
        setSocket(null);
    }
  }, [user]);
  const contextValue = useMemo(() => ({
    socket,
    isConnected,
    socketService
  }), [socket, isConnected]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;