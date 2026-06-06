import { Socket, Channel } from 'phoenix';

type FrameCallback = (base64jpeg: string) => void;
type StatusCallback = (status: 'connected' | 'disconnected' | 'error', msg?: string) => void;

let socket: Socket | null = null;
let channel: Channel | null = null;

export function connectARServer(
  serverUrl: string,
  onFrame: FrameCallback,
  onStatus: StatusCallback,
) {
  if (socket) {
    socket.disconnect();
    socket = null;
    channel = null;
  }
  const fullUrl = serverUrl.replace(/\/+$/, '') + '/ws/websocket';
  socket = new Socket(fullUrl, {
    transport: WebSocket,
    heartbeatIntervalMs: 5000,
  });

  socket.onOpen(() => onStatus('connected'));
  socket.onClose(() => onStatus('disconnected'));
  socket.onError((err: any) => onStatus('error', String(err)));

  socket.connect();

  channel = socket.channel('ar_makeup:lobby', {});
  channel.on('frame', (payload: { data: string }) => {
    onFrame(payload.data);
  });
  channel.on('error', (payload: { message: string }) => {
    onStatus('error', payload.message);
  });

  channel
    .join()
    .receive('ok', () => onStatus('connected'))
    .receive('error', (resp: any) => onStatus('error', JSON.stringify(resp)))
    .receive('timeout', () => onStatus('error', 'join timeout'));
}

export function sendFrame(base64jpeg: string) {
  if (channel) {
    channel.push('frame', { data: base64jpeg });
  }
}

export function disconnectARServer() {
  if (channel) {
    channel.leave();
    channel = null;
  }
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
