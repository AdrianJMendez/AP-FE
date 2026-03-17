import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  LucideAngularModule, 
  Search, 
  MessageCircle, 
  Heart, 
  User, 
  Grid3x3, 
  List, 
  Eye, 
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical
} from 'lucide-angular';

interface Product {
  id: number;
  title: string;
  image: string;
  status: 'Venta' | 'Intercambio' | 'Préstamo';
  price: number;
  tags: string[];
  category: string;
  career: string;
  views?: number;
  savedBy?: number;
  messages?: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  // Iconos
  readonly Search = Search;
  readonly MessageCircle = MessageCircle;
  readonly Heart = Heart;
  readonly User = User;
  readonly Grid3x3 = Grid3x3;
  readonly List = List;
  readonly Eye = Eye;
  readonly Filter = Filter;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly MoreVertical = MoreVertical;

  // Estados de la UI
  activeTab = signal<'todos' | 'mis'>('todos');
  viewMode = signal<'grid' | 'list'>('grid');
  searchQuery = signal('');
  showFavoritesOnly = signal(false);
  
  // Filtros
  selectedMaterials = signal<string[]>([]);
  selectedModalities = signal<string[]>([]);
  selectedCareers = signal<string[]>([]);
  favorites = signal<number[]>([2, 3, 6, 7, 11]);

  // Catálogo completo de Ayuda Puma
  products: Product[] = [
    { id: 1, title: 'Laptop Hp Premium', image: 'assets/productos/laptophp.jpeg', status: 'Venta', price: 8000.00, tags: ['Usado', 'Ingeniería'], category: 'Electrónicos', career: 'Ingeniería' },
    { id: 2, title: 'Bata de Laboratorio', image: 'assets/productos/batalab.jpg', status: 'Venta', price: 350.00, tags: ['Nuevo', 'Salud'], category: 'Uniformes', career: 'Ciencias de la Salud' },
    { id: 3, title: 'Calculadora HP 50g', image: 'assets/productos/calculadorahp.jpg', status: 'Intercambio', price: 0, tags: ['Usado', 'Completo'], category: 'Calculadoras', career: 'Ingeniería' },
    { id: 4, title: 'Libro: Cálculo de Stewart', image: 'assets/productos/librocalculo.jpg', status: 'Venta', price: 800.00, tags: ['Fisico', 'Séptima Ed.'], category: 'Libros', career: 'Todas' },
    { id: 5, title: 'Kit de Dibujo Técnico', image: 'assets/productos/kitdibujo.jpg', status: 'Venta', price: 450.00, tags: ['Completo'], category: 'Otros', career: 'Ingeniería' },
    { id: 6, title: 'Estetoscopio Littmann', image: 'assets/productos/estetoscopio.png', status: 'Venta', price: 2100.00, tags: ['Profesional'], category: 'Otros', career: 'Ciencias de la Salud' },
    { id: 7, title: 'Libro de Anatomía Gray', image: 'assets/productos/librogray.jpg', status: 'Intercambio', price: 0, tags: ['Como nuevo'], category: 'Libros', career: 'Ciencias de la Salud' },
    { id: 8, title: 'Uniforme de Odontología', image: 'assets/productos/uniformeodonto.jpg', status: 'Venta', price: 600.00, tags: ['Talla M'], category: 'Uniformes', career: 'Ciencias de la Salud' },
    { id: 9, title: 'Tableta Gráfica Wacom', image: 'assets/productos/tabletawacom.jpg', status: 'Venta', price: 1500.00, tags: ['Diseño'], category: 'Electrónicos', career: 'Artes' },
    { id: 10, title: 'Código Civil Honduras', image: 'assets/productos/codigocivil.jpg', status: 'Venta', price: 1500.00, tags: ['Derecho'], category: 'Libros', career: 'Ciencias Jurídicas' },
    { id: 11, title: 'Microscopio Monocular', image: 'assets/productos/micro.jpg', status: 'Venta', price: 3200.00, tags: ['Laboratorio'], category: 'Electrónicos', career: 'Biología' },
    { id: 12, title: 'Planos de Arquitectura', image: 'assets/productos/portaplanos.jpg', status: 'Intercambio', price: 0, tags: ['Referencia'], category: 'Otros', career: 'Arquitectura' }
  ];

  // Productos del usuario (Pestaña "Mis Productos")
  myProducts: Product[] = [
    { id: 101, title: 'Calculadora HP 50g (Mía)', image: 'assets/productos/calculadorahp.jpg', status: 'Venta', price: 350, tags: ['Ingeniería'], category: 'Calculadoras', career: 'Ingeniería', views: 127, savedBy: 15, messages: 8 },
    { id: 102, title: 'Bata de Laboratorio', image: 'assets/productos/batalab.jpg', status: 'Venta', price: 200, tags: ['Salud'], category: 'Uniformes', career: 'Ciencias de la Salud', views: 84, savedBy: 6, messages: 2 }
  ];

  // Lógica de filtrado reactiva con Computed
  filteredProducts = computed(() => {
    let result = this.products.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(this.searchQuery().toLowerCase());
      const matchesMaterial = this.selectedMaterials().length === 0 || this.selectedMaterials().includes(p.category);
      const matchesModality = this.selectedModalities().length === 0 || this.selectedModalities().includes(p.status);
      const matchesCareer = this.selectedCareers().length === 0 || this.selectedCareers().includes(p.career) || this.selectedCareers().includes('Todas');
      
      return matchesSearch && matchesMaterial && matchesModality && matchesCareer;
    });

    if (this.showFavoritesOnly()) {
      result = result.filter(p => this.favorites().includes(p.id));
    }
    return result;
  });

  toggleFavorite(id: number) {
    const currentFavs = this.favorites();
    if (currentFavs.includes(id)) {
      this.favorites.set(currentFavs.filter(favId => favId !== id));
    } else {
      this.favorites.set([...currentFavs, id]);
    }
  }

  toggleFilter(type: 'material' | 'modality' | 'career', value: string) {
    let current: string[];
    if (type === 'material') {
      current = this.selectedMaterials();
      this.selectedMaterials.set(this.getNewFilterList(current, value));
    } else if (type === 'modality') {
      current = this.selectedModalities();
      this.selectedModalities.set(this.getNewFilterList(current, value));
    } else {
      current = this.selectedCareers();
      this.selectedCareers.set(this.getNewFilterList(current, value));
    }
  }

  private getNewFilterList(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter(v => v !== value) : [...list, value];
  }
}