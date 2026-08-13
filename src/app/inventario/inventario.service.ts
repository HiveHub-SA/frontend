import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventarioRequestDTO, InventarioResponseDTO, TipoInventarioNombre } from './inventario.model';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private readonly apiUrl = 'http://localhost:8080/hivehub/inventarios';

  constructor(private http: HttpClient) { }

  // POST /hivehub/inventarios (crea inv sin colmena asignada)
  registrarInventario(request: InventarioRequestDTO): Observable<InventarioResponseDTO> {
    return this.http.post<InventarioResponseDTO>(this.apiUrl, request);
  }

  // GET /hivehub/inventarios?sinAsignar=true&tipo=ALZA (trae inv. sueltos para asignar)
  listarDisponibles(tipo?: TipoInventarioNombre): Observable<InventarioResponseDTO[]> {
    let params = new HttpParams().set('sinAsignar', 'true');
    if (tipo) params = params.set('tipo', tipo);
    return this.http.get<InventarioResponseDTO[]>(this.apiUrl, { params });
  }

  listarTodos(): Observable<InventarioResponseDTO[]> {
    return this.http.get<InventarioResponseDTO[]>(this.apiUrl);
  }
}