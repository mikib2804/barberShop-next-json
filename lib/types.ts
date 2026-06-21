export type AppointmentStatus = 'planned' | 'arrived' | 'cancelled';

export interface Customer {
  id: string;
  name: string;
  phone: string;
}

export interface Appointment {
  id: string;
  customerId: string;
  date: string;
  time: string;
  status: AppointmentStatus;
}

export interface AppointmentWithCustomer extends Appointment {
  customer: Customer;
}

export interface BusinessSettings {
  workingHoursStart: string;
  workingHoursEnd: string;
  activeDays: number[];
  blockedDates: string[];
  blockedHours: Array<{ date: string; time: string }>;
  slotMinutes: number;
}

export interface JsonDb {
  customers: Customer[];
  appointments: Appointment[];
  settings: BusinessSettings;
}

