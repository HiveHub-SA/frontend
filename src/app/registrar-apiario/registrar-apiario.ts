import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectorUbicacionComponent } from '../selector-ubicacion/selector-ubicacion';
import { ApiarioService } from '../apiarios/apiario.service';

@Component({
  selector: 'app-registrar-apiario',
  imports: [CommonModule, FormsModule, SelectorUbicacionComponent],
  templateUrl: './registrar-apiario.html',
  styleUrl: './registrar-apiario.css'
})
export class RegistrarApiarioComponent {

  visible = input.required<boolean>();

  creado = output<any>();
  cancelado = output<void>();

  name: string = '';
  latitude: number | null = null;
  longitude: number | null = null;

  mostrarModalMapa = false;

  loading = false;
  errorMessage: string | null = null;

  constructor(
    private apiarioService: ApiarioService,
  ) {}

  onBackdropClick() {
    if (this.loading) return;
    this.cerrar()
  }

  cerrar() {
    if (this.loading) return;
    this.cleanForm();
    this.cancelado.emit();
  }

  abrirMapa() {
    this.mostrarModalMapa = true;
  }

  cerrarMapa() {
    this.mostrarModalMapa = false;
  }

  onUbicacionSeleccionada(coordenadas: { lat: number; lng: number }) {
    this.latitude = coordenadas.lat;
    this.longitude = coordenadas.lng;
  }

  cleanForm(){
    this.name = '';
    this.latitude = null;
    this.longitude = null;
    this.errorMessage = null;
  }

  createApiario() {
    if (!this.name || !this.latitude || !this.longitude) return;

    this.loading = true;
    this.errorMessage = null;

    const newApiario = {
      name: this.name,
      latitude: this.latitude,
      longitude: this.longitude,
    };

    this.apiarioService.createApiario(newApiario).subscribe({
      next: (respuesta) => {
        this.loading = false;
        console.log('apiario creado', respuesta);
        this.creado.emit(respuesta)
        this.cleanForm();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error al crear apiario', error);
        this.errorMessage = 'Error al crear apiario. Por favor, inténtalo de nuevo.';
      },
    });
    }
}
