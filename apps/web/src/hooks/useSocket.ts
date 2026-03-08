import { useEffect, useState } from 'react';
import { socket, connectSocket, disconnectSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth.store';

export function useSocket() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      disconnectSocket();
      setConnected(false);
      return;
    }

    connectSocket(accessToken);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      disconnectSocket();
    };
  }, [accessToken]);

  return { socket, connected };
}
