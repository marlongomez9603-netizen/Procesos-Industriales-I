import { buildFccUnit } from './fcc-unit.js';
import { buildHydrocracking } from './hydrocracking.js';
import { buildAtmosphericDistillation } from './atmospheric-distillation.js';
import { buildVacuumDistillation } from './vacuum-distillation.js';

export const models = [
  {
    id: 'cdu',
    name: 'Columna de Destilación Atmosférica (CDU)',
    description: 'Equipo detallado: columna principal por secciones (faldón, cabezales, stripping, flasheo/HGO, LGO, top, domo) con internos visibles, horno de carga, side strippers, sistema de cabeza y bombas. Soporta vista explosionada.',
    build: buildAtmosphericDistillation,
  },
  {
    id: 'vdu',
    name: 'Columna de Destilación al Vacío (VDU)',
    description: 'Torre swaged con secciones de stripping/flasheo-lavado/LVGO e internos visibles, horno de carga, sistema de eyectores de vapor de tres etapas con intercondensadores, sump, pumparounds y enfriadores. Soporta vista explosionada.',
    build: buildVacuumDistillation,
  },
  {
    id: 'fcc',
    name: 'Unidad de Cracking Catalítico Fluidizado (FCC)',
    description: 'Unidad de FCC con reactor (riser y disengager), regenerador, ciclones, líneas de catalizador, fraccionadora principal, soplante de aire y chimenea de gases.',
    build: buildFccUnit,
  },
  {
    id: 'hydrocracking',
    name: 'Unidad de Hidrocraqueo (Hydrocracking)',
    description: 'Unidad de hidrocraqueo de dos etapas (hidrotratamiento + hidrocraqueo) con horno de carga, intercambiadores carga/efluente, separadores HP/LP, absorbedor de aminas, compresores de H₂ de reciclo y makeup, y fraccionador de productos.',
    build: buildHydrocracking,
  },
];
