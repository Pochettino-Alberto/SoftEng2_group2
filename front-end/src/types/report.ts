import type {User} from "./user";

export interface ReportPhoto {
  id: number;
  report_id: number;
  position: number;
  photo_path: string;
  photo_public_url: string;
}

export const ReportStatus = {
  PENDING_APPROVAL: "Pending Approval",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  SUSPENDED: "Suspended",
  REJECTED: "Rejected",
  RESOLVED: "Resolved"
} as const;

export type ReportStatus = typeof ReportStatus[keyof typeof ReportStatus];

export interface ReportCategory {
  id: number;
  name: string;
  icon: string;
  description: string;
}

export interface Location {
  lat: number;
  lng: number;
}

export interface Report {
  id: number;
  title: string;
  description?: string;

  category_id: number;
  category: ReportCategory;

  reporter_id?: number | null;
  reporter?: User;

  assigned_from_id?: number | null;
  assigned_from?: User;

  maintainer_id?: number | null;
  maintainer?: User;

  updated_by?: number | null;
  updated?: User;

  is_public: boolean;

  latitude: number;
  longitude: number;

  status: ReportStatus;
  status_reason?: string;

  photos: ReportPhoto[];

  createdAt: string;
  updatedAt: string;
  assigned_to?: string;
}

export interface CreateReportData {
  title: string;
  description: string;
  categoryId: number;
  latitude: number;
  longitude: number;
  is_public: boolean;
  photos?: File[];
}
