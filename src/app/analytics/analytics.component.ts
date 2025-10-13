// analytics.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { AnalyticsService, WorkTeller } from './analytics.service';
import transactionsData from '../data/transactions.json';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css'],
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  transactions: WorkTeller[] = [];
  dailyChart?: Chart;
  weeklyChart?: Chart;
  selectedDateRange = 90;

  dateRangeOptions = [
    { value: 7, label: 'Last 7 Days' },
    { value: 30, label: 'Last 30 Days' },
    { value: 60, label: 'Last 60 Days' },
    { value: 90, label: 'Last 90 Days' },
  ];

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.transactions = transactionsData.data.data;
    this.initializeCharts();
  }

  onDateRangeChange(): void {
    this.updateCharts();
  }

  filterByDateRange(transactions: WorkTeller[], days: number): WorkTeller[] {
    const now = new Date();
    const start = new Date();
    start.setDate(now.getDate() - days);
    return transactions.filter((t) => {
      const d = new Date(t.date || t.createdAt);
      return d >= start && d <= now;
    });
  }

  getDailyTotals(transactions: WorkTeller[]): { label: string; value: number }[] {
    const daily: { [key: string]: number } = {
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
      Sun: 0,
    };

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    transactions.forEach((t) => {
      const d = new Date(t.date || t.createdAt);
      const day = days[d.getDay()];
      daily[day] += 1; 
    });

    return Object.entries(daily).map(([label, value]) => ({ label, value }));
  }

  getWeeklyTotals(transactions: WorkTeller[]): { label: string; value: number }[] {
    const weekly = { 'Week 1': 0, 'Week 2': 0, 'Week 3': 0, 'Week 4': 0 };

    transactions.forEach((t) => {
      const d = new Date(t.date || t.createdAt);
      const day = d.getDate();
      const week = day <= 7 ? 'Week 1' : day <= 14 ? 'Week 2' : day <= 21 ? 'Week 3' : 'Week 4';

      weekly[week] += 1; 
    });

    return Object.entries(weekly).map(([label, value]) => ({ label, value }));
  }

  initializeCharts(): void {
    const filtered = this.filterByDateRange(this.transactions, this.selectedDateRange);

    // Daily Chart
    const dailyTotals = this.getDailyTotals(filtered);
    const dailyData = this.prepareChartData(
      dailyTotals,
      'Daily Transactions',
      'rgba(99, 132, 255, 0.85)',
      'rgba(99, 132, 255, 1)'
    );
    const dailyCanvas = document.getElementById('dailyChart') as HTMLCanvasElement;

    if (dailyCanvas) {
      this.dailyChart = new Chart(dailyCanvas, {
        type: 'bar',
        data: dailyData,
        options: this.getChartOptions('Daily Transactions', dailyTotals),
      });
    }

    // Weekly Chart
    const weeklyTotals = this.getWeeklyTotals(filtered);
    const weeklyData = this.prepareChartData(
      weeklyTotals,
      'Weekly Transactions',
      'rgba(99, 132, 255, 0.85)',
      'rgba(99, 132, 255, 1)'
    );
    const weeklyCanvas = document.getElementById('weeklyChart') as HTMLCanvasElement;

    if (weeklyCanvas) {
      this.weeklyChart = new Chart(weeklyCanvas, {
        type: 'bar',
        data: weeklyData,
        options: this.getChartOptions('Weekly Transactions', weeklyTotals),
      });
    }
  }

  updateCharts(): void {
    const filtered = this.filterByDateRange(this.transactions, this.selectedDateRange);

    if (this.dailyChart) {
      const data = this.getDailyTotals(filtered);
      const maxValue = Math.max(...data.map((d) => d.value));
      const suggestedMax = maxValue > 0 ? Math.ceil(maxValue * 1.2) : 10;

      this.dailyChart.data.labels = data.map((d) => d.label);
      this.dailyChart.data.datasets[0].data = data.map((d) => d.value);

      const dailyOptions = this.dailyChart.options as any;
      if (dailyOptions?.scales?.y) {
        dailyOptions.scales.y.suggestedMax = suggestedMax;
        if (dailyOptions.scales.y.ticks) {
          dailyOptions.scales.y.ticks.stepSize = Math.max(1, Math.ceil(suggestedMax / 5));
        }
      }
      this.dailyChart.update();
    }

    if (this.weeklyChart) {
      const data = this.getWeeklyTotals(filtered);
      const maxValue = Math.max(...data.map((d) => d.value));
      const suggestedMax = maxValue > 0 ? Math.ceil(maxValue * 1.2) : 10;

      this.weeklyChart.data.labels = data.map((d) => d.label);
      this.weeklyChart.data.datasets[0].data = data.map((d) => d.value);

      const weeklyOptions = this.weeklyChart.options as any;
      if (weeklyOptions?.scales?.y) {
        weeklyOptions.scales.y.suggestedMax = suggestedMax;
        if (weeklyOptions.scales.y.ticks) {
          weeklyOptions.scales.y.ticks.stepSize = Math.max(1, Math.ceil(suggestedMax / 5));
        }
      }
      this.weeklyChart.update();
    }
  }

  prepareChartData(
    data: { label: string; value: number }[],
    label: string,
    bg: string,
    border: string
  ) {
    return {
      labels: data.map((d) => d.label),
      datasets: [
        {
          label,
          data: data.map((d) => d.value), 
          backgroundColor: bg,
          borderColor: border,
          borderWidth: 0,
          borderRadius: 4,
        },
      ],
    };
  }

  getChartOptions(
    title: string,
    data: { label: string; value: number }[]
  ): ChartConfiguration['options'] {
    const maxValue = Math.max(...data.map((d) => d.value));
    const suggestedMax = maxValue > 0 ? Math.ceil(maxValue * 1.2) : 10;

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: false,
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
          ticks: {
            color: '#666',
            font: {
              size: 12,
            },
          },
        },
        y: {
          beginAtZero: true,
          suggestedMax: suggestedMax,
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)',
          },
          border: {
            display: false,
          },
          ticks: {
            color: '#666',
            font: {
              size: 12,
            },
            stepSize: Math.max(1, Math.ceil(suggestedMax / 5)),
            precision: 0,
          } as any,
        },
      },
    };
  }

  ngOnDestroy(): void {
    this.dailyChart?.destroy();
    this.weeklyChart?.destroy();
  }
}
