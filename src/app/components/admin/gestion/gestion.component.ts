import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; // Añadido Router
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../services/product.service';
import { LucideAngularModule, Trash2, CheckCircle, LogOut } from 'lucide-angular';

@Component({
  selector: 'app-gestion',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule, FormsModule],
  templateUrl: './gestion.component.html'
})
export class GestionComponent implements OnInit {
  private productService = inject(ProductService);
  private router = inject(Router); // Inyectamos el Router

  readonly Trash2 = Trash2;
  readonly CheckCircle = CheckCircle;
  readonly LogOut = LogOut;

  publications = signal<any[]>([]);
  showModal = signal(false);
  selectedPublication = signal<any>(null);
  selectedStatus = signal<number>(1);
  actionReason = '';

  ngOnInit() {
    this.loadPending();
  }

  // --- NUEVA FUNCIÓN LOGOUT ---
  logout() {
    this.router.navigate(['/login']);
  }

  loadPending() {
    this.productService.getRequestedProducts(1).subscribe({
      next: (res: any) => {
        this.publications.set(res.data || []);
      },
      error: (err) => console.error('Error cargando pendientes:', err)
    });
  }

  openModal(pub: any, status: number) {
    this.selectedPublication.set(pub);
    this.selectedStatus.set(status);
    this.actionReason = status === 1 ? 'Publicación aprobada por moderación' : '';
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedPublication.set(null);
    this.actionReason = '';
  }

  confirmAction() {
    const pub = this.selectedPublication();
    if (!pub) return;

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const currentUserId = Number(currentUser?.idUser || 1);

    this.productService.changeStatus(
      pub.idProduct,
      currentUserId,
      this.selectedStatus()
    ).subscribe({
      next: () => {
        this.loadPending();
        this.closeModal();
      },
      error: (err) => alert('Error al procesar la acción: ' + err.message)
    });
  }
}