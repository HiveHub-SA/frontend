import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertasClimaService, AlertaExtrema } from '../modulo-climatico/alertas-clima.service';

@Component({
  selector: 'app-notificaciones-clima',
  imports: [CommonModule],
  templateUrl: './notificaciones-clima.html',
  styleUrl: './notificaciones-clima.css',
})
export class NotificacionesClima {

  public alertasService = inject(AlertasClimaService);

  mostrarDropdown = false;

  toggleDropdown(): void {
    this.mostrarDropdown = !this.mostrarDropdown;
  }

  seleccionarAlerta(alerta: AlertaExtrema): void {
    this.mostrarDropdown = false;
  }

}