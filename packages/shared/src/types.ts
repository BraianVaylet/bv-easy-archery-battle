/**
 * Tipos de las entidades tal como las devuelve la API (camelCase).
 * Las filas de la DB (snake_case) se mapean a estos tipos en los repositories.
 */

import type { BowCategory, Experience } from './domain';

export interface PublicUser {
  id: number;
  alias: string;
}

export interface Avatar {
  id: number;
  alias: string;
  bowCategory: BowCategory;
  color: string;
  experience: Experience;
  createdAt: number;
  updatedAt: number;
}

export interface CatalogModality {
  key: string;
  label: string;
  defaultArrows: number;
  maxPerArrow: number;
  scoringSet: string[];
  defaultRounds: number;
}

export interface Catalog {
  bowCategories: { key: string; label: string }[];
  modalities: CatalogModality[];
  colors: { key: string; label: string; hex: string }[];
}
