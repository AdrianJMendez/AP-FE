import { Component, signal, computed, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  MoreVertical,
  LogOut,
  Send
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

interface ChatMessage {
  text: string;
  time: string;
  mine: boolean;
}

interface Chat {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  online: boolean;
  messages: ChatMessage[];
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
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);

  // ── Lucide icons ──────────────────────────────────────────────
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
  readonly LogOut = LogOut;
  readonly Send = Send;

  // ── Productos ─────────────────────────────────────────────────
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

  // ── Agregar producto ──────────────────────────────────────────
  isAddDialogOpen = signal(false);
  imagePreviews = signal<string[]>([]);
  imageUrls     = signal<string[]>([]);
  uploadingCount = signal(0);
  isSaving = signal(false);

  get isUploadingImage() { return this.uploadingCount() > 0; }

  newProduct = signal({
    title: '',
    description: '',
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

  // ── Modal Perfil ──────────────────────────────────────────────
  isProfileOpen = signal(false);

  // ── Modal Mensajería ──────────────────────────────────────────
  isMessagesOpen = signal(false);
  chatSearch = signal('');
  selectedChat = signal<Chat | null>(null);
  newMessage = signal('');

  chats = signal<Chat[]>([
    {
      id: 1,
      name: 'Eli Oseguera',
      lastMessage: 'Perfecto, Gracias 😊',
      time: '10 min',
      online: true,
      messages: [
        { text: '¿Aún tienes la calculadora disponible?', time: '10:05 am', mine: false },
        { text: 'Sí, sigue disponible. ¿Te interesa?',   time: '10:06 am', mine: true  },
        { text: 'Perfecto, Gracias 😊',                   time: '10:08 am', mine: false },
      ]
    },
    {
      id: 2,
      name: 'Sofía Hernández',
      lastMessage: 'Sí, aún lo tengo disponible',
      time: '10:12 am',
      online: false,
      messages: [
        { text: '¿Tienes el libro de cálculo III?', time: '10:10 am', mine: false },
        { text: 'Sí, aún lo tengo disponible',      time: '10:12 am', mine: true  },
      ]
    },
    {
      id: 3,
      name: 'Kevin López',
      lastMessage: 'Claro, ¿cuándo los necesitas?',
      time: '9:49 am',
      online: false,
      messages: [
        { text: '¿Me puedes vender los apuntes de Física II?', time: '9:47 am', mine: false },
        { text: 'Claro, ¿cuándo los necesitas?',               time: '9:49 am', mine: true  },
      ]
    },
    {
      id: 4,
      name: 'Andrea Gómez',
      lastMessage: 'Te lo dejo en L. 400',
      time: '8:30 am',
      online: false,
      messages: [
        { text: '¿Cuánto por el uniforme?', time: '8:28 am', mine: false },
        { text: 'Te lo dejo en L. 400',     time: '8:30 am', mine: true  },
      ]
    },
    {
      id: 5,
      name: 'Luis Torres',
      lastMessage: 'Está en muy buen estado',
      time: '7:55 am',
      online: false,
      messages: [
        { text: '¿Cómo está la laptop que vendes?', time: '7:53 am', mine: false },
        { text: 'Está en muy buen estado',           time: '7:55 am', mine: true  },
      ]
    },
  ]);

  filteredChats = computed(() => {
    const q = this.chatSearch().toLowerCase();
    if (!q) return this.chats();
    return this.chats().filter(c =>
      c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q)
    );
  });

  // ── Datos del usuario logueado ────────────────────────────────
  currentUserName = computed(() => {
    const u = this.getCurrentUser();
    const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
    return name || 'Usuario';
  });

  currentUserAccount = computed(() => {
    const u = this.getCurrentUser();
    return u.accountNumber ?? u.idUser?.toString() ?? '';
  });

  currentUserEmail = computed(() => {
    const u = this.getCurrentUser();
    return u.email ?? '';
  });

  // ─────────────────────────────────────────────────────────────
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadProducts();
    }
  }

  private getCurrentUser(): any {
    if (!isPlatformBrowser(this.platformId)) return {};
    try {
      return JSON.parse(localStorage.getItem('currentUser') || '{}');
    } catch {
      return {};
    }
  }

  // ── Carga de productos ────────────────────────────────────────
  loadProducts() {
    this.productService.getProducts(this.currentPage()).subscribe({
      next: (response: any) => {
        const currentUser   = this.getCurrentUser();
        const rawData       = response.data || [];
        const currentUserId = currentUser?.idUser;

        this.totalPagesFromServer.set(response.meta?.[0]?.totalPages ?? 1);

        const mapped: Product[] = rawData.map((p: any) => ({
          id:          p.idProduct,
          title:       p.productName,
          image:       (p.images && p.images.length > 0 && p.images[0].imageUrl)
                         ? p.images[0].imageUrl
                         : 'assets/productos/default.jpg',
          status:      p.modalityName as any,
          price:       p.price,
          tags:        [p.categoryName, p.conditionName].filter(Boolean),
          category:    p.categoryName || 'Otros',
          career:      'Todas',
          description: p.description,
          owner:       `${p.firstName} ${p.lastName}`,
          // ✅ FIX: siempre normalizar a Number para evitar comparación string vs number
          ownerId:     Number(p.idUser),
          views:       Math.floor(Math.random() * 100),
          savedBy:     Math.floor(Math.random() * 20),
          messages:    Math.floor(Math.random() * 5)
        }));

        // ✅ FIX: normalizar currentUserId a Number antes de comparar
        const myId = Number(currentUserId);
        this.productsSignal.set(mapped);
        this.myProductsSignal.set(
          mapped.filter(p => !isNaN(myId) && p.ownerId === myId)
        );
      },
      error: (err: any) => console.error('Error al conectar con la API:', err)
    });
  }

  // ── Helpers de formulario ─────────────────────────────────────
  setNewProductField(field: string, value: any) {
    this.newProduct.update(p => ({ ...p, [field]: value }));
  }

  clearImageAt(index: number) {
    this.imagePreviews.update(list => list.filter((_, i) => i !== index));
    this.imageUrls.update(list => list.filter((_, i) => i !== index));
  }

  onTagsChange(value: string) {
    const tags = value.split(',').map(t => t.trim()).filter(t => t.length > 0);
    this.newProduct.update(p => ({ ...p, tags }));
  }

  // ── Computeds de productos ────────────────────────────────────
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
  totalPages    = computed(() => this.totalPagesFromServer());

  pagedMyProducts = computed(() => {
    const all   = this.myProductsSignal();
    const start = (this.currentMyPage() - 1) * this.itemsPerPage;
    return all.slice(start, start + this.itemsPerPage);
  });

  totalMyPages = computed(() =>
    Math.ceil(this.myProductsSignal().length / this.itemsPerPage)
  );

  isMyProduct = computed(() => {
    const myId = Number(this.getCurrentUser()?.idUser);
    // ✅ FIX: consistencia con la misma normalización usada en loadProducts
    return (product: Product) => !isNaN(myId) && product.ownerId === myId;
  });

  // ── Status helpers ────────────────────────────────────────────
  getStatusBg(status: string): string   { return this.statusColors[status]?.bg   ?? 'bg-gray-100';   }
  getStatusText(status: string): string  { return this.statusColors[status]?.text ?? 'text-gray-700'; }

  // ── Favoritos ─────────────────────────────────────────────────
  toggleFavorite(event: Event, id: number) {
    event.stopPropagation();
    const current = this.favorites();
    this.favorites.set(
      current.includes(id) ? current.filter(f => f !== id) : [...current, id]
    );
  }

  // ── Filtros ───────────────────────────────────────────────────
  toggleFilter(type: 'material' | 'modality' | 'career', value: string) {
    const sig = type === 'material' ? this.selectedMaterials
              : type === 'modality' ? this.selectedModalities
              : this.selectedCareers;
    sig.update(v => v.includes(value) ? v.filter(i => i !== value) : [...v, value]);
    this.currentPage.set(1);
    this.loadProducts();
  }

  // ── Detalle producto ──────────────────────────────────────────
  openDetail(product: Product) {
    this.selectedProduct.set(product);
    document.body.style.overflow = 'hidden';
  }

  closeDetail() {
    this.selectedProduct.set(null);
    document.body.style.overflow = 'auto';
  }

  // ── Paginación ────────────────────────────────────────────────
  setPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadProducts();
  }

  setMyPage(page: number) {
    if (page < 1 || page > this.totalMyPages()) return;
    this.currentMyPage.set(page);
  }

  // ── Agregar producto ──────────────────────────────────────────
  openAddDialog() {
    this.isAddDialogOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeAddDialog() {
    this.isAddDialogOpen.set(false);
    this.imagePreviews.set([]);
    this.imageUrls.set([]);
    this.newProduct.set({
      title: '', description: '',
      status: 'Venta', price: '', condition: 'Usado',
      category: '', career: '', tags: []
    });
    document.body.style.overflow = 'auto';
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const remaining = 2 - this.imageUrls().length;
    if (remaining <= 0) {
      alert('Ya alcanzaste el máximo de 2 imágenes.');
      input.value = '';
      return;
    }

    const file = input.files[0];

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreviews.update(list => [...list, reader.result as string]);
    };
    reader.readAsDataURL(file);

    this.uploadingCount.update(n => n + 1);
    const slotIndex = this.imageUrls().length;

    this.productService.uploadImage(file).subscribe({
      next: (url: string) => {
        this.uploadingCount.update(n => n - 1);
        this.imageUrls.update(list => {
          const copy = [...list];
          copy[slotIndex] = url;
          return copy;
        });
      },
      error: () => {
        this.uploadingCount.update(n => n - 1);
        this.imagePreviews.update(list => list.slice(0, -1));
        alert('Error al subir la imagen. Intenta de nuevo.');
      }
    });

    input.value = '';
  }

  publishProduct() {
    const p           = this.newProduct();
    const currentUser = this.getCurrentUser();

    if (!p.title.trim())       { alert('El título es obligatorio.');      return; }
    if (!p.description.trim()) { alert('La descripción es obligatoria.'); return; }
    if (!p.category)           { alert('Selecciona una categoría.');      return; }
    if (!p.condition)          { alert('Selecciona una condición.');      return; }
    if (this.isUploadingImage) { alert('Espera a que las imágenes terminen de subirse.'); return; }

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
      images:      this.imageUrls().map(url => ({ imageUrl: url }))
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
          id:          response?.data?.idProduct ?? Date.now(),
          title:       p.title.trim(),
          image:       this.imageUrls()[0] || 'assets/productos/default.jpg',
          status:      p.status,
          price:       p.price ? parseFloat(p.price) : 0,
          tags:        [p.category, p.condition].filter(Boolean),
          category:    p.category,
          career:      p.career || 'Todas',
          description: p.description.trim(),
          owner:       `${currentUser.firstName ?? ''} ${currentUser.lastName ?? ''}`.trim(),
          // ✅ FIX: consistencia al crear producto nuevo localmente
          ownerId:     Number(currentUser.idUser),
          views:    0,
          savedBy:  0,
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

  // ── Modal Perfil ──────────────────────────────────────────────
  openProfileModal() {
    this.isProfileOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeProfileModal() {
    this.isProfileOpen.set(false);
    document.body.style.overflow = 'auto';
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('currentUser');
    }
    this.closeProfileModal();
    this.router.navigate(['/login']);
  }

  // ── Modal Mensajería ──────────────────────────────────────────
  openMessagesModal() {
    this.isMessagesOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeMessagesModal() {
    this.isMessagesOpen.set(false);
    this.selectedChat.set(null);
    this.newMessage.set('');
    document.body.style.overflow = 'auto';
  }

  selectChat(chat: Chat) {
    this.selectedChat.set(chat);
    this.newMessage.set('');
  }

  sendMessage() {
    const text = this.newMessage().trim();
    if (!text || !this.selectedChat()) return;

    const now  = new Date();
    const time = now.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' });
    const msg: ChatMessage = { text, time, mine: true };

    this.chats.update(list =>
      list.map(c => {
        if (c.id !== this.selectedChat()!.id) return c;
        return { ...c, lastMessage: text, time, messages: [...c.messages, msg] };
      })
    );

    // Sincroniza la referencia del chat seleccionado con el estado actualizado
    const updated = this.chats().find(c => c.id === this.selectedChat()!.id)!;
    this.selectedChat.set(updated);
    this.newMessage.set('');
  }
}