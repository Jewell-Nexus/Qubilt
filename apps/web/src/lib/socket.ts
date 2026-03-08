import { io, type Socket } from 'socket.io-client';

export const socket: Socket = io(import.meta.env.VITE_WS_URL || '/', {
  autoConnect: false,
  auth: {},
});

export function connectSocket(token: string): void {
  socket.auth = { token };
  socket.connect();
}

export function disconnectSocket(): void {
  socket.disconnect();
}
