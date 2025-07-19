import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserMenuComponent } from '../user-menu/user-menu.component';

@Component({
  selector: 'app-top-navigation',
  imports: [CommonModule, UserMenuComponent],
  templateUrl: './top-navigation.component.html'
})
export class TopNavigationComponent {
  @Input() isUserMenuOpen = false;
  @Input() userName = 'Tom Cook';
  @Output() toggleMobileSidenav = new EventEmitter<void>();
  @Output() toggleUserMenu = new EventEmitter<void>();

  onToggleMobileSidenav() {
    this.toggleMobileSidenav.emit();
  }

  onToggleUserMenu() {
    this.toggleUserMenu.emit();
  }
}