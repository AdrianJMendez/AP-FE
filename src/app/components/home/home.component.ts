import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Search,
  MessageCircle,
  Heart,
  User,
  X,
  Plus,
  Filter,
  Grid3x3,
  List,
  Eye,
  Upload,
  ChevronLeft,
  ChevronRight,
  MoreVertical
} from 'lucide-angular';

interface Product {
  id: number;
  title: string;
  image: string;
  status: 'Venta' | 'Intercambio' | 'Préstamo' | 'Donación';
  price: number;
  tags: string[];
  category: string;
  career: string;
  description: string;
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
  readonly X = X;
  readonly Plus = Plus;
  readonly Filter = Filter;
  readonly MoreVertical = MoreVertical;
  readonly Eye = Eye;
  readonly Upload = Upload;
  readonly List = List;
  readonly Grid3x3 = Grid3x3;

  // Estados
  searchQuery = signal('');
  showFavoritesOnly = signal(false);
  activeTab = signal<'todos' | 'mis'>('todos');
  selectedProduct = signal<Product | null>(null);
  priceRange = signal<number>(10000);
  viewMode = signal<'grid' | 'list'>('grid');
  currentPage = signal(1);
  isAddDialogOpen = signal(false);
  imagePreviewUrl = signal('');

  // Nuevo producto
  newProduct = signal({
    title: '',
    image: '',
    status: 'Venta' as 'Venta' | 'Intercambio' | 'Préstamo' | 'Donación',
    price: '',
    condition: 'Usado',
    category: '',
    career: '',
    tags: [] as string[],
  });

  // Filtros
  selectedMaterials = signal<string[]>([]);
  selectedModalities = signal<string[]>([]);
  selectedCareers = signal<string[]>([]);
  favorites = signal<number[]>([2, 3, 6, 7, 11]);

  readonly itemsPerPage = 9;

  readonly statusColors: Record<string, { bg: string; text: string }> = {
    Venta:      { bg: 'bg-green-100',  text: 'text-green-700' },
    Donación:   { bg: 'bg-blue-100',   text: 'text-blue-700' },
    Préstamo:   { bg: 'bg-purple-100', text: 'text-purple-700' },
    Intercambio:{ bg: 'bg-yellow-100', text: 'text-yellow-700' },
  };

  getStatusBg(status: string): string {
    return this.statusColors[status]?.bg ?? 'bg-gray-100';
  }

  getStatusText(status: string): string {
    return this.statusColors[status]?.text ?? 'text-gray-700';
  }

  // Catálogo completo (12 productos)
  products: Product[] = [
    { id: 1,  title: 'Laptop Hp Premium',        image: 'assets/productos/laptophp.jpeg',        status: 'Venta',      price: 8000, tags: ['Usado', 'Ingeniería'],  category: 'Electrónicos',  career: 'Ingeniería',          description: 'Laptop de alto rendimiento ideal para estudiantes de ingeniería y diseño.' },
    { id: 2,  title: 'Bata de Laboratorio',       image: 'assets/productos/batalab.jpg',          status: 'Venta',      price: 350,  tags: ['Nuevo', 'Salud'],       category: 'Uniformes',     career: 'Ciencias de la Salud', description: 'Bata blanca de algodón, reglamentaria para laboratorios de la facultad.' },
    { id: 3,  title: 'Calculadora HP 50g',        image: 'assets/productos/calculadorahp.jpg',    status: 'Intercambio',price: 0,    tags: ['Usado', 'Completo'],    category: 'Calculadoras',  career: 'Ingeniería',          description: 'Calculadora gráfica en excelente estado, incluye estuche original.' },
    { id: 4,  title: 'Libro: Cálculo de Stewart', image: 'assets/productos/librocalculo.jpg',     status: 'Venta',      price: 800,  tags: ['Fisico', '7ma Ed.'],    category: 'Libros',        career: 'Todas',               description: 'Libro de Cálculo de una variable, séptima edición. Sin rayones.' },
    { id: 5,  title: 'Kit de Dibujo Técnico',     image: 'assets/productos/kitdibujo.jpg',        status: 'Venta',      price: 450,  tags: ['Completo'],             category: 'Otros',         career: 'Ingeniería',          description: 'Incluye tablero, escuadras y compás profesional.' },
    { id: 6,  title: 'Estetoscopio Littmann',     image: 'assets/productos/estetoscopio.png',     status: 'Venta',      price: 2100, tags: ['Profesional'],          category: 'Otros',         career: 'Ciencias de la Salud', description: 'Estetoscopio Littmann Classic III, poco uso.' },
    { id: 7,  title: 'Libro de Anatomía Gray',    image: 'assets/productos/librogray.jpg',        status: 'Intercambio',price: 0,    tags: ['Como nuevo'],           category: 'Libros',        career: 'Ciencias de la Salud', description: 'Libro de anatomía para estudiantes de medicina, tapa dura.' },
    { id: 8,  title: 'Uniforme de Odontología',   image: 'assets/productos/uniformeodonto.jpg',   status: 'Venta',      price: 600,  tags: ['Talla M'],              category: 'Uniformes',     career: 'Ciencias de la Salud', description: 'Filipina y pantalón de odontología, color reglamentario.' },
    { id: 9,  title: 'Tableta Gráfica Wacom',     image: 'assets/productos/tabletawacom.jpg',     status: 'Venta',      price: 1500, tags: ['Diseño'],               category: 'Electrónicos',  career: 'Artes',               description: 'Wacom Intuos Small, perfecta para dibujo digital y edición.' },
    { id: 10, title: 'Código Civil Honduras',     image: 'assets/productos/codigocivil.jpg',      status: 'Venta',      price: 1500, tags: ['Derecho'],              category: 'Libros',        career: 'Ciencias Jurídicas',  description: 'Última edición actualizada del Código Civil de Honduras.' },
    { id: 11, title: 'Microscopio Monocular',     image: 'assets/productos/micro.jpg',            status: 'Venta',      price: 3200, tags: ['Laboratorio'],          category: 'Electrónicos',  career: 'Biología',            description: 'Microscopio para laboratorio biológico, 400x de aumento.' },
    { id: 12, title: 'Planos de Arquitectura',    image: 'assets/productos/portaplanos.jpg',      status: 'Intercambio',price: 0,    tags: ['Referencia'],           category: 'Otros',         career: 'Arquitectura',        description: 'Tubo portaplanos resistente y ajustable.' }
  ];

