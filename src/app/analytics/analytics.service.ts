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

export interface DateRangeBounds {
  periodStart: Date;
  periodEnd: Date;
  prevPeriodStart?: Date;
  prevPeriodEnd?: Date;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private apiUrl = '/api/transactions';

  constructor(private http: HttpClient) {}

  private getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private getCustomerId(t: WorkTeller): string | undefined {
    return t.workProfile?.email || t.workProfile?.name;
  }

  filterBySpecificDate(transactions: WorkTeller[], dateString: string): WorkTeller[] {
    const targetDate = new Date(dateString);
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();
    const targetDay = targetDate.getDate();

    return transactions.filter((t) => {
      const transactionDate = new Date(t.createdAt);
      return (
        transactionDate.getFullYear() === targetYear &&
        transactionDate.getMonth() === targetMonth &&
        transactionDate.getDate() === targetDay
      );
    });
  }

  filterByDateRange(transactions: WorkTeller[], selectedDateRange: string): WorkTeller[] {
    const { periodStart, periodEnd } = this.getDateRangeBounds(selectedDateRange);
    return transactions.filter((t) => {
      const d = new Date(t.date || t.createdAt);
      return d >= periodStart && d <= periodEnd;
    });
  }

  getDateRangeBounds(
    selectedDateRange: string,
    includePrevPeriod: boolean = false
  ): DateRangeBounds {
    const now = new Date();
    let periodStart: Date, periodEnd: Date;
    let prevPeriodStart: Date | undefined, prevPeriodEnd: Date | undefined;

    switch (selectedDateRange) {
      case 'today':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (includePrevPeriod) {
          prevPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          prevPeriodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        }
        break;

      case 'yesterday':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        if (includePrevPeriod) {
          prevPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
          prevPeriodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
        }
        break;

      case 'thisWeek': {
        const monday = this.getMonday(now);
        periodStart = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (includePrevPeriod) {
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
        }
        break;
      }

      case 'lastWeek': {
        const lastWeekMonday = this.getMonday(now);
        lastWeekMonday.setDate(lastWeekMonday.getDate() - 7);
        periodStart = new Date(
          lastWeekMonday.getFullYear(),
          lastWeekMonday.getMonth(),
          lastWeekMonday.getDate()
        );
        const lastWeekSunday = new Date(lastWeekMonday);
        lastWeekSunday.setDate(lastWeekMonday.getDate() + 6);
        periodEnd = new Date(
          lastWeekSunday.getFullYear(),
          lastWeekSunday.getMonth(),
          lastWeekSunday.getDate()
        );
        if (includePrevPeriod) {
          const prevMonday = new Date(lastWeekMonday);
          prevMonday.setDate(lastWeekMonday.getDate() - 7);
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
        }
        break;
      }

      case 'last7Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        if (includePrevPeriod) {
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
        }
        break;

      case 'last14Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
        if (includePrevPeriod) {
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
        }
        break;

      case 'last30Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        if (includePrevPeriod) {
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
        }
        break;

      case 'last60Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60);
        if (includePrevPeriod) {
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
        }
        break;

      case 'last90Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
        if (includePrevPeriod) {
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
        }
        break;

      case 'last2Months': {
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const targetMonth = currentMonth - 2;
        const targetYear = targetMonth < 0 ? currentYear - 1 : currentYear;
        const adjustedMonth = targetMonth < 0 ? targetMonth + 12 : targetMonth;
        periodStart = new Date(targetYear, adjustedMonth, 1);
        periodEnd = new Date(targetYear, adjustedMonth + 1, 0);
        if (includePrevPeriod) {
          prevPeriodStart = new Date(targetYear, adjustedMonth - 1, 1);
          prevPeriodEnd = new Date(targetYear, adjustedMonth, 0);
        }
        break;
      }

      case 'thisMonth':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        if (includePrevPeriod) {
          prevPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          prevPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        }
        break;

