import { Injectable, inject, signal } from '@angular/core';
import { ClimaService, WeatherData } from './clima.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

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
  
  //Gestion de las alertas 
  alertas = signal<AlertaExtrema[]>([]);
  alertaToastInicial = signal<boolean>(false);
  private toastCerradoManual = false; // Evita que se vuelva a abrir si el usuario lo cerró manualmente
  
  
  // Nuevo "BehaviorSubject" para manejar la redirección y enfoque al hacer click en una notificación 
  private enfocarApiarioSubject = new BehaviorSubject<any>(null);
  public enfocarApiario$ = this.enfocarApiarioSubject.asObservable();
  
  //Se agrega router en caso de que sea necesario redirigir a partir de las notificaciones
  constructor(private router: Router){}

  

  // Se evualua el clima de todos los apiarios en paralelo 
  evaluarApiarios(apiarios: Array<{ id?: any; nombre: string; lat: number; lng: number }>): void {
    if (!apiarios || apiarios.length === 0) {
      this.alertas.set([]);
      this.alertaToastInicial.set(false);
      return;
    }

    //Se prepara el array de peticiones HTTP
    const peticiones$ = apiarios.map((apiario) =>
      this.climaService.obtenerClimaApiario(apiario.lat, apiario.lng).pipe(
        catchError(() => of(null)) // Si falla la consulta de un apiario no se interrumpe el resto
      )
    );

    //Se usa forkJoin para ejecutar todas las peticiones al mismo tiempo y esperar a que terminen
    forkJoin(peticiones$).subscribe({
      next: (resultadosClima) => {
        const nuevasAlertas: AlertaExtrema[] = [];
        resultadosClima.forEach((clima, index) => {
          if (!clima) return;
          const apiario = apiarios[index];
          const halladas = this.analizarCondiciones(apiario, clima);
          nuevasAlertas.push(...halladas);
        });

        // Acá se actualiza la lista de alertas para la campanita del header
        this.alertas.set(nuevasAlertas);

        // Verificamos si existe alguna alerta relevante para mostrar
        const hayAlertasRelevantes = nuevasAlertas.some(
          a => a.tipo === 'calor' || a.tipo === 'frio' || (a.tipo === 'lluvia' && a.nivel === 'peligro')
        );

        // Solo se muestra el cartel si hay alertas y el usuario no lo cerro previamente
        if (hayAlertasRelevantes && !this.toastCerradoManual) {
          this.alertaToastInicial.set(true);
        } else {
          this.alertaToastInicial.set(false);
        }
      }
    });
  }

  // Cierra el cartel flotante de forma definitiva 
  cerrarToast(): void {
    this.toastCerradoManual = true;
    this.alertaToastInicial.set(false);
  }

  private analizarCondiciones(
    apiario: { id?: any; nombre: string; lat: number; lng: number },
    clima: WeatherData
  ): AlertaExtrema[] {
    const res: AlertaExtrema[] = [];

    // Calor Extremo (≥ 38°C)
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

    // Frio Extremo (≤ 10°C)
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

    // Lluvias Extremas / Tormenta
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

  // Funcionalidades asociadas a la historia de usuario 42 - Ver apiario desde notificacion
  // Método para disparar la redirección desde cualquier parte de la app

  seleccionarAlertaYRedirigir(alerta: any) {
    this.enfocarApiarioSubject.next(alerta);
    this.router.navigate(['/mapa']); // O la ruta donde se encuentre tu mapa
  }

  obtenerAlertaPendiente() {
    return this.enfocarApiarioSubject.value;
  }

  limpiarEnfoque() {
    this.enfocarApiarioSubject.next(null);
  }



}