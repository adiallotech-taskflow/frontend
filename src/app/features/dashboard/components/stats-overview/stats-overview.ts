import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardStats } from '../../../../core/models';

@Component({
  selector: 'app-stats-overview',
  imports: [CommonModule],
  templateUrl: './stats-overview.html',
  styleUrl: './stats-overview.css'
})
export class StatsOverviewComponent {
  @Input() stats!: DashboardStats;
}