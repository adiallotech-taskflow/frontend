import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
  isSidenavOpen = signal(true);

  toggleSidenav() {
    this.isSidenavOpen.update(value => !value);
  }

  navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/workspaces', label: 'Workspaces', icon: 'folder' },
    { path: '/tasks', label: 'Tasks', icon: 'check_circle' }
  ];
}