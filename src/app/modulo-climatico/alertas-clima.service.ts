import { Injectable, inject, signal } from '@angular/core';
import { ClimaService, WeatherData } from './clima.service';

export interface AlertaExtrema {
  id: string;
  apiarioId: string | number;
  nombreApiario: string;
  lat: number;
  lng: number;
  tipo: 'calor' | 'frio' | 'lluvia';
  nivel: 'peligro' | 'advertencia';
  titulo: string;
  mensaje: string;
  icono: string;
}

@Injectable({
  providedIn: 'root'
})
export class AlertasClimaService {
  private climaService = inject(ClimaService);
  
  // Signals para estado reactivo
  alertas = signal<AlertaExtrema[]>([]);
  alertaToastInicial = signal<AlertaExtrema | null>(null);

  private colaToast: AlertaExtrema[] = [];
  private idsDescartados = new Set<string>(); // para que no se abran de vuelta al recargar pagina

  /* Evalúa el clima de una lista de apiarios y genera alertas activas. */
  evaluarApiarios(apiarios: Array<{ id?: any; nombre: string; lat: number; lng: number }>): void {
    const nuevasAlertas: AlertaExtrema[] = [];

    apiarios.forEach((apiario) => {
      this.climaService.obtenerClimaApiario(apiario.lat, apiario.lng).subscribe({
        next: (clima) => {
          if (!clima) return;
          const halladas = this.analizarCondiciones(apiario, clima);
          nuevasAlertas.push(...halladas);
          this.alertas.set([...nuevasAlertas]);

          halladas.forEach((alerta) => this.encolarToast(alerta));
        }
      });
    });
  }

    private encolarToast(alerta: AlertaExtrema): void {
    const esImportante =
      alerta.tipo === 'calor' ||
      alerta.tipo === 'frio' ||
      (alerta.tipo === 'lluvia' && alerta.nivel === 'peligro');

    if (!esImportante) return;
    if (this.idsDescartados.has(alerta.id)) return; // punto 3
    if (this.colaToast.some(a => a.id === alerta.id)) return;

    this.colaToast.push(alerta);

    if (!this.alertaToastInicial()) {
      this.mostrarSiguienteToast();
    }
  }

    private mostrarSiguienteToast(): void {
    const siguiente = this.colaToast.shift();
    this.alertaToastInicial.set(siguiente ?? null);
  }

  cerrarToast(): void {
    const actual = this.alertaToastInicial();
    if (actual) this.idsDescartados.add(actual.id);
    this.mostrarSiguienteToast();
  }


  private analizarCondiciones(
    apiario: { id?: any; nombre: string; lat: number; lng: number },
    clima: WeatherData
  ): AlertaExtrema[] {
    const res: AlertaExtrema[] = [];

    // 1. Calor Extremo (≥ 38°C - Riesgo de derretimiento de panales)
    if (clima.temp >= 38) {
      res.push({
        id: `${apiario.nombre}-calor`,
        apiarioId: apiario.id,
        nombreApiario: apiario.nombre,
        lat: apiario.lat,
        lng: apiario.lng,
        tipo: 'calor',
        nivel: 'peligro',
        titulo: 'Alerta por Calor Extremo',
        mensaje: `Temperatura de ${clima.temp}°C. Riesgo de derretimiento de panales.`,
        icono: 'wb_sunny'
      });
    }

    // 2. Caída brusca / Frío Extremo (≤ 10°C)
    if (clima.temp <= 10) {
      res.push({
        id: `${apiario.nombre}-frio`,
        apiarioId: apiario.id,
        nombreApiario: apiario.nombre,
        lat: apiario.lat,
        lng: apiario.lng,
        tipo: 'frio',
        nivel: 'advertencia',
        titulo: 'Alerta por Frío Bajo',
        mensaje: `Temperatura de ${clima.temp}°C. Las abejas formarán el bolo invernal.`,
        icono: 'ac_unit'
      });
    }

    // 3. Precipitaciones Extremas / Tormenta
    const cond = clima.condicion?.toLowerCase() || '';
    const probLluvia = clima.horas?.[0]?.probabilidadLluvia || 0;

    if (cond.includes('tormenta') || cond.includes('fuerte') || probLluvia >= 70 || clima.alertaLluvia) {
      res.push({
        id: `${apiario.nombre}-lluvia`,
        apiarioId: apiario.id,
        nombreApiario: apiario.nombre,
        lat: apiario.lat,
        lng: apiario.lng,
        tipo: 'lluvia',
        nivel: cond.includes('tormenta') ? 'peligro' : 'advertencia',
        titulo: 'Alerta de Precipitaciones',
        mensaje: clima.alertaLluvia?.mensaje || `Pronóstico de lluvias intensas (${probLluvia}% prob.).`,
        icono: 'rainy'
      });
    }

    return res;
  }

}