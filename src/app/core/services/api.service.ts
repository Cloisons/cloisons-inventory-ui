import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CommunicationService } from './communication.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(
    private communicationService: CommunicationService
  ) {}

  // Test API connection
  testConnection(): Observable<any> {
    return this.communicationService.get(`/health`, 'Testing connection...');
  }

  // Get API status
  getStatus(): Observable<any> {
    return this.communicationService.get(`/status`, 'Checking status...');
  }
}
