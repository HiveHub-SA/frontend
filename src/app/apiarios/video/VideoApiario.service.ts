import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VideoApiario } from './VideoApiario.model';

@Injectable({ providedIn: 'root' })
export class ApiarioVideoService {

    private readonly apiUrl = 'http://localhost:8080/hivehub/apiarios';

    constructor(private http: HttpClient) { }

    // GET /hivehub/apiarios/{apiarioId}/videos
    getVideos(apiarioId: number): Observable<VideoApiario[]> {
        return this.http.get<VideoApiario[]>(`${this.apiUrl}/${apiarioId}/videos`);
    }

    // POST /hivehub/apiarios/{apiarioId}/videos
    subirVideo(apiarioId: number, archivo: File): Observable<VideoApiario> {
        const formData = new FormData();
        formData.append('archivo', archivo);
        return this.http.post<VideoApiario>(`${this.apiUrl}/${apiarioId}/videos`, formData);
    }

    // GET /hivehub/apiarios/{apiarioId}/videos/{videoId} como blob, para que el
    // interceptor JWT mande el token
    verVideo(apiarioId: number, videoId: number): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/${apiarioId}/videos/${videoId}`, { responseType: 'blob' });
    }

    // DELETE /hivehub/apiarios/{apiarioId}/videos/{videoId}
    eliminarVideo(apiarioId: number, videoId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${apiarioId}/videos/${videoId}`);
    }
}