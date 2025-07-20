import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services';

@Component({
  selector: 'app-auth-debug',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 bg-black text-white p-3 rounded-lg text-sm font-mono z-50">
      <h3 class="font-bold mb-2">🔍 Auth Debug</h3>
      <div>
        <strong>Authenticated:</strong> {{ (isAuthenticated$ | async) ? '✅ YES' : '❌ NO' }}
      </div>
      <div>
        <strong>Current User:</strong> {{ (currentUser$ | async)?.email || 'None' }}
      </div>
      <div>
        <strong>Role:</strong> {{ (currentUser$ | async)?.role || 'None' }}
      </div>
      <div class="mt-2">
        <strong>Session:</strong> {{ hasSession ? '✅ Found' : '❌ Not found' }}
      </div>
      <div>
        <strong>Users in DB:</strong> {{ usersCount }}
      </div>
      <div class="mt-2 space-y-1">
        <button 
          (click)="resetUsers()" 
          class="block w-full bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs">
          🔄 Reset Users
        </button>
        <button 
          (click)="clearSession()" 
          class="block w-full bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded text-xs">
          🗑️ Clear Session
        </button>
      </div>
    </div>
  `
})
export class AuthDebugComponent {
  private authService = inject(AuthService);

  currentUser$ = this.authService.currentUser$;
  isAuthenticated$ = this.authService.isAuthenticated$;

  get hasSession(): boolean {
    return !!localStorage.getItem('taskflow_auth_session');
  }

  get usersCount(): number {
    const users = localStorage.getItem('taskflow_users');
    return users ? JSON.parse(users).length : 0;
  }

  resetUsers(): void {
    localStorage.removeItem('taskflow_users');
    localStorage.removeItem('taskflow_auth_session');
    console.log('🔄 Users and session cleared - reload page to reinitialize');
    window.location.reload();
  }

  clearSession(): void {
    localStorage.removeItem('taskflow_auth_session');
    console.log('🗑️ Session cleared');
  }

  constructor() {
    console.log('🔍 AuthDebugComponent initialized');
    
    // Log toutes les changes d'état
    this.currentUser$.subscribe(user => {
      console.log('🔍 AuthDebug - Current user:', user);
    });
    
    this.isAuthenticated$.subscribe(isAuth => {
      console.log('🔍 AuthDebug - Is authenticated:', isAuth);
    });
  }
}