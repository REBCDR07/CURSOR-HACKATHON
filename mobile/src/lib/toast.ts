export type ToastTone = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  tone?: ToastTone;
  durationMs?: number;
}

type ToastHandler = (message: string, options?: ToastOptions) => void;

let handler: ToastHandler | null = null;

export function registerToastHandler(next: ToastHandler | null): void {
  handler = next;
}

export function showToast(message: string, options?: ToastOptions): void {
  if (!message.trim()) return;
  handler?.(message, options);
}
