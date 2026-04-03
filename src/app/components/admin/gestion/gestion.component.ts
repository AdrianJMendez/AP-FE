import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  CheckCircle,
  Eye,
  LogOut,
  LucideAngularModule,
  Trash2,
  X
} from 'lucide-angular';
import { ProductService } from '../../../services/product.service';

interface PendingPublication {
  idProduct: number;
  productName: string;
  description: string;
  price: number;
  createdAt: string;
  categoryName: string;
  modalityName: string;
  conditionName: string;
  idUser: number;
  firstName: string;
  lastName: string;
  images?: Array<{ imageUrl: string }>;
}

@Component({
  selector: 'app-gestion',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule, FormsModule],
  templateUrl: './gestion.component.html',
  styleUrl: './gestion.component.css'
})
export class GestionComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly Trash2 = Trash2;
  readonly CheckCircle = CheckCircle;
  readonly LogOut = LogOut;
  readonly Eye = Eye;
  readonly X = X;

  publications = signal<PendingPublication[]>([]);
  isLoading = signal(false);
  currentPage = signal(1);
  totalPages = signal(1);

  showDetailModal = signal(false);
  selectedPublication = signal<PendingPublication | null>(null);

  showStatusModal = signal(false);
  selectedStatus = signal<1 | 5>(1);
  actionReason = signal('');
  isSubmitting = signal(false);

  ngOnInit() {
    this.loadPending();
  }

  logout() {
    this.router.navigate(['/']);
  }

  loadPending(page: number = this.currentPage()) {
    this.isLoading.set(true);

    this.productService.getRequestedProducts(page).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        this.currentPage.set(response?.meta?.[0]?.currentPage ?? page);
        this.totalPages.set(response?.meta?.[0]?.totalPages ?? 1);
        this.publications.set(response?.data ?? []);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Error cargando pendientes:', err);
        this.publications.set([]);
      }
    });
  }

  setPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.loadPending(page);
  }

  openDetail(publication: PendingPublication) {
    this.selectedPublication.set(publication);
    this.showDetailModal.set(true);
    this.setBodyScroll(true);
  }

  closeDetailModal() {
    this.showDetailModal.set(false);
    this.selectedPublication.set(null);
    if (!this.showStatusModal()) {
      this.setBodyScroll(false);
    }
  }

  openStatusModal(publication: PendingPublication, status: 1 | 5) {
    this.selectedPublication.set(publication);
    this.selectedStatus.set(status);
    this.actionReason.set('');
    this.showStatusModal.set(true);
    this.setBodyScroll(true);
  }

  closeStatusModal() {
    this.showStatusModal.set(false);
    this.actionReason.set('');
    if (!this.showDetailModal()) {
      this.selectedPublication.set(null);
      this.setBodyScroll(false);
    }
  }

  confirmAction() {
    const publication = this.selectedPublication();
    if (!publication || this.isSubmitting()) return;

    const currentUser = this.getCurrentUser();
    const idUser = Number(currentUser?.idUser);

    if (!idUser) {
      alert('No se encontró el usuario actual en la sesión.');
      return;
    }

    const description = this.actionReason().trim();

    if (!description) {
      alert(
        this.selectedStatus() === 5
          ? 'Debes escribir una descripción para poner la publicación en inactivo.'
          : 'Debes escribir una descripción para aprobar la publicación.'
      );
      return;
    }

    this.isSubmitting.set(true);

    this.productService
      .changeStatus(publication.idProduct, idUser, this.selectedStatus(), description)
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeStatusModal();

          if (this.showDetailModal()) {
            this.closeDetailModal();
          }

          const fallbackPage =
            this.publications().length === 1 && this.currentPage() > 1
              ? this.currentPage() - 1
              : this.currentPage();

          this.loadPending(fallbackPage);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          console.error('Error cambiando estado:', err);
          alert('No se pudo actualizar el estado de la publicación.');
        }
      });
  }

  getPrimaryImage(publication: PendingPublication) {
    const validImage = publication.images?.find((image) => image.imageUrl?.trim());
    return validImage?.imageUrl || 'assets/productos/default.jpg';
  }

  getPriceLabel(price: number) {
    return price > 0 ? `L. ${price.toFixed(2)}` : 'Gratis';
  }

  private getCurrentUser() {
    if (!isPlatformBrowser(this.platformId)) return {};

    try {
      return JSON.parse(localStorage.getItem('currentUser') || '{}');
    } catch {
      return {};
    }
  }

  private setBodyScroll(locked: boolean) {
    if (!isPlatformBrowser(this.platformId)) return;
    document.body.style.overflow = locked ? 'hidden' : 'auto';
  }
}
