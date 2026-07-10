import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { BackendTestResponse, HandshakeService } from '../handshake.service';
import { CommonModule } from '@angular/common';

//Esto es solo para pruebas
import { MockRegistrarApiarioComponent } from '../mock-registrar-apiario/mock-registrar-apiario';

type ConnectionState = 'idle' | 'checking' | 'connected' | 'failed';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink, RouterOutlet, CommonModule, MockRegistrarApiarioComponent],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio implements OnInit {
  protected readonly title = signal('frontend');
  protected readonly connectionState = signal<ConnectionState>('idle');
  protected readonly handshakeMessage = signal('Starting handshake...');

  constructor(private readonly handshakeService: HandshakeService) {}

  public verRegistroMock: boolean = false;

  async ngOnInit(): Promise<void> {
    this.connectionState.set('checking');
    this.handshakeMessage.set('Contacting backend on port 8080...');

    try {
      const response: BackendTestResponse = await this.handshakeService.initHandshake();
      this.connectionState.set('connected');
      this.handshakeMessage.set(
        `${response.app} is ${response.status} (database: ${response.databaseConnection})`
      );
    } catch (error) {
      this.connectionState.set('failed');
      this.handshakeMessage.set('Could not connect to the backend at http://localhost:8080/api/handshake');
      console.error('[Handshake] Backend connection failed.', error);
    }
  }
}
