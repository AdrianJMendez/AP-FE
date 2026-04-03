import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService } from './alert.service';
import {
  LucideAngularModule,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  X
} from 'lucide-angular';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './alert.component.html'
})
export class AlertComponent {
  readonly alertService = inject(AlertService);

  readonly CheckCircle  = CheckCircle;
  readonly XCircle      = XCircle;
  readonly AlertTriangle = AlertTriangle;
  readonly Info         = Info;
  readonly HelpCircle   = HelpCircle;
  readonly X            = X;

  get config() { return this.alertService.config(); }

  iconFor(type: string) {
    switch (type) {
      case 'success': return this.CheckCircle;
      case 'error':   return this.XCircle;
      case 'warning': return this.AlertTriangle;
      case 'confirm': return this.HelpCircle;
      default:        return this.Info;
    }
  }

  colorFor(type: string): { icon: string; btn: string; bg: string; border: string } {
    switch (type) {
      case 'success': return { icon: 'text-green-500',  btn: 'bg-green-500 hover:bg-green-600',   bg: 'bg-green-50',  border: 'border-green-100' };
      case 'error':   return { icon: 'text-red-500',    btn: 'bg-red-500 hover:bg-red-600',       bg: 'bg-red-50',    border: 'border-red-100' };
      case 'warning': return { icon: 'text-yellow-500', btn: 'bg-yellow-500 hover:bg-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' };
      case 'confirm': return { icon: 'text-blue-500',   btn: 'bg-[#2E4C9E] hover:bg-blue-800',   bg: 'bg-blue-50',   border: 'border-blue-100' };
      default:        return { icon: 'text-blue-500',   btn: 'bg-[#2E4C9E] hover:bg-blue-800',   bg: 'bg-blue-50',   border: 'border-blue-100' };
    }
  }

  handleConfirm() {
    this.config?.onConfirm?.();
    this.alertService.close();
  }

  handleCancel() {
    this.config?.onCancel?.();
    this.alertService.close();
  }
}