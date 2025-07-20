import { Component, Input, Output, EventEmitter, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserMenuComponent } from '../user-menu/user-menu.component';
import { AuthService } from '../../../core/services';

@Component({
  selector: 'app-top-navigation',
  imports: [CommonModule, UserMenuComponent],
  templateUrl: './top-navigation.component.html'
})
export class TopNavigationComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  @Input() isUserMenuOpen = false;
  @Output() toggleMobileSidenav = new EventEmitter<void>();
  @Output() toggleUserMenu = new EventEmitter<void>();

  // Observables et computed values pour l'authentification
  currentUser$ = this.authService.currentUser$;
  isAuthenticated$ = this.authService.isAuthenticated$;
  
  // Computed values pour l'affichage
  userName = computed(() => {
    const user = this.authService.getCurrentUser();
    return user ? this.authService.getUserFullName() : 'Utilisateur';
  });

  userInitials = computed(() => {
    return this.authService.getUserInitials();
  });

  userRole = computed(() => {
    const user = this.authService.getCurrentUser();
    return user?.role || 'member';
  });

  constructor() {
    // Debug: Observer l'état d'authentification dans TopNav
    this.authService.currentUser$.subscribe(user => {
      console.log('👤 Current user changed in TopNavigation:', user);
    });
    
    this.authService.isAuthenticated$.subscribe(isAuth => {
      console.log('🔐 Authentication state in TopNavigation:', isAuth);
    });
  }

  onToggleMobileSidenav() {
    this.toggleMobileSidenav.emit();
  }

  onToggleUserMenu() {
    this.toggleUserMenu.emit();
  }

  onLogout() {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Logout successful');
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Même en cas d'erreur, on redirige vers login
        this.router.navigate(['/auth/login']);
      }
    });
  }

  navigateToLogin() {
    this.router.navigate(['/auth/login']);
  }

  navigateToProfile() {
    // TODO: Implémenter la navigation vers le profil
    console.log('Navigate to profile - not implemented yet');
  }
}