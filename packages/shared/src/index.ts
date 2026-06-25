// @bv/shared — lógica de dominio WA compartida entre FE y BE.
// scoring/ranking/pairing/stats y schemas se agregan en SH-2..SH-4.
export const SHARED_VERSION = '0.1.0';

export * from './api';
export * from './constants';
export * from './domain';
export * from './pairing';
export * from './ranking';
export * from './schemas/auth';
export * from './schemas/avatar';
export * from './schemas/tournament';
export * from './scoring';
export * from './securityQuestions';
export * from './stats';
export * from './types';
