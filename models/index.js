import { buildFccUnit } from './fcc-unit.js';
import { buildHydrocracking } from './hydrocracking.js';
import { buildAtmosphericDistillation } from './atmospheric-distillation.js';
import { buildVacuumDistillation } from './vacuum-distillation.js';
import { buildCrudeDesalter } from './crude-desalter.js';
import { buildCatalyticReforming } from './catalytic-reforming.js';
import { buildAlkylation } from './alkylation.js';
import { buildIsomerization } from './isomerization.js';

export const models = [
  {
    id: 'desalter',
    name: 'Desalador de Crudo (Desalter)',
    description: 'Tren de desalado: bomba de carga, intercambiadores de precalentamiento, válvula de mezcla, inyección de agua de lavado, dos desaladores electrostáticos en serie y sistema de salmuera. Soporta vista explosionada.',
    build: buildCrudeDesalter,
  },
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
  {
    id: 'reforming',
    name: 'Unidad de Reformado Catalítico (CCR)',
    description: 'Reformado catalítico continuo: torre de reactores apilados (R1-R4) de lecho móvil, tren de hornos intermedios, regenerador CCR, líneas de catalizador, intercambiador carga/efluente, separador de hidrógeno, compresor de reciclo y estabilizador. Soporta vista explosionada.',
    build: buildCatalyticReforming,
  },
  {
    id: 'alkylation',
    name: 'Unidad de Alquilación (H₂SO₄)',
    description: 'Alquilación con ácido sulfúrico (tipo Stratco): reactor contactor con mezclador, decantador de ácido, ciclo de refrigeración, lavado cáustico/agua, desisobutanizador, despropanizador, tanques de ácido y tratamiento de carga. Soporta vista explosionada.',
    build: buildAlkylation,
  },
  {
    id: 'isomerization',
    name: 'Unidad de Isomerización (C5/C6)',
    description: 'Isomerización de nafta ligera (tipo Penex): secadores de tamiz molecular, intercambiador carga/efluente, calentador, reactores lead-lag de alúmina clorada, inyección de cloruro, compresor de H₂, estabilizador con lavador cáustico y desisohexanizador de reciclo. Soporta vista explosionada.',
    build: buildIsomerization,
  },
];
