
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
  description: string;
  is_public: boolean;
  category: ReportCategory; // [used for GET reports] Contains the full category object
  category_id: number;  // [used for UPLOAD a report] can be evaluated to category name by a separate API call
  location: Location;

  reporter_id?: number;
  assigned_to?: number;
  assigned_from?: number;
  maintainer?: number;
  updated_by?: number;

  updatedAt: string;
  createdAt: string;

  status: ReportStatus;
  status_reason?: string;

  photos: ReportPhoto[];
}