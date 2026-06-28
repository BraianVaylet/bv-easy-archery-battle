/** Formatea un timestamp (epoch ms) como fecha corta es-AR. */
export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
