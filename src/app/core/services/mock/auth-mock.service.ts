import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { delay, map, tap, switchMap } from 'rxjs/operators';
import { MockBaseService } from './mock-base.service';
import { User } from '../../models';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: Date;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: Date;
  refreshToken?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthMockService extends MockBaseService<User> {
  private readonly SESSION_KEY = 'taskflow_auth_session';
  private readonly TOKEN_EXPIRY_HOURS = 24;
  
  // BehaviorSubject pour l'utilisateur courant
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Observable pour savoir si l'utilisateur est connecté
  public isAuthenticated$ = this.currentUser$.pipe(
    map(user => !!user)
  );

  protected override storageKey = 'taskflow_users';

  // Données utilisateurs de test
  protected override defaultData: User[] = [
    {
      id: 'admin-user-id',
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
      avatar: undefined,
      role: 'admin',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    },
    {
      id: 'regular-user-id',
      email: 'user@test.com',
      firstName: 'Regular',
      lastName: 'User',
      avatar: undefined,
      role: 'member',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date()
    },
    {
      id: 'demo-user-id',
      email: 'demo@test.com',
      firstName: 'Demo',
      lastName: 'User',
      avatar: undefined,
      role: 'viewer',
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date()
    }
  ];

  constructor() {
    super();
    
    // Forcer l'initialisation des utilisateurs de test si ils n'existent pas
    const existingUsers = this.getStoredData();
    if (!existingUsers || existingUsers.length === 0) {
      console.log('🔍 No users found in storage, initializing with default data');
      this.saveToStorage(this.defaultData);
    }
    
    this.initializeAuth();
    
    // Debug: Vérifier les données au démarrage
    const users = this.getStoredData();
    console.log('🔍 AuthMockService initialized - Users in storage:', users);
    console.log('🔍 Default data available:', this.defaultData);
  }

  /**
   * Initialise l'authentification en vérifiant la session stockée
   */
  private initializeAuth(): void {
    const session = this.getStoredSession();
    if (session && this.isSessionValid(session)) {
      this.currentUserSubject.next(session.user);
      this.configService.logAction('Auth session restored from localStorage', {
        userId: session.user.id,
        email: session.user.email
      });
    } else if (session) {
      // Session expirée, la nettoyer
      this.clearSession();
      this.configService.logAction('Expired auth session cleared', {});
    }
  }

  /**
   * Connexion utilisateur
   */
  login(email: string, password: string): Observable<AuthResponse> {
    this.configService.logAction('Login attempt', { email });

    // Vérifier si on doit simuler une erreur
    if (this.configService.shouldSimulateError()) {
      const error = {
        message: 'Network error during login',
        code: 'NETWORK_ERROR',
        status: 503,
        timestamp: new Date().toISOString()
      };
      this.configService.logAction('Simulated login error', { error });
      return throwError(() => error);
    }

    return this.simulateDelay().pipe(
      switchMap(() => {
        const users = this.getStoredData() || [];
        console.log('🔍 Login attempt - Users from storage:', users);
        console.log('🔍 Looking for email:', email);
        
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        console.log('🔍 Found user:', user);

        // Vérifier si l'utilisateur existe
        if (!user) {
          this.configService.logAction('Login failed - user not found', { email });
          return throwError(() => ({
            message: 'Email ou mot de passe incorrect',
            code: 'INVALID_CREDENTIALS',
            status: 401
          }));
        }

        // Vérifier le mot de passe (toujours "password123" pour le mock)
        if (password !== 'password123') {
          this.configService.logAction('Login failed - invalid password', { email });
          return throwError(() => ({
            message: 'Email ou mot de passe incorrect',
            code: 'INVALID_CREDENTIALS',
            status: 401
          }));
        }

        // Générer la réponse d'authentification
        const authResponse = this.generateAuthResponse(user);
        
        // Stocker la session
        this.storeSession({
          user,
          token: authResponse.token,
          expiresAt: authResponse.expiresAt,
          refreshToken: this.generateRefreshToken()
        });

        // Mettre à jour l'utilisateur courant
        this.currentUserSubject.next(user);

        this.configService.logAction('Login successful', {
          userId: user.id,
          email: user.email,
          role: user.role
        });

        return of(authResponse);
      })
    );
  }

  /**
   * Inscription utilisateur
   */
  register(registerData: RegisterRequest): Observable<AuthResponse> {
    this.configService.logAction('Registration attempt', { email: registerData.email });

    // Vérifier si on doit simuler une erreur (3% de chance)
    if (Math.random() < 0.03) {
      const error = {
        message: 'Network error during registration',
        code: 'NETWORK_ERROR',
        status: 503,
        timestamp: new Date().toISOString()
      };
      this.configService.logAction('Simulated registration error', { error });
      return throwError(() => error);
    }

    return this.simulateDelay().pipe(
      switchMap(() => {
        const users = this.getStoredData() || [];
        
        // Vérifier si l'email existe déjà
        const existingUser = users.find(u => 
          u.email.toLowerCase() === registerData.email.toLowerCase()
        );

        if (existingUser) {
          this.configService.logAction('Registration failed - email exists', { 
            email: registerData.email 
          });
          return throwError(() => ({
            message: 'Cet email est déjà utilisé',
            code: 'EMAIL_ALREADY_EXISTS',
            status: 409
          }));
        }

        // Créer le nouvel utilisateur
        const newUser: User = {
          id: this.generateId(),
          email: registerData.email,
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          avatar: undefined,
          role: 'member', // Rôle par défaut
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Ajouter à la liste des utilisateurs
        const updatedUsers = [...users, newUser];
        this.saveToStorage(updatedUsers);

        // Générer la réponse d'authentification
        const authResponse = this.generateAuthResponse(newUser);
        
        // Stocker la session
        this.storeSession({
          user: newUser,
          token: authResponse.token,
          expiresAt: authResponse.expiresAt,
          refreshToken: this.generateRefreshToken()
        });

        // Mettre à jour l'utilisateur courant
        this.currentUserSubject.next(newUser);

        this.configService.logAction('Registration successful', {
          userId: newUser.id,
          email: newUser.email,
          role: newUser.role
        });

        return of(authResponse);
      })
    );
  }

  /**
   * Déconnexion utilisateur
   */
  logout(): Observable<boolean> {
    this.configService.logAction('Logout', {
      userId: this.currentUserSubject.value?.id
    });

    return this.simulateDelay().pipe(
      map(() => {
        this.clearSession();
        this.currentUserSubject.next(null);
        
        this.configService.logAction('Logout successful', {});
        return true;
      })
    );
  }

  /**
   * Rafraîchit le token d'authentification
   */
  refreshToken(): Observable<AuthResponse> {
    const session = this.getStoredSession();
    
    if (!session || !this.isSessionValid(session)) {
      return throwError(() => ({
        message: 'Session invalide ou expirée',
        code: 'INVALID_SESSION',
        status: 401
      }));
    }

    return this.simulateDelay().pipe(
      map(() => {
        const authResponse = this.generateAuthResponse(session.user);
        
        // Mettre à jour la session
        this.storeSession({
          user: session.user,
          token: authResponse.token,
          expiresAt: authResponse.expiresAt,
          refreshToken: this.generateRefreshToken()
        });

        this.configService.logAction('Token refreshed', {
          userId: session.user.id
        });

        return authResponse;
      })
    );
  }

  /**
   * Obtient l'utilisateur courant
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    const session = this.getStoredSession();
    return !!(session && this.isSessionValid(session));
  }

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   */
  hasRole(role: User['role']): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Vérifie si l'utilisateur a au moins un rôle donné
   */
  hasMinimumRole(minRole: User['role']): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    const roleHierarchy: Record<User['role'], number> = {
      'viewer': 1,
      'member': 2,
      'admin': 3
    };

    return roleHierarchy[user.role] >= roleHierarchy[minRole];
  }

  /**
   * Génère une réponse d'authentification avec token JWT fake
   */
  private generateAuthResponse(user: User): AuthResponse {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS);

    const token = this.generateJwtToken(user, expiresAt);

    return {
      user,
      token,
      expiresAt
    };
  }

  /**
   * Génère un faux token JWT
   */
  private generateJwtToken(user: User, expiresAt: Date): string {
    // Header fake JWT
    const header = {
      typ: 'JWT',
      alg: 'HS256'
    };

    // Payload fake JWT
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000),
      iss: 'taskflow-mock-api',
      aud: 'taskflow-frontend'
    };

    // Signature fake (juste pour l'apparence)
    const signature = this.generateRandomString(43);

    // Encoder en base64 (simulation)
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Génère un refresh token
   */
  private generateRefreshToken(): string {
    return this.generateRandomString(32);
  }

  /**
   * Génère une chaîne aléatoire
   */
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Stocke la session dans localStorage
   */
  private storeSession(session: AuthSession): void {
    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify({
        ...session,
        user: session.user,
        expiresAt: session.expiresAt.toISOString()
      }));
    } catch (error) {
      console.warn('Failed to store auth session:', error);
    }
  }

  /**
   * Récupère la session depuis localStorage
   */
  private getStoredSession(): AuthSession | null {
    try {
      const stored = localStorage.getItem(this.SESSION_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        expiresAt: new Date(parsed.expiresAt)
      };
    } catch (error) {
      console.warn('Failed to load auth session:', error);
      return null;
    }
  }

  /**
   * Vérifie si une session est valide
   */
  private isSessionValid(session: AuthSession): boolean {
    return session.expiresAt.getTime() > Date.now();
  }

  /**
   * Nettoie la session stockée
   */
  private clearSession(): void {
    try {
      localStorage.removeItem(this.SESSION_KEY);
    } catch (error) {
      console.warn('Failed to clear auth session:', error);
    }
  }

  /**
   * Méthodes utilitaires pour les tests
   */
  public getTestUsers(): User[] {
    return this.defaultData;
  }

  public forceLogin(userId: string): Observable<AuthResponse> {
    const users = this.getStoredData() || [];
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return throwError(() => new Error('User not found'));
    }

    const authResponse = this.generateAuthResponse(user);
    this.storeSession({
      user,
      token: authResponse.token,
      expiresAt: authResponse.expiresAt
    });
    
    this.currentUserSubject.next(user);
    return of(authResponse);
  }

  public clearAllSessions(): void {
    this.clearSession();
    this.currentUserSubject.next(null);
  }
}