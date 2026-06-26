export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'unsupported';

/**
 * Comparte vía Web Share API si está disponible; si no, copia al portapapeles.
 * Devuelve qué ocurrió para dar feedback al usuario.
 */
export async function shareOrCopy(data: { title: string; text: string }): Promise<ShareResult> {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;

  if (nav && typeof nav.share === 'function') {
    try {
      await nav.share(data);
      return 'shared';
    } catch (err) {
      // El usuario canceló el diálogo nativo: no es un error a reportar.
      if (err instanceof Error && err.name === 'AbortError') return 'cancelled';
      // Otro fallo: intentamos copiar.
    }
  }

  if (nav?.clipboard?.writeText) {
    try {
      await nav.clipboard.writeText(`${data.title}\n\n${data.text}`);
      return 'copied';
    } catch {
      return 'unsupported';
    }
  }

  return 'unsupported';
}
