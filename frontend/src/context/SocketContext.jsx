import React, { createContext, useContext, useEffect, useState } from 'react';
import socketService from '../services/socket';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Get user from session storage
    // In a more complex app, this might come from an AuthContext
    const raw = sessionStorage.getItem('user');
    const user = raw ? JSON.parse(raw) : null;
    const userId = user?.id || user?.userId;

    if (userId) {
       console.log('[SocketProvider] Initializing socket for user:', userId);
       const socketInstance = socketService.connect(userId);
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
         // We generally don't disconnect the socket on unmount unless the user actively logs out,
         // but we should remove *these* specific listeners to avoid leaks.
         socketInstance.off('connect', onConnect);
         socketInstance.off('disconnect', onDisconnect);
       };
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, socketService }}>
      {children}
    </SocketContext.Provider>
  );
};
