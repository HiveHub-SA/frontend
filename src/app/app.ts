import { Component, OnInit, signal } from '@angular/core';

import { BackendTestResponse, HandshakeService } from './handshake.service';
import { RouterOutlet } from '@angular/router';

type ConnectionState = 'idle' | 'checking' | 'connected' | 'failed';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  imports: [RouterOutlet],
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('frontend');
  protected readonly connectionState = signal<ConnectionState>('idle');
  protected readonly handshakeMessage = signal('Starting handshake...');

  constructor(private readonly handshakeService: HandshakeService) {}

  async ngOnInit(): Promise<void> {
    this.connectionState.set('checking');
    this.handshakeMessage.set('Contacting backend on port 8080...');

    try {
      const response: BackendTestResponse = await this.handshakeService.initHandshake();
      this.connectionState.set('connected');
      this.handshakeMessage.set(
        `${response.app} is ${response.status} (database: ${response.databaseConnection})`,
      );
    } catch (error) {
      this.connectionState.set('failed');
      this.handshakeMessage.set(
        'Could not connect to the backend at http://localhost:8080/api/handshake',
      );
      console.error('[Handshake] Backend connection failed.', error);
    }
  }
}
