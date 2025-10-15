import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { AnalyticsService, WorkTeller } from './analytics.service';
import transactionsData from '../data/transactions.json';

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
  selectedChartType: 'bar' | 'line' | 'doughnut' = 'bar';

  dateRangeOptions = [
    { value: 7, label: 'Last 7 Days' },
    { value: 30, label: 'Last 30 Days' },
    { value: 60, label: 'Last 60 Days' },
    { value: 90, label: 'Last 90 Days' },
  ];

  chartTypeOptions = [
    { value: 'bar', label: 'Bar Chart' },
    { value: 'line', label: 'Area Chart' },
    { value: 'doughnut', label: 'Donut Chart' },
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

  onChartTypeChange(): void {
    this.destroyCharts();
    this.initializeCharts();
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
      daily[day] += t.total;
    });

    return Object.entries(daily).map(([label, value]) => ({ label, value }));
  }

  getWeeklyTotals(transactions: WorkTeller[]): { label: string; value: number }[] {
    const weekly: { [key: string]: number } = {};

    transactions.forEach((t) => {
      const d = new Date(t.date || t.createdAt);
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diff));

      const endDate = new Date(monday);
      endDate.setDate(endDate.getDate() + 6);

      const startFormatted = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endFormatted = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const weekLabel = `${startFormatted} - ${endFormatted}`;

      if (!weekly[weekLabel]) {
        weekly[weekLabel] = 0;
      }
      weekly[weekLabel] += t.total;
    });

    return Object.entries(weekly)
      .sort((a, b) => {
        const aDate = new Date(a[0].split(' - ')[0]);
        const bDate = new Date(b[0].split(' - ')[0]);
        return aDate.getTime() - bDate.getTime();
      })
      .map(([label, value]) => ({ label, value }));
  }

  initializeCharts(): void {
    const filtered = this.filterByDateRange(this.transactions, this.selectedDateRange);

    // Daily Chart
    const dailyTotals = this.getDailyTotals(filtered);
    const dailyData = this.prepareChartData(dailyTotals, 'Daily Amount Sold');
    const dailyCanvas = document.getElementById('dailyChart') as HTMLCanvasElement;

    if (dailyCanvas) {
      this.dailyChart = new Chart(dailyCanvas, {
        type: this.selectedChartType,
        data: dailyData,
        options: this.getChartOptions('Daily Amount Sold (₦)', dailyTotals),
      });
    }

  
    const weeklyTotals = this.getWeeklyTotals(filtered);
    const weeklyData = this.prepareChartData(weeklyTotals, 'Weekly Amount Sold');
    const weeklyCanvas = document.getElementById('weeklyChart') as HTMLCanvasElement;

    if (weeklyCanvas) {
      this.weeklyChart = new Chart(weeklyCanvas, {
        type: this.selectedChartType,
        data: weeklyData,
        options: this.getChartOptions('Weekly Amount Sold (₦)', weeklyTotals),
      });
    }
  }

  updateCharts(): void {
    const filtered = this.filterByDateRange(this.transactions, this.selectedDateRange);

    if (this.dailyChart) {
      const data = this.getDailyTotals(filtered);
      this.dailyChart.data.labels = data.map((d) => d.label);
      this.dailyChart.data.datasets[0].data = data.map((d) => d.value);

      const maxValue = Math.max(...data.map((d) => d.value));
      const suggestedMax = maxValue > 0 ? Math.ceil(maxValue * 1.2) : 10;

      const dailyOptions = this.dailyChart.options as any;
      if (this.selectedChartType !== 'doughnut' && dailyOptions?.scales?.y) {
        dailyOptions.scales.y.suggestedMax = suggestedMax;
        if (dailyOptions.scales.y.ticks) {
          dailyOptions.scales.y.ticks.stepSize = this.calculateStepSize(suggestedMax);
        }
      }
      this.dailyChart.update();
    }

    if (this.weeklyChart) {
      const data = this.getWeeklyTotals(filtered);
      this.weeklyChart.data.labels = data.map((d) => d.label);
      this.weeklyChart.data.datasets[0].data = data.map((d) => d.value);

      const maxValue = Math.max(...data.map((d) => d.value));
      const suggestedMax = maxValue > 0 ? Math.ceil(maxValue * 1.2) : 10;

      const weeklyOptions = this.weeklyChart.options as any;
      if (this.selectedChartType !== 'doughnut' && weeklyOptions?.scales?.y) {
        weeklyOptions.scales.y.suggestedMax = suggestedMax;
        if (weeklyOptions.scales.y.ticks) {
          weeklyOptions.scales.y.ticks.stepSize = this.calculateStepSize(suggestedMax);
        }
      }
      this.weeklyChart.update();
    }
  }

  prepareChartData(data: { label: string; value: number }[], label: string) {
    const colors = [
      'rgba(99, 132, 255, 0.85)',
      'rgba(255, 99, 132, 0.85)',
      'rgba(75, 192, 75, 0.85)',
      'rgba(255, 206, 86, 0.85)',
      'rgba(153, 102, 255, 0.85)',
      'rgba(255, 159, 64, 0.85)',
      'rgba(54, 162, 235, 0.85)',
      'rgba(255, 120, 180, 0.85)',
      'rgba(0, 200, 150, 0.85)',
      'rgba(255, 180, 100, 0.85)',
    ];

    const borderColors = [
      'rgba(99, 132, 255, 1)',
      'rgba(255, 99, 132, 1)',
      'rgba(75, 192, 75, 1)',
      'rgba(255, 206, 86, 1)',
      'rgba(153, 102, 255, 1)',
      'rgba(255, 159, 64, 1)',
      'rgba(54, 162, 235, 1)',
      'rgba(255, 120, 180, 1)',
      'rgba(0, 200, 150, 1)',
      'rgba(255, 180, 100, 1)',
    ];

    if (this.selectedChartType === 'doughnut') {
      return {
        labels: data.map((d) => d.label),
        datasets: [
          {
            label,
            data: data.map((d) => d.value),
            backgroundColor: colors.map((c, i) => colors[i % colors.length]),
            borderColor: '#fff',
            borderWidth: 3,
            hoverOffset: 15,
          },
        ],
      };
    } else if (this.selectedChartType === 'line') {
      return {
        labels: data.map((d) => d.label),
        datasets: [
          {
            label,
            data: data.map((d) => d.value),
            borderColor: 'rgba(99, 132, 255, 1)',
            backgroundColor: 'rgba(99, 132, 255, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointBackgroundColor: 'rgba(99, 132, 255, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
          },
        ],
      };
    } else {
      return {
        labels: data.map((d) => d.label),
        datasets: [
          {
            label,
            data: data.map((d) => d.value),
            backgroundColor: 'rgba(99, 132, 255, 0.85)',
            borderColor: 'rgba(99, 132, 255, 1)',
            borderWidth: 0,
            borderRadius: 4,
          },
        ],
      };
    }
  }

  getChartOptions(
    title: string,
    data: { label: string; value: number }[]
  ): ChartConfiguration['options'] {
    const maxValue = Math.max(...data.map((d) => d.value), 0);
    const suggestedMax = maxValue > 0 ? Math.ceil(maxValue * 1.2) : 100;

    if (this.selectedChartType === 'doughnut') {
      return {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1.8,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle',
              font: {
                size: 11,
                family: "'Inter', 'Segoe UI', sans-serif",
              },
              color: '#333',
            },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 13,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
            cornerRadius: 6,
            callbacks: {
              label: (context: any) => {
                const value = context.parsed;
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                let formattedValue = '';

                if (value >= 1000000) {
                  formattedValue = '₦' + (value / 1000000).toFixed(2) + 'M';
                } else if (value >= 1000) {
                  formattedValue = '₦' + (value / 1000).toFixed(2) + 'K';
                } else {
                  formattedValue = '₦' + value.toLocaleString();
                }

                return `${context.label}: ${formattedValue} (${percentage}%)`;
              },
            },
          },
        },
      } as any;
    }

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
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const value = context.parsed.y;
              if (value >= 1000000) {
                return '₦' + (value / 1000000).toFixed(2) + 'M';
              } else if (value >= 1000) {
                return '₦' + (value / 1000).toFixed(2) + 'K';
              }
              return '₦' + value.toLocaleString();
            },
          },
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
            callback: (value: any) => {
              if (value >= 1000000) {
                return '₦' + (value / 1000000).toFixed(0) + 'M';
              } else if (value >= 1000) {
                return '₦' + (value / 1000).toFixed(0) + 'K';
              }
              return '₦' + value;
            },
            stepSize: this.calculateStepSize(suggestedMax),
          } as any,
        },
      },
    };
  }

  calculateStepSize(max: number): number {
    if (max <= 100) return 10;
    if (max <= 1000) return 100;
    if (max <= 10000) return 1000;
    if (max <= 100000) return 10000;
    if (max <= 1000000) return 100000;
    return Math.ceil(max / 5);
  }

  destroyCharts(): void {
    this.dailyChart?.destroy();
    this.weeklyChart?.destroy();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }
}
