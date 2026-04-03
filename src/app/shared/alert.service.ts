import { Injectable, signal } from '@angular/core';

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface AlertConfig {
  type: AlertType;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

@Injectable({ providedIn: 'root' })
export class AlertService {
  config = signal<AlertConfig | null>(null);

  show(config: AlertConfig) {
    this.config.set(config);
  }

  success(title: string, message: string) {
    this.config.set({ type: 'success', title, message });
  }

  error(title: string, message: string) {
    this.config.set({ type: 'error', title, message });
  }

  warning(title: string, message: string) {
    this.config.set({ type: 'warning', title, message });
  }

  info(title: string, message: string) {
    this.config.set({ type: 'info', title, message });
  }

  confirm(title: string, message: string, onConfirm: () => void, onCancel?: () => void) {
    this.config.set({
      type: 'confirm',
      title,
      message,
      confirmLabel: 'Confirmar',
      cancelLabel: 'Cancelar',
      onConfirm,
      onCancel
    });
  }

  close() {
    this.config.set(null);
  }
}