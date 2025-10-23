import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface WorkTeller {
  id: number;
  workTellerType: string;
  uniqueIdentifier: string;
  paystackPaymentReference?: string | null;
  hubPaymentPending?: string | null;
  total: number;
  amountPaid: number;
  subtotal: number;
  date: string;
  issueDate?: string | null;
  dueDate?: string | null;
  tax: number;
  taxMetric: string;
  discount: number;
  discountMetric: string;
  shippingFee: number;
  convertedFromId?: number | null;
  convertedToId?: number | null;
  includeShippingFee: boolean;
  includeTaxOnEachEntry?: boolean | null;
  includeDiscountOnEachEntry?: boolean | null;
  description?: string | null;
  deliveryNote?: string | null;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
  createdBy?: number;
  paymentStatus: string;
  paymentMethod: string;
  source: string;
  customerId?: number | null;
  organizationId?: number;
  workspaceId?: number | null;
  workTellerStage?: string | null;
  workProfile?: {
    name: string;
    email?: string;
    phoneNumber?: string;
  };
  convertedFrom?: {
    workTellerType: string;
  };
}

export interface ApiResponse {
  message: string;
  data: { data: WorkTeller[]; totalCount: number };
  statusCode: number;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private apiUrl = '/api/transactions';

  constructor(private http: HttpClient) {}

  getTransactions(): Observable<WorkTeller[]> {
    return this.http.get<ApiResponse>(this.apiUrl).pipe(map((res) => res.data.data));
  }

