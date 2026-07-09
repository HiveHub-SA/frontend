import { Component, OnInit, signal, inject } from '@angular/core';
import { OperacionSalaService, OperacionSalaResponse, ResumenSalaResponse, OperacionSalaRequest } from './operacion_sala.service';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-operacion-sala',
  templateUrl: './operacion_sala.component.html',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    FormsModule
  ],
})
export class OperacionSalaComponent implements OnInit {

  // Inyección de dependencias
  private readonly operacionService = inject(OperacionSalaService);

  // Declaración de estados mediante Signals
  resumen = signal<ResumenSalaResponse>({ totalMielExtraida: 0, alzasProcesadas: 0, alzasEnEspera: 0 });
  historial = signal<OperacionSalaResponse[]>([]);

  temporadaActual = signal<string>('2025/2026');
  mostrarModal = signal<boolean>(false);

  // Variables de estado del formulario
  tipoOperacionForm = signal<'INGRESO' | 'EXTRACCION'>('INGRESO');
  fechaForm = signal<string>('');
  cantidadAlzasForm = signal<number>(0);
  kilosMielForm = signal<number>(0);

  ngOnInit(): void {
    this.inicializarFecha();
    this.cargarDatosPantalla();
  }

  // Inicializa el campo de fecha con la fecha actual del sistema
  inicializarFecha(): void {
    this.fechaForm.set(new Date().toISOString().split('T')[0]);
  }

  // Realiza las peticiones HTTP para cargar los datos de la vista
  cargarDatosPantalla(): void {
    this.operacionService.obtenerResumen(this.temporadaActual()).subscribe({
      next: (data) => this.resumen.set(data),
      error: (err) => console.error('Error al cargar el resumen', err)
    });

    this.operacionService.obtenerHistorial(this.temporadaActual()).subscribe({
      next: (data) => this.historial.set(data),
      error: (err) => console.error('Error al cargar el historial', err)
    });
  }

  // Controles de interfaz y formulario
  abrirModal(): void {
    this.inicializarFecha();
    this.cantidadAlzasForm.set(0);
    this.kilosMielForm.set(0);
    this.tipoOperacionForm.set('INGRESO');
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
  }

  cambiarTipoFormulario(tipo: 'INGRESO' | 'EXTRACCION'): void {
    this.tipoOperacionForm.set(tipo);
  }

  incrementarAlzas(): void {
    this.cantidadAlzasForm.update(alzas => alzas + 1);
  }

  decrementarAlzas(): void {
    if (this.cantidadAlzasForm() > 0) {
      this.cantidadAlzasForm.update(alzas => alzas - 1);
    }
  }

  // Procesamiento y envío de datos al backend
  guardarRegistro(): void {
    if (this.cantidadAlzasForm() <= 0) {
      alert('La cantidad de alzas debe ser mayor a 0');
      return;
    }

    if (this.tipoOperacionForm() === 'EXTRACCION' && this.kilosMielForm() <= 0) {
      alert('Debe registrar los kilogramos de miel obtenidos');
      return;
    }

    const payload: OperacionSalaRequest = {
      fecha: this.fechaForm(),
      tipoOperacion: this.tipoOperacionForm(),
      cantidadAlzas: this.cantidadAlzasForm(),
      kilosMiel: this.tipoOperacionForm() === 'EXTRACCION' ? this.kilosMielForm() : undefined,
      temporada: this.temporadaActual()
    };

    this.operacionService.registrarOperacion(payload).subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarDatosPantalla();
      },
      error: (err) => {
        alert('Error en el registro.');
        console.error(err);
      }
    });
  }
}
