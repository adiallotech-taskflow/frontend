import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-fab-button',
  imports: [CommonModule],
  templateUrl: './fab-button.html',
  styleUrl: './fab-button.css'
})
export class FabButtonComponent {
  @Output() click = new EventEmitter<void>();

  onClick() {
    this.click.emit();
  }
}