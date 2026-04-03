import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  FileText,
  LayoutDashboard,
  LogOut,
  LucideAngularModule,
  Settings,
  Trash2
} from 'lucide-angular';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { ProductService } from '../../services/product.service';

interface HistoryItemView {
  idHistory: number;
  product: string;
  admin: string;
  reason: string;
  date: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly LayoutDashboard = LayoutDashboard;
  readonly FileText = FileText;
  readonly Trash2 = Trash2;
  readonly LogOut = LogOut;
  readonly Settings = Settings;
  readonly employeeRegistrationRoute = ['/', environment.employeeRegistrationPath];

  totalProducts = signal(0);
  totalDeletions = signal(0);
  historyItems = signal<HistoryItemView[]>([]);
  activeTab = signal<'Denegados' | 'Aprobados'>('Denegados');
  isLoadingMetrics = signal(false);
  isLoadingHistory = signal(false);

  ngOnInit() {
    this.loadDashboard();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  loadDashboard() {
    this.loadMetrics();
    this.loadHistory();
  }

  private loadMetrics() {
    this.isLoadingMetrics.set(true);

    this.productService.getMetrics().subscribe({
      next: (response: any) => {
        this.isLoadingMetrics.set(false);

        const metrics = response?.data;
        this.totalProducts.set(metrics?.totalAvailableProducts ?? 0);
        this.totalDeletions.set(metrics?.totalInactivatedProducts ?? 0);
      },
      error: (err) => {
        this.isLoadingMetrics.set(false);
        console.error('Error en metricas:', err);
        this.totalProducts.set(0);
        this.totalDeletions.set(0);
      }
    });
  }

  setHistoryTab(tab: 'Denegados' | 'Aprobados') {
    if (this.activeTab() !== tab) {
      this.activeTab.set(tab);
      this.loadHistory();
    }
  }

  private loadHistory() {
    this.isLoadingHistory.set(true);

    this.productService.getHistory(1, this.activeTab()).subscribe({
      next: (response: any) => {
        this.isLoadingHistory.set(false);

        const rows = response?.data ?? [];
        this.historyItems.set(
          rows.map((item: any) => ({
            idHistory: item.idHistory,
            product: item.productName,
            admin: item.employeeName,
            reason:
              item.description ??
              item.reason ??
              item.moderationDescription ??
              'Sin descripcion registrada',
            date: item.changedAt
          }))
        );
      },
      error: (err) => {
        this.isLoadingHistory.set(false);
        console.error('Error en historial:', err);
        this.historyItems.set([]);
      }
    });
  }
}
