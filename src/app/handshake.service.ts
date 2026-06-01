import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface BackendTestResponse {
  status: string;
  app: string;
  databaseConnection: string;
}

@Injectable({
  providedIn: 'root'
})
export class HandshakeService {
  private readonly backendUrl = 'http://localhost:8080/api/handshake';

  constructor(private http: HttpClient) {}

  initHandshake(): Promise<BackendTestResponse> {
    return firstValueFrom(this.http.get<BackendTestResponse>(this.backendUrl));
  }
}
