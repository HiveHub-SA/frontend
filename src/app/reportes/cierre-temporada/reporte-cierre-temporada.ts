import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../navbar/navbar.component';
import { ReporteService } from '../reporte.service';
import {
  ReporteCierreTemporadaDTO,
  RendimientoApiarioDTO,
  RendimientoFloracionDTO,
  EficienciaBiologicaDTO,
  PrioridadApiarioDTO,
  ComparativaInteranualDTO
} from '../reporte.model';

@Component({
  selector: 'app-reporte-cierre-temporada',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './reporte-cierre-temporada.html',
  styleUrl: './reporte-cierre-temporada.css'
})
export class ReporteCierreTemporadaComponent implements OnInit {

  // Fechas del rango de temporada
  fechaInicio = signal<string>('');
  fechaFin = signal<string>('');

  // Temporadas detectadas en backend
  temporadas = signal<string[]>([]);
  temporadaSeleccionada = signal<string>('');
  mostrarFiltroFechas = signal<boolean>(false);
  mostrarAyudaPrioridad = signal<boolean>(false);
  mostrarAyudaRendimiento = signal<boolean>(false);

  // Datos consolidados
  reporte = signal<ReporteCierreTemporadaDTO | null>(null);
  loading = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Pestaña activa
  pestanaActiva = signal<'DETALLE' | 'FLORACION' | 'BIOLOGIA'>('DETALLE');

  // Métrica del gráfico de barras
  metricaGraficoApiarios = signal<'KILOS' | 'ALZAS' | 'RINDE_COLMENA'>('KILOS');

  // Paleta fija Neo-Brutalista identitaria por Apiario (Mejora #5)
  private readonly PALETA_APIARIOS: string[] = [
    '#ffb300', // Ámbar dorado HiveHub
    '#42a5f5', // Azul cielo
    '#66bb6a', // Verde fresco
    '#ff7043', // Naranja coral
    '#ab47bc', // Púrpura
    '#26a69a', // Verde azulado
    '#ffa726', // Naranja cálido
    '#8d6e63', // Café tierra
    '#5c6bc0', // Índigo
    '#ec407a'  // Rosa vibrante
  ];

  constructor(private reporteService: ReporteService) {}

  ngOnInit(): void {
    const now = new Date();
    const currentYear = now.getMonth() >= 10 ? now.getFullYear() : now.getFullYear() - 1;
    this.fechaInicio.set(`${currentYear}-11-01`);
    this.fechaFin.set(`${currentYear + 1}-10-31`);
    this.temporadaSeleccionada.set(`${currentYear}/${currentYear + 1}`);

    this.cargarTemporadas();
    this.consultarReporte();
  }

  cargarTemporadas(): void {
    this.reporteService.getTemporadasDisponibles().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.temporadas.set(data);
        } else {
          const defaultYear = new Date().getFullYear();
          this.temporadas.set([`${defaultYear - 1}/${defaultYear}`, `${defaultYear}/${defaultYear + 1}`]);
        }
      },
      error: () => {
        const defaultYear = new Date().getFullYear();
        this.temporadas.set([`${defaultYear - 1}/${defaultYear}`, `${defaultYear}/${defaultYear + 1}`]);
      }
    });
  }

  seleccionarAtajoTemporada(tempStr: string): void {
    this.temporadaSeleccionada.set(tempStr);
    this.mostrarFiltroFechas.set(false);
    const parts = tempStr.split('/');
    if (parts.length === 2) {
      const yearStart = parseInt(parts[0], 10);
      const yearEnd = parseInt(parts[1], 10);
      if (!isNaN(yearStart) && !isNaN(yearEnd)) {
        this.fechaInicio.set(`${yearStart}-11-01`);
        this.fechaFin.set(`${yearEnd}-10-31`);
        this.consultarReporte();
      }
    }
  }

  toggleFiltroFechas(): void {
    this.mostrarFiltroFechas.update(v => !v);
  }

  toggleAyudaPrioridad(): void {
    this.mostrarAyudaPrioridad.update(v => !v);
  }

  toggleAyudaRendimiento(): void {
    this.mostrarAyudaRendimiento.update(v => !v);
  }

  consultarReporte(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.reporteService.getReporteCierreTemporada(this.fechaInicio(), this.fechaFin()).subscribe({
      next: (data) => {
        this.reporte.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al obtener reporte de cierre:', err);
        this.errorMessage.set('Ocurrió un error al cargar los datos del reporte.');
        this.loading.set(false);
      }
    });
  }

  getColorApiario(apiarioId: number): string {
    const idx = Math.abs(apiarioId) % this.PALETA_APIARIOS.length;
    return this.PALETA_APIARIOS[idx];
  }

  apiariosOrdenados = computed(() => {
    const rep = this.reporte();
    if (!rep || !rep.rendimientoApiarios) return [];
    const lista = [...rep.rendimientoApiarios];
    const metrica = this.metricaGraficoApiarios();
    if (metrica === 'KILOS') {
      lista.sort((a, b) => b.kilosMiel - a.kilosMiel);
    } else if (metrica === 'ALZAS') {
      lista.sort((a, b) => b.alzasProcesadas - a.alzasProcesadas);
    } else {
      lista.sort((a, b) => b.kilosPorColmena - a.kilosPorColmena);
    }
    return lista;
  });

  maxValorGrafico = computed(() => {
    const lista = this.apiariosOrdenados();
    if (!lista || lista.length === 0) return 1;
    const metrica = this.metricaGraficoApiarios();
    if (metrica === 'KILOS') {
      return Math.max(...lista.map((a) => a.kilosMiel), 1);
    } else if (metrica === 'ALZAS') {
      return Math.max(...lista.map((a) => a.alzasProcesadas), 1);
    } else {
      return Math.max(...lista.map((a) => a.kilosPorColmena), 1);
    }
  });

  getPorcentajeBarra(apiario: RendimientoApiarioDTO): number {
    const max = this.maxValorGrafico();
    const metrica = this.metricaGraficoApiarios();
    let val = 0;
    if (metrica === 'KILOS') val = apiario.kilosMiel;
    else if (metrica === 'ALZAS') val = apiario.alzasProcesadas;
    else val = apiario.kilosPorColmena;

    return Math.max(6, Math.min(100, (val / max) * 100));
  }

  cambiarMetricaApiarios(metrica: 'KILOS' | 'ALZAS' | 'RINDE_COLMENA'): void {
    this.metricaGraficoApiarios.set(metrica);
  }

  cambiarPestana(pestana: 'DETALLE' | 'FLORACION' | 'BIOLOGIA'): void {
    this.pestanaActiva.set(pestana);
  }
}
