import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../core/services/dashboard.service';

interface StatItem {
  id: string;
  label: string;
  value: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="welcome-card" aria-labelledby="welcome-title">
      <h2 id="welcome-title">Welcome to Cloisons Inventory Management</h2>
      <p>You have successfully logged in! Use the side navigation to access different features.</p>
    </section>
    
    <section class="stats-grid" aria-labelledby="stats-title">
      <h2 id="stats-title" class="sr-only">Dashboard Statistics</h2>
      <article class="stat-card" *ngFor="let stat of stats; trackBy: trackByStatId">
        <div class="stat-icon" [attr.aria-hidden]="true">
          <i [class]="stat.icon"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stat.label }}</h3>
          <p class="stat-number" [attr.aria-label]="stat.label + ': ' + stat.value">{{ stat.value }}</p>
        </div>
      </article>
    </section>
  `,
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DashboardComponent implements OnInit {
  
  stats: StatItem[] = [
    { id: 'total-projects', label: 'Total Projects', value: '0', icon: 'mdi mdi-view-dashboard' },
    { id: 'completed-projects', label: 'Completed', value: '0', icon: 'mdi mdi-check-circle' },
    { id: 'planning-projects', label: 'Planning', value: '0', icon: 'mdi mdi-clock-outline' }
  ];

  constructor(private dashboardService: DashboardService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.dashboardService.getProjectStats().subscribe({
      next: (stats) => {
        const fmt = (n: number) => (Number.isFinite(n) ? n.toLocaleString() : '0');
        // Recreate array to trigger OnPush change detection
        this.stats = [
          { id: 'total-projects', label: 'Total Projects', value: fmt(stats.totalProjects), icon: 'mdi mdi-view-dashboard' },
          { id: 'completed-projects', label: 'Completed', value: fmt(stats.completedProjects), icon: 'mdi mdi-check-circle' },
          { id: 'planning-projects', label: 'Planning', value: fmt(stats.planningProjects), icon: 'mdi mdi-clock-outline' }
        ];
        this.cdr.detectChanges();
      },
      error: () => {
        // Values remain as defaults; errors are handled globally by CommunicationService
      }
    });
  }

  trackByStatId(index: number, stat: StatItem): string {
    return stat.id;
  }
}
