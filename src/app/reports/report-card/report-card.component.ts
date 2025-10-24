import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Report } from '../reports.component';

@Component({
  selector: 'app-report-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-card.component.html',
  styleUrl: './report-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportCardComponent {
  @Input({ required: true }) report!: Report;
  @Output() reportClick = new EventEmitter<Report>();

  onCardClick(): void {
    this.reportClick.emit(this.report);
  }
}
