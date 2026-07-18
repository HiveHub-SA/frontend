import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventarioRequestDTO, Inventario, InventarioResponseDTO } from './inventario.model';

@Injectable({ providedIn: 'root' })
export class InventarioService {

  private readonly apiUrl = 'http://localhost:8080/api/inventario';

  constructor(private http: HttpClient) { }

  // POST /api/inventario
  registrarInventario(request: InventarioRequestDTO): Observable<InventarioResponseDTO> {
    return this.http.post<InventarioResponseDTO>(this.apiUrl, request);
  }

}