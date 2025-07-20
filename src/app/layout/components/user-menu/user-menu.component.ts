import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-menu',
  imports: [CommonModule],
  templateUrl: './user-menu.component.html'
})
export class UserMenuComponent {
  @Input() isOpen = false;
  @Input() userName = 'Tom Cook';
  @Input() userInitials = 'TC';
  @Input() userRole: 'admin' | 'member' | 'viewer' = 'member';
  @Output() toggle = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
  @Output() profile = new EventEmitter<void>();

  onToggle() {
    this.toggle.emit();
  }

  onLogout() {
    this.logout.emit();
  }

  onProfile() {
    this.profile.emit();
  }

  getRoleBadgeClass(): string {
    switch (this.userRole) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'member':
        return 'bg-green-100 text-green-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getRoleLabel(): string {
    switch (this.userRole) {
      case 'admin':
        return 'Admin';
      case 'member':
        return 'Member';
      case 'viewer':
        return 'Viewer';
      default:
        return 'User';
    }
  }
}