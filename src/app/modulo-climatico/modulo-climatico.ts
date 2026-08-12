import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClimaService, WeatherData } from './clima.service';

export interface AlertaClimatica {
  tipo: 'lluvia' | 'calor' | 'frio';
  titulo: string;
  mensaje: string;
  icono: string;
}

@Component({
  selector: 'app-modulo-climatico',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modulo-climatico.html',
  styleUrl: './modulo-climatico.css',
})


export class ModuloClimaticoComponent implements OnChanges {
  @Input() visible: boolean = false;
  @Input() apiario: { nombre: string; lat: number; lng: number } | null = null;
  @Output() cerrado = new EventEmitter<void>();

  //Servicio del clima y para detectar cambios
  private climaService = inject(ClimaService);
  private cdr = inject(ChangeDetectorRef);

  //Variables para utilizar en la creacion del modal
  cargando: boolean = false;
  error: boolean = false;
  climaData: WeatherData | null = null;
  alertasActivas: AlertaClimatica[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (this.visible && this.apiario) {
      this.cargarClima();
    }
  }

  cargarClima(): void {
    if (!this.apiario) return;

    this.cargando = true;
    this.error = false;
    this.alertasActivas = [];
    this.cdr.detectChanges();

    this.climaService.obtenerClimaApiario(this.apiario.lat, this.apiario.lng).subscribe({
      next: (data) => {
        this.climaData = data;
        this.cargando = false;

        if (data) {
          this.evaluarAlertas(data);
        } else {
          this.error = true;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = true;
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  evaluarAlertas(data: WeatherData): void {
    this.alertasActivas = [];

    // Alerta de Temperatura Extrema
    if (data.temp >= 38) {
      this.alertasActivas.push({
        tipo: 'calor',
        titulo: 'Alerta por Calor Extremo',
        mensaje: 'Temperatura superior o igual a 38°C. Riesgo de derretimiento de panales.',
        icono: 'wb_sunny'
      });
    } else if (data.temp <= 10) {
      this.alertasActivas.push({
        tipo: 'frio',
        titulo: 'Alerta por Frío Bajo',
        mensaje: 'Temperatura inferior o igual a 10°C. Las abejas mantendrán el bolo invernal.',
        icono: 'ac_unit'
      });
    }

    // Alerta de Precipitaciones
    if (data.alertaLluvia || data.condicion?.toLowerCase().includes('lluvia')) {
      this.alertasActivas.push({
        tipo: 'lluvia',
        titulo: 'Alerta de Precipitaciones',
        mensaje: data.alertaLluvia?.mensaje || 'Se registran lluvias en la zona del apiario.',
        icono: 'rainy'
      });
    }
  }

  // Obtengo los iconos climaticos de la misma api. Pueden venir como codigo numerico o como texto
  obtenerIconoClima(condicionOrCode?: string | number): string {
    if (condicionOrCode === undefined || condicionOrCode === null) return 'partly_cloudy_day';

    // Si viene como codigo numerico
    if (typeof condicionOrCode === 'number') {
      const code = condicionOrCode;
      if (code === 1000 || code === 800) return 'wb_sunny'; // Soleado / Despejado
      if ([1003, 1006, 1009, 801, 802, 803, 804].includes(code)) return 'cloud'; // Nublado / Parcialmente nublado
      if ([1063, 1180, 1183, 1186, 1189, 1192, 1195, 500, 501, 502].includes(code)) return 'rainy'; // Lluvia
      if ([1087, 1273, 1276, 200, 201, 202].includes(code)) return 'thunderstorm'; // Tormenta
      if (code >= 600 && code < 700) return 'ac_unit'; // Nieve
    }

    // Si viene como texto
    const c = String(condicionOrCode).toLowerCase();
    if (c.includes('lluvia') || c.includes('llovizna') || c.includes('chubasco')) return 'rainy';
    if (c.includes('tormenta')) return 'thunderstorm';
    if (c.includes('nube') || c.includes('nublado') || c.includes('cubierto')) return 'cloud';
    if (c.includes('despejado') || c.includes('soleado') || c.includes('claro')) return 'wb_sunny';
    if (c.includes('nieve')) return 'ac_unit';

    return 'partly_cloudy_day';
  }

  cerrar(): void {
    this.cerrado.emit();
  }
}