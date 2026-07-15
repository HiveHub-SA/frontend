import {Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {ColmenaDTO} from './colmena.model'

@Injectable({ providedIn: 'root' })
export class ColmenaService {

  private readonly apiUrl = 'http://localhost:8080/hivehub/colmenas';

  constructor(private http: HttpClient) {}

  //GET /hivehub/colmenas/{id}
  getColmenaById(id: number): Observable<ColmenaDTO>{
    return this.http.get<ColmenaDTO>(`${this.apiUrl}/${id}`);
  }
}
