import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RutaDTO, RutaRequestDTO } from './ruta.model';

@Injectable({
    providedIn: 'root'
})
export class RutaService {

    private readonly apiUrl =
        'http://localhost:8080/hivehub/apiarios/ruta';

    constructor(
        private http: HttpClient
    ) { }

    calcularRuta(
        request: RutaRequestDTO
    ): Observable<RutaDTO> {

        return this.http.post<RutaDTO>(
            this.apiUrl,
            request
        );

    }

}