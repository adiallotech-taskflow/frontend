import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task, Workspace, StatCard } from '../../../../core/models';

@Component({
  selector: 'app-workspace-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workspace-stats.component.html',
  styleUrls: ['./workspace-stats.component.css'],
})
export class WorkspaceStatsComponent implements OnInit {
  @Input({ required: true }) workspace!: Workspace;
  @Input({ required: true }) tasks: Task[] = [];

  stats = signal<StatCard[]>([]);
  progressData = signal<number[]>([]);
  animatedValues = signal<{ [key: string]: number }>({});

  ngOnInit() {
    this.calculateStats();
    this.generateProgressData();
    this.animateNumbers();
  }

  private calculateStats() {
    const totalTasks = this.tasks.length;
    const completedTasks = this.tasks.filter((t) => t.status === 'done').length;
    const overdueTasks = this.tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
    ).length;
    const activeMembers = new Set(this.tasks.map((t) => t.assigneeId)).size;

    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    this.stats.set([
      {
        title: 'Total Tasks',
        value: totalTasks,
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
        color: 'blue',
      },
      {
        title: 'Completed',
        value: completedTasks,
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        color: 'green',
        percentage: completionPercentage,
        suffix: '%',
      },
      {
        title: 'Overdue',
        value: overdueTasks,
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
        color: 'red',
      },
      {
        title: 'Active Members',
        value: activeMembers,
        icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
        color: 'purple',
      },
    ]);
  }

  private generateProgressData() {
    const last7Days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const tasksCompletedThatDay = this.tasks.filter(
        (t) => t.status === 'done' && t.updatedAt && new Date(t.updatedAt).toISOString().split('T')[0] === dateStr
      ).length;

      last7Days.push(tasksCompletedThatDay);
    }

    this.progressData.set(last7Days);
  }

  private animateNumbers() {
    const values: { [key: string]: number } = {};
    const stats = this.stats();
    const duration = 1000;
    const steps = 60;
    const stepDuration = duration / steps;

    stats.forEach((stat, index) => {
      const key = `stat-${index}`;
      let currentValue = 0;
      const increment = stat.value / steps;

      const interval = setInterval(() => {
        currentValue += increment;
        if (currentValue >= stat.value) {
          currentValue = stat.value;
          clearInterval(interval);
        }
        values[key] = Math.round(currentValue);
        this.animatedValues.set({ ...values });
      }, stepDuration);
    });
  }

  getAnimatedValue(index: number): number {
    return this.animatedValues()[`stat-${index}`] || 0;
  }

  getColorClasses(color: string) {
    const colorMap: { [key: string]: { bg: string; text: string; icon: string } } = {
      blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        icon: 'text-blue-500',
      },
      green: {
        bg: 'bg-green-50',
        text: 'text-green-600',
        icon: 'text-green-500',
      },
      red: {
        bg: 'bg-red-50',
        text: 'text-red-600',
        icon: 'text-red-500',
      },
      purple: {
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        icon: 'text-purple-500',
      },
    };
    return colorMap[color] || colorMap['blue'];
  }

  getSparklinePoints(): string {
    const data = this.progressData();
    if (data.length === 0) {
      return '';
    }

    const width = 100;
    const height = 30;
    const max = Math.max(...data, 1);
    const step = width / (data.length - 1);

    return data
      .map((value, index) => {
        const x = index * step;
        const y = height - (value / max) * height;
        return `${x},${y}`;
      })
      .join(' ');
  }
}
