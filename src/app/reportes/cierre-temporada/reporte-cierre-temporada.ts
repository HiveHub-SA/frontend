import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../navbar/navbar.component';
import { ReporteService } from '../reporte.service';
import {
  ReporteCierreTemporadaDTO,
  RendimientoApiarioDTO,
  RendimientoFloracionDTO,
  EficienciaBiologicaDTO
} from '../reporte.model';

@Component({
  selector: 'app-reporte-cierre-temporada',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
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

  // Datos consolidados
  reporte = signal<ReporteCierreTemporadaDTO | null>(null);
  loading = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Controles de visualización y botones rápidos 1-clic
  pestanaActiva = signal<'APIARIOS' | 'FLORACION' | 'BIOLOGIA'>('APIARIOS');
  
  // Gráfico de Apiarios - Botones 1-clic
  modoOrdenamiento = signal<'RANKING' | 'ALFABETICO'>('RANKING');
  metricaGraficoApiarios = signal<'KILOS' | 'ALZAS' | 'RINDE_COLMENA'>('KILOS');

  // Gráfico de Floración - Botones 1-clic
  metricaFloracion = signal<'KILOS' | 'PORCENTAJE'>('KILOS');

  // Filtro de búsqueda en tabla
  busquedaApiario = signal<string>('');

  constructor(private reporteService: ReporteService) {}

  ngOnInit(): void {
    // Calcular temporada actual por defecto (Noviembre a Octubre)
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

  /**
   * Atajo 1-clic: Selecciona una temporada predefinida y actualiza las fechas automáticamente.
   */
  seleccionarAtajoTemporada(tempStr: string): void {
    this.temporadaSeleccionada.set(tempStr);
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

  /**
   * Atajo 1-clic: Últimos 6 meses desde hoy.
   */
  seleccionarUltimos6Meses(): void {
    const now = new Date();
    const endStr = now.toISOString().split('T')[0];
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    const startStr = sixMonthsAgo.toISOString().split('T')[0];

    this.fechaInicio.set(startStr);
    this.fechaFin.set(endStr);
    this.temporadaSeleccionada.set('Últimos 6 meses');
    this.consultarReporte();
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
        this.errorMessage.set('Ocurrió un error al cargar los datos del reporte. Verifique la conexión.');
        this.loading.set(false);
      }
    });
  }

  // Lista calculada de apiarios filtrada y ordenada
  apiariosProcesados = computed(() => {
    const rep = this.reporte();
    if (!rep || !rep.rendimientoApiarios) return [];

    let lista = [...rep.rendimientoApiarios];

    // Filtro por texto si existe
    const q = this.busquedaApiario().trim().toLowerCase();
    if (q) {
      lista = lista.filter((a) => a.apiarioNombre.toLowerCase().includes(q));
    }

    // Ordenamiento según botón 1-clic
    if (this.modoOrdenamiento() === 'RANKING') {
      const metrica = this.metricaGraficoApiarios();
      if (metrica === 'KILOS') {
        lista.sort((a, b) => b.kilosMiel - a.kilosMiel);
      } else if (metrica === 'ALZAS') {
        lista.sort((a, b) => b.alzasProcesadas - a.alzasProcesadas);
      } else {
        lista.sort((a, b) => b.kilosPorColmena - a.kilosPorColmena);
      }
    } else {
      lista.sort((a, b) => a.apiarioNombre.localeCompare(b.apiarioNombre));
    }

    return lista;
  });

  // Valor máximo para calcular el porcentaje de barra en gráfico
  maxValorGrafico = computed(() => {
    const lista = this.apiariosProcesados();
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

    return Math.max(8, Math.min(100, (val / max) * 100));
  }

  // Métodos de cambio con botones 1-clic
  cambiarModoOrden(modo: 'RANKING' | 'ALFABETICO'): void {
    this.modoOrdenamiento.set(modo);
  }

  cambiarMetricaApiarios(metrica: 'KILOS' | 'ALZAS' | 'RINDE_COLMENA'): void {
    this.metricaGraficoApiarios.set(metrica);
  }

  cambiarMetricaFloracion(metrica: 'KILOS' | 'PORCENTAJE'): void {
    this.metricaFloracion.set(metrica);
  }

  cambiarPestana(pestana: 'APIARIOS' | 'FLORACION' | 'BIOLOGIA'): void {
    this.pestanaActiva.set(pestana);
  }
}
