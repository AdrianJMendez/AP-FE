import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router'; // Añadido Router
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service'; 
import { LucideAngularModule, LayoutDashboard, FileText, Trash2, LogOut, Settings } from 'lucide-angular';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule],
  templateUrl: './admin.component.html'
})
export class AdminComponent implements OnInit {
  private productService = inject(ProductService);
  private router = inject(Router); // Inyectamos el Router

  readonly LayoutDashboard = LayoutDashboard;
  readonly FileText = FileText;
  readonly Trash2 = Trash2;
  readonly LogOut = LogOut;
  readonly Settings = Settings;

  totalProducts = signal(0);
  totalDeletions = signal(0);
  deletionHistory = signal<any[]>([]);

  ngOnInit() {
    this.loadDashboard();
  }

  // --- NUEVA FUNCIÓN LOGOUT ---
  logout() {
    // Aquí puedes limpiar tokens si los tienes: localStorage.clear();
    this.router.navigate(['/login']); // Cambia '/login' por tu ruta real de acceso
  }

  loadDashboard() {
    this.productService.getMetrics().subscribe({
      next: (res: any) => {
        if (res.data) {
          this.totalProducts.set(res.data.totalAvailableProducts);
          this.totalDeletions.set(res.data.totalInactivatedProducts);
        }
      },
      error: (err) => console.error('Error en métricas:', err)
    });

    this.productService.getHistory(1, 'Denegados').subscribe({
      next: (res: any) => {
        if (res.data) {
          this.deletionHistory.set(res.data.map((item: any) => ({
            product: item.productName,
            admin: item.employeeName,
            reason: item.description || 'Sin motivo especificado',
            date: item.changedAt 
          })));
        }
      },
      error: (err) => console.error('Error en historial:', err)
    });
  }
}