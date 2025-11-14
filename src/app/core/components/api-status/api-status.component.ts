import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-api-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="api-status">
      <h3>API Connection Status</h3>
      <div class="status-indicator" [class.connected]="isConnected" [class.disconnected]="!isConnected">
        <i class="mdi" [class.mdi-check-circle]="isConnected" [class.mdi-alert-circle]="!isConnected"></i>
        <span>{{ isConnected ? 'Connected' : 'Disconnected' }}</span>
      </div>
      <p *ngIf="!isConnected" class="error-message">
        Backend server is not running on port 8082. Please start the server to test authentication.
      </p>
      <button (click)="testConnection()" [disabled]="isLoading" class="btn btn-primary">
        <span *ngIf="!isLoading">Test Connection</span>
        <span *ngIf="isLoading">
          <i class="mdi mdi-loading mdi-spin"></i>
          Testing...
        </span>
      </button>
    </div>
  `,
  styles: [`
    .api-status {
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .api-status h3 {
      margin: 0 0 16px 0;
      color: #333;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      font-weight: 500;
    }

    .status-indicator.connected {
      color: #28a745;
    }

    .status-indicator.disconnected {
      color: #dc3545;
    }

    .error-message {
      color: #dc3545;
      font-size: 14px;
      margin-bottom: 16px;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    .btn-primary {
      background: #182996;
      color: white;
    }

    .btn-primary:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .mdi-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class ApiStatusComponent implements OnInit {
  isConnected: boolean = false;
  isLoading: boolean = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.testConnection();
  }

  testConnection(): void {
    this.isLoading = true;
    this.apiService.testConnection().subscribe({
      next: (response) => {
        this.isConnected = true;
        this.isLoading = false;
      },
      error: (error) => {
        this.isConnected = false;
        this.isLoading = false;
      }
    });
  }
}
