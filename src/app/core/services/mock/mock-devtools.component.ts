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
  templateUrl: './mock-devtools.component.html',
  styleUrl: './mock-devtools.component.css'
})
export class MockDevToolsComponent implements OnInit {
  private currentConfig = signal<MockConfig>({} as MockConfig);
  private currentStats = signal<any>(null);
  private logs = signal<Array<{ timestamp: string; message: string }>>([]);
  private isEditingConfig = signal(false);

  tempConfig = { delayMin: 300, delayMax: 800 };
  tempErrorRate = 0;

  constructor(
    private configService: MockConfigService,
    private utilsService: MockUtilsService
  ) {}

  shouldShow = computed(() => !environment.production);
  config = computed(() => this.currentConfig());
  stats = computed(() => this.currentStats());
  consoleOutput = computed(() => this.logs());
  editingConfig = computed(() => this.isEditingConfig());

  ngOnInit(): void {
    const config = this.configService.getConfig();
    this.currentConfig.set(config);
    this.tempConfig = { delayMin: config.delayMin, delayMax: config.delayMax };
    this.tempErrorRate = config.errorRate * 100;
    this.refreshStats();
  }

  toggleConfigEdit() {
    if (this.isEditingConfig()) {
      // Save config
      const newConfig: MockConfig = {
        ...this.currentConfig(),
        delayMin: this.tempConfig.delayMin,
        delayMax: this.tempConfig.delayMax,
        errorRate: this.tempErrorRate / 100
      };
      this.configService.updateConfig(newConfig);
      this.currentConfig.set(newConfig);
      this.addLog('Configuration updated');
    }
    this.isEditingConfig.update(v => !v);
  }

  applyPreset(preset: 'normal' | 'slow' | 'unstable') {
    switch (preset) {
      case 'normal':
        this.tempConfig = { delayMin: 300, delayMax: 800 };
        this.tempErrorRate = 0;
        break;
      case 'slow':
        this.tempConfig = { delayMin: 1000, delayMax: 3000 };
        this.tempErrorRate = 0;
        break;
      case 'unstable':
        this.tempConfig = { delayMin: 500, delayMax: 2000 };
        this.tempErrorRate = 25;
        break;
    }
    this.addLog(`Applied ${preset} preset`);
  }

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

  importData(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result as string;
          this.utilsService.importMockData(data);
          this.refreshStats();
          this.addLog('Data imported successfully');
        } catch (error) {
          this.addLog('Failed to import data');
        }
      };
      reader.readAsText(file);
    }
  }

  clearLogs() {
    this.logs.set([]);
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
