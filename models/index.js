import { buildIndustrialPlant } from './industrial-plant.js';
import { buildHeatExchanger } from './heat-exchanger.js';

export const models = [
  {
    id: 'plant',
    name: 'Planta de destilación',
    description: 'Unidad central con columna de destilación, horno de proceso, regasificador, bombas y estructura metálica de soporte.',
    build: buildIndustrialPlant,
  },
  {
    id: 'heat-exchanger',
    name: 'Intercambiador de calor (carcasa y tubos)',
    description: 'Modelo simplificado de un intercambiador de calor de carcasa y tubos con cabezales desmontables.',
    build: buildHeatExchanger,
  },
];
