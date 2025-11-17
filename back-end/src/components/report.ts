import { Utility } from '../utilities';
import { User } from './user'

export const ReportStatus = {
    PENDING_APPROVAL: "Pending Approval",
    ASSIGNED: "Assigned",
    IN_PROGRESS: "In Progress",
    SUSPENDED: "Suspended",
    REJECTED: "Rejected",
    RESOLVED: "Resolved"
} as const;

export type ReportStatusType = typeof ReportStatus[keyof typeof ReportStatus];

/**
 * Represents a category for a report.
 */
class ReportCategory {
    id: number;
    name: string;
    icon: string;
    description?: string;

    constructor(
        id: number = 0,
        name: string,
        icon: string,
        description?: string
    ) {
        this.id = id;
        this.name = name;
        this.icon = icon;
        this.description = description;
    }
}

/**
 * Represents a photo attached to a report.
 */
class ReportPhoto {
    id: number;
    report_id: number;
    photo_id: string;
    position: number;
    photo_url: string;

    constructor(
        id: number = 0,
        report_id: number,
        photo_id: string,
        position: number,
        photo_url: string = ""
    ) {
        this.id = id;
        this.report_id = report_id;
        this.photo_id = photo_id;
        this.position = position;
        this.photo_url = photo_url; // evaluated from photo_id
    }
}

/**
 * Represents a user-submitted report.
 */
class Report {
    id: number;
    
    category_id: number;
    category: ReportCategory; // evaluated by category_id

    reporter_id?: number;
    reporter?: User;          // evaluated by reporter_id

    updated_by?: number;
    updated?: User;           // evaluated by updated_by

    title: string;
    description?: string;

    is_public: boolean;
    latitude: number;
    longitude: number;

    status: ReportStatusType;
    status_reason?: string;

    createdAt: string;
    updatedAt: string;

    photos_id: number[];
    photos: ReportPhoto[];

    /**
     * Creates a new Report instance.
     * @param category - Either a ReportCategory object or category ID
     * @param reporter - Optional User object for reporter
     * @param updated - Optional User object for updater
     */
    constructor(
        id: number = 0,
        category_id: number,
        title: string,
        latitude: number,
        longitude: number,
        status: ReportStatusType,
        is_public: boolean = false,
        reporter_id?: number,
        updated_by?: number,
        description?: string,
        status_reason?: string,
        createdAt?: string,
        updatedAt?: string,
        photos_id: number[] = []
    ) {
        this.id = id;

        // Assign category object if passed, or create a minimal object from ID
        this.category_id = category_id;

        this.reporter_id = reporter_id;
        this.updated_by = updated_by;

        this.title = title;
        this.description = description;

        this.is_public = is_public;
        this.latitude = latitude;
        this.longitude = longitude;

        this.status = status;
        this.status_reason = status_reason;

        this.createdAt = createdAt ?? Utility.now();
        this.updatedAt = updatedAt ?? Utility.now();

        this.photos_id = photos_id;
    }
}

export { Report, ReportPhoto, ReportCategory };
