import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockDevToolsComponent } from '../mock-devtools/mock-devtools.component';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, MockDevToolsComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  showDevTools = signal(!environment.production);
}