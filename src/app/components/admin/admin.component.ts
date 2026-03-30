import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import {

  LucideAngularModule,

  LayoutDashboard,

  FileText,

  Trash2,

  LogOut,

  Settings

} from 'lucide-angular';



interface DeletionRecord {

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

export class AdminComponent {

  // Iconos para la vista

  readonly LayoutDashboard = LayoutDashboard;

  readonly FileText = FileText;

  readonly Trash2 = Trash2;

  readonly LogOut = LogOut;

  readonly Settings = Settings;



  // Datos quemados para los Stats

  totalProducts = signal(12);

  totalDeletions = signal(3);



  // Historial de eliminaciones (Mock data)

  deletionHistory = signal<DeletionRecord[]>([

    {

      product: 'iPhone 13 Pro Max (Publicación Spam)',

      admin: 'Admin Principal',

      reason: 'Publicación duplicada con intención de spam. El usuario ya tenía 3 publicaciones idénticas.',

      date: '2025-01-16 14:30'

    },

    {

      product: 'Calculadora TI-84 Plus',

      admin: 'Admin Principal',

      reason: 'Contenido inapropiado en las imágenes del producto.',

      date: '2025-01-15 10:15'

    },

    {

      product: 'Libro de Física Cuántica',

      admin: 'Admin Principal',

      reason: 'El usuario solicitó la eliminación por error en la información del producto.',

      date: '2025-01-14 16:45'

    }

  ]);



  logout() {

    console.log('Cerrando sesión administrativa...');

    // Aquí iría la lógica de navegación al login

  }

}