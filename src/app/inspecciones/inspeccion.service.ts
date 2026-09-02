import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InspeccionDTO, InspeccionColmenaDTO } from './inspeccion.model';

/**
 * Servicio Angular para la gestión de solicitudes HTTP relativas a las inspecciones de apiarios.
 * Se comunica directamente con los endpoints de la API backend Spring Boot en http://localhost:8080/hivehub.
 */
@Injectable({ providedIn: 'root' })
export class InspeccionService {
  /** URL base para los servicios backend de HiveHub */
  private readonly apiUrl = 'http://localhost:8080/hivehub';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista de inspecciones registradas para un apiario específico.
   *
   * @param apiarioId ID del apiario
   * @returns Observable con la lista de InspeccionDTO
   */
  getInspeccionesByApiario(apiarioId: number): Observable<InspeccionDTO[]> {
    return this.http.get<InspeccionDTO[]>(`${this.apiUrl}/apiarios/${apiarioId}/inspecciones`);
  }

  /**
   * Obtiene una inspección por su ID.
   *
   * @param id ID de la inspección
   * @returns Observable con el objeto InspeccionDTO
   */
  getInspeccionById(id: number): Observable<InspeccionDTO> {
    return this.http.get<InspeccionDTO>(`${this.apiUrl}/inspecciones/${id}`);
  }

  /**
   * Crea una nueva inspección general para un apiario.
   *
   * @param apiarioId ID del apiario
   * @param dto Datos iniciales de la inspección
   * @returns Observable con el objeto InspeccionDTO registrado
   */
  createInspeccion(apiarioId: number, dto: Partial<InspeccionDTO>): Observable<InspeccionDTO> {
    return this.http.post<InspeccionDTO>(`${this.apiUrl}/apiarios/${apiarioId}/inspecciones`, dto);
  }

  /**
   * Actualiza el tipo de floración predominante registrada en una inspección.
   *
   * @param id ID de la inspección
   * @param floracion Nombre de la floración seleccionada
   * @returns Observable con la inspección actualizada
   */
  updateFloracion(id: number, floracion: string): Observable<InspeccionDTO> {
    return this.http.put<InspeccionDTO>(`${this.apiUrl}/inspecciones/${id}/floracion`, {
      floracion,
    });
  }

  /**
   * Actualiza la presencia/nivel de varroa en una inspección de apiario (US 43).
   * 
   * @param id ID de la inspección
   * @param varroa Estado de varroa ('NO_DETECTADA' | 'DETECTADA')
   * @returns Observable con la inspección actualizada
   */
  updateVarroa(id: number, varroa: string): Observable<InspeccionDTO> {
    return this.http.put<InspeccionDTO>(`${this.apiUrl}/inspecciones/${id}/varroa`, { varroa });
  }

  /**
   * Finaliza una inspección cambiando su estado a "SINCRONIZADA".
   *
   * @param id ID de la inspección
   * @returns Observable con la inspección finalizada
   */
  finalizarInspeccion(id: number): Observable<InspeccionDTO> {
    return this.http.put<InspeccionDTO>(`${this.apiUrl}/inspecciones/${id}/finalizar`, {});
  }

  /**
   * Obtiene el detalle de inspección para una colmena específica (US 32).
   */
  getInspeccionColmena(inspeccionId: number, colmenaId: number): Observable<InspeccionColmenaDTO> {
    return this.http.get<InspeccionColmenaDTO>(
      `${this.apiUrl}/inspecciones/${inspeccionId}/colmenas/${colmenaId}`,
    );
  }

  /**
   * Guarda o actualiza el detalle de inspección para una colmena (US 32).
   */
  saveInspeccionColmena(
    inspeccionId: number,
    colmenaId: number,
    dto: InspeccionColmenaDTO,
  ): Observable<InspeccionColmenaDTO> {
    return this.http.post<InspeccionColmenaDTO>(
      `${this.apiUrl}/inspecciones/${inspeccionId}/colmenas/${colmenaId}`,
      dto,
    );
  }

  /**
   * Obtiene la lista de detalles de inspección por colmena de una inspección general.
   */
  getInspeccionesColmenas(inspeccionId: number): Observable<InspeccionColmenaDTO[]> {
    return this.http.get<InspeccionColmenaDTO[]>(
      `${this.apiUrl}/inspecciones/${inspeccionId}/colmenas`,
    );
  }

  /**
   * Sincroniza atómicamente un paquete completo de inspección generado en modo offline (US 05).
   *
   * @param dto DTO de inspección completa con colmenas asociadas
   * @returns Observable con la inspección persistida
   */
  sincronizarInspeccion(dto: InspeccionDTO): Observable<InspeccionDTO> {
    return this.http.post<InspeccionDTO>(`${this.apiUrl}/inspecciones/sincronizar`, dto);
  }

  /**
   * Elimina un registro de inspección por su ID.
   */
  deleteInspeccion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/inspecciones/${id}`);
  }
}
