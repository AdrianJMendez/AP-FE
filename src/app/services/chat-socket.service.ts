import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { ChatMessage } from './chat.service';

type SocketEvent =
  | { type: 'connected'; payload: { userId: number } }
  | { type: 'chat_message'; payload: ChatMessage }
  | { type: 'error'; message: string }
  | { type: string; payload?: unknown; message?: string };

@Injectable({
  providedIn: 'root'
})
export class ChatSocketService {
  private socket: WebSocket | null = null;
  private connectedUserId: number | null = null;

  readonly events$ = new Subject<SocketEvent>();

  connect(userId: number) {
    if (!userId) return;

    if (this.socket && this.connectedUserId === userId) {
      return;
    }

    this.disconnect();

    const socketUrl = `${this.resolveSocketBaseUrl()}?userId=${userId}`;
    this.socket = new WebSocket(socketUrl);
    this.connectedUserId = userId;

    this.socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as SocketEvent;
        this.events$.next(parsed);
      } catch {
        this.events$.next({ type: 'error', message: 'No se pudo leer el mensaje del socket.' });
      }
    };

    this.socket.onclose = () => {
      this.events$.next({ type: 'error', message: 'La conexión de chat se cerró.' });
      this.socket = null;
      this.connectedUserId = null;
    };

    this.socket.onerror = () => {
      this.events$.next({ type: 'error', message: 'No se pudo conectar el chat en tiempo real.' });
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connectedUserId = null;
  }

  sendMessage(idConversation: number, messageText: string) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('El canal de chat no está conectado.');
    }

    this.socket.send(
      JSON.stringify({
        type: 'send_message',
        payload: {
          idConversation,
          messageText
        }
      })
    );
  }

  private resolveSocketBaseUrl() {
    if (environment.wsUrl) {
      return environment.wsUrl;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  }
}
