export type AppointmentStatus = "planned" | "arrived" | "cancelled";

export interface Slot {
  time: string;
  available: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export interface StoredAppointment {
  id: string;
  customerId: string;
  date: string;
  time: string;
  status: AppointmentStatus;
}

export interface Appointment extends StoredAppointment {
  customer: Customer;
}

export type AppointmentWithCustomer = Appointment;

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
  appointments: StoredAppointment[];
  settings: BusinessSettings;
}
