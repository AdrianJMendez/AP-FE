import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
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
  MoreVertical
} from 'lucide-angular';

interface Product {
  id: number;
  title: string;
  image: string;
  status: 'Venta' | 'Intercambio' | 'Donación';
  price: number;
  tags: string[];
  category: string;
  career: string;
  description: string;
  views?: number;
  savedBy?: number;
  messages?: number;
  owner?: string;
  ownerId?: number;
}

const MODALITY_MAP: Record<string, number> = {
  'Venta': 1,
  'Intercambio': 2,
  'Donación': 3
};

const CATEGORY_MAP: Record<string, number> = {
  'Tecnología': 1,
  'Libros y Material Académico': 2,
  'Uniformes': 3,
  'Electrodomésticos': 4,
  'Ropa y Accesorios': 5,
  'Deportes': 6,
  'Hogar': 7,
  'Instrumentos Musicales': 8,
  'Otros': 9
};

const CONDITION_MAP: Record<string, number> = {
  'Nuevo': 1,
  'Usado': 2
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);

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

  productsSignal = signal<Product[]>([]);
  myProductsSignal = signal<Product[]>([]);

  searchQuery = signal('');
  showFavoritesOnly = signal(false);
  activeTab = signal<'todos' | 'mis'>('todos');
  selectedProduct = signal<Product | null>(null);
  priceRange = signal<number>(15000);
  viewMode = signal<'grid' | 'list'>('grid');

  currentPage = signal(1);
  totalPagesFromServer = signal(1);
  currentMyPage = signal(1);

  isAddDialogOpen = signal(false);
  imagePreviewUrl = signal('');
  isSaving = signal(false);
  isUploadingImage = signal(false); // Estado para saber si la imagen se está subiendo

  newProduct = signal({
    title: '',
    description: '',
    image: '',
    status: 'Venta' as 'Venta' | 'Intercambio' | 'Donación',
    price: '',
    condition: 'Usado',
    category: '',
    career: '',
    tags: [] as string[],
  });

  selectedMaterials = signal<string[]>([]);
  selectedModalities = signal<string[]>([]);
  selectedCareers = signal<string[]>([]);
  favorites = signal<number[]>([]);

  readonly itemsPerPage = 9;

  readonly statusColors: Record<string, { bg: string; text: string }> = {
    Venta:       { bg: 'bg-green-100',  text: 'text-green-700' },
    Donación:    { bg: 'bg-blue-100',   text: 'text-blue-700' },
    Intercambio: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  };

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.productService.getProducts(this.currentPage()).subscribe({
      next: (response: any) => {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const rawData = response.data || [];
        const currentUserId = currentUser?.idUser;

        this.totalPagesFromServer.set(response.meta?.[0]?.totalPages ?? 1);

        const mapped: Product[] = rawData.map((p: any) => ({
          id: p.idProduct,
          title: p.productName,
          image: (p.images && p.images.length > 0)
                  ? p.images[0].imageUrl
                  : 'assets/productos/default.jpg',
          status: p.modalityName as any,
          price: p.price,
          tags: [p.categoryName, p.conditionName].filter(Boolean),
          category: p.categoryName || 'Otros',
          career: 'Todas',
          description: p.description,
          owner: `${p.firstName} ${p.lastName}`,
          ownerId: p.idUser,
          views: Math.floor(Math.random() * 100),
          savedBy: Math.floor(Math.random() * 20),
          messages: Math.floor(Math.random() * 5)
        }));

        this.productsSignal.set(mapped);
        this.myProductsSignal.set(mapped.filter(p => p.ownerId === Number(currentUserId)));
      },
      error: (err: any) => console.error('Error al conectar con la API:', err)
    });
  }

  setNewProductField(field: string, value: any) {
    this.newProduct.update(p => ({ ...p, [field]: value }));
  }

  clearImage() {
    this.imagePreviewUrl.set('');
    this.newProduct.update(p => ({ ...p, image: '' }));
  }

  onTagsChange(value: string) {
    const tags = value.split(',').map(t => t.trim()).filter(t => t.length > 0);
    this.newProduct.update(p => ({ ...p, tags }));
  }

  filteredProducts = computed(() => {
    let result = this.productsSignal().filter(p => {
      const matchesSearch   = p.title.toLowerCase().includes(this.searchQuery().toLowerCase());
      const matchesMaterial = this.selectedMaterials().length === 0 || this.selectedMaterials().includes(p.category);
      const matchesModality = this.selectedModalities().length === 0 || this.selectedModalities().includes(p.status);
      const matchesCareer   = this.selectedCareers().length === 0 || this.selectedCareers().includes(p.career) || p.career === 'Todas';
      const matchesPrice    = p.price <= this.priceRange();
      return matchesSearch && matchesMaterial && matchesModality && matchesCareer && matchesPrice;
    });

    if (this.showFavoritesOnly()) {
      result = result.filter(p => this.favorites().includes(p.id));
    }
    return result;
  });

  pagedProducts = computed(() => this.filteredProducts());

  totalPages = computed(() => this.totalPagesFromServer());

  pagedMyProducts = computed(() => {
    const all   = this.myProductsSignal();
    const start = (this.currentMyPage() - 1) * this.itemsPerPage;
    return all.slice(start, start + this.itemsPerPage);
  });

  totalMyPages = computed(() =>
    Math.ceil(this.myProductsSignal().length / this.itemsPerPage)
  );

  isMyProduct = computed(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return (product: Product) => product.ownerId === Number(currentUser?.idUser);
  });

  getStatusBg(status: string): string  { return this.statusColors[status]?.bg   ?? 'bg-gray-100'; }
  getStatusText(status: string): string { return this.statusColors[status]?.text ?? 'text-gray-700'; }

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
    this.currentPage.set(1);
    this.loadProducts();
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
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadProducts();
  }

  setMyPage(page: number) {
    if (page < 1 || page > this.totalMyPages()) return;
    this.currentMyPage.set(page);
  }

  openAddDialog() {
    this.isAddDialogOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeAddDialog() {
    this.isAddDialogOpen.set(false);
    this.imagePreviewUrl.set('');
    this.newProduct.set({
      title: '', description: '', image: '',
      status: 'Venta', price: '', condition: 'Usado',
      category: '', career: '', tags: []
    });
    document.body.style.overflow = 'auto';
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];

    // Mostrar preview local inmediatamente
    const reader = new FileReader();
    reader.onload = () => this.imagePreviewUrl.set(reader.result as string);
    reader.readAsDataURL(file);

    // Subir imagen al servidor y guardar solo la ruta
    this.isUploadingImage.set(true);
    const formData = new FormData();
    formData.append('image', file);

    this.productService.uploadImage(formData).subscribe({
      next: (res: any) => {
        this.isUploadingImage.set(false);
        this.newProduct.update(p => ({ ...p, image: res.imageUrl }));
      },
      error: () => {
        this.isUploadingImage.set(false);
        alert('Error al subir la imagen. Intenta de nuevo.');
        this.clearImage();
      }
    });
  }

  publishProduct() {
    const p = this.newProduct();
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    if (!p.title.trim())       { alert('El título es obligatorio.');       return; }
    if (!p.description.trim()) { alert('La descripción es obligatoria.');  return; }
    if (!p.category)           { alert('Selecciona una categoría.');       return; }
    if (!p.condition)          { alert('Selecciona una condición.');       return; }
    if (this.isUploadingImage()) { alert('Espera a que la imagen termine de subirse.'); return; }

    const idModality  = MODALITY_MAP[p.status];
    const idCategory  = CATEGORY_MAP[p.category];
    const idCondition = CONDITION_MAP[p.condition];

    if (!idModality || !idCategory || !idCondition) {
      alert('Datos inválidos. Verifica modalidad, categoría y condición.');
      return;
    }

    const payload = {
      idProduct:   null,
      productName: p.title.trim(),
      description: p.description.trim(),
      price:       p.price ? parseFloat(p.price) : 0,
      idModality,
      idCondition,
      idCategory,
      idStatus:    1,
      idUser:      currentUser.idUser,
      images:      p.image ? [{ imageUrl: p.image }] : []
    };

    this.isSaving.set(true);

    this.productService.saveProduct(payload).subscribe({
      next: (response: any) => {
        this.isSaving.set(false);

        if (response?.ok === false) {
          alert('Error al publicar: ' + (response.message || 'Error desconocido'));
          return;
        }

        const newMapped: Product = {
          id: response?.data?.idProduct ?? Date.now(),
          title: p.title.trim(),
          image: p.image || 'assets/productos/default.jpg',
          status: p.status,
          price: p.price ? parseFloat(p.price) : 0,
          tags: [p.category, p.condition].filter(Boolean),
          category: p.category,
          career: p.career || 'Todas',
          description: p.description.trim(),
          owner: `${currentUser.firstName ?? ''} ${currentUser.lastName ?? ''}`.trim(),
          ownerId: currentUser.idUser,
          views: 0,
          savedBy: 0,
          messages: 0
        };

        this.productsSignal.update(list => [newMapped, ...list]);
        this.myProductsSignal.update(list => [newMapped, ...list]);

        this.closeAddDialog();
        this.loadProducts();
      },
      error: (err: any) => {
        this.isSaving.set(false);
        console.error('Error al publicar producto:', err);
        alert('No se pudo conectar con el servidor.');
      }
    });
  }
}