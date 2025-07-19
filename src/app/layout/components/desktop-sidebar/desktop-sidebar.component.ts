import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationMenuComponent } from '../navigation-menu/navigation-menu.component';

@Component({
  selector: 'app-desktop-sidebar',
  imports: [CommonModule, NavigationMenuComponent],
  templateUrl: './desktop-sidebar.component.html'
})
export class DesktopSidebarComponent {
  @Input() navigationItems: any[] = [];
  @Input() teams: any[] = [];
}
