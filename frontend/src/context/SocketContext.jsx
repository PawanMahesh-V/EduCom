import React, { createContext, useContext, useEffect, useState } from 'react';
import socketService from '../services/socket';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
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
