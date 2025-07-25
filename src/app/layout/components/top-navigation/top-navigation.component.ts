import { Component, Input, Output, EventEmitter, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserMenuComponent } from '../user-menu/user-menu.component';
import { AuthService } from '../../../core/services';

@Component({
  selector: 'app-top-navigation',
  imports: [CommonModule, UserMenuComponent],
  templateUrl: './top-navigation.component.html',
})
export class TopNavigationComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  @Input() isUserMenuOpen = false;
  @Output() toggleMobileSidenav = new EventEmitter<void>();
  @Output() toggleUserMenu = new EventEmitter<void>();
  @Output() openCommandPalette = new EventEmitter<void>();

  isAuthenticated$ = this.authService.isAuthenticated$;

  userName = computed(() => {
    const user = this.authService.getCurrentUser();
    return user ? this.authService.getUserFullName() : 'User';
  });

  userInitials = computed(() => {
    return this.authService.getUserInitials();
  });

  userRole = computed(() => {
    const user = this.authService.getCurrentUser();
    return user?.role || 'member';
  });

  onToggleMobileSidenav() {
    this.toggleMobileSidenav.emit();
  }

  onToggleUserMenu() {
    this.toggleUserMenu.emit();
  }

  onOpenCommandPalette() {
    this.openCommandPalette.emit();
  }

  onLogout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);

        this.router.navigate(['/auth/login']);
      },
    });
  }

  navigateToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
