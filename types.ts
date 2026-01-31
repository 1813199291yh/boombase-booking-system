
export enum ScreenType {
  LANDING = 'LANDING',
  CHECKOUT = 'CHECKOUT',
  WAIVER = 'WAIVER',
  CONFIRMATION = 'CONFIRMATION',
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  ADMIN_SCHEDULE = 'ADMIN_SCHEDULE',
  ADMIN_PAYOUTS = 'ADMIN_PAYOUTS'
}

export type CourtType = 'Full Court' | 'Half Court';

export interface Booking {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  courtType: CourtType;
  date: string;
  time: string;
  status: 'Pending Approval' | 'Confirmed' | 'Declined' | 'Refunded' | 'Cancelled';
  price: number;
  waiverSigned: boolean;
  waiverName?: string;
  waiverSignature?: string;
  timestamp: number;
}
