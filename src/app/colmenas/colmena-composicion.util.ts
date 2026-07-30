import { InventarioResponseDTO } from '../inventario/inventario.model';

export interface ComposicionColmena {
    camaras: number;
    alzas: number;
    nucleos: number;
    alzasPorMarcos: Record<number, number>; // ej: {8: 2, 10: 1}
}

export function calcularComposicion(inventarios: InventarioResponseDTO[] = []): ComposicionColmena {
    const alzasPorMarcos: Record<number, number> = {};
    let camaras = 0, alzas = 0, nucleos = 0;

    for (const inv of inventarios) {
        if (inv.tipoNombre === 'CAMARA') camaras++;
        if (inv.tipoNombre === 'NUCLEO') nucleos++;
        if (inv.tipoNombre === 'ALZA') {
            alzas++;
            const marcos = inv.cantidadMarcos ?? 0;
            alzasPorMarcos[marcos] = (alzasPorMarcos[marcos] || 0) + 1;
        }
    }
    return { camaras, alzas, nucleos, alzasPorMarcos };
}

export function formatearAlzas(comp: ComposicionColmena): string {
    const partes = Object.entries(comp.alzasPorMarcos)
        .map(([marcos, cant]) => `${cant} de ${marcos} marcos`);
    return partes.length > 0 ? partes.join(', ') : '0';
}