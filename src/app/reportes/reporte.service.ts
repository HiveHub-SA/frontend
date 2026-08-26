import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReporteCierreTemporadaDTO } from './reporte.model';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private readonly baseUrl = 'http://localhost:8080/hivehub/reportes';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el reporte consolidado de cierre de temporada para un rango de fechas.
   */
  getReporteCierreTemporada(fechaInicio?: string, fechaFin?: string): Observable<ReporteCierreTemporadaDTO> {
    let params = new HttpParams();
    if (fechaInicio) {
      params = params.set('fechaInicio', fechaInicio);
    }
    if (fechaFin) {
      params = params.set('fechaFin', fechaFin);
    }
    return this.http.get<ReporteCierreTemporadaDTO>(`${this.baseUrl}/cierre-temporada`, { params });
  }

  /**
   * Obtiene las temporadas distintas registradas en el sistema.
   */
  getTemporadasDisponibles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/temporadas-disponibles`);
  }
}