      case 'lastMonth':
        periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        if (includePrevPeriod) {
          prevPeriodStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
          prevPeriodEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0);
        }
        break;

      case 'thisQuarter': {
        const thisQuarter = Math.floor(now.getMonth() / 3);
        const thisStartMonth = thisQuarter * 3;
        periodStart = new Date(now.getFullYear(), thisStartMonth, 1);
        periodEnd = new Date(now.getFullYear(), thisStartMonth + 3, 0);
        if (includePrevPeriod) {
          prevPeriodStart = new Date(now.getFullYear(), thisStartMonth - 3, 1);
          prevPeriodEnd = new Date(now.getFullYear(), thisStartMonth, 0);
        }
        break;
      }

      case 'lastQuarter': {
        const lastQuarter = Math.floor(now.getMonth() / 3) - 1;
        const lastStartMonth = lastQuarter * 3;
        periodStart = new Date(now.getFullYear(), lastStartMonth, 1);
        periodEnd = new Date(now.getFullYear(), lastStartMonth + 3, 0);
        if (includePrevPeriod) {
          prevPeriodStart = new Date(now.getFullYear(), lastStartMonth - 3, 1);
          prevPeriodEnd = new Date(now.getFullYear(), lastStartMonth, 0);
        }
        break;
      }

      case 'thisYear':
        periodStart = new Date(now.getFullYear(), 0, 1);
        periodEnd = new Date(now.getFullYear(), 11, 31);
        if (includePrevPeriod) {
          prevPeriodStart = new Date(now.getFullYear() - 1, 0, 1);
          prevPeriodEnd = new Date(now.getFullYear() - 1, 11, 31);
        }
        break;

      case 'lastYear':
        periodStart = new Date(now.getFullYear() - 1, 0, 1);
        periodEnd = new Date(now.getFullYear() - 1, 11, 31);
        if (includePrevPeriod) {
          prevPeriodStart = new Date(now.getFullYear() - 2, 0, 1);
          prevPeriodEnd = new Date(now.getFullYear() - 2, 11, 31);
        }
        break;

      case 'allTime':
        periodStart = new Date(-8640000000000000);
        periodEnd = new Date(8640000000000000);
        if (includePrevPeriod) {
          prevPeriodStart = new Date(-8640000000000000);
          prevPeriodEnd = new Date(now.getTime() - 1);
        }
        break;

      default:
        periodStart = new Date(-8640000000000000);
        periodEnd = new Date(8640000000000000);
        break;
    }

    return { periodStart, periodEnd, prevPeriodStart, prevPeriodEnd };
  }

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

  getCustomerRetentionRate(
    transactions: WorkTeller[],
    selectedDateRange: string,
    specificDate?: string
  ): number | null {
    if (!transactions.length) return null;

    if (specificDate) {
      const filtered = this.filterBySpecificDate(transactions, specificDate);
      if (filtered.length === 0) return null;

      const specificDateObj = new Date(specificDate);
      specificDateObj.setHours(0, 0, 0, 0);

      const transactionsBeforeDate = transactions.filter((t) => {
        const d = new Date(t.createdAt);
        d.setHours(0, 0, 0, 0);
        return d < specificDateObj;
      });

      const previousCustomers = new Set(
        transactionsBeforeDate.map((t) => this.getCustomerId(t)).filter(Boolean)
      );

      const todaysCustomers = filtered.map((t) => this.getCustomerId(t)).filter(Boolean);

      if (todaysCustomers.length === 0) return 0;

      let returningCustomers = 0;
      todaysCustomers.forEach((custId) => {
        if (previousCustomers.has(custId)) {
          returningCustomers++;
        }
      });

      return Math.round((returningCustomers / todaysCustomers.length) * 100);
    }

    const { periodStart, periodEnd, prevPeriodStart, prevPeriodEnd } = this.getDateRangeBounds(
      selectedDateRange,
      true
    );

    if (!prevPeriodStart || !prevPeriodEnd) {
      console.warn('Unknown date range:', selectedDateRange);
      return 0;
    }

    const previousCustomers = new Set(
      transactions
        .filter((t) => {
          const d = new Date(t.date || t.createdAt);
          return d >= prevPeriodStart && d <= prevPeriodEnd;
        })
        .map((t) => this.getCustomerId(t))
        .filter(Boolean)
    );

    const currentCustomers = new Set(
      transactions
        .filter((t) => {
          const d = new Date(t.date || t.createdAt);
          return d >= periodStart && d <= periodEnd;
        })
        .map((t) => this.getCustomerId(t))
        .filter(Boolean)
    );

    if (previousCustomers.size === 0) return 0;

    let retained = 0;
    previousCustomers.forEach((cust) => {
      if (currentCustomers.has(cust)) retained++;
    });

    return Math.round((retained / previousCustomers.size) * 100);
  }

  getTransactionCount(
    transactions: WorkTeller[],
    selectedDateRange: string,
    specificDate?: string
  ): number {
    if (!transactions.length) return 0;

    let filtered: WorkTeller[];
    if (specificDate) {
      filtered = this.filterBySpecificDate(transactions, specificDate);
    } else {
      filtered = this.filterByDateRange(transactions, selectedDateRange);
    }

    return filtered.length;
  }

  getTotalRevenue(
    transactions: WorkTeller[],
    selectedDateRange: string,
    specificDate?: string
  ): number {
    if (!transactions.length) return 0;

    let filtered: WorkTeller[];
    if (specificDate) {
      filtered = this.filterBySpecificDate(transactions, specificDate);
    } else {
      filtered = this.filterByDateRange(transactions, selectedDateRange);
    }

    return filtered.reduce((sum, t) => sum + t.total, 0);
  }

  getTotalUniqueCustomers(
    transactions: WorkTeller[],
    selectedDateRange: string,
    specificDate?: string
  ): number {
    if (!transactions.length) return 0;

    let filtered: WorkTeller[];
    if (specificDate) {
      filtered = this.filterBySpecificDate(transactions, specificDate);
    } else {
      filtered = this.filterByDateRange(transactions, selectedDateRange);
    }

    const uniqueCustomers = new Set(
      filtered
        .filter((t) => t.total > 0)
        .map((t) => this.getCustomerId(t))
        .filter(Boolean)
    );

    return uniqueCustomers.size;
  }

  getTop10Customers(
    transactions: WorkTeller[],
    selectedDateRange: string,
    specificDate?: string
  ): Array<{ name: string; value: number; customerId: string }> {
    if (!transactions.length) return [];

    let filtered: WorkTeller[];
    if (specificDate) {
      filtered = this.filterBySpecificDate(transactions, specificDate);
    } else {
      filtered = this.filterByDateRange(transactions, selectedDateRange);
    }

    const customerData: {
      [key: string]: {
        customerId: string;
        name: string;
        value: number;
      };
    } = {};

    filtered.forEach((t) => {
      const custId = t.workProfile?.email || 'unknown';
      const custName = t.workProfile?.name || 'Unknown';

      if (!customerData[custId]) {
        customerData[custId] = {
          customerId: custId,
          name: custName,
          value: 0,
        };
      }

      customerData[custId].name = custName;
      customerData[custId].value += t.total;
    });

    return Object.values(customerData)
      .filter((customer) => customer.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }

  getTransactionsByDayOfWeek(
    transactions: WorkTeller[],
    selectedDateRange: string,
    specificDate?: string
  ): { labels: string[]; counts: number[] } {
    if (!transactions.length) return { labels: [], counts: [] };

    let filtered: WorkTeller[];
    if (specificDate) {
      filtered = this.filterBySpecificDate(transactions, specificDate);
    } else {
      filtered = this.filterByDateRange(transactions, selectedDateRange);
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const counts = Array(7).fill(0);

    filtered.forEach((t) => {
      const d = new Date(t.date || t.createdAt);
      counts[d.getDay()]++;
    });

    return { labels: days, counts };
  }

  getTransactionsByTimeOfDay(
    transactions: WorkTeller[],
    selectedDateRange: string,
    specificDate?: string
  ): Array<{ name: string; value: number }> {
    if (!transactions.length) return [];

    let filtered: WorkTeller[];
    if (specificDate) {
      filtered = this.filterBySpecificDate(transactions, specificDate);
    } else {
      filtered = this.filterByDateRange(transactions, selectedDateRange);
    }

    const timeSlots = {
      Morning: 0,
      Afternoon: 0,
      Evening: 0,
    };

    filtered.forEach((t) => {
      const d = new Date(t.date || t.createdAt);
      const hour = d.getHours();

      if (hour >= 6 && hour < 12) {
        timeSlots.Morning++;
      } else if (hour >= 12 && hour < 18) {
        timeSlots.Afternoon++;
      } else {
        timeSlots.Evening++;
      }
    });

    return [
      { name: 'Morning', value: timeSlots.Morning },
      { name: 'Afternoon', value: timeSlots.Afternoon },
      { name: 'Evening', value: timeSlots.Evening },
    ].filter((slot) => slot.value > 0);
  }

  getBusiestDay(
    transactions: WorkTeller[],
    selectedDateRange: string,
    specificDate?: string
  ): string | null {
    if (!transactions.length) return null;

    const filtered = specificDate
      ? this.filterBySpecificDate(transactions, specificDate)
      : this.filterByDateRange(transactions, selectedDateRange);

    if (!filtered.length) return null;

    const dayCounts: number[] = Array(7).fill(0);
    filtered.forEach((t) => {
      const d = new Date(t.date || t.createdAt);
      dayCounts[d.getDay()]++;
    });

    const max = Math.max(...dayCounts);
    if (max === 0) return null;

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayCounts.indexOf(max)];
  }

  getBusiestMonth(
    transactions: WorkTeller[],
    selectedDateRange: string,
    specificDate?: string
  ): string | null {
    if (!transactions.length) return null;

    const filtered = specificDate
      ? this.filterBySpecificDate(transactions, specificDate)
      : this.filterByDateRange(transactions, selectedDateRange);

    if (!filtered.length) return null;

    const monthCounts: number[] = Array(12).fill(0);
    filtered.forEach((t) => {
      const d = new Date(t.date || t.createdAt);
      monthCounts[d.getMonth()]++;
    });

    const max = Math.max(...monthCounts);
    if (max === 0) return null;

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

  getBusiestHour(
    transactions: WorkTeller[],
    selectedDateRange: string,
    specificDate?: string
  ): string | null {
    if (!transactions.length) return null;

    const filtered = specificDate
      ? this.filterBySpecificDate(transactions, specificDate)
      : this.filterByDateRange(transactions, selectedDateRange);

    if (!filtered.length) return null;

    const hourCounts: number[] = Array(24).fill(0);
    filtered.forEach((t) => {
      const d = new Date(t.date || t.createdAt);
      hourCounts[d.getHours()]++;
    });

    const max = Math.max(...hourCounts);
    if (max === 0) return null;

    const hour = hourCounts.indexOf(max);
    return hour.toString().padStart(2, '0') + ':00';
  }

  getAverageOrderValue(
    transactions: WorkTeller[],
    selectedDateRange: string,
    specificDate?: string
  ): number {
    if (!transactions.length) return 0;

    let filtered: WorkTeller[];
    if (specificDate) {
      filtered = this.filterBySpecificDate(transactions, specificDate);
    } else {
      filtered = this.filterByDateRange(transactions, selectedDateRange);
    }

    if (filtered.length === 0) return 0;

    const totalRevenue = filtered.reduce((sum, t) => sum + t.total, 0);
    return totalRevenue / filtered.length;
  }

  getPaymentSuccessRate(
    transactions: WorkTeller[],
    selectedDateRange: string,
    specificDate?: string
  ): number {
    if (!transactions.length) return 0;

    let filtered: WorkTeller[];
    if (specificDate) {
      filtered = this.filterBySpecificDate(transactions, specificDate);
    } else {
      filtered = this.filterByDateRange(transactions, selectedDateRange);
    }

    if (filtered.length === 0) return 0;

    const successfulPayments = filtered.filter((t) => {
      const status = (t.paymentStatus || '').toLowerCase();
      return (
        status === 'fullypaid' ||
        status === 'paid' ||
        status === 'success' ||
        status === 'successful' ||
        status === 'completed'
      );
    }).length;

    return Math.round((successfulPayments / filtered.length) * 100);
  }

  getMostPopularPaymentMethod(
    transactions: WorkTeller[],
    selectedDateRange: string,
    specificDate?: string
  ): string {
    if (!transactions.length) return 'N/A';

    const filtered = specificDate
      ? this.filterBySpecificDate(transactions, specificDate)
      : this.filterByDateRange(transactions, selectedDateRange);

    if (!filtered.length) return 'N/A';

    const methodCounts: { [key: string]: number } = {};
    filtered.forEach((t) => {
      const method = t.paymentMethod || 'Unknown';
      methodCounts[method] = (methodCounts[method] || 0) + 1;
    });

    const entries = Object.entries(methodCounts);
    if (entries.length === 0) return 'N/A';

    return entries.reduce((a, b) => (a[1] > b[1] ? a : b))[0];
  }

  getCustomerRevenueSplit(
    transactions: WorkTeller[],
    selectedDateRange: string,
    specificDate?: string
  ): { firstTime: number; repeat: number } {
    if (!transactions.length) return { firstTime: 0, repeat: 0 };

    let filtered: WorkTeller[];
    if (specificDate) {
      filtered = this.filterBySpecificDate(transactions, specificDate);
    } else {
      filtered = this.filterByDateRange(transactions, selectedDateRange);
    }

    if (filtered.length === 0) return { firstTime: 0, repeat: 0 };

    const customerFirstTransaction: { [key: string]: Date } = {};
    transactions.forEach((t) => {
      const custId = this.getCustomerId(t);
      if (!custId) return;
      const txDate = new Date(t.date || t.createdAt);
      if (!customerFirstTransaction[custId] || txDate < customerFirstTransaction[custId]) {
        customerFirstTransaction[custId] = txDate;
      }
    });

    let firstTimeRevenue = 0;
    let repeatRevenue = 0;

    filtered.forEach((t) => {
      const custId = this.getCustomerId(t);
      if (!custId) return;
      const txDate = new Date(t.date || t.createdAt);
      const firstTxDate = customerFirstTransaction[custId];

      if (firstTxDate && txDate.getTime() === firstTxDate.getTime()) {
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

  getDiscountUtilizationRate(
    transactions: WorkTeller[],
    selectedDateRange: string,
    specificDate?: string
  ): number {
    if (!transactions.length) return 0;

    let filtered: WorkTeller[];
    if (specificDate) {
      filtered = this.filterBySpecificDate(transactions, specificDate);
    } else {
      filtered = this.filterByDateRange(transactions, selectedDateRange);
    }

    if (filtered.length === 0) return 0;

    const withDiscount = filtered.filter((t) => t.discount > 0).length;
    return Math.round((withDiscount / filtered.length) * 100);
  }

  getPeakRevenueHours(transactions: WorkTeller[], specificDate?: string): string {
    if (!transactions.length) return 'N/A';

    const filtered = specificDate
      ? this.filterBySpecificDate(transactions, specificDate)
      : transactions;

    if (!filtered.length) return 'N/A';

    const hourRevenue: number[] = Array(24).fill(0);
    filtered.forEach((t) => {
      const d = new Date(t.date || t.createdAt);
      hourRevenue[d.getHours()] += t.total;
    });

    const maxRevenue = Math.max(...hourRevenue);
    if (maxRevenue === 0) return 'N/A';

    const peakHour = hourRevenue.indexOf(maxRevenue);
    return peakHour.toString().padStart(2, '0') + ':00';
  }

  getRevenueByPaymentMethod(
    transactions: WorkTeller[],
    selectedDateRange: string,
    specificDate?: string
  ): Array<{ name: string; value: number }> {
    const filtered = specificDate
      ? this.filterBySpecificDate(transactions, specificDate)
      : this.filterByDateRange(transactions, selectedDateRange);

    if (!filtered.length) return [];

    const methodRevenue: { [key: string]: number } = {};
    filtered.forEach((t) => {
      const method = t.paymentMethod || 'Unknown';
      methodRevenue[method] = (methodRevenue[method] || 0) + t.total;
    });

    return Object.entries(methodRevenue)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0);
  }

  getRevenueByHour(
    transactions: WorkTeller[],
    selectedDateRange: string,
    specificDate?: string
  ): number[] {
    const filtered = specificDate
      ? this.filterBySpecificDate(transactions, specificDate)
      : this.filterByDateRange(transactions, selectedDateRange);

    const hourData: number[] = Array(24).fill(0);

    filtered.forEach((t) => {
      const d = new Date(t.date || t.createdAt);
      hourData[d.getHours()] += t.total;
    });

    return hourData;
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
    txns: WorkTeller[],
    specificDate?: string
  ): { labels: string[]; totals: number[]; lastActualDate: Date | null } {
    const now = new Date();
    let labels: string[] = [];
    let totals: number[] = [];
    let lastActualDate: Date | null = null;

    if (specificDate) {
      const targetDate = new Date(specificDate);
      labels = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');
      totals = Array(24).fill(0);

      txns.forEach((t) => {
        const d = new Date(t.createdAt);
        if (
          d.getDate() === targetDate.getDate() &&
          d.getMonth() === targetDate.getMonth() &&
          d.getFullYear() === targetDate.getFullYear()
        ) {
          totals[d.getHours()] += t.total;
        }
      });

      return { labels, totals, lastActualDate: targetDate };
    }

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
      const monday = this.getMonday(now);
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
    txns: WorkTeller[],
    specificDate?: string
  ): { labels: string[]; counts: number[] } {
    if (specificDate) {
      const targetDate = new Date(specificDate);
      const labels = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');
      const counts = Array(24).fill(0);

      txns.forEach((t) => {
        const d = new Date(t.createdAt);
        if (
          d.getDate() === targetDate.getDate() &&
          d.getMonth() === targetDate.getMonth() &&
          d.getFullYear() === targetDate.getFullYear()
        ) {
          counts[d.getHours()]++;
        }
      });

      return { labels, counts };
    }

    const now = new Date();

    if (range === 'today' || range === 'yesterday') {
      const labels = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');
      const counts = Array(24).fill(0);
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
          counts[d.getHours()]++;
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

      const labels = days.map((d) =>
        d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      );
      const counts = days.map((d) => {
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

      const labels = days.map((d) =>
        d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      );
      const counts = days.map((d) => {
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

      const labels = days.map((d) =>
        d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      );
      const counts = days.map((d) => {
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

      const labels = weeks.map(
        ({ start, end }) =>
          `${start.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
      );

      const counts = weeks.map(
        ({ start, end }) =>
          txns.filter((t) => {
            const td = new Date(t.date || t.createdAt);
            return td >= start && td <= end;
          }).length
      );

      return { labels, counts };
    }

    if (range === 'thisWeek' || range === 'lastWeek') {
      const monday = this.getMonday(now);
      if (range === 'lastWeek') {
        monday.setDate(monday.getDate() - 7);
      }

      const labels = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
      });

      const counts = Array(7).fill(0);
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
            counts[i]++;
          }
        }
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
      const labels = [];
      const counts = [];

      for (let m = 0; m < 3; m++) {
        const monthIndex = startMonth + m;
        const monthTxns = txns.filter((t) => {
          const d = new Date(t.date || t.createdAt);
          return d.getFullYear() === qYear && d.getMonth() === monthIndex;
        });

        labels.push(
          new Date(qYear, monthIndex).toLocaleString(undefined, { month: 'short', year: 'numeric' })
        );
        counts.push(monthTxns.length);
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

      const labels = days.map((d) =>
        d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      );
      const counts = days.map((d) => {
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

    if (range === 'thisYear' || range === 'lastYear') {
      let y = range === 'thisYear' ? now.getFullYear() : now.getFullYear() - 1;
      const labels = [];
      const counts = [];

      for (let m = 0; m < 12; m++) {
        const monthTxns = txns.filter((t) => {
          const d = new Date(t.date || t.createdAt);
          return d.getFullYear() === y && d.getMonth() === m;
        });

        labels.push(new Date(y, m).toLocaleString(undefined, { month: 'short', year: 'numeric' }));
        counts.push(monthTxns.length);
      }

      return { labels, counts };
    }

    if (range === 'allTime') {
      const years = txns.map((t) => new Date(t.date || t.createdAt).getFullYear());
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);

      const labels = [];
      const counts = [];

      for (let y = minYear; y <= maxYear; y++) {
        for (let m = 0; m < 12; m++) {
          const monthTxns = txns.filter((t) => {
            const d = new Date(t.date || t.createdAt);
            return d.getFullYear() === y && d.getMonth() === m;
          });

          if (monthTxns.length > 0) {
            labels.push(
              new Date(y, m).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
            );
            counts.push(monthTxns.length);
          }
        }
      }

      return { labels, counts };
    }

    const { labels } = this.prepareChartSeries(range, txns);
    const { periodStart, periodEnd } = this.getDateRangeBounds(range);
    const filtered = txns.filter((t) => {
      const d = new Date(t.date || t.createdAt);
      return d >= periodStart && d <= periodEnd;
    });

    const counts = Array(labels.length)
      .fill(0)
      .map(() => Math.floor(filtered.length / labels.length));

    return { labels, counts };
  }
}
