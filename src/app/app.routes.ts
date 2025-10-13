import { Routes } from '@angular/router';
import { AnalyticsComponent } from './analytics/analytics.component';

export const routes: Routes = [
  { path: '', component: AnalyticsComponent },
  { path: 'receipts', component: AnalyticsComponent },
];
