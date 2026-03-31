import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { RegisterComponent } from './components/register/register.component';
import { AdminComponent } from './components/admin/admin.component';
import { GestionComponent } from './components/admin/gestion/gestion.component'; // <--- Verifica esta ruta
import { AuthGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'home', component: HomeComponent },
  { path: 'admin', component: AdminComponent, canActivate: [AuthGuard] },
  { path: 'admin/gestion', component: GestionComponent, canActivate: [AuthGuard] }, // Nueva ruta para la gestión activa
  { path: '**', redirectTo: '' }
];