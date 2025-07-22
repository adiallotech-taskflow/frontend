import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockConfigService } from './mock.config';
import { MockUtilsService } from './mock.utils';
import { environment } from '../../../../environments/environment';
import { MockConfig } from '../../models';

@Component({
  selector: 'app-mock-devtools',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs" *ngIf="shouldShow()">
      <div class="mb-3">
        <h4 class="text-sm font-medium text-gray-900 mb-2">Mock DevTools</h4>
      </div>

      <div class="mb-3">
        <h5 class="font-medium text-gray-800 mb-1 text-xs">Config</h5>
        <div class="space-y-1 text-xs">
          <div class="flex justify-between">
            <span class="text-gray-600">Delay:</span>
            <span>{{ config().delayMin }}-{{ config().delayMax }}ms</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Errors:</span>
            <span>{{ (config().errorRate * 100).toFixed(1) }}%</span>
          </div>
        </div>
      </div>

      <div class="mb-3" *ngIf="stats()">
        <h5 class="font-medium text-gray-800 mb-1 text-xs">Data</h5>
        <div class="text-xs text-gray-600">Tasks: {{ stats()?.['tasks']?.['total'] || 0 }}</div>
      </div>

      <div class="space-y-2">
        <h5 class="font-medium text-gray-800 mb-1 text-xs">Actions</h5>

        <div class="grid grid-cols-2 gap-1">
          <button (click)="resetData()" class="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">
            Reset
          </button>
          <button (click)="seedData()" class="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">
            Seed
          </button>
          <button (click)="exportData()" class="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
            Export
          </button>
          <button
            (click)="downloadData()"
            class="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
          >
            Download
          </button>
        </div>
      </div>

      <div class="mt-3" *ngIf="consoleOutput().length > 0">
        <h5 class="font-medium text-gray-800 mb-1 text-xs">Console</h5>
        <div class="bg-gray-100 p-1 rounded text-xs max-h-16 overflow-y-auto">
          <div *ngFor="let log of consoleOutput().slice(-3)" class="text-xs text-gray-600 truncate">
            {{ log.message }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        position: relative;
        z-index: 1000;
      }
    `,
  ],
})
export class MockDevToolsComponent implements OnInit {
  private currentConfig = signal<MockConfig>({} as MockConfig);
  private currentStats = signal<{ tasks?: { total?: number } } | null>(null);
  private logs = signal<Array<{ timestamp: string; message: string }>>([]);

  constructor(
    private configService: MockConfigService,
    private utilsService: MockUtilsService
  ) {}

  ngOnInit() {
    this.currentConfig.set(this.configService.getConfig());
    this.refreshStats();
  }

  shouldShow = computed(() => !environment.production);
  config = computed(() => this.currentConfig());
  stats = computed(() => this.currentStats());
  consoleOutput = computed(() => this.logs());

  resetData() {
    this.utilsService.resetAllMockData();
    this.refreshStats();
    this.addLog('All mock data reset');
  }

  seedData() {
    this.utilsService.seedWithDemoData();
    this.refreshStats();
    this.addLog('Demo data loaded');
  }

  exportData() {
    const data = this.utilsService.exportMockData();
    navigator.clipboard.writeText(data).then(() => {
      this.addLog('Data copied to clipboard');
    });
  }

  downloadData() {
    this.utilsService.downloadMockData();
    this.addLog('Data download started');
  }

  private refreshStats() {
    const stats = this.utilsService.getMockDataStats();
    this.currentStats.set(stats);
  }

  private addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    const newLogs = [...this.logs(), { timestamp, message }];
    this.logs.set(newLogs.slice(-10));
  }
}
