import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoApiario } from '../VideoApiario.model';
import { ApiarioVideoService } from '../VideoApiario.service';
import { ConfirmDeleteComponent } from '../../../confirm-delete-component/confirm-delete-component';

@Component({
    selector: 'app-videos-apiario',
    standalone: true,
    imports: [CommonModule, ConfirmDeleteComponent],
    templateUrl: './videoApiario.component.html',
    styleUrl: './videoApiario.component.css',
})
export class VideosApiarioComponent implements OnInit {
    @Input({ required: true }) apiarioId!: number;

    videos = signal<VideoApiario[]>([]);
    loading = signal<boolean>(true);

    subiendo = signal<boolean>(false);
    uploadError = signal<string | null>(null);

    videoSeleccionado = signal<VideoApiario | null>(null);
    videoUrlActual = signal<string | null>(null);
    cargandoReproduccion = signal<boolean>(false);

    videoAEliminar = signal<VideoApiario | null>(null);
    deleting = signal<boolean>(false);
    deleteError = signal<string | null>(null);

    constructor(private videoService: ApiarioVideoService) { }

    ngOnInit(): void {
        this.cargarVideos();
    }

    private cargarVideos() {
        this.loading.set(true);
        this.videoService.getVideos(this.apiarioId).subscribe({
            next: (data) => { this.videos.set(data); this.loading.set(false); },
            error: (error) => { console.error(error); this.loading.set(false); },
        });
    }

    onArchivoSeleccionado(event: Event) {
        const input = event.target as HTMLInputElement;
        const archivo = input.files?.[0];
        if (!archivo) return;

        if (!archivo.type.startsWith('video/')) {
            this.uploadError.set('El archivo seleccionado no es un video.');
            input.value = '';
            return;
        }

        if (!navigator.onLine) {
            this.uploadError.set('Necesitás conexión a internet para subir el video.');
            input.value = '';
            return;
        }

        this.subiendo.set(true);
        this.uploadError.set(null);

        this.videoService.subirVideo(this.apiarioId, archivo).subscribe({
            next: (video) => {
                this.videos.update((v) => [video, ...v]);
                this.subiendo.set(false);
                input.value = '';
            },
            error: (err) => {
                console.error('Error al subir video:', err);
                this.subiendo.set(false);
                this.uploadError.set('No se pudo subir el video. Verificá tu conexión e intentá nuevamente.');
                input.value = '';
            },
        });
    }

    abrirVideo(video: VideoApiario) {
        this.videoSeleccionado.set(video);
        this.cargandoReproduccion.set(true);
        this.videoService.verVideo(this.apiarioId, video.id).subscribe({
            next: (blob) => {
                this.videoUrlActual.set(URL.createObjectURL(blob));
                this.cargandoReproduccion.set(false);
            },
            error: (error) => {
                console.error(error);
                this.cargandoReproduccion.set(false);
                this.cerrarVideo();
            },
        });
    }

    cerrarVideo() {
        const url = this.videoUrlActual();
        if (url) URL.revokeObjectURL(url);
        this.videoUrlActual.set(null);
        this.videoSeleccionado.set(null);
    }

    abrirEliminar(video: VideoApiario, event: Event) {
        event.stopPropagation();
        this.deleteError.set(null);
        this.videoAEliminar.set(video);
    }

    cerrarEliminar() {
        this.videoAEliminar.set(null);
    }

    confirmarEliminar() {
        const video = this.videoAEliminar();
        if (!video) return;

        this.deleting.set(true);
        this.deleteError.set(null);

        this.videoService.eliminarVideo(this.apiarioId, video.id).subscribe({
            next: () => {
                this.videos.update((v) => v.filter((x) => x.id !== video.id));
                this.deleting.set(false);
                this.videoAEliminar.set(null);
            },
            error: (error) => {
                console.error(error);
                this.deleting.set(false);
                this.deleteError.set('No se pudo eliminar el video. Intentá nuevamente.');
            },
        });
    }

    trackByVideoId(index: number, video: VideoApiario): number {
        return video?.id ?? index;
    }

    formatearTamanio(bytes: number): string {
        if (!bytes) return '';
        const mb = bytes / (1024 * 1024);
        return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
    }
}