import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AlertService } from '../../shared/alert.service';
import { AlertComponent } from '../../shared/alert.component';
import { ProductService } from '../../services/product.service';
import {
  ChatConversation,
  ChatMessage,
  ChatService
} from '../../services/chat.service';
import { ChatSocketService } from '../../services/chat-socket.service';
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
  Send,
  Pencil,
  Trash2
} from 'lucide-angular';

interface Product {
  id: number;
  title: string;
  image: string;
  images?: string[];
  status: 'Venta' | 'Intercambio' | 'Donación';
  idStatus?: number;
  state?: 'Disponible' | 'Vendido' | 'Intercambiado' | 'Donado' | 'Inactivo' | 'En revisión';
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
  Venta: 1,
  Intercambio: 2,
  Donación: 3
};

const CATEGORY_MAP: Record<string, number> = {
  Tecnología: 1,
  'Libros y Material Académico': 2,
  Uniformes: 3,
  Electrodomésticos: 4,
  'Ropa y Accesorios': 5,
  Deportes: 6,
  Hogar: 7,
  'Instrumentos Musicales': 8,
  Otros: 9
};

const CONDITION_MAP: Record<string, number> = {
  Nuevo: 1,
  Usado: 2
};

const PRODUCT_STATE_MAP: Record<number, string> = {
  1: 'Disponible',
  2: 'Vendido',
  3: 'Intercambiado',
  4: 'Donado',
  5: 'Inactivo',
  6: 'En revisión'
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, AlertComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly productService = inject(ProductService);
  private readonly chatService = inject(ChatService);
  private readonly chatSocketService = inject(ChatSocketService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  readonly alertService = inject(AlertService);

  private chatEventsSubscription?: Subscription;

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
  readonly Pencil = Pencil;
  readonly Trash2 = Trash2;

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
  myStatusFilter = signal<number>(1);
  totalMyPagesFromServer = signal(1);

  isAddDialogOpen = signal(false);
  imagePreviews = signal<string[]>([]);
  imageUrls = signal<string[]>([]);
  uploadingCount = signal(0);
  isSaving = signal(false);
  isDeleting = signal(false);

  isEditDialogOpen = signal(false);
  editingProduct = signal<Product | null>(null);
  editImagePreviews = signal<string[]>([]);
  editImageUrls = signal<string[]>([]);
  editUploadingCount = signal(0);
  isEditSaving = signal(false);

  editProduct = signal({
    title: '',
    description: '',
    status: 'Venta' as 'Venta' | 'Intercambio' | 'Donación',
    price: '',
    condition: 'Usado',
    category: '',
    career: '',
  });

  get isUploadingImage() { return this.uploadingCount() > 0; }
  get isEditUploadingImage() { return this.editUploadingCount() > 0; }

  newProduct = signal({
    title: '',
    description: '',
    status: 'Venta' as 'Venta' | 'Intercambio' | 'Donación',
    price: '',
    condition: 'Usado',
    category: '',
    career: '',
    tags: [] as string[]
  });

  selectedMaterials = signal<string[]>([]);
  selectedModalities = signal<string[]>([]);
  selectedCareers = signal<string[]>([]);
  favorites = signal<number[]>([]);

  readonly itemsPerPage = 9;

  readonly statusColors: Record<string, { bg: string; text: string }> = {
    Venta: { bg: 'bg-green-100', text: 'text-green-700' },
    Donación: { bg: 'bg-blue-100', text: 'text-blue-700' },
    Intercambio: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    Disponible: { bg: 'bg-green-100', text: 'text-green-700' },
    Vendido: { bg: 'bg-slate-100', text: 'text-slate-700' },
    Intercambiado: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    Donado: { bg: 'bg-blue-100', text: 'text-blue-700' },
    Inactivo: { bg: 'bg-red-100', text: 'text-red-700' },
    'En revisión': { bg: 'bg-gray-100', text: 'text-gray-700' }
  };

  isProfileOpen = signal(false);
  isMessagesOpen = signal(false);
  isLoadingChats = signal(false);
  isLoadingMessages = signal(false);
  isSocketConnected = signal(false);
  chatSearch = signal('');
  selectedChatId = signal<number | null>(null);
  newMessage = signal('');
  chats = signal<ChatConversation[]>([]);
  chatMessages = signal<ChatMessage[]>([]);

  filteredChats = computed(() => {
    const query = this.chatSearch().trim().toLowerCase();
    const chats = this.chats();
    if (!query) return chats;
    return chats.filter((chat) => {
      const name = chat.otherUserName.toLowerCase();
      const lastMessage = (chat.lastMessage || '').toLowerCase();
      const productName = chat.productName.toLowerCase();
      return name.includes(query) || lastMessage.includes(query) || productName.includes(query);
    });
  });

  selectedChat = computed(
    () => this.chats().find((chat) => chat.idConversation === this.selectedChatId()) ?? null
  );

  currentUserName = computed(() => {
    const user = this.getCurrentUser();
    const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    return name || 'Usuario';
  });

  currentUserAccount = computed(() => {
    const user = this.getCurrentUser();
    return user.accountNumber ?? user.idUser?.toString() ?? '';
  });

  currentUserEmail = computed(() => {
    const user = this.getCurrentUser();
    return user.email ?? '';
  });

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.loadProducts();
    this.loadMyProducts();
    this.initializeChatConnection();
  }

  ngOnDestroy() {
    this.chatEventsSubscription?.unsubscribe();
    this.chatSocketService.disconnect();
  }

  private initializeChatConnection() {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    this.chatEventsSubscription = this.chatSocketService.events$.subscribe((event) => {
      if (event.type === 'connected') { this.isSocketConnected.set(true); return; }
      if (event.type === 'chat_message' && event.payload) {
        this.isSocketConnected.set(true);
        this.applyIncomingMessage(event.payload as ChatMessage);
        return;
      }
      if (event.type === 'error' && event.message &&
          (event.message.includes('cerró') || event.message.includes('conectar'))) {
        this.isSocketConnected.set(false);
      }
    });

    this.chatSocketService.connect(userId);
  }

  private getCurrentUser(): any {
    if (!isPlatformBrowser(this.platformId)) return {};
    try { return JSON.parse(localStorage.getItem('currentUser') || '{}'); }
    catch { return {}; }
  }

  private getCurrentUserId() {
    const idUser = Number(this.getCurrentUser()?.idUser);
    return Number.isFinite(idUser) && idUser > 0 ? idUser : 0;
  }

  private setBodyScroll(locked: boolean) {
    if (!isPlatformBrowser(this.platformId)) return;
    document.body.style.overflow = locked ? 'hidden' : 'auto';
  }

  private sortChats(chats: ChatConversation[]) {
    return [...chats].sort((left, right) => {
      const leftDate = left.lastMessageAt ? new Date(left.lastMessageAt).getTime() : 0;
      const rightDate = right.lastMessageAt ? new Date(right.lastMessageAt).getTime() : 0;
      return rightDate - leftDate || right.idConversation - left.idConversation;
    });
  }

  private upsertConversation(conversation: ChatConversation) {
    this.chats.update((list) => {
      const next = list.filter((item) => item.idConversation !== conversation.idConversation);
      next.unshift(conversation);
      return this.sortChats(next);
    });
  }

  private applyIncomingMessage(message: ChatMessage) {
    const currentUserId = this.getCurrentUserId();
    const alreadyLoaded = this.chatMessages().some((item) => item.idMessage === message.idMessage);

    if (this.selectedChatId() === message.idConversation && !alreadyLoaded) {
      this.chatMessages.update((list) => [...list, message]);
    }

    const existingConversation = this.chats().find(
      (conversation) => conversation.idConversation === message.idConversation
    );

    if (!existingConversation) { this.loadChats(message.idConversation); return; }

    const updatedConversation: ChatConversation = {
      ...existingConversation,
      lastMessage: message.messageText,
      lastMessageAt: message.createdAt
    };

    this.upsertConversation(updatedConversation);

    if (message.idSenderUser !== currentUserId && !this.isMessagesOpen()) {
      this.isMessagesOpen.set(true);
      this.setBodyScroll(true);
    }
  }

  loadProducts() {
    this.productService.getProducts(this.currentPage()).subscribe({
      next: (response: any) => {
        const currentUser = this.getCurrentUser();
        const rawData = response.data || [];
        const currentUserId = currentUser?.idUser;

        this.totalPagesFromServer.set(response.meta?.[0]?.totalPages ?? 1);

        const mapped: Product[] = rawData.map((product: any) => ({
          id: product.idProduct,
          title: product.productName,
          image: product.images && product.images.length > 0 && product.images[0].imageUrl
            ? product.images[0].imageUrl
            : 'assets/productos/default.jpg',
          images: product.images
            ? product.images.map((img: any) => img.imageUrl).filter(Boolean)
            : [],
          status: (product.modalityName as Product['status']) ?? 'Venta',
          idStatus: Number(product.idStatus ?? 1),
          state: PRODUCT_STATE_MAP[Number(product.idStatus ?? 1)] as Product['state'] || 'Disponible',
          price: product.price,
          tags: [product.categoryName, product.conditionName].filter(Boolean),
          category: product.categoryName || 'Otros',
          career: 'Todas',
          description: product.description,
          owner: `${product.firstName} ${product.lastName}`.trim(),
          ownerId: Number(product.idUser),
          views: Math.floor(Math.random() * 100),
          savedBy: Math.floor(Math.random() * 20),
          messages: 0
        }));

        this.productsSignal.set(mapped);
      },
      error: (err: any) => console.error('Error al conectar con la API:', err)
    });
  }

  loadMyProducts(page: number = 1, status: number = this.myStatusFilter()) {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    this.currentMyPage.set(page);
    this.myStatusFilter.set(status);

    this.productService.getMyProducts(page, userId, status).subscribe({
      next: (response: any) => {
        const rawData = response.data || [];
        this.totalMyPagesFromServer.set(response.meta?.[0]?.totalPages ?? 1);

        const mapped: Product[] = rawData.map((product: any) => {
          const statusId = Number(product.idStatus ?? 1);
          const computedState = PRODUCT_STATE_MAP[statusId] as Product['state'] || 'Disponible';
          const modality = (product.modalityName as Product['status']) ?? 'Venta';

          return {
            id: product.idProduct,
            title: product.productName,
            image: product.images && product.images.length > 0 && product.images[0].imageUrl
              ? product.images[0].imageUrl
              : 'assets/productos/default.jpg',
            images: product.images
              ? product.images.map((img: any) => img.imageUrl).filter(Boolean)
              : [],
            status: modality,
            idStatus: statusId,
            state: computedState,
            price: product.price,
            tags: [product.categoryName, product.conditionName].filter(Boolean),
            category: product.categoryName || 'Otros',
            career: 'Todas',
            description: product.description,
            owner: `${product.firstName} ${product.lastName}`.trim(),
            ownerId: Number(product.idUser),
            views: Math.floor(Math.random() * 100),
            savedBy: Math.floor(Math.random() * 20),
            messages: 0
          };
        });

        this.myProductsSignal.set(mapped);
      },
      error: (err: any) => {
        console.error('Error cargando mis productos:', err);
        this.alertService.error('Error', 'No se pudieron cargar mis productos.');
      }
    });
  }

  setNewProductField(field: string, value: any) {
    this.newProduct.update((product) => ({ ...product, [field]: value }));
  }

  setEditProductField(field: string, value: any) {
    this.editProduct.update((product) => ({ ...product, [field]: value }));
  }

  clearImageAt(index: number) {
    this.imagePreviews.update((list) => list.filter((_, position) => position !== index));
    this.imageUrls.update((list) => list.filter((_, position) => position !== index));
  }

  clearEditImageAt(index: number) {
    this.editImagePreviews.update((list) => list.filter((_, position) => position !== index));
    this.editImageUrls.update((list) => list.filter((_, position) => position !== index));
  }

  onTagsChange(value: string) {
    const tags = value.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0);
    this.newProduct.update((product) => ({ ...product, tags }));
  }

  filteredProducts = computed(() => {
    let result = this.productsSignal().filter((product) => {
      const matchesSearch = product.title.toLowerCase().includes(this.searchQuery().toLowerCase());
      const matchesMaterial = this.selectedMaterials().length === 0 || this.selectedMaterials().includes(product.category);
      const matchesModality = this.selectedModalities().length === 0 || this.selectedModalities().includes(product.status);
      const matchesCareer = this.selectedCareers().length === 0 || this.selectedCareers().includes(product.career) || product.career === 'Todas';
      const matchesPrice = product.price <= this.priceRange();
      return matchesSearch && matchesMaterial && matchesModality && matchesCareer && matchesPrice;
    });

    if (this.showFavoritesOnly()) {
      result = result.filter((product) => this.favorites().includes(product.id));
    }
    return result;
  });

  pagedProducts = computed(() => this.filteredProducts());
  totalPages = computed(() => this.totalPagesFromServer());

  pagedMyProducts = computed(() => {
    const allProducts = this.myProductsSignal();
    const start = (this.currentMyPage() - 1) * this.itemsPerPage;
    return allProducts.slice(start, start + this.itemsPerPage);
  });

  totalMyPages = computed(() => this.totalMyPagesFromServer());

  isMyProduct = computed(() => {
    const myId = this.getCurrentUserId();
    return (product: Product) => !Number.isNaN(myId) && product.ownerId === myId;
  });

  getProductStatusAction(product: Product): { nextStatus: number; label: string } | null {
    if (product.idStatus === 5) return null;
    if (product.idStatus === 6) return { nextStatus: 5, label: 'Marcar como Inactivo' };
    switch (product.status) {
      case 'Venta':       return { nextStatus: 2, label: 'Marcar como Vendido' };
      case 'Intercambio': return { nextStatus: 3, label: 'Marcar como Intercambiado' };
      case 'Donación':    return { nextStatus: 4, label: 'Marcar como Donado' };
      default:            return { nextStatus: 5, label: 'Marcar como Inactivo' };
    }
  }

  changeProductStatus(event: Event, product: Product) {
    event.stopPropagation();
    const userId = this.getCurrentUserId();
    if (!userId) { this.alertService.warning('Atención', 'Necesitas iniciar sesión.'); return; }

    const action = this.getProductStatusAction(product);
    if (!action) { this.alertService.info('Info', 'El producto ya no se puede actualizar.'); return; }

    this.productService.changeStatus(product.id, userId, action.nextStatus).subscribe({
      next: () => {
        this.alertService.success('¡Listo!', 'Estado actualizado correctamente.');
        this.loadMyProducts(this.currentMyPage(), this.myStatusFilter());
        this.loadProducts();
      },
      error: (err: any) => {
        console.error('Error al cambiar estado:', err);
        this.alertService.error('Error', 'No se pudo actualizar el estado.');
      }
    });
  }

  deactivateProduct(event: Event, product: Product) {
    event.stopPropagation();
    const userId = this.getCurrentUserId();
    if (!userId) { this.alertService.warning('Atención', 'Necesitas iniciar sesión.'); return; }

    if (product.idStatus === 5) {
      this.alertService.info('Info', 'El producto ya está inactivo.');
      return;
    }

    this.alertService.confirm(
      '¿Inactivar producto?',
      `"${product.title}" será marcado como inactivo y dejará de aparecer en el catálogo.`,
      () => {
        this.productService.changeStatus(product.id, userId, 5).subscribe({
          next: () => {
            this.alertService.success('¡Listo!', 'Producto marcado como inactivo.');
            this.loadMyProducts(this.currentMyPage(), this.myStatusFilter());
            this.loadProducts();
            if (this.selectedProduct()?.id === product.id) this.closeDetail();
          },
          error: (err: any) => {
            console.error('Error al inactivar producto:', err);
            this.alertService.error('Error', 'No se pudo inactivar el producto.');
          }
        });
      }
    );
  }

  getStatusBg(status: string): string { return this.statusColors[status]?.bg ?? 'bg-gray-100'; }
  getStatusText(status: string): string { return this.statusColors[status]?.text ?? 'text-gray-700'; }

  toggleFavorite(event: Event, id: number) {
    event.stopPropagation();
    const current = this.favorites();
    this.favorites.set(
      current.includes(id) ? current.filter((favoriteId) => favoriteId !== id) : [...current, id]
    );
  }

  toggleFilter(type: 'material' | 'modality' | 'career', value: string) {
    const targetSignal = type === 'material' ? this.selectedMaterials
      : type === 'modality' ? this.selectedModalities
      : this.selectedCareers;
    targetSignal.update((values) =>
      values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
    );
    this.currentPage.set(1);
    this.loadProducts();
  }

  openDetail(product: Product) {
    this.selectedProduct.set(product);
    this.setBodyScroll(true);
  }

  closeDetail() {
    this.selectedProduct.set(null);
    this.setBodyScroll(false);
  }

  setPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadProducts();
  }

  setMyPage(page: number) {
    if (page < 1 || page > this.totalMyPages()) return;
    this.currentMyPage.set(page);
    this.loadMyProducts(page, this.myStatusFilter());
  }

  setMyStatus(status: number) {
    this.myStatusFilter.set(status);
    this.currentMyPage.set(1);
    this.loadMyProducts(1, status);
  }

  openAddDialog() {
    this.isAddDialogOpen.set(true);
    this.setBodyScroll(true);
  }

  closeAddDialog() {
    this.isAddDialogOpen.set(false);
    this.imagePreviews.set([]);
    this.imageUrls.set([]);
    this.newProduct.set({ title: '', description: '', status: 'Venta', price: '', condition: 'Usado', category: '', career: '', tags: [] });
    this.setBodyScroll(false);
  }

  openEditDialog(event: Event, product: Product) {
    event.stopPropagation();
    this.editingProduct.set(product);
    const conditionTag = product.tags.find(t => t === 'Nuevo' || t === 'Usado') ?? 'Usado';
    this.editProduct.set({
      title: product.title,
      description: product.description,
      status: product.status,
      price: product.price > 0 ? product.price.toString() : '',
      condition: conditionTag,
      category: product.category,
      career: product.career,
    });
    const imgs = product.images && product.images.length > 0
      ? product.images
      : product.image ? [product.image] : [];
    this.editImagePreviews.set([...imgs]);
    this.editImageUrls.set([...imgs]);
    this.isEditDialogOpen.set(true);
    this.setBodyScroll(true);
  }

  closeEditDialog() {
    this.isEditDialogOpen.set(false);
    this.editingProduct.set(null);
    this.editImagePreviews.set([]);
    this.editImageUrls.set([]);
    this.editUploadingCount.set(0);
    this.setBodyScroll(false);
  }

  confirmDelete(event: Event, product: Product) {
    event.stopPropagation();
    this.deactivateProduct(event, product);
  }

  onEditFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const remaining = 2 - this.editImageUrls().length;
    if (remaining <= 0) { this.alertService.warning('Límite alcanzado', 'Ya alcanzaste el máximo de 2 imágenes.'); input.value = ''; return; }
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => { this.editImagePreviews.update((list) => [...list, reader.result as string]); };
    reader.readAsDataURL(file);
    this.editUploadingCount.update((value) => value + 1);
    const slotIndex = this.editImageUrls().length;
    this.productService.uploadImage(file).subscribe({
      next: (url: string) => {
        this.editUploadingCount.update((value) => value - 1);
        this.editImageUrls.update((list) => { const next = [...list]; next[slotIndex] = url; return next; });
      },
      error: () => {
        this.editUploadingCount.update((value) => value - 1);
        this.editImagePreviews.update((list) => list.slice(0, -1));
        this.alertService.error('Error', 'Error al subir la imagen. Intenta de nuevo.');
      }
    });
    input.value = '';
  }

  saveEditProduct() {
    const product = this.editProduct();
    const editing = this.editingProduct();
    const currentUser = this.getCurrentUser();
    if (!product.title.trim()) { this.alertService.warning('Campo requerido', 'El título es obligatorio.'); return; }
    if (!product.description.trim()) { this.alertService.warning('Campo requerido', 'La descripción es obligatoria.'); return; }
    if (!product.category) { this.alertService.warning('Campo requerido', 'Selecciona una categoría.'); return; }
    if (!product.condition) { this.alertService.warning('Campo requerido', 'Selecciona una condición.'); return; }
    if (this.isEditUploadingImage) { this.alertService.info('Espera', 'Las imágenes todavía se están subiendo.'); return; }
    const idModality = MODALITY_MAP[product.status];
    const idCategory = CATEGORY_MAP[product.category];
    const idCondition = CONDITION_MAP[product.condition];
    if (!idModality || !idCategory || !idCondition) {
      this.alertService.error('Error', 'Datos inválidos. Verifica modalidad, categoría y condición.');
      return;
    }
    const payload = {
      idProduct: editing!.id,
      productName: product.title.trim(),
      description: product.description.trim(),
      price: product.price ? parseFloat(product.price) : 0,
      idModality, idCondition, idCategory,
      idStatus: 1,
      idUser: currentUser.idUser,
      images: this.editImageUrls().filter(Boolean).map((url) => ({ imageUrl: url }))
    };
    this.isEditSaving.set(true);
    this.productService.saveProduct(payload).subscribe({
      next: (response: any) => {
        this.isEditSaving.set(false);
        if (response?.hasError) {
          this.alertService.error('Error', response.meta?.[0]?.message || 'Error desconocido');
          return;
        }
        const allImgs = this.editImageUrls().filter(Boolean);
        const updatedProduct: Product = {
          ...editing!,
          title: product.title.trim(),
          description: product.description.trim(),
          status: product.status,
          price: product.price ? parseFloat(product.price) : 0,
          category: product.category,
          tags: [product.category, product.condition].filter(Boolean),
          image: allImgs[0] || editing!.image,
          images: allImgs
        };
        this.myProductsSignal.update((list) => list.map((p) => (p.id === editing!.id ? updatedProduct : p)));
        this.productsSignal.update((list) => list.map((p) => (p.id === editing!.id ? updatedProduct : p)));
        this.closeEditDialog();
        this.alertService.success('¡Listo!', 'Producto actualizado correctamente.');
      },
      error: (err: any) => {
        this.isEditSaving.set(false);
        console.error('Error al actualizar producto:', err);
        this.alertService.error('Error', 'No se pudo conectar con el servidor.');
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const remaining = 2 - this.imageUrls().length;
    if (remaining <= 0) { this.alertService.warning('Límite alcanzado', 'Ya alcanzaste el máximo de 2 imágenes.'); input.value = ''; return; }
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => { this.imagePreviews.update((list) => [...list, reader.result as string]); };
    reader.readAsDataURL(file);
    this.uploadingCount.update((value) => value + 1);
    const slotIndex = this.imageUrls().length;
    this.productService.uploadImage(file).subscribe({
      next: (url: string) => {
        this.uploadingCount.update((value) => value - 1);
        this.imageUrls.update((list) => { const next = [...list]; next[slotIndex] = url; return next; });
      },
      error: () => {
        this.uploadingCount.update((value) => value - 1);
        this.imagePreviews.update((list) => list.slice(0, -1));
        this.alertService.error('Error', 'Error al subir la imagen. Intenta de nuevo.');
      }
    });
    input.value = '';
  }

  publishProduct() {
    const product = this.newProduct();
    const currentUser = this.getCurrentUser();
    if (!product.title.trim()) { this.alertService.warning('Campo requerido', 'El título es obligatorio.'); return; }
    if (!product.description.trim()) { this.alertService.warning('Campo requerido', 'La descripción es obligatoria.'); return; }
    if (!product.category) { this.alertService.warning('Campo requerido', 'Selecciona una categoría.'); return; }
    if (!product.condition) { this.alertService.warning('Campo requerido', 'Selecciona una condición.'); return; }
    if (this.isUploadingImage) { this.alertService.info('Espera', 'Las imágenes todavía se están subiendo.'); return; }
    const idModality = MODALITY_MAP[product.status];
    const idCategory = CATEGORY_MAP[product.category];
    const idCondition = CONDITION_MAP[product.condition];
    if (!idModality || !idCategory || !idCondition) {
      this.alertService.error('Error', 'Datos inválidos. Verifica modalidad, categoría y condición.');
      return;
    }
    const payload = {
      idProduct: null,
      productName: product.title.trim(),
      description: product.description.trim(),
      price: product.price ? parseFloat(product.price) : 0,
      idModality, idCondition, idCategory,
      idStatus: 1,
      idUser: currentUser.idUser,
      images: this.imageUrls().map((url) => ({ imageUrl: url }))
    };
    this.isSaving.set(true);
    this.productService.saveProduct(payload).subscribe({
      next: (response: any) => {
        this.isSaving.set(false);
        if (response?.ok === false) {
          this.alertService.error('Error', response.message || 'Error desconocido');
          return;
        }
        const allImgs = this.imageUrls().filter(Boolean);
        const newMapped: Product = {
          id: response?.data?.idProduct ?? Date.now(),
          title: product.title.trim(),
          image: allImgs[0] || 'assets/productos/default.jpg',
          images: allImgs,
          status: product.status,
          price: product.price ? parseFloat(product.price) : 0,
          tags: [product.category, product.condition].filter(Boolean),
          category: product.category,
          career: product.career || 'Todas',
          description: product.description.trim(),
          owner: `${currentUser.firstName ?? ''} ${currentUser.lastName ?? ''}`.trim(),
          ownerId: Number(currentUser.idUser),
          views: 0, savedBy: 0, messages: 0
        };
        this.productsSignal.update((list) => [newMapped, ...list]);
        this.myProductsSignal.update((list) => [newMapped, ...list]);
        this.closeAddDialog();
        this.alertService.success('¡Publicado!', 'Tu producto ya está disponible en el catálogo.');
        this.loadProducts();
      },
      error: (err: any) => {
        this.isSaving.set(false);
        console.error('Error al publicar producto:', err);
        this.alertService.error('Error', 'No se pudo conectar con el servidor.');
      }
    });
  }

  openProfileModal() { this.isProfileOpen.set(true); this.setBodyScroll(true); }
  closeProfileModal() { this.isProfileOpen.set(false); this.setBodyScroll(false); }

  logout() {
    if (isPlatformBrowser(this.platformId)) localStorage.removeItem('currentUser');
    this.chatSocketService.disconnect();
    this.closeProfileModal();
    this.router.navigate(['/']);
  }

  openMessagesModal() {
    this.isMessagesOpen.set(true);
    this.setBodyScroll(true);
    this.loadChats(this.selectedChatId() ?? undefined);
  }

  closeMessagesModal() {
    this.isMessagesOpen.set(false);
    this.selectedChatId.set(null);
    this.chatMessages.set([]);
    this.newMessage.set('');
    this.setBodyScroll(false);
  }

  loadChats(conversationToSelect?: number) {
    const userId = this.getCurrentUserId();
    if (!userId) return;
    this.isLoadingChats.set(true);
    this.chatService.getUserConversations(userId).subscribe({
      next: (response) => {
        this.isLoadingChats.set(false);
        if (response.hasError) { this.alertService.error('Error', response.meta?.[0]?.message || 'No se pudieron cargar los chats.'); return; }
        const chats = this.sortChats(response.data ?? []);
        this.chats.set(chats);
        const targetConversationId = conversationToSelect ?? this.selectedChatId();
        if (!targetConversationId) return;
        const targetConversation = chats.find((chat) => chat.idConversation === targetConversationId);
        if (targetConversation) this.selectChat(targetConversation);
      },
      error: (err) => {
        this.isLoadingChats.set(false);
        console.error('Error al cargar conversaciones:', err);
        this.alertService.error('Error', 'No se pudieron cargar las conversaciones.');
      }
    });
  }

  selectChat(chat: ChatConversation) {
    this.selectedChatId.set(chat.idConversation);
    this.newMessage.set('');
    this.loadMessages(chat.idConversation);
  }

  loadMessages(idConversation: number) {
    const userId = this.getCurrentUserId();
    if (!userId) return;
    this.isLoadingMessages.set(true);
    this.chatService.getConversationMessages(idConversation, userId).subscribe({
      next: (response) => {
        this.isLoadingMessages.set(false);
        if (response.hasError) { this.alertService.error('Error', response.meta?.[0]?.message || 'No se pudieron cargar los mensajes.'); return; }
        this.chatMessages.set(response.data ?? []);
      },
      error: (err) => {
        this.isLoadingMessages.set(false);
        console.error('Error al cargar mensajes:', err);
        this.alertService.error('Error', 'No se pudieron cargar los mensajes.');
      }
    });
  }

  openChatFromProduct(product: Product, event?: Event) {
    event?.stopPropagation();
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) { this.alertService.warning('Atención', 'Debes iniciar sesión para contactar al vendedor.'); return; }
    if (product.ownerId === currentUserId) { this.alertService.info('Info', 'No puedes abrir un chat con tu propia publicación.'); return; }
    this.chatService.openConversation(product.id, currentUserId).subscribe({
      next: (response) => {
        if (response.hasError) { this.alertService.error('Error', response.meta?.[0]?.message || 'No se pudo abrir el chat.'); return; }
        const conversation = response.data;
        this.upsertConversation(conversation);
        this.selectedChatId.set(conversation.idConversation);
        this.isMessagesOpen.set(true);
        this.setBodyScroll(true);
        this.loadChats(conversation.idConversation);
        this.loadMessages(conversation.idConversation);
      },
      error: (err) => {
        console.error('Error al abrir conversación:', err);
        this.alertService.error('Error', 'No se pudo abrir la conversación.');
      }
    });
  }

  sendMessage() {
    const text = this.newMessage().trim();
    const selectedChat = this.selectedChat();
    if (!text || !selectedChat) return;
    try {
      this.chatSocketService.sendMessage(selectedChat.idConversation, text);
      this.newMessage.set('');
    } catch (err: any) {
      console.error('Error al enviar mensaje:', err);
      this.alertService.error('Error', err.message || 'No se pudo enviar el mensaje.');
    }
  }

  getChatPreviewTime(value: string | null) {
    if (!value) return 'Nuevo';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' });
  }

  getMessageTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' });
  }

  isMine(message: ChatMessage) {
    return message.idSenderUser === this.getCurrentUserId();
  }
}