import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = signal<User | null>(null);
  private isAuthenticated = signal<boolean>(false);

  getCurrentUser = this.currentUser.asReadonly();
  getIsAuthenticated = this.isAuthenticated.asReadonly();

  login(email: string, password: string): Observable<User> {
    return of({} as User);
  }

  logout(): void {
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  refreshToken(): Observable<string> {
    return of('');
  }
}