interface SpinnerProps {
  size?: number;
  label?: string;
}

/** Indicador de carga accesible. */
export function Spinner({ size = 20, label = 'Cargando' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className="inline-block animate-spin rounded-full border-2 border-current border-t-transparent"
      style={{ width: size, height: size }}
    />
  );
}
