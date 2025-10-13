import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

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
    {
      id: 'total-projects',
      label: 'Total Projects',
      value: '1,234',
      icon: 'mdi mdi-package-variant'
    },
    {
      id: 'delivered',
      label: 'Delivered',
      value: '456',
      icon: 'mdi mdi-truck-delivery'
    },
    {
      id: 'planning',
      label: 'Planning',
      value: '78',
      icon: 'mdi mdi-clock-outline'
    },
    {
      id: 'revenue',
      label: 'Revenue',
      value: '$12,345',
      icon: 'mdi mdi-currency-usd'
    }
  ];

  constructor() {}

  ngOnInit(): void {
    // Component initialization logic if needed
  }

  trackByStatId(index: number, stat: StatItem): string {
    return stat.id;
  }
}
