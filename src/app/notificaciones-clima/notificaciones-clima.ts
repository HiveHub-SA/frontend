import { Component, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertasClimaService, AlertaExtrema } from '../modulo-climatico/alertas-clima.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-notificaciones-clima',
  imports: [CommonModule],
  templateUrl: './notificaciones-clima.html',
  styleUrl: './notificaciones-clima.css',
})
export class NotificacionesClima {
  public alertasService = inject(AlertasClimaService);
  mostrarDropdown = false;

  @ViewChild('dropdownBody') dropdownBody?: ElementRef<HTMLDivElement>;

  //variables que me permiten arrastrar las notificaciones
  private isDragging = false;
  private startY = 0;
  private scrollTop = 0;

  toggleDropdown(): void {
    this.mostrarDropdown = !this.mostrarDropdown;

    if (this.mostrarDropdown) {
      // esperamos a que Angular renderice el contenedor en el DOM
      setTimeout(() => {
        if (this.dropdownBody?.nativeElement) {
          const el = this.dropdownBody.nativeElement;
          // sirve para que Leaflet no intercepte ni anule los eventos de este contenedor
          L.DomEvent.disableScrollPropagation(el);
          L.DomEvent.disableClickPropagation(el);
        }
      });
    }
  }

  seleccionarAlerta(alerta: AlertaExtrema): void {
    this.mostrarDropdown = false;
  }

  startDragging(e: MouseEvent): void {
    if (!this.dropdownBody) return;
    this.isDragging = true;
    const el = this.dropdownBody.nativeElement;
    this.startY = e.pageY - el.offsetTop;
    this.scrollTop = el.scrollTop;
  }

  stopDragging(): void {
    this.isDragging = false;
  }

  onMouseMove(e: MouseEvent): void {
    if (!this.isDragging || !this.dropdownBody) return;
    e.preventDefault();
    const el = this.dropdownBody.nativeElement;
    const y = e.pageY - el.offsetTop;
    const walk = (y - this.startY) * 1.5; // Velocidad del desplazamiento
    el.scrollTop = this.scrollTop - walk;
  }

}