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
  customerId?: number | null;
  organizationId?: number;
  workspaceId?: number | null;
  workTellerStage?: string | null;
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
}
