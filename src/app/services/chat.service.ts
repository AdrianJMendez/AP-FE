import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatConversation {
  idConversation: number;
  idProduct: number;
  productName: string;
  productImage: string | null;
  otherUserId: number;
  otherUserName: string;
  lastMessage: string;
  lastMessageAt: string | null;
}

export interface ChatMessage {
  idMessage: number;
  idConversation: number;
  idSenderUser: number;
  messageText: string;
  createdAt: string;
  recipientUserId?: number;
}

export interface ChatApiResponse<T> {
  data: T;
  meta?: Array<{ status?: number; message?: string; criticity?: number }>;
  hasError?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/chats`;

  openConversation(idProduct: number, idBuyerUser: number): Observable<ChatApiResponse<ChatConversation>> {
    return this.http.post<ChatApiResponse<ChatConversation>>(`${this.apiUrl}/open`, {
      idProduct,
      idBuyerUser
    });
  }

  getUserConversations(idUser: number): Observable<ChatApiResponse<ChatConversation[]>> {
    return this.http.get<ChatApiResponse<ChatConversation[]>>(`${this.apiUrl}/user/${idUser}`);
  }

  getConversationMessages(
    idConversation: number,
    idUser: number
  ): Observable<ChatApiResponse<ChatMessage[]>> {
    return this.http.get<ChatApiResponse<ChatMessage[]>>(
      `${this.apiUrl}/${idConversation}/messages`,
      {
        params: { idUser: idUser.toString() }
      }
    );
  }
}
