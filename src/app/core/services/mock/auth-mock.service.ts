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

  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  
  public isAuthenticated$ = this.currentUser$.pipe(
    map(user => !!user)
  );

  protected override storageKey = 'taskflow_users';

  
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

    
    const existingUsers = this.getStoredData();
    if (!existingUsers || existingUsers.length === 0) {
      console.log('🔍 No users found in storage, initializing with default data');
      this.saveToStorage(this.defaultData);
    }

    this.initializeAuth();
  }

  
  private initializeAuth(): void {
    const session = this.getStoredSession();
    if (session && this.isSessionValid(session)) {
      this.currentUserSubject.next(session.user);
      this.configService.logAction('Auth session restored from localStorage', {
        userId: session.user.id,
        email: session.user.email
      });
    } else if (session) {
      
      this.clearSession();
      this.configService.logAction('Expired auth session cleared', {});
    }
  }

  
  login(email: string, password: string): Observable<AuthResponse> {
    this.configService.logAction('Login attempt', { email });

    
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

        
        if (!user) {
          this.configService.logAction('Login failed - user not found', { email });
          return throwError(() => ({
            message: 'Invalid email or password',
            code: 'INVALID_CREDENTIALS',
            status: 401
          }));
        }

        
        if (password !== 'password123') {
          this.configService.logAction('Login failed - invalid password', { email });
          return throwError(() => ({
            message: 'Invalid email or password',
            code: 'INVALID_CREDENTIALS',
            status: 401
          }));
        }

        
        const authResponse = this.generateAuthResponse(user);

        
        this.storeSession({
          user,
          token: authResponse.token,
          expiresAt: authResponse.expiresAt,
          refreshToken: this.generateRefreshToken()
        });

        
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

  
  register(registerData: RegisterRequest): Observable<AuthResponse> {
    this.configService.logAction('Registration attempt', { email: registerData.email });

    
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

        
        const existingUser = users.find(u =>
          u.email.toLowerCase() === registerData.email.toLowerCase()
        );

        if (existingUser) {
          this.configService.logAction('Registration failed - email exists', {
            email: registerData.email
          });
          return throwError(() => ({
            message: 'This email is already in use',
            code: 'EMAIL_ALREADY_EXISTS',
            status: 409
          }));
        }

        
        const newUser: User = {
          id: this.generateId(),
          email: registerData.email,
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          avatar: undefined,
          role: 'member', 
          createdAt: new Date(),
          updatedAt: new Date()
        };

        
        const updatedUsers = [...users, newUser];
        this.saveToStorage(updatedUsers);

        
        const authResponse = this.generateAuthResponse(newUser);

        
        this.storeSession({
          user: newUser,
          token: authResponse.token,
          expiresAt: authResponse.expiresAt,
          refreshToken: this.generateRefreshToken()
        });

        
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

  
  refreshToken(): Observable<AuthResponse> {
    const session = this.getStoredSession();

    if (!session || !this.isSessionValid(session)) {
      return throwError(() => ({
        message: 'Invalid or expired session',
        code: 'INVALID_SESSION',
        status: 401
      }));
    }

    return this.simulateDelay().pipe(
      map(() => {
        const authResponse = this.generateAuthResponse(session.user);

        
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

  
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  
  isAuthenticated(): boolean {
    const session = this.getStoredSession();
    return !!(session && this.isSessionValid(session));
  }

  
  hasRole(role: User['role']): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  
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

  
  private generateJwtToken(user: User, expiresAt: Date): string {
    
    const header = {
      typ: 'JWT',
      alg: 'HS256'
    };

    
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000),
      iss: 'taskflow-mock-api',
      aud: 'taskflow-frontend'
    };

    
    const signature = this.generateRandomString(43);

    
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  
  private generateRefreshToken(): string {
    return this.generateRandomString(32);
  }

  
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  
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

  
  private isSessionValid(session: AuthSession): boolean {
    return session.expiresAt.getTime() > Date.now();
  }

  
  private clearSession(): void {
    try {
      localStorage.removeItem(this.SESSION_KEY);
    } catch (error) {
      console.warn('Failed to clear auth session:', error);
    }
  }

  
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