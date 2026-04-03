import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { RegisterComponent } from './components/register/register.component';
import { AdminComponent } from './components/admin/admin.component';
import { GestionComponent } from './components/admin/gestion/gestion.component';
import { VerifyEmailComponent } from './components/verify-email/verify-email.component';
import { AuthGuard } from './services/auth.guard';
import { environment } from '../environments/environment';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  {
    path: 'register',
    component: RegisterComponent,
    data: { userType: 'student' },
  },
  {
    path: environment.employeeRegistrationPath,
    component: RegisterComponent,
    canActivate: [AuthGuard],
    data: { userType: 'employee' },
  },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'home', component: HomeComponent },
  { path: 'admin', component: AdminComponent, canActivate: [AuthGuard] },
  { path: 'admin/gestion', component: GestionComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: 'login' }
];
