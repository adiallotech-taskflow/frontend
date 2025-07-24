import { Component, signal, input, output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamModel } from '../../../../core/models';

@Component({
  selector: 'app-edit-team-slide-over',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-team-slide-over.component.html',
  styleUrl: './edit-team-slide-over.component.css',
})
export class EditTeamSlideOverComponent {
  isOpen = signal(false);
  
  team = input<TeamModel | null>(null);
  
  teamUpdated = output<{ name: string; description?: string }>();
  closed = output<void>();

  name: string = '';
  description: string = '';

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.isOpen()) {
      this.close();
    }
  }

  open() {
    const currentTeam = this.team();
    if (currentTeam) {
      this.name = currentTeam.name;
      this.description = currentTeam.description || '';
    }
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    this.closed.emit();
  }

  updateTeam() {
    if (this.name.trim()) {
      this.teamUpdated.emit({
        name: this.name.trim(),
        description: this.description.trim() || undefined
      });
      this.close();
    }
  }

  isFormValid(): boolean {
    return this.name.trim().length > 0;
  }
}