  // Productos propios
  myProducts: Product[] = [
    { id: 101, title: 'Calculadora HP 50g (Mía)', image: 'assets/productos/calculadorahp.jpg', status: 'Venta',  price: 350, tags: ['Ingeniería'], category: 'Calculadoras', career: 'Ingeniería',           description: 'Mi calculadora personal.',   views: 127, savedBy: 15, messages: 8 },
    { id: 102, title: 'Bata de Laboratorio',      image: 'assets/productos/batalab.jpg',       status: 'Venta',  price: 200, tags: ['Salud'],      category: 'Uniformes',    career: 'Ciencias de la Salud', description: 'Bata en buen estado.',       views: 84,  savedBy: 6,  messages: 2 }
  ];

  filteredProducts = computed(() => {
    let result = this.products.filter(p => {
      const matchesSearch    = p.title.toLowerCase().includes(this.searchQuery().toLowerCase());
      const matchesMaterial  = this.selectedMaterials().length === 0 || this.selectedMaterials().includes(p.category);
      const matchesModality  = this.selectedModalities().length === 0 || this.selectedModalities().includes(p.status);
      const matchesCareer    = this.selectedCareers().length === 0 || this.selectedCareers().includes(p.career) || p.career === 'Todas';
      const matchesPrice     = p.price <= this.priceRange();
      return matchesSearch && matchesMaterial && matchesModality && matchesCareer && matchesPrice;
    });
    if (this.showFavoritesOnly()) {
      result = result.filter(p => this.favorites().includes(p.id));
    }
    return result;
  });

  pagedProducts = computed(() => {
    const all   = this.filteredProducts();
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return all.slice(start, start + this.itemsPerPage);
  });

  totalPages = computed(() =>
    Math.ceil(this.filteredProducts().length / this.itemsPerPage)
  );

  toggleFavorite(event: Event, id: number) {
    event.stopPropagation();
    const current = this.favorites();
    this.favorites.set(current.includes(id) ? current.filter(f => f !== id) : [...current, id]);
  }

  toggleFilter(type: 'material' | 'modality' | 'career', value: string) {
    const sig = type === 'material' ? this.selectedMaterials
              : type === 'modality' ? this.selectedModalities
              : this.selectedCareers;
    sig.update(v => v.includes(value) ? v.filter(i => i !== value) : [...v, value]);
  }

  openDetail(product: Product) {
    this.selectedProduct.set(product);
    document.body.style.overflow = 'hidden';
  }

  closeDetail() {
    this.selectedProduct.set(null);
    document.body.style.overflow = 'auto';
  }

  setPage(page: number) {
    this.currentPage.set(page);
  }

  openAddDialog() {
    this.isAddDialogOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeAddDialog() {
    this.isAddDialogOpen.set(false);
    this.imagePreviewUrl.set('');
    this.newProduct.set({ title: '', image: '', status: 'Venta', price: '', condition: 'Usado', category: '', career: '', tags: [] });
    document.body.style.overflow = 'auto';
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.imagePreviewUrl.set(dataUrl);
      this.newProduct.update(p => ({ ...p, image: dataUrl }));
    };
    reader.readAsDataURL(file);
  }

  clearImage() {
    this.imagePreviewUrl.set('');
    this.newProduct.update(p => ({ ...p, image: '' }));
  }

  setNewProductField(field: string, value: string) {
    this.newProduct.update(p => ({ ...p, [field]: value }));
  }

  onTagsChange(raw: string) {
    const tags = raw.split(',').map(t => t.trim()).filter(t => t.length > 0);
    this.newProduct.update(p => ({ ...p, tags }));
  }

  publishProduct() {
    const np = this.newProduct();
    console.log('Nuevo producto:', np);
    this.closeAddDialog();
  }
}