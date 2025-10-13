# Analytics Component

## Prerequisites

- Chart.js 4.x

## Installation

```bash
npm install chart.js
```

## Usage

### 

```typescript
import { Component } from '@angular/core';
import { AnalyticsComponent } from './analytics/analytics.component';

@Component({
  selector: 'app-dashboard',
  template: `<app-analytics></app-analytics>`,
  imports: [AnalyticsComponent],
  standalone: true,
})
export class DashboardComponent {}
```

## Using the API

Modify the `loadTransactions()` method in `analytics.component.ts`:

```typescript
loadTransactions(): void {
  this.analyticsService.getTransactions().subscribe((data) => {
    this.transactions = data;
    this.initializeCharts();
  });
}
```
