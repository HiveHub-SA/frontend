import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, catchError, of } from 'rxjs';
import { ApiarioDTO, ApiarioVista, NewApiario } from './apiario.model';
import { OfflineCacheService } from '../shared/services/offline-cache.service';

@Injectable({ providedIn: 'root' })
export class ApiarioService {

  private readonly apiUrl = 'http://localhost:8080/hivehub/apiarios';
  private offlineCache = inject(OfflineCacheService);

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el detalle de un apiario por ID.
   * - En línea: almacena en caché local las colmenas y datos del apiario.
   * - Sin conexión: recupera los datos directamente de la caché local (OfflineCacheService).
   */
  getApiarioById(id: number): Observable<ApiarioDTO> {
    return this.http.get<ApiarioDTO>(`${this.apiUrl}/${id}`).pipe(
      tap((dto) => {
        if (dto && dto.colmenas) {
          this.offlineCache.cacheColmenas(dto.id, dto.colmenas);
        }
      }),
      catchError((err) => {
        const cached = this.offlineCache.getCachedApiarioById(id);
        if (cached) {
          return of(cached as ApiarioDTO);
        }
        throw err;
      })
    );
  }

  /**
   * Obtiene la lista completa de apiarios para la vista de mapa y listados.
   * - En línea: actualiza la lista de apiarios en la caché local.
   * - Sin conexión: retorna la lista cacheada como fallback sin interrumpir la experiencia.
   */
  getAll(): Observable<ApiarioVista[]> {
    return this.http.get<ApiarioDTO[]>(this.apiUrl).pipe(
      tap((dtos) => this.offlineCache.cacheApiarios(dtos)),
      map((dtos) => dtos.map((dto) => this.toVista(dto))),
      catchError((err) => {
        const cached = this.offlineCache.getCachedApiarios();
        if (cached && cached.length > 0) {
          return of(cached.map((dto: any) => this.toVista(dto)));
        }
        throw err;
      })
    );
  }

  private toVista(dto: ApiarioDTO): ApiarioVista {
    return {
      id: dto.id,
      name: dto.name,
      latitude: dto.latitude,
      longitude: dto.longitude,
    };
  }

  // DELETE /hivehub/apiarios/{id}
  deleteApiario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // POST /hivehub/apiarios
  createApiario(apiario: NewApiario): Observable<NewApiario> {
    return this.http.post<NewApiario>(`${this.apiUrl}`, apiario);
  }
}
