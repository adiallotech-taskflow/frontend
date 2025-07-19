import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavigationItem, Team } from '../../../core/models';

@Component({
  selector: 'app-navigation-menu',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navigation-menu.component.html'
})
export class NavigationMenuComponent {
  @Input() navigationItems: NavigationItem[] = [];
  @Input() teams: Team[] = [];
}