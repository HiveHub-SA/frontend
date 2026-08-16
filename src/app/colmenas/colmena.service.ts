import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ColmenaDTO, ColmenaRequestDTO } from './colmena.model'

@Injectable({ providedIn: 'root' })
export class ColmenaService {

  private readonly apiUrl = 'http://localhost:8080/hivehub/colmenas';

  constructor(private http: HttpClient) { }

  //GET /hivehub/colmenas/{id}
  getColmenaById(id: number): Observable<ColmenaDTO> {
    return this.http.get<ColmenaDTO>(`${this.apiUrl}/${id}`);
  }

  //DELETE /hivehub/colmenas/{id}
  deleteColmena(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  //PUT /hivehub/colmenas/{id}
  updateColmena(id: number, colmena: ColmenaRequestDTO): Observable<ColmenaDTO> {
    return this.http.put<ColmenaDTO>(`${this.apiUrl}/${id}`, colmena);
  }

  //POST /hivehub/colmenas
  crearColmena(colmena: ColmenaRequestDTO): Observable<ColmenaDTO> {
    return this.http.post<ColmenaDTO>(this.apiUrl, colmena);
  }
}
