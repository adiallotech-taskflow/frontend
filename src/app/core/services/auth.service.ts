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
  private useMockService = true; // Pour l'instant on utilise toujours le mock

  // Expose les observables du mock service
  public currentUser$ = this.authMockService.currentUser$;
  public isAuthenticated$ = this.authMockService.isAuthenticated$;

  constructor() {
    // Log pour indiquer qu'on utilise le service mock
    console.log('AuthService initialized with mock implementation');
  }

  /**
   * Connexion utilisateur
   */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.authMockService.login(email, password);
  }

  /**
   * Inscription utilisateur
   */
  register(registerData: RegisterRequest): Observable<AuthResponse> {
    return this.authMockService.register(registerData);
  }

  /**
   * Déconnexion utilisateur
   */
  logout(): Observable<boolean> {
    return this.authMockService.logout();
  }

  /**
   * Rafraîchit le token d'authentification
   */
  refreshToken(): Observable<AuthResponse> {
    return this.authMockService.refreshToken();
  }

  /**
   * Obtient l'utilisateur courant
   */
  getCurrentUser(): User | null {
    return this.authMockService.getCurrentUser();
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    return this.authMockService.isAuthenticated();
  }

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   */
  hasRole(role: User['role']): boolean {
    return this.authMockService.hasRole(role);
  }

  /**
   * Vérifie si l'utilisateur a au moins un rôle donné
   */
  hasMinimumRole(minRole: User['role']): boolean {
    return this.authMockService.hasMinimumRole(minRole);
  }

  /**
   * Observable qui émet true si l'utilisateur est admin
   */
  public isAdmin$ = this.currentUser$.pipe(
    map(user => user?.role === 'admin')
  );

  /**
   * Observable qui émet true si l'utilisateur est au moins membre
   */
  public isMember$ = this.currentUser$.pipe(
    map(user => user?.role === 'member' || user?.role === 'admin')
  );

  /**
   * Obtient les initiales de l'utilisateur pour l'avatar
   */
  getUserInitials(): string {
    const user = this.getCurrentUser();
    if (!user) return '';
    
    const firstInitial = user.firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = user.lastName?.charAt(0)?.toUpperCase() || '';
    
    return firstInitial + lastInitial;
  }

  /**
   * Obtient le nom complet de l'utilisateur
   */
  getUserFullName(): string {
    const user = this.getCurrentUser();
    if (!user) return '';
    
    return `${user.firstName} ${user.lastName}`.trim();
  }

  /**
   * Méthodes utilitaires pour les tests
   */
  public getTestUsers(): User[] {
    return this.authMockService.getTestUsers();
  }

  public forceLogin(userId: string): Observable<AuthResponse> {
    return this.authMockService.forceLogin(userId);
  }

  public clearAllSessions(): void {
    this.authMockService.clearAllSessions();
  }

  /**
   * Prépare le service pour une future API réelle
   * Cette méthode sera utilisée quand on aura une vraie API
   */
  private switchToRealApi(): void {
    // TODO: Implémenter quand l'API sera disponible
    // this.useMockService = false;
    console.log('Switching to real API - not implemented yet');
  }
}