  getRevenueGrowthRate(
    transactions: WorkTeller[],
    period: 'month' | 'year' = 'month'
  ): number | null {
    if (!transactions.length) return null;
    const now = new Date();
    let currentTotal = 0;
    let previousTotal = 0;

    if (period === 'month') {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      currentTotal = transactions
        .filter((t) => {
          const d = new Date(t.date || t.createdAt);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.total, 0);

      previousTotal = transactions
        .filter((t) => {
          const d = new Date(t.date || t.createdAt);
          return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
        })
        .reduce((sum, t) => sum + t.total, 0);
    } else if (period === 'year') {
      const currentYear = now.getFullYear();
      const lastYear = currentYear - 1;

      currentTotal = transactions
        .filter((t) => {
          const d = new Date(t.date || t.createdAt);
          return d.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.total, 0);

      previousTotal = transactions
        .filter((t) => {
          const d = new Date(t.date || t.createdAt);
          return d.getFullYear() === lastYear;
        })
        .reduce((sum, t) => sum + t.total, 0);
    }

    if (previousTotal === 0) return null;
    return Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
  }

  getCustomerRetentionRate(transactions: WorkTeller[], selectedDateRange: string): number | null {
    if (!transactions.length) return null;

    const now = new Date();
    let periodStart: Date, periodEnd: Date, prevPeriodStart: Date, prevPeriodEnd: Date;

    const getCustomerId = (t: WorkTeller) => t.workProfile?.email || t.workProfile?.name;

    const getMonday = (date: Date): Date => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    switch (selectedDateRange) {
      case 'today': {
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        prevPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        prevPeriodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
      }
      case 'yesterday': {
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        prevPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
        prevPeriodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
        break;
      }
      case 'thisWeek': {
        const monday = getMonday(now);
        periodStart = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const prevMonday = new Date(monday);
        prevMonday.setDate(monday.getDate() - 7);
        prevPeriodStart = new Date(
          prevMonday.getFullYear(),
          prevMonday.getMonth(),
          prevMonday.getDate()
        );
        const prevSunday = new Date(prevMonday);
        prevSunday.setDate(prevMonday.getDate() + 6);
        prevPeriodEnd = new Date(
          prevSunday.getFullYear(),
          prevSunday.getMonth(),
          prevSunday.getDate()
        );
        break;
      }
      case 'lastWeek': {
        const monday = getMonday(now);
        monday.setDate(monday.getDate() - 7);
        periodStart = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        periodEnd = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate());
        const prevMonday = new Date(monday);
        prevMonday.setDate(monday.getDate() - 7);
        prevPeriodStart = new Date(
          prevMonday.getFullYear(),
          prevMonday.getMonth(),
          prevMonday.getDate()
        );
        const prevSunday = new Date(prevMonday);
        prevSunday.setDate(prevMonday.getDate() + 6);
        prevPeriodEnd = new Date(
          prevSunday.getFullYear(),
          prevSunday.getMonth(),
          prevSunday.getDate()
        );
        break;
      }
      case 'last7Days': {
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        prevPeriodEnd = new Date(
          periodStart.getFullYear(),
          periodStart.getMonth(),
          periodStart.getDate() - 1
        );
        prevPeriodStart = new Date(
          prevPeriodEnd.getFullYear(),
          prevPeriodEnd.getMonth(),
          prevPeriodEnd.getDate() - 7
        );
        break;
      }
      case 'last14Days': {
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
        prevPeriodEnd = new Date(
          periodStart.getFullYear(),
          periodStart.getMonth(),
          periodStart.getDate() - 1
        );
        prevPeriodStart = new Date(
          prevPeriodEnd.getFullYear(),
          prevPeriodEnd.getMonth(),
          prevPeriodEnd.getDate() - 14
        );
        break;
      }
      case 'last30Days': {
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        prevPeriodEnd = new Date(
          periodStart.getFullYear(),
          periodStart.getMonth(),
          periodStart.getDate() - 1
        );
        prevPeriodStart = new Date(
          prevPeriodEnd.getFullYear(),
          prevPeriodEnd.getMonth(),
          prevPeriodEnd.getDate() - 30
        );
        break;
      }
      case 'last60Days': {
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60);
        prevPeriodEnd = new Date(
          periodStart.getFullYear(),
          periodStart.getMonth(),
          periodStart.getDate() - 1
        );
        prevPeriodStart = new Date(
          prevPeriodEnd.getFullYear(),
          prevPeriodEnd.getMonth(),
          prevPeriodEnd.getDate() - 60
        );
        break;
      }
      case 'last90Days': {
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
        prevPeriodEnd = new Date(
          periodStart.getFullYear(),
          periodStart.getMonth(),
          periodStart.getDate() - 1
        );
        prevPeriodStart = new Date(
          prevPeriodEnd.getFullYear(),
          prevPeriodEnd.getMonth(),
          prevPeriodEnd.getDate() - 90
        );
        break;
      }
      case 'last2Months': {
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const targetMonth = currentMonth - 2;
        const targetYear = targetMonth < 0 ? currentYear - 1 : currentYear;
        const adjustedMonth = targetMonth < 0 ? targetMonth + 12 : targetMonth;
        periodStart = new Date(targetYear, adjustedMonth, 1);
        periodEnd = new Date(targetYear, adjustedMonth + 1, 0);
        prevPeriodStart = new Date(targetYear, adjustedMonth - 1, 1);
        prevPeriodEnd = new Date(targetYear, adjustedMonth, 0);
        break;
      }
      case 'thisMonth': {
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        prevPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        prevPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      }
      case 'lastMonth': {
        periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        prevPeriodStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        prevPeriodEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0);
        break;
      }
      case 'thisQuarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        const startMonth = quarter * 3;
        periodStart = new Date(now.getFullYear(), startMonth, 1);
        periodEnd = new Date(now.getFullYear(), startMonth + 3, 0);
        prevPeriodStart = new Date(now.getFullYear(), startMonth - 3, 1);
        prevPeriodEnd = new Date(now.getFullYear(), startMonth, 0);
        break;
      }
      case 'lastQuarter': {
        const quarter = Math.floor(now.getMonth() / 3) - 1;
        const startMonth = quarter * 3;
        periodStart = new Date(now.getFullYear(), startMonth, 1);
        periodEnd = new Date(now.getFullYear(), startMonth + 3, 0);
        prevPeriodStart = new Date(now.getFullYear(), startMonth - 3, 1);
        prevPeriodEnd = new Date(now.getFullYear(), startMonth, 0);
        break;
      }
      case 'thisYear': {
        periodStart = new Date(now.getFullYear(), 0, 1);
        periodEnd = new Date(now.getFullYear(), 11, 31);
        prevPeriodStart = new Date(now.getFullYear() - 1, 0, 1);
        prevPeriodEnd = new Date(now.getFullYear() - 1, 11, 31);
        break;
      }
      case 'lastYear': {
        periodStart = new Date(now.getFullYear() - 1, 0, 1);
        periodEnd = new Date(now.getFullYear() - 1, 11, 31);
        prevPeriodStart = new Date(now.getFullYear() - 2, 0, 1);
        prevPeriodEnd = new Date(now.getFullYear() - 2, 11, 31);
        break;
      }
      case 'allTime': {
        periodStart = new Date(-8640000000000000);
        periodEnd = new Date(8640000000000000);
        prevPeriodStart = new Date(-8640000000000000);
        prevPeriodEnd = new Date(now.getTime() - 1);
        break;
      }
      default: {
        console.warn('Unknown date range:', selectedDateRange);
        return 0;
      }
    }

    const previousCustomers = new Set(
      transactions
        .filter((t) => {
          const d = new Date(t.date || t.createdAt);
          return d >= prevPeriodStart && d <= prevPeriodEnd;
        })
        .map(getCustomerId)
        .filter(Boolean)
    );

    const currentCustomers = new Set(
      transactions
        .filter((t) => {
          const d = new Date(t.date || t.createdAt);
          return d >= periodStart && d <= periodEnd;
        })
        .map(getCustomerId)
        .filter(Boolean)
    );

    if (previousCustomers.size === 0) return 0;

    let retained = 0;
    previousCustomers.forEach((cust) => {
      if (currentCustomers.has(cust)) retained++;
    });

    return Math.round((retained / previousCustomers.size) * 100);
  }

  getBusiestDay(transactions: WorkTeller[]): string | null {
    if (!transactions.length) return null;
    const dayCounts = Array(7).fill(0);

    transactions.forEach((t) => {
      const d = new Date(t.date || t.createdAt);
      dayCounts[d.getDay()]++;
    });

    const max = Math.max(...dayCounts);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayCounts.indexOf(max)];
  }

  getBusiestMonth(transactions: WorkTeller[]): string | null {
    if (!transactions.length) return null;
    const monthCounts = Array(12).fill(0);

    transactions.forEach((t) => {
      const d = new Date(t.date || t.createdAt);
      monthCounts[d.getMonth()]++;
    });

    const max = Math.max(...monthCounts);
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[monthCounts.indexOf(max)];
  }

  getBusiestHour(transactions: WorkTeller[]): string | null {
    if (!transactions.length) return null;
    const hourCounts = Array(24).fill(0);

    transactions.forEach((t) => {
      const d = new Date(t.date || t.createdAt);
      hourCounts[d.getHours()]++;
    });

    const max = Math.max(...hourCounts);
    const hour = hourCounts.indexOf(max);
    return hour.toString().padStart(2, '0') + ':00';
  }

  calculateGrowth(totals: number[]): (number | null)[] {
    return totals.map((val, i, arr) => {
      if (i === 0) return null;
      const prev = arr[i - 1];
      if (prev === 0 && val === 0) return 0;
      if (prev === 0 && val > 0) return 100;
      return Math.round(((val - prev) / prev) * 100);
    });
  }

  calculateForecast(totals: number[], periods: number = 7): number[] {
    const n = totals.length;
    if (n < 2) return Array(periods).fill(totals[0] || 0);

    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += totals[i];
      sumXY += i * totals[i];
      sumX2 += i * i;
    }

    const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const b = (sumY - m * sumX) / n;

    const forecast: number[] = [];
    for (let i = 0; i < periods; i++) {
      const predictedValue = m * (n + i) + b;
      forecast.push(Math.max(0, Math.round(predictedValue)));
    }
    return forecast;
  }

  getAverageOrderValue(transactions: WorkTeller[], selectedDateRange: string): number {
    if (!transactions.length) return 0;
    const now = new Date();
    let periodStart: Date, periodEnd: Date;

    const getMonday = (date: Date): Date => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    switch (selectedDateRange) {
      case 'today':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
      case 'thisWeek': {
        const monday = getMonday(now);
        periodStart = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      }
      case 'lastWeek': {
        const monday = getMonday(now);
        monday.setDate(monday.getDate() - 7);
        periodStart = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        periodEnd = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate());
        break;
      }
      case 'last7Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'last14Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
        break;
      case 'last30Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        break;
      case 'last60Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60);
        break;
      case 'last90Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
        break;
      case 'last2Months': {
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const targetMonth = currentMonth - 2;
        const targetYear = targetMonth < 0 ? currentYear - 1 : currentYear;
        const adjustedMonth = targetMonth < 0 ? targetMonth + 12 : targetMonth;
        periodStart = new Date(targetYear, adjustedMonth, 1);
        periodEnd = new Date(targetYear, adjustedMonth + 1, 0);
        break;
      }
      case 'thisMonth':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisQuarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        const startMonth = quarter * 3;
        periodStart = new Date(now.getFullYear(), startMonth, 1);
        periodEnd = new Date(now.getFullYear(), startMonth + 3, 0);
        break;
      }
      case 'lastQuarter': {
        const quarter = Math.floor(now.getMonth() / 3) - 1;
        const startMonth = quarter * 3;
        periodStart = new Date(now.getFullYear(), startMonth, 1);
        periodEnd = new Date(now.getFullYear(), startMonth + 3, 0);
        break;
      }
      case 'thisYear':
        periodStart = new Date(now.getFullYear(), 0, 1);
        periodEnd = new Date(now.getFullYear(), 11, 31);
        break;
      case 'lastYear':
        periodStart = new Date(now.getFullYear() - 1, 0, 1);
        periodEnd = new Date(now.getFullYear() - 1, 11, 31);
        break;
      case 'allTime':
        periodStart = new Date(-8640000000000000);
        periodEnd = new Date(8640000000000000);
        break;
      default:
        return 0;
    }

    const filtered = transactions.filter((t) => {
      const d = new Date(t.date || t.createdAt);
      return d >= periodStart && d <= periodEnd;
    });
    if (filtered.length === 0) return 0;
    const totalRevenue = filtered.reduce((sum, t) => sum + t.total, 0);
    return totalRevenue / filtered.length;
  }

  trimZeroEdges(arr: number[], labels: string[]): { data: number[]; labels: string[] } {
    let start = arr.findIndex((v) => v !== 0);
    let end = arr.length - 1 - [...arr].reverse().findIndex((v) => v !== 0);

    if (start === -1 || end < start) {
      return { data: arr, labels };
    }

    return {
      data: arr.slice(start, end + 1),
      labels: labels.slice(start, end + 1),
    };
  }

  prepareChartSeries(
    range: string,
    txns: WorkTeller[]
  ): { labels: string[]; totals: number[]; lastActualDate: Date | null } {
    const now = new Date();
    let labels: string[] = [];
    let totals: number[] = [];
    let lastActualDate: Date | null = null;

    const getMonday = (date: Date): Date => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    if (range === 'today' || range === 'yesterday') {
      labels = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');
      totals = Array(24).fill(0);
      const refDate = new Date(now);
      if (range === 'yesterday') {
        refDate.setDate(now.getDate() - 1);
      }

      txns.forEach((t) => {
        const d = new Date(t.date || t.createdAt);
        if (
          d.getDate() === refDate.getDate() &&
          d.getMonth() === refDate.getMonth() &&
          d.getFullYear() === refDate.getFullYear()
        ) {
          totals[d.getHours()] += t.total;
        }
      });
      return { labels, totals, lastActualDate };
    }

    const lastNDays = { last7Days: 8, last14Days: 15, last30Days: 31 } as const;
    if (range in lastNDays) {
      const n = lastNDays[range as keyof typeof lastNDays];
      const days = Array.from({ length: n }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (n - 1 - i));
        d.setHours(0, 0, 0, 0);
        return d;
      });

      labels = days.map((d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      totals = days.map((d) => {
        const dayTxns = txns.filter((t) => {
          const td = new Date(t.date || t.createdAt);
          return (
            td.getFullYear() === d.getFullYear() &&
            td.getMonth() === d.getMonth() &&
            td.getDate() === d.getDate()
          );
        });
        return dayTxns.reduce((sum, t) => sum + t.total, 0);
      });
      lastActualDate = days[days.length - 1];
      return { labels, totals, lastActualDate };
    }

    if (range === 'thisMonth') {
      const month = now.getMonth();
      const year = now.getFullYear();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const days: Date[] = Array.from(
        { length: daysInMonth },
        (_, i) => new Date(year, month, i + 1)
      );

      labels = days.map((d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      totals = days.map((d) => {
        const dayTxns = txns.filter((t) => {
          const td = new Date(t.date || t.createdAt);
          return (
            td.getFullYear() === d.getFullYear() &&
            td.getMonth() === d.getMonth() &&
            td.getDate() === d.getDate()
          );
        });
        return dayTxns.reduce((sum, t) => sum + t.total, 0);
      });
      lastActualDate = new Date(year, month, now.getDate());
      return { labels, totals, lastActualDate };
    }

    if (range === 'lastMonth') {
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const month = prevMonth.getMonth();
      const year = prevMonth.getFullYear();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const days: Date[] = Array.from(
        { length: daysInMonth },
        (_, i) => new Date(year, month, i + 1)
      );

      labels = days.map((d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      totals = days.map((d) => {
        const dayTxns = txns.filter((t) => {
          const td = new Date(t.date || t.createdAt);
          return (
            td.getFullYear() === d.getFullYear() &&
            td.getMonth() === d.getMonth() &&
            td.getDate() === d.getDate()
          );
        });
        return dayTxns.reduce((sum, t) => sum + t.total, 0);
      });
      lastActualDate = days[days.length - 1];
      return { labels, totals, lastActualDate };
    }

    if (range === 'thisQuarter' || range === 'lastQuarter') {
      const quarter = Math.floor(now.getMonth() / 3) + 1;
      let qYear = now.getFullYear();
      let qNum = range === 'thisQuarter' ? quarter : quarter - 1;
      if (qNum < 1) {
        qNum = 4;
        qYear--;
      }
      const startMonth = (qNum - 1) * 3;
      labels = [];
      totals = [];
      for (let m = 0; m < 3; m++) {
        const monthIndex = startMonth + m;
        const monthTxns = txns.filter((t) => {
          const d = new Date(t.date || t.createdAt);
          return d.getFullYear() === qYear && d.getMonth() === monthIndex;
        });
        labels.push(
          new Date(qYear, monthIndex).toLocaleString(undefined, { month: 'short', year: 'numeric' })
        );
        totals.push(monthTxns.reduce((sum, t) => sum + t.total, 0));
      }
      return { labels, totals, lastActualDate };
    }

    if (range === 'last2Months') {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const targetMonth = currentMonth - 2;
      const targetYear = targetMonth < 0 ? currentYear - 1 : currentYear;
      const adjustedMonth = targetMonth < 0 ? targetMonth + 12 : targetMonth;

      const startDate = new Date(targetYear, adjustedMonth, 1);
      const endDate = new Date(targetYear, adjustedMonth + 1, 0);

      const days: Date[] = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d));
      }

      labels = days.map((d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      totals = days.map((d) => {
        const dayTxns = txns.filter((t) => {
          const td = new Date(t.date || t.createdAt);
          return (
            td.getFullYear() === d.getFullYear() &&
            td.getMonth() === d.getMonth() &&
            td.getDate() === d.getDate()
          );
        });
        return dayTxns.reduce((sum, t) => sum + t.total, 0);
      });
      lastActualDate = endDate;
      return { labels, totals, lastActualDate };
    }

    if (['last60Days', 'last90Days'].includes(range)) {
      const n = range === 'last60Days' ? 60 : 90;
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - n + 1);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);

      const weeks: { start: Date; end: Date }[] = [];
      let currentStart = new Date(startDate);

      while (currentStart <= endDate) {
        const weekEnd = new Date(currentStart);
        weekEnd.setDate(currentStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        weeks.push({
          start: new Date(currentStart),
          end: weekEnd <= endDate ? weekEnd : new Date(endDate),
        });

        currentStart.setDate(currentStart.getDate() + 7);
      }

      labels = weeks.map(
        ({ start, end }) =>
          `${start.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
      );

      totals = weeks.map(({ start, end }) =>
        txns.reduce((sum, t) => {
          const td = new Date(t.date || t.createdAt);
          return td >= start && td <= end ? sum + t.total : sum;
        }, 0)
      );

      lastActualDate = weeks[weeks.length - 1].end;
      return { labels, totals, lastActualDate };
    }

    if (range === 'thisYear' || range === 'lastYear') {
      let y = range === 'thisYear' ? now.getFullYear() : now.getFullYear() - 1;
      labels = [];
      totals = [];
      for (let m = 0; m < 12; m++) {
        const monthTxns = txns.filter((t) => {
          const d = new Date(t.date || t.createdAt);
          return d.getFullYear() === y && d.getMonth() === m;
        });
        labels.push(new Date(y, m).toLocaleString(undefined, { month: 'short', year: 'numeric' }));
        totals.push(monthTxns.reduce((sum, t) => sum + t.total, 0));
      }
      return { labels, totals, lastActualDate };
    }

    if (range === 'thisWeek' || range === 'lastWeek') {
      const monday = getMonday(now);
      if (range === 'lastWeek') {
        monday.setDate(monday.getDate() - 7);
      }

      labels = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
      });

      totals = Array(7).fill(0);
      txns.forEach((t) => {
        const d = new Date(t.date || t.createdAt);
        for (let i = 0; i < 7; i++) {
          const currLabelDate = new Date(monday);
          currLabelDate.setDate(monday.getDate() + i);
          if (
            d.getFullYear() === currLabelDate.getFullYear() &&
            d.getMonth() === currLabelDate.getMonth() &&
            d.getDate() === currLabelDate.getDate()
          ) {
            totals[i] += t.total;
          }
        }
      });
      return { labels, totals, lastActualDate };
    }

    if (range === 'allTime') {
      const years = txns.map((t) => new Date(t.date || t.createdAt).getFullYear());
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      labels = [];
      totals = [];
      for (let y = minYear; y <= maxYear; y++) {
        for (let m = 0; m < 12; m++) {
          const monthTxns = txns.filter((t) => {
            const d = new Date(t.date || t.createdAt);
            return d.getFullYear() === y && d.getMonth() === m;
          });
          if (monthTxns.length) {
            labels.push(
              new Date(y, m).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
            );
            totals.push(monthTxns.reduce((sum, t) => sum + t.total, 0));
          }
        }
      }
      return { labels, totals, lastActualDate };
    }

    return { labels: [], totals: [], lastActualDate };
  }

  prepareChartSeriesVolume(
    range: string,
    txns: WorkTeller[]
  ): { labels: string[]; counts: number[] } {
    const now = new Date();
    let labels: string[] = [];
    let counts: number[] = [];

    const getMonday = (date: Date): Date => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    if (range === 'today' || range === 'yesterday') {
      labels = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');
      counts = Array(24).fill(0);
      const refDate = new Date(now);
      if (range === 'yesterday') {
        refDate.setDate(now.getDate() - 1);
      }

      txns.forEach((t) => {
        const d = new Date(t.date || t.createdAt);
        if (
          d.getDate() === refDate.getDate() &&
          d.getMonth() === refDate.getMonth() &&
          d.getFullYear() === refDate.getFullYear()
        ) {
          counts[d.getHours()] += 1;
        }
      });
      return { labels, counts };
    }

    const lastNDays = { last7Days: 8, last14Days: 15, last30Days: 31 } as const;
    if (range in lastNDays) {
      const n = lastNDays[range as keyof typeof lastNDays];
      const days = Array.from({ length: n }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (n - 1 - i));
        d.setHours(0, 0, 0, 0);
        return d;
      });

      labels = days.map((d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      counts = days.map((d) => {
        return txns.filter((t) => {
          const td = new Date(t.date || t.createdAt);
          return (
            td.getFullYear() === d.getFullYear() &&
            td.getMonth() === d.getMonth() &&
            td.getDate() === d.getDate()
          );
        }).length;
      });
      return { labels, counts };
    }

    if (range === 'thisMonth') {
      const month = now.getMonth();
      const year = now.getFullYear();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const days: Date[] = Array.from(
        { length: daysInMonth },
        (_, i) => new Date(year, month, i + 1)
      );

      labels = days.map((d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      counts = days.map((d) => {
        return txns.filter((t) => {
          const td = new Date(t.date || t.createdAt);
          return (
            td.getFullYear() === d.getFullYear() &&
            td.getMonth() === d.getMonth() &&
            td.getDate() === d.getDate()
          );
        }).length;
      });
      return { labels, counts };
    }

    if (range === 'lastMonth') {
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const month = prevMonth.getMonth();
      const year = prevMonth.getFullYear();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const days: Date[] = Array.from(
        { length: daysInMonth },
        (_, i) => new Date(year, month, i + 1)
      );

      labels = days.map((d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      counts = days.map((d) => {
        return txns.filter((t) => {
          const td = new Date(t.date || t.createdAt);
          return (
            td.getFullYear() === d.getFullYear() &&
            td.getMonth() === d.getMonth() &&
            td.getDate() === d.getDate()
          );
        }).length;
      });
      return { labels, counts };
    }

    if (range === 'thisQuarter' || range === 'lastQuarter') {
      const quarter = Math.floor(now.getMonth() / 3) + 1;
      let qYear = now.getFullYear();
      let qNum = range === 'thisQuarter' ? quarter : quarter - 1;
      if (qNum < 1) {
        qNum = 4;
        qYear--;
      }
      const startMonth = (qNum - 1) * 3;
      labels = [];
      counts = [];
      for (let m = 0; m < 3; m++) {
        const monthIndex = startMonth + m;
        const monthTxnsCount = txns.filter((t) => {
          const d = new Date(t.date || t.createdAt);
          return d.getFullYear() === qYear && d.getMonth() === monthIndex;
        }).length;
        labels.push(
          new Date(qYear, monthIndex).toLocaleString(undefined, { month: 'short', year: 'numeric' })
        );
        counts.push(monthTxnsCount);
      }
      return { labels, counts };
    }

    if (range === 'last2Months') {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const targetMonth = currentMonth - 2;
      const targetYear = targetMonth < 0 ? currentYear - 1 : currentYear;
      const adjustedMonth = targetMonth < 0 ? targetMonth + 12 : targetMonth;

      const startDate = new Date(targetYear, adjustedMonth, 1);
      const endDate = new Date(targetYear, adjustedMonth + 1, 0);

      const days: Date[] = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d));
      }

      labels = days.map((d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      counts = days.map((d) => {
        return txns.filter((t) => {
          const td = new Date(t.date || t.createdAt);
          return (
            td.getFullYear() === d.getFullYear() &&
            td.getMonth() === d.getMonth() &&
            td.getDate() === d.getDate()
          );
        }).length;
      });
      return { labels, counts };
    }

    if (['last60Days', 'last90Days'].includes(range)) {
      const n = range === 'last60Days' ? 60 : 90;
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - n + 1); 
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);

      const weeks: { start: Date; end: Date }[] = [];
      let currentStart = new Date(startDate);

      while (currentStart <= endDate) {
        const weekEnd = new Date(currentStart);
        weekEnd.setDate(currentStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        weeks.push({
          start: new Date(currentStart),
          end: weekEnd <= endDate ? weekEnd : new Date(endDate),
        });

        currentStart.setDate(currentStart.getDate() + 7);
      }

      labels = weeks.map(
        ({ start, end }) =>
          `${start.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
      );

      counts = weeks.map(({ start, end }) =>
        txns.reduce((sum, t) => {
          const td = new Date(t.date || t.createdAt);
          return td >= start && td <= end ? sum + 1 : sum;
        }, 0)
      );

      return { labels, counts };
    }

    if (range === 'thisYear' || range === 'lastYear') {
      let y = range === 'thisYear' ? now.getFullYear() : now.getFullYear() - 1;
      labels = [];
      counts = [];
      for (let m = 0; m < 12; m++) {
        const monthTxnsCount = txns.filter((t) => {
          const d = new Date(t.date || t.createdAt);
          return d.getFullYear() === y && d.getMonth() === m;
        }).length;
        labels.push(new Date(y, m).toLocaleString(undefined, { month: 'short', year: 'numeric' }));
        counts.push(monthTxnsCount);
      }
      return { labels, counts };
    }

    if (range === 'thisWeek' || range === 'lastWeek') {
      const monday = getMonday(now);
      if (range === 'lastWeek') {
        monday.setDate(monday.getDate() - 7);
      }

      labels = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
      });

      counts = Array(7).fill(0);
      txns.forEach((t) => {
        const d = new Date(t.date || t.createdAt);
        for (let i = 0; i < 7; i++) {
          const currLabelDate = new Date(monday);
          currLabelDate.setDate(monday.getDate() + i);
          if (
            d.getFullYear() === currLabelDate.getFullYear() &&
            d.getMonth() === currLabelDate.getMonth() &&
            d.getDate() === currLabelDate.getDate()
          ) {
            counts[i] += 1;
          }
        }
      });
      return { labels, counts };
    }

    if (range === 'allTime') {
      const years = txns.map((t) => new Date(t.date || t.createdAt).getFullYear());
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      labels = [];
      counts = [];
      for (let y = minYear; y <= maxYear; y++) {
        for (let m = 0; m < 12; m++) {
          const monthTxnsCount = txns.filter((t) => {
            const d = new Date(t.date || t.createdAt);
            return d.getFullYear() === y && d.getMonth() === m;
          }).length;
          if (monthTxnsCount) {
            labels.push(
              new Date(y, m).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
            );
            counts.push(monthTxnsCount);
          }
        }
      }
      return { labels, counts };
    }

    return { labels: [], counts: [] };
  }

  
  getPaymentSuccessRate(transactions: WorkTeller[], selectedDateRange: string): number {
    if (!transactions.length) return 0;

    const now = new Date();
    let periodStart: Date, periodEnd: Date;

    
    const getMonday = (date: Date): Date => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    switch (selectedDateRange) {
      case 'today':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
      case 'thisWeek': {
        const monday = getMonday(now);
        periodStart = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      }
      case 'lastWeek': {
        const monday = getMonday(now);
        monday.setDate(monday.getDate() - 7);
        periodStart = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        periodEnd = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate());
        break;
      }
      case 'last7Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'last14Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
        break;
      case 'last30Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        break;
      case 'last60Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60);
        break;
      case 'last90Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
        break;
      case 'last2Months': {
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const targetMonth = currentMonth - 2;
        const targetYear = targetMonth < 0 ? currentYear - 1 : currentYear;
        const adjustedMonth = targetMonth < 0 ? targetMonth + 12 : targetMonth;
        periodStart = new Date(targetYear, adjustedMonth, 1);
        periodEnd = new Date(targetYear, adjustedMonth + 1, 0);
        break;
      }
      case 'thisMonth':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisQuarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        const startMonth = quarter * 3;
        periodStart = new Date(now.getFullYear(), startMonth, 1);
        periodEnd = new Date(now.getFullYear(), startMonth + 3, 0);
        break;
      }
      case 'lastQuarter': {
        const quarter = Math.floor(now.getMonth() / 3) - 1;
        const startMonth = quarter * 3;
        periodStart = new Date(now.getFullYear(), startMonth, 1);
        periodEnd = new Date(now.getFullYear(), startMonth + 3, 0);
        break;
      }
      case 'thisYear':
        periodStart = new Date(now.getFullYear(), 0, 1);
        periodEnd = new Date(now.getFullYear(), 11, 31);
        break;
      case 'lastYear':
        periodStart = new Date(now.getFullYear() - 1, 0, 1);
        periodEnd = new Date(now.getFullYear() - 1, 11, 31);
        break;
      case 'allTime':
        periodStart = new Date(-8640000000000000);
        periodEnd = new Date(8640000000000000);
        break;
      default:
        return 0;
    }

    const filtered = transactions.filter((t) => {
      const d = new Date(t.date || t.createdAt);
      return d >= periodStart && d <= periodEnd;
    });

    if (filtered.length === 0) return 0;

    const paidCount = filtered.filter(
      (t) =>
        t.paymentStatus?.toLowerCase() === 'fullypaid' || t.paymentStatus?.toLowerCase() === 'paid'
    ).length;

    return Math.round((paidCount / filtered.length) * 100);
  }

  
  getMostPopularPaymentMethod(transactions: WorkTeller[], selectedDateRange: string): string {
    if (!transactions.length) return 'N/A';

    const now = new Date();
    let periodStart: Date, periodEnd: Date;

    const getMonday = (date: Date): Date => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d;
    };

   
    switch (selectedDateRange) {
      case 'today':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
      case 'thisWeek': {
        const monday = getMonday(now);
        periodStart = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      }
      case 'lastWeek': {
        const monday = getMonday(now);
        monday.setDate(monday.getDate() - 7);
        periodStart = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        periodEnd = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate());
        break;
      }
      case 'last7Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'last14Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
        break;
      case 'last30Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        break;
      case 'last60Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60);
        break;
      case 'last90Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
        break;
      case 'last2Months': {
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const targetMonth = currentMonth - 2;
        const targetYear = targetMonth < 0 ? currentYear - 1 : currentYear;
        const adjustedMonth = targetMonth < 0 ? targetMonth + 12 : targetMonth;
        periodStart = new Date(targetYear, adjustedMonth, 1);
        periodEnd = new Date(targetYear, adjustedMonth + 1, 0);
        break;
      }
      case 'thisMonth':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisQuarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        const startMonth = quarter * 3;
        periodStart = new Date(now.getFullYear(), startMonth, 1);
        periodEnd = new Date(now.getFullYear(), startMonth + 3, 0);
        break;
      }
      case 'lastQuarter': {
        const quarter = Math.floor(now.getMonth() / 3) - 1;
        const startMonth = quarter * 3;
        periodStart = new Date(now.getFullYear(), startMonth, 1);
        periodEnd = new Date(now.getFullYear(), startMonth + 3, 0);
        break;
      }
      case 'thisYear':
        periodStart = new Date(now.getFullYear(), 0, 1);
        periodEnd = new Date(now.getFullYear(), 11, 31);
        break;
      case 'lastYear':
        periodStart = new Date(now.getFullYear() - 1, 0, 1);
        periodEnd = new Date(now.getFullYear() - 1, 11, 31);
        break;
      case 'allTime':
        periodStart = new Date(-8640000000000000);
        periodEnd = new Date(8640000000000000);
        break;
      default:
        return 'N/A';
    }

    const filtered = transactions.filter((t) => {
      const d = new Date(t.date || t.createdAt);
      return d >= periodStart && d <= periodEnd;
    });

    if (filtered.length === 0) return 'N/A';

    const methodCounts: { [key: string]: number } = {};
    filtered.forEach((t) => {
      const method = t.paymentMethod || 'Unknown';
      methodCounts[method] = (methodCounts[method] || 0) + 1;
    });

    let maxMethod = 'N/A';
    let maxCount = 0;
    Object.entries(methodCounts).forEach(([method, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxMethod = method;
      }
    });

    return maxMethod;
  }

  
  getCustomerRevenueSplit(
    transactions: WorkTeller[],
    selectedDateRange: string
  ): { firstTime: number; repeat: number } {
    if (!transactions.length) return { firstTime: 0, repeat: 0 };

    const now = new Date();
    let periodStart: Date, periodEnd: Date;

    const getMonday = (date: Date): Date => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    
    switch (selectedDateRange) {
      case 'today':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
      case 'thisWeek': {
        const monday = getMonday(now);
        periodStart = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      }
      case 'lastWeek': {
        const monday = getMonday(now);
        monday.setDate(monday.getDate() - 7);
        periodStart = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        periodEnd = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate());
        break;
      }
      case 'last7Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'last14Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
        break;
      case 'last30Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        break;
      case 'last60Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60);
        break;
      case 'last90Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
        break;
      case 'last2Months': {
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const targetMonth = currentMonth - 2;
        const targetYear = targetMonth < 0 ? currentYear - 1 : currentYear;
        const adjustedMonth = targetMonth < 0 ? targetMonth + 12 : targetMonth;
        periodStart = new Date(targetYear, adjustedMonth, 1);
        periodEnd = new Date(targetYear, adjustedMonth + 1, 0);
        break;
      }
      case 'thisMonth':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisQuarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        const startMonth = quarter * 3;
        periodStart = new Date(now.getFullYear(), startMonth, 1);
        periodEnd = new Date(now.getFullYear(), startMonth + 3, 0);
        break;
      }
      case 'lastQuarter': {
        const quarter = Math.floor(now.getMonth() / 3) - 1;
        const startMonth = quarter * 3;
        periodStart = new Date(now.getFullYear(), startMonth, 1);
        periodEnd = new Date(now.getFullYear(), startMonth + 3, 0);
        break;
      }
      case 'thisYear':
        periodStart = new Date(now.getFullYear(), 0, 1);
        periodEnd = new Date(now.getFullYear(), 11, 31);
        break;
      case 'lastYear':
        periodStart = new Date(now.getFullYear() - 1, 0, 1);
        periodEnd = new Date(now.getFullYear() - 1, 11, 31);
        break;
      case 'allTime':
        periodStart = new Date(-8640000000000000);
        periodEnd = new Date(8640000000000000);
        break;
      default:
        return { firstTime: 0, repeat: 0 };
    }

    const periodTransactions = transactions.filter((t) => {
      const d = new Date(t.date || t.createdAt);
      return d >= periodStart && d <= periodEnd;
    });

    const getCustomerId = (t: WorkTeller) =>
      t.workProfile?.email || t.workProfile?.name || t.customerId;

    
    const customerFirstDate: { [key: string]: Date } = {};
    transactions.forEach((t) => {
      const custId = getCustomerId(t);
      if (!custId) return;
      const tDate = new Date(t.date || t.createdAt);
      if (!customerFirstDate[custId] || tDate < customerFirstDate[custId]) {
        customerFirstDate[custId] = tDate;
      }
    });

    let firstTimeRevenue = 0;
    let repeatRevenue = 0;

    periodTransactions.forEach((t) => {
      const custId = getCustomerId(t);
      if (!custId) {
        firstTimeRevenue += t.total;
        return;
      }

      const firstDate = customerFirstDate[custId];
      const tDate = new Date(t.date || t.createdAt);

      
      if (
        firstDate &&
        firstDate >= periodStart &&
        firstDate <= periodEnd &&
        firstDate.getTime() === tDate.getTime()
      ) {
        firstTimeRevenue += t.total;
      } else {
        repeatRevenue += t.total;
      }
    });

    const total = firstTimeRevenue + repeatRevenue;
    if (total === 0) return { firstTime: 0, repeat: 0 };

    return {
      firstTime: Math.round((firstTimeRevenue / total) * 100),
      repeat: Math.round((repeatRevenue / total) * 100),
    };
  }

  
  getDiscountUtilizationRate(transactions: WorkTeller[], selectedDateRange: string): number {
    if (!transactions.length) return 0;

    const now = new Date();
    let periodStart: Date, periodEnd: Date;

    const getMonday = (date: Date): Date => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    
    switch (selectedDateRange) {
      case 'today':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
      case 'thisWeek': {
        const monday = getMonday(now);
        periodStart = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      }
      case 'lastWeek': {
        const monday = getMonday(now);
        monday.setDate(monday.getDate() - 7);
        periodStart = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        periodEnd = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate());
        break;
      }
      case 'last7Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'last14Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
        break;
      case 'last30Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        break;
      case 'last60Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60);
        break;
      case 'last90Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
        break;
      case 'last2Months': {
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const targetMonth = currentMonth - 2;
        const targetYear = targetMonth < 0 ? currentYear - 1 : currentYear;
        const adjustedMonth = targetMonth < 0 ? targetMonth + 12 : targetMonth;
        periodStart = new Date(targetYear, adjustedMonth, 1);
        periodEnd = new Date(targetYear, adjustedMonth + 1, 0);
        break;
      }
      case 'thisMonth':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisQuarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        const startMonth = quarter * 3;
        periodStart = new Date(now.getFullYear(), startMonth, 1);
        periodEnd = new Date(now.getFullYear(), startMonth + 3, 0);
        break;
      }
      case 'lastQuarter': {
        const quarter = Math.floor(now.getMonth() / 3) - 1;
        const startMonth = quarter * 3;
        periodStart = new Date(now.getFullYear(), startMonth, 1);
        periodEnd = new Date(now.getFullYear(), startMonth + 3, 0);
        break;
      }
      case 'thisYear':
        periodStart = new Date(now.getFullYear(), 0, 1);
        periodEnd = new Date(now.getFullYear(), 11, 31);
        break;
      case 'lastYear':
        periodStart = new Date(now.getFullYear() - 1, 0, 1);
        periodEnd = new Date(now.getFullYear() - 1, 11, 31);
        break;
      case 'allTime':
        periodStart = new Date(-8640000000000000);
        periodEnd = new Date(8640000000000000);
        break;
      default:
        return 0;
    }

    const filtered = transactions.filter((t) => {
      const d = new Date(t.date || t.createdAt);
      return d >= periodStart && d <= periodEnd;
    });

    if (filtered.length === 0) return 0;

    const withDiscount = filtered.filter((t) => t.discount > 0).length;
    return Math.round((withDiscount / filtered.length) * 100);
  }

  
  getPeakRevenueHours(transactions: WorkTeller[]): string {
    if (!transactions.length) return 'N/A';

    const hourRevenue = Array(24).fill(0);

    transactions.forEach((t) => {
      const d = new Date(t.date || t.createdAt);
      hourRevenue[d.getHours()] += t.total;
    });

    
    const hourIndices = hourRevenue.map((_, i) => i);
    hourIndices.sort((a, b) => hourRevenue[b] - hourRevenue[a]);

    const top3 = hourIndices.slice(0, 3);
    return top3.map((h) => h.toString().padStart(2, '0') + ':00').join(', ');
  }

  getRevenueByPaymentMethod(
    transactions: WorkTeller[],
    selectedDateRange: string
  ): { name: string; value: number }[] {
    if (!transactions.length) return [];

    const now = new Date();
    let periodStart: Date, periodEnd: Date;

    const getMonday = (date: Date): Date => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    
    switch (selectedDateRange) {
      case 'today':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
      case 'thisWeek': {
        const monday = getMonday(now);
        periodStart = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      }
      case 'lastWeek': {
        const monday = getMonday(now);
        monday.setDate(monday.getDate() - 7);
        periodStart = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        periodEnd = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate());
        break;
      }
      case 'last7Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'last14Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
        break;
      case 'last30Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        break;
      case 'last60Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60);
        break;
      case 'last90Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
        break;
      case 'last2Months': {
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const targetMonth = currentMonth - 2;
        const targetYear = targetMonth < 0 ? currentYear - 1 : currentYear;
        const adjustedMonth = targetMonth < 0 ? targetMonth + 12 : targetMonth;
        periodStart = new Date(targetYear, adjustedMonth, 1);
        periodEnd = new Date(targetYear, adjustedMonth + 1, 0);
        break;
      }
      case 'thisMonth':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisQuarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        const startMonth = quarter * 3;
        periodStart = new Date(now.getFullYear(), startMonth, 1);
        periodEnd = new Date(now.getFullYear(), startMonth + 3, 0);
        break;
      }
      case 'lastQuarter': {
        const quarter = Math.floor(now.getMonth() / 3) - 1;
        const startMonth = quarter * 3;
        periodStart = new Date(now.getFullYear(), startMonth, 1);
        periodEnd = new Date(now.getFullYear(), startMonth + 3, 0);
        break;
      }
      case 'thisYear':
        periodStart = new Date(now.getFullYear(), 0, 1);
        periodEnd = new Date(now.getFullYear(), 11, 31);
        break;
      case 'lastYear':
        periodStart = new Date(now.getFullYear() - 1, 0, 1);
        periodEnd = new Date(now.getFullYear() - 1, 11, 31);
        break;
      case 'allTime':
        periodStart = new Date(-8640000000000000);
        periodEnd = new Date(8640000000000000);
        break;
      default:
        return [];
    }

    const filtered = transactions.filter((t) => {
      const d = new Date(t.date || t.createdAt);
      return d >= periodStart && d <= periodEnd;
    });

    const methodRevenue: { [key: string]: number } = {};
    filtered.forEach((t) => {
      const method = t.paymentMethod || 'Unknown';
      methodRevenue[method] = (methodRevenue[method] || 0) + t.total;
    });

    return Object.entries(methodRevenue)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }

  getRevenueByHour(transactions: WorkTeller[], selectedDateRange: string): number[] {
    const now = new Date();
    let periodStart: Date, periodEnd: Date;

    const getMonday = (date: Date): Date => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    switch (selectedDateRange) {
      case 'today':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
      case 'thisWeek': {
        const monday = getMonday(now);
        periodStart = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      }
      case 'lastWeek': {
        const monday = getMonday(now);
        monday.setDate(monday.getDate() - 7);
        periodStart = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        periodEnd = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate());
        break;
      }
      case 'last7Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'last14Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
        break;
      case 'last30Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        break;
      case 'last60Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60);
        break;
      case 'last90Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
        break;
      case 'last2Months': {
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const targetMonth = currentMonth - 2;
        const targetYear = targetMonth < 0 ? currentYear - 1 : currentYear;
        const adjustedMonth = targetMonth < 0 ? targetMonth + 12 : targetMonth;
        periodStart = new Date(targetYear, adjustedMonth, 1);
        periodEnd = new Date(targetYear, adjustedMonth + 1, 0);
        break;
      }
      case 'thisMonth':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisQuarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        const startMonth = quarter * 3;
        periodStart = new Date(now.getFullYear(), startMonth, 1);
        periodEnd = new Date(now.getFullYear(), startMonth + 3, 0);
        break;
      }
      case 'lastQuarter': {
        const quarter = Math.floor(now.getMonth() / 3) - 1;
        const startMonth = quarter * 3;
        periodStart = new Date(now.getFullYear(), startMonth, 1);
        periodEnd = new Date(now.getFullYear(), startMonth + 3, 0);
        break;
      }
      case 'thisYear':
        periodStart = new Date(now.getFullYear(), 0, 1);
        periodEnd = new Date(now.getFullYear(), 11, 31);
        break;
      case 'lastYear':
        periodStart = new Date(now.getFullYear() - 1, 0, 1);
        periodEnd = new Date(now.getFullYear() - 1, 11, 31);
        break;
      case 'allTime':
        periodStart = new Date(-8640000000000000);
        periodEnd = new Date(8640000000000000);
        break;
      default:
        periodStart = new Date(-8640000000000000);
        periodEnd = new Date(8640000000000000);
        break;
    }

    
    const filtered = transactions.filter((t) => {
      const d = new Date(t.date || t.createdAt);
      return d >= periodStart && d <= periodEnd;
    });

    const hourRevenue = Array(24).fill(0);

    filtered.forEach((t) => {
      const d = new Date(t.date || t.createdAt);
      hourRevenue[d.getHours()] += t.total;
    });

    return hourRevenue;
  }
}
