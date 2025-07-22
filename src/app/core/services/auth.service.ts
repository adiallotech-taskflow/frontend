import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthMockService, RegisterRequest, AuthResponse } from './mock/auth-mock.service';
import { User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authMockService = inject(AuthMockService);


  public currentUser$ = this.authMockService.currentUser$;
  public isAuthenticated$ = this.authMockService.isAuthenticated$;

  constructor() {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.authMockService.login(email, password);
  }

  register(registerData: RegisterRequest): Observable<AuthResponse> {
    return this.authMockService.register(registerData);
  }

  logout(): Observable<boolean> {
    return this.authMockService.logout();
  }

  getCurrentUser(): User | null {
    return this.authMockService.getCurrentUser();
  }

  getUserInitials(): string {
    const user = this.getCurrentUser();
    if (!user) return '';

    const firstInitial = user.firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = user.lastName?.charAt(0)?.toUpperCase() || '';

    return firstInitial + lastInitial;
  }

  getUserFullName(): string {
    const user = this.getCurrentUser();
    if (!user) return '';

    return `${user.firstName} ${user.lastName}`.trim();
  }
}
