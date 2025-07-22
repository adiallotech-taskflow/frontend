import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthMockService, LoginRequest, RegisterRequest, AuthResponse } from './mock/auth-mock.service';
import { User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authMockService = inject(AuthMockService);
  private useMockService = true; 

  
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

  
  refreshToken(): Observable<AuthResponse> {
    return this.authMockService.refreshToken();
  }

  
  getCurrentUser(): User | null {
    return this.authMockService.getCurrentUser();
  }

  
  isAuthenticated(): boolean {
    return this.authMockService.isAuthenticated();
  }

  
  hasRole(role: User['role']): boolean {
    return this.authMockService.hasRole(role);
  }

  
  hasMinimumRole(minRole: User['role']): boolean {
    return this.authMockService.hasMinimumRole(minRole);
  }

  
  public isAdmin$ = this.currentUser$.pipe(
    map(user => user?.role === 'admin')
  );

  
  public isMember$ = this.currentUser$.pipe(
    map(user => user?.role === 'member' || user?.role === 'admin')
  );

  
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

  
  public getTestUsers(): User[] {
    return this.authMockService.getTestUsers();
  }

  public forceLogin(userId: string): Observable<AuthResponse> {
    return this.authMockService.forceLogin(userId);
  }

  public clearAllSessions(): void {
    this.authMockService.clearAllSessions();
  }

  
  private switchToRealApi(): void {
    
    
    console.log('Switching to real API - not implemented yet');
  }
}