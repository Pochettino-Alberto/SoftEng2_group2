export const ReportStatus = {
  PENDING_APPROVAL: "Pending Approval",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  SUSPENDED: "Suspended",
  REJECTED: "Rejected",
  RESOLVED: "Resolved"
} as const;

export type ReportStatus = typeof ReportStatus[keyof typeof ReportStatus];

/*export const ReportCategory = {
  WATER_SUPPLY: "Water Supply – Drinking Water",
  ARCHITECTURAL_BARRIERS: "Architectural Barriers",
  SEWER_SYSTEM: "Sewer System",
  PUBLIC_LIGHTING: "Public Lighting",
  WASTE: "Waste",
  ROAD_SIGNS: "Road Signs and Traffic Lights",
  ROADS_URBAN: "Roads and Urban Furnishings",
  GREEN_AREAS: "Public Green Areas and Playgrounds",
  OTHER: "Other"
} as const;*/

export interface ReportCategory {
  id: number;
  name: string;
  icon: string;
  description: string;
};

//export type ReportCategory = typeof ReportCategory[keyof typeof ReportCategory];

export interface Location {
  lat: number;
  lng: number;
}

export interface Report {
  id: number;
  title: string;
  description: string;
  category: ReportCategory;
  category_id: number;
  location: Location;
  status: ReportStatus;
  status_reason?: string;
  anonymous: boolean;
  photos: string[];
  reporter?: string;
  createdAt?: string;
  updatedAt?: string;
  assigned_to?: string;
}

export interface CreateReportData {
  title: string;
  description: string;
  //category: ReportCategory;
  categoryId: number;
  latitude: number;
  longitude: number;
  is_public: boolean;
  photos?: File[];
}
