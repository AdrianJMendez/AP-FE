import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { 
  LucideAngularModule, 
  Trash2, 
  Eye, // Icono para ver detalles
  Search,
  LogOut,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-angular';

interface Publication {
  id: number;
  title: string;
  user: string;
  category: string;
  price: string;
  date: string;
  status: 'Disponible' | 'Reservado' | 'Donado';
  isApproved: boolean; // Control de moderación
}

@Component({
  selector: 'app-gestion',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule],
  templateUrl: './gestion.component.html',
  styleUrl: './gestion.component.css'
})
export class GestionComponent {
  private router = inject(Router);

  // Referencias para Lucide
  readonly Trash2 = Trash2;
  readonly Eye = Eye;
  readonly CheckCircle = CheckCircle;
  readonly XCircle = XCircle;
  readonly LogOut = LogOut;
  readonly Clock = Clock;

  publications = signal<Publication[]>([
    { id: 1, title: 'iPhone 13 Pro Max', user: 'Juan Pérez', category: 'Tecnología', price: 'L. 15,000', date: '18/01/2025', status: 'Disponible', isApproved: false },
    { id: 2, title: 'Calculadora TI-84 Plus', user: 'Maria Sosa', category: 'Académico', price: 'L. 1,200', date: '17/01/2025', status: 'Disponible', isApproved: true },
    { id: 3, title: 'Bata de Laboratorio L', user: 'Carlos Ruiz', category: 'Uniformes', price: 'Donación', date: '16/01/2025', status: 'Donado', isApproved: false },
    { id: 4, title: 'Libro Física Universitaria', user: 'Ana Martínez', category: 'Libros', price: 'L. 500', date: '15/01/2025', status: 'Reservado', isApproved: true },
    { id: 5, title: 'Laptop Dell Inspiron', user: 'Roberto Gómez', category: 'Tecnología', price: 'L. 8,500', date: '14/01/2025', status: 'Disponible', isApproved: false }
  ]);

  toggleApproval(id: number, approved: boolean) {
    this.publications.update(pubs => 
      pubs.map(p => p.id === id ? { ...p, isApproved: approved } : p)
    );
  }

  deletePublication(id: number) {
    if (confirm('¿Eliminar esta publicación de la base de datos?')) {
      this.publications.update(pubs => pubs.filter(p => p.id !== id));
    }
  }

  logout() {
    this.router.navigate(['/']); 
  }
}