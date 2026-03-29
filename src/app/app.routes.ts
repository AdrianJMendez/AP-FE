import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { AdminComponent } from './components/admin/admin.component';
import { GestionComponent } from './components/admin/gestion/gestion.component'; // <--- Verifica esta ruta

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  { path: 'admin', component: AdminComponent },
  { path: 'admin/gestion', component: GestionComponent }, // Nueva ruta para la gestión activa
  { path: '**', redirectTo: '' }
];