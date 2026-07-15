import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiarioDTO, ApiarioVista } from './apiario.model';

@Injectable({ providedIn: 'root' })
export class ApiarioService {

  private readonly apiUrl = 'http://localhost:8080/hivehub/apiarios';

  constructor(private http: HttpClient) {}


  // GET /hivehub/apiarios/{id}
  getApiarioById(id: number): Observable<ApiarioDTO> {
    return this.http.get<ApiarioDTO>(`${this.apiUrl}/${id}`);
  }

  // GET /hivehub/apiarios
  getAll(): Observable<ApiarioVista[]> {
    return this.http.get<ApiarioDTO[]>(this.apiUrl)
      .pipe(map((dtos) => dtos.map((dto) => this.toVista(dto))));
  }

  private toVista(dto: ApiarioDTO): ApiarioVista {
    return {
      id: dto.id,
      name: dto.name,
    };
  }
}
