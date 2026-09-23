// Calendar event entity type definition for Prisma
export interface CalendarEvent {
  id: number;
  organizationId: number;
  userId: number;
  calendarId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  description?: string;
  status: string;
  taskId?: number;
  externalId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarSync {
  id: number;
  organizationId: number;
  userId: number;
  provider: string;
  calendarId: string;
  syncToken?: string;
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}