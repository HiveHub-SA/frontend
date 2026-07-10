import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectorUbicacionComponent } from '../selector-ubicacion/selector-ubicacion';

@Component({
  selector: 'app-mock-registrar-apiario',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectorUbicacionComponent],
  templateUrl: './mock-registrar-apiario.html',
  styleUrl: './mock-registrar-apiario.css'
})
export class MockRegistrarApiarioComponent {
  //variables del formulario
  public nombreApiario: string = '';
  public latitud: number | null = null;
  public longitud: number | null = null;

  //control para mostrar/ocultar el modal de la ventanita
  public mostrarModalMapa: boolean = false;

  //abre la ventanita del mapa
  public abrirMapa() {
    this.mostrarModalMapa = true;
  }

  //cierra la ventanita del mapa
  public cerrarMapa() {
    this.mostrarModalMapa = false;
  }

  //captura el evento del componente SelectorUbicacion
  public onUbicacionSeleccionada(coordenadas: { lat: number; lng: number }) {
    this.latitud = coordenadas.lat;
    this.longitud = coordenadas.lng;
  }

  //simulacion del envio de los datos al backend
  public simularGuardarApiario() {
    const apiarioPayload = {
      name: this.nombreApiario,
      latitude: this.latitud,
      longitude: this.longitud
    };

    console.clear();
    console.log("%c--- ENVIANDO APIARIO AL BACKEND ---", "color: #ffcc00; font-weight: bold;");
    console.table(apiarioPayload);
        
    // Reset temporal de prueba
    this.nombreApiario = '';
    this.latitud = null;
    this.longitud = null;
  }
}