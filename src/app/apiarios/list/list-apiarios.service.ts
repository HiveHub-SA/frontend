import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiarioDTO, ApiarioVista } from '../apiario.model';

@Injectable({ providedIn: 'root' })
export class ApiarioService {

  private readonly baseUrl = 'http://localhost:8080/hivehub/apiarios';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiarioVista[]> {
    console.log("hello");
    return this.http
     .get<ApiarioDTO[]>(this.baseUrl)
     .pipe(map((dtos) => dtos.map((dto) => this.toVista(dto))));
  }

  private toVista(dto: ApiarioDTO): ApiarioVista {
    return {
      id: dto.id,
      name: dto.name,
    };
  }
}
