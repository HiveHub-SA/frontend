import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { OperacionSalaService, OperacionSalaResponse, ResumenSalaResponse, OperacionSalaRequest, Region, Apiario } from './operacion_sala.service';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  resumen = signal<ResumenSalaResponse>({ totalMielExtraida: 0, alzasProcesadas: 0, alzasEnEspera: 0 });
  historial = signal<OperacionSalaResponse[]>([]);
  regiones = signal<Region[]>([]);
  regionActiva = signal<Region | null>(null);
  apiarios = signal<Apiario[]>([]);
  
  // Apiarios filtrados para la región activa
  apiariosFiltrados = computed(() => {
    const region = this.regionActiva();
    if (!region) return [];
    return this.apiarios().filter(a => a.regionId === region.id);
  });

  temporadaActual = signal<string>('');
  mostrarModal = signal<boolean>(false);
  mostrarModalRegion = signal<boolean>(false);

  // Variables de estado del formulario de operación
  tipoOperacionForm = signal<'INGRESO' | 'EXTRACCION'>('INGRESO');
  fechaForm = signal<string>('');
  cantidadAlzasForm = signal<number>(0);
  kilosMielForm = signal<number>(0);
  apiariosSeleccionadosForm = signal<number[]>([]);

  // Variables de estado del formulario de región
  nombreRegionForm = signal<string>('');
  inicioTemporadaMesForm = signal<number>(11);
  finTemporadaMesForm = signal<number>(3);
  creandoNuevaRegion = signal<boolean>(false);

  ngOnInit(): void {
    this.inicializarFecha();
    this.cargarRegionesYApiarios();
  }

  // Inicializa el campo de fecha con la fecha actual del sistema
  inicializarFecha(): void {
    this.fechaForm.set(new Date().toISOString().split('T')[0]);
  }

  // Carga regiones y apiarios inicialmente
  cargarRegionesYApiarios(): void {
    this.operacionService.obtenerRegiones().subscribe({
      next: (regs) => {
        this.regiones.set(regs);
        if (regs.length > 0) {
          this.regionActiva.set(regs[0]);
          this.recalcularTemporada();
          this.cargarDatosPantalla();
        }
      },
      error: (err) => console.error('Error al cargar regiones', err)
    });

    this.operacionService.obtenerApiarios().subscribe({
      next: (apis) => this.apiarios.set(apis),
      error: (err) => console.error('Error al cargar apiarios', err)
    });
  }

  // Recalcula la temporada actual basada en la fecha de hoy y el mes de inicio de la región activa
  recalcularTemporada(): void {
    const region = this.regionActiva();
    if (!region) return;

    const hoy = new Date();
    const mes = hoy.getMonth() + 1; // 1-12
    const anio = hoy.getFullYear();
    const inicio = region.inicioTemporadaMes;

    if (mes >= inicio) {
      this.temporadaActual.set(`${anio}/${anio + 1}`);
    } else {
      this.temporadaActual.set(`${anio - 1}/${anio}`);
    }
  }

  // Realiza las peticiones HTTP para cargar los datos de la vista según la región activa y temporada
  cargarDatosPantalla(): void {
    const region = this.regionActiva();
    const temp = this.temporadaActual();
    if (!region || !temp) return;

    this.operacionService.obtenerResumen(region.id, temp).subscribe({
      next: (data) => this.resumen.set(data),
      error: (err) => console.error('Error al cargar el resumen', err)
    });

    this.operacionService.obtenerHistorial(region.id, temp).subscribe({
      next: (data) => this.historial.set(data),
      error: (err) => console.error('Error al cargar el historial', err)
    });
  }

  // Cambiar la región activa seleccionada
  seleccionarRegion(region: Region): void {
    this.regionActiva.set(region);
    this.recalcularTemporada();
    this.cargarDatosPantalla();
  }

  // Controles de modal de región
  abrirModalRegion(): void {
    const active = this.regionActiva();
    if (active) {
      this.nombreRegionForm.set(active.nombre);
      this.inicioTemporadaMesForm.set(active.inicioTemporadaMes);
      this.finTemporadaMesForm.set(active.finTemporadaMes);
    }
    this.creandoNuevaRegion.set(false);
    this.mostrarModalRegion.set(true);
  }

  cerrarModalRegion(): void {
    this.mostrarModalRegion.set(false);
  }

  activarNuevaRegionForm(): void {
    this.nombreRegionForm.set('');
    this.inicioTemporadaMesForm.set(11);
    this.finTemporadaMesForm.set(3);
    this.creandoNuevaRegion.set(true);
  }

  cancelarNuevaRegion(): void {
    this.creandoNuevaRegion.set(false);
    const active = this.regionActiva();
    if (active) {
      this.nombreRegionForm.set(active.nombre);
      this.inicioTemporadaMesForm.set(active.inicioTemporadaMes);
      this.finTemporadaMesForm.set(active.finTemporadaMes);
    }
  }

  guardarRegion(): void {
    if (!this.nombreRegionForm().trim()) {
      alert('Debe ingresar un nombre para la región.');
      return;
    }

    const payload = {
      nombre: this.nombreRegionForm(),
      inicioTemporadaMes: +this.inicioTemporadaMesForm(),
      finTemporadaMes: +this.finTemporadaMesForm()
    };

    if (this.creandoNuevaRegion()) {
      this.operacionService.crearRegion(payload).subscribe({
        next: (nueva) => {
          this.regiones.update(regs => [...regs, nueva]);
          this.seleccionarRegion(nueva);
          this.cerrarModalRegion();
        },
        error: (err) => {
          alert('Error al crear la región.');
          console.error(err);
        }
      });
    } else {
      const active = this.regionActiva();
      if (!active) return;

      this.operacionService.actualizarRegion(active.id, payload).subscribe({
        next: (actualizada) => {
          this.regiones.update(regs => regs.map(r => r.id === actualizada.id ? actualizada : r));
          this.seleccionarRegion(actualizada);
          this.cerrarModalRegion();
        },
        error: (err) => {
          alert('Error al actualizar la región.');
          console.error(err);
        }
      });
    }
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
  }

  incrementarAlzas(): void {
    this.cantidadAlzasForm.update(alzas => alzas + 1);
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

  esFechaValidaParaRegion(fechaStr: string, region: Region): boolean {
    if (!fechaStr) return false;
    const parts = fechaStr.split('-');
    const mes = +parts[1]; // 1-12
    const inicio = region.inicioTemporadaMes;
    const fin = region.finTemporadaMes;

    if (inicio <= fin) {
      return mes >= inicio && mes <= fin;
    } else {
      return mes >= inicio || mes <= fin;
    }
  }

  // Procesamiento y envío de datos al backend
  guardarRegistro(): void {
    const region = this.regionActiva();
    if (!region) {
      alert('Debe tener una región seleccionada.');
      return;
    }

    if (!this.esFechaValidaParaRegion(this.fechaForm(), region)) {
      const inicioMesNombre = this.mesesSelect.find(m => m.value === region.inicioTemporadaMes)?.label;
      const finMesNombre = this.mesesSelect.find(m => m.value === region.finTemporadaMes)?.label;
      alert(`La fecha seleccionada está fuera de la temporada activa configurada para la región ${region.nombre} (${inicioMesNombre} a ${finMesNombre}).`);
      return;
    }

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
      regionId: region.id,
      apiariosIds: this.apiariosSeleccionadosForm()
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
