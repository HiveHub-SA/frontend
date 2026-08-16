import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, tap, catchError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WeatherData {
  temp: number;
  condicion: string;
  humedad: number;
  iconoCode: number;
  esDeDia: boolean;
  alertaLluvia: { activa: boolean; probabilidad: number; mensaje: string } | null;
  horas: Array<{
    hora: string;
    temp: number;
    iconoCode: number;
    probabilidadLluvia: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class ClimaService {
  private http = inject(HttpClient);

  private apiKey = environment.weatherApiKey; 
  private baseUrl = 'https://api.weatherapi.com/v1/forecast.json';

  obtenerClimaApiario(lat: number, lng: number): Observable<WeatherData | null> {
    const cacheKey = `hivehub_weather_${lat.toFixed(4)}_${lng.toFixed(4)}`;

    // Modo offline: leer directamente de la caché local
    if (!navigator.onLine) {
      const cached = localStorage.getItem(cacheKey);
      return of(cached ? JSON.parse(cached) : null);
    }

    const url = `${this.baseUrl}?key=${this.apiKey}&q=${lat},${lng}&days=2&aqi=no&alerts=no&lang=es`;

    return this.http.get<any>(url).pipe(
      // 1. Transformamos la respuesta de WeatherAPI a la interfaz WeatherData
      map((res) => this.procesarRespuestaWeatherApi(res)),
      // 2. Guardamos los datos mapeados en localStorage
      tap((parsedData) => {
        if (parsedData) {
          localStorage.setItem(cacheKey, JSON.stringify(parsedData));
        }
      }),
      // 3. Fallback a la caché si falla la petición HTTP
      catchError((error) => {
        console.error('Error al obtener clima desde API:', error);
        const cached = localStorage.getItem(cacheKey);
        return of(cached ? JSON.parse(cached) : null);
      })
    );
  }

  private procesarRespuestaWeatherApi(res: any): WeatherData {
    const current = res.current;
    const hourList: any[] = (res.forecast?.forecastday || []).flatMap((d: any) => d.hour || []);
    const currentEpoch = current?.last_updated_epoch || Math.floor(Date.now() / 1000);

    // Filtrar las 5 horas siguientes a partir del momento actual
    const futurasHoras = hourList
      .filter((h) => h.time_epoch >= currentEpoch - 1800)
      .slice(0, 5)
      .map((h) => ({
        hora: h.time ? h.time.split(' ')[1] : h.time,
        temp: Math.round(h.temp_c),
        iconoCode: h.condition.code,
        probabilidadLluvia: h.chance_of_rain || 0
      }));

    // Detectar si hay probabilidad de lluvia >= 60% en las próximas horas para la alerta
    const horaConLluvia = futurasHoras.find((h) => h.probabilidadLluvia >= 60);
    const alertaLluvia = horaConLluvia
      ? {
          activa: true,
          probabilidad: horaConLluvia.probabilidadLluvia,
          mensaje: `Probabilidad del ${horaConLluvia.probabilidadLluvia}% de precipitaciones cerca de las ${horaConLluvia.hora} hs.`
        }
      : null;

    return {
      temp: Math.round(current.temp_c),
      condicion: current.condition.text,
      humedad: current.humidity,
      iconoCode: current.condition.code,
      esDeDia: current.is_day === 1,
      alertaLluvia,
      horas: futurasHoras
    };
  }
}