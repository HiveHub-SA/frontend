// apiario.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiarioDTO {
  id?: number;
  name: string;       // <--- Cambiado de 'nombre' a 'name'
  latitude: number;   // <--- Cambiado de 'latitud' a 'latitude'
  longitude: number;  // <--- Este ya estaba bien (coincide con 'longitude')
  createdAt?: string; // Opcional, por si lo necesitas después
  colmenas?: any[];   // Opcional, por si lo necesitas después
}

@Injectable({
  providedIn: 'root'
})
export class ApiarioMapasService {
  private apiUrl = 'http://localhost:8080/hivehub/apiarios'; // Asegúrate de que el puerto (8080 u otro) coincida con tu backend

  constructor(private http: HttpClient) {}

  obtenerApiarios(): Observable<ApiarioDTO[]> {
    return this.http.get<ApiarioDTO[]>(this.apiUrl);
  }
}