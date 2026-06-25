interface FieldErrorProps {
  children?: string;
  id?: string;
}

/** Mensaje de error de un campo (oculto si no hay mensaje). */
export function FieldError({ children, id }: FieldErrorProps) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-danger text-sm">
      {children}
    </p>
  );
}
