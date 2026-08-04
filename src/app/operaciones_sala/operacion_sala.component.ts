import { Component, OnInit, signal, computed, inject, effect } from '@angular/core';
import { OperacionSalaService, OperacionSalaResponse, ResumenSalaResponse, OperacionSalaRequest, Apiario } from './operacion_sala.service';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarService } from '../navbar/navbar.service';

@Component({
  selector: 'app-operacion-sala',
  templateUrl: './operacion_sala.component.html',
  styleUrl: './operacion_sala.component.css',
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
  private readonly navbarService = inject(NavbarService);

  constructor() {
    effect(() => {
      const isModalOpen = this.mostrarModal();
      this.navbarService.setDisabled(isModalOpen);
    });
  }

  // Nombres cortos de meses para display
  nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  mesesSelect = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  // Declaración de estados mediante Signals
  apiarios = signal<Apiario[]>([]);
  resumen = signal<ResumenSalaResponse>({ totalMielExtraida: 0, alzasProcesadas: 0, alzasEnEspera: 0 });
  historial = signal<OperacionSalaResponse[]>([]);
  // Apiarios que tienen al menos un ingreso registrado en la temporada actual (según historial)
  apiariosConIngreso = computed(() => {
    const historialActual = this.historial();
    const apiariosTotales = this.apiarios();

    const nombresConIngreso = new Set<string>();
    historialActual
      .filter(op => op.tipoOperacion === 'INGRESO')
      .forEach(op => {
        op.apiariosNombres?.forEach(nombre => nombresConIngreso.add(nombre));
      });

    return apiariosTotales.filter(ap => nombresConIngreso.has(ap.name));
  });

  // Apiarios expuestos para la vista según el tipo de operación
  apiariosFiltrados = computed(() => {
    if (this.tipoOperacionForm() === 'EXTRACCION') {
      return this.apiariosConIngreso();
    }
    return this.apiarios();
  });

  temporadaActual = signal<string>('');
  mostrarModal = signal<boolean>(false);

  // Variables de estado del formulario de operación
  tipoOperacionForm = signal<'INGRESO' | 'EXTRACCION'>('INGRESO');
  fechaForm = signal<string>('');
  cantidadAlzasForm = signal<number>(0);
  kilosMielForm = signal<number>(0);
  apiariosSeleccionadosForm = signal<number[]>([]);

  ngOnInit(): void {
    this.inicializarFecha();
    this.cargarApiariosYDatos();
  }

  // Inicializa el campo de fecha con la fecha actual del sistema
  inicializarFecha(): void {
    this.fechaForm.set(new Date().toISOString().split('T')[0]);
  }

  // Carga apiarios y datos de la pantalla
  cargarApiariosYDatos(): void {
    this.operacionService.obtenerApiarios().subscribe({
      next: (apis) => {
        this.apiarios.set(apis);
        this.recalcularTemporada();
        this.cargarDatosPantalla();
      },
      error: (err) => console.error('Error al cargar apiarios', err)
    });
  }

  // Recalcula la temporada actual basada en la fecha de hoy (inicio de temporada por defecto: Noviembre)
  recalcularTemporada(): void {
    const hoy = new Date();
    const mes = hoy.getMonth() + 1; // 1-12
    const anio = hoy.getFullYear();
    const inicio = 11; // Noviembre por defecto

    if (mes >= inicio) {
      this.temporadaActual.set(`${anio}/${anio + 1}`);
    } else {
      this.temporadaActual.set(`${anio - 1}/${anio}`);
    }
  }

  // Realiza las peticiones HTTP para cargar los datos de la vista según la temporada
  cargarDatosPantalla(): void {
    const temp = this.temporadaActual();
    if (!temp) return;

    this.operacionService.obtenerResumen(temp).subscribe({
      next: (data) => this.resumen.set(data),
      error: (err) => console.error('Error al cargar el resumen', err)
    });

    this.operacionService.obtenerHistorial(temp).subscribe({
      next: (data) => this.historial.set(data),
      error: (err) => console.error('Error al cargar el historial', err)
    });
  }

  // Controles de interfaz de registro de operación
  abrirModal(): void {
    this.inicializarFecha();
    this.cantidadAlzasForm.set(0);
    this.kilosMielForm.set(0);
    this.tipoOperacionForm.set('INGRESO');
    this.apiariosSeleccionadosForm.set([]);
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
  }

  cambiarTipoFormulario(tipo: 'INGRESO' | 'EXTRACCION'): void {
    this.tipoOperacionForm.set(tipo);
    if (tipo === 'EXTRACCION') {
      if (this.cantidadAlzasForm() > this.resumen().alzasEnEspera) {
        this.cantidadAlzasForm.set(this.resumen().alzasEnEspera);
      }
      const permitidosIds = new Set(this.apiariosConIngreso().map(a => a.id));
      this.apiariosSeleccionadosForm.update(ids => ids.filter(id => permitidosIds.has(id)));
    }
  }

  incrementarAlzas(): void {
    if (this.tipoOperacionForm() === 'EXTRACCION') {
      if (this.cantidadAlzasForm() < this.resumen().alzasEnEspera) {
        this.cantidadAlzasForm.update(alzas => alzas + 1);
      }
    } else {
      this.cantidadAlzasForm.update(alzas => alzas + 1);
    }
  }

  decrementarAlzas(): void {
    if (this.cantidadAlzasForm() > 0) {
      this.cantidadAlzasForm.update(alzas => alzas - 1);
    }
  }

  toggleApiarioSeleccionado(id: number): void {
    this.apiariosSeleccionadosForm.update(ids => {
      if (ids.includes(id)) {
        return ids.filter(x => x !== id);
      } else {
        return [...ids, id];
      }
    });
  }

  // Procesamiento y envío de datos al backend
  guardarRegistro(): void {
    if (this.cantidadAlzasForm() <= 0) {
      alert('La cantidad de alzas debe ser mayor a 0');
      return;
    }

    if (this.tipoOperacionForm() === 'EXTRACCION') {
      if (this.kilosMielForm() <= 0) {
        alert('Debe registrar los kilogramos de miel obtenidos');
        return;
      }
      if (this.cantidadAlzasForm() > this.resumen().alzasEnEspera) {
        alert(`No se pueden procesar más alzas de las que están en espera en la sala. Alzas disponibles: ${this.resumen().alzasEnEspera}`);
        return;
      }
      if (this.apiariosSeleccionadosForm().length === 0) {
        alert('Debe seleccionar al menos un apiario con ingreso registrado para realizar la extracción.');
        return;
      }
    }

    const payload: OperacionSalaRequest = {
      fecha: this.fechaForm(),
      tipoOperacion: this.tipoOperacionForm(),
      cantidadAlzas: this.cantidadAlzasForm(),
      kilosMiel: this.tipoOperacionForm() === 'EXTRACCION' ? this.kilosMielForm() : undefined,
      apiariosIds: this.apiariosSeleccionadosForm()
    };

    this.operacionService.registrarOperacion(payload).subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarDatosPantalla();
      },
      error: (err) => {
        const errorMsg = err?.error?.message || (typeof err?.error === 'string' ? err.error : 'Error en el registro de operación.');
        alert(errorMsg);
        console.error(err);
      }
    });
  }
}
