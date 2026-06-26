import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

/** Estado vacío para listas sin datos. */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-border border-dashed bg-surface px-6 py-10 text-center">
      <p className="font-medium text-fg">{title}</p>
      {description && <p className="text-muted text-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
