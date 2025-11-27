import { Report, ReportCategory, ReportStatusType } from "../components/report"
import { PaginatedResult } from "../components/common";
import ReportDAO from "../dao/reportDAO"
import {User} from "../components/user";

/**
 * Represents a controller for managing users.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class ReportController {
    private dao: ReportDAO

    constructor() {
        this.dao = new ReportDAO
    }


    async saveReport(report: Report): Promise<Report>  {
        try {
            return await this.dao.saveReport(report);
        } catch (error) {
            console.error("Error saving report:", error);
            throw error;
        }
    }

    async saveReportPhotos(report: Report): Promise<Report> {
        try {
            return await this.dao.saveReportPhotos(report);
        } catch (error) {
            console.error("Error saving report photos:", error);
            throw error;
        }
    }

    /**
     * Fetch all report categories
     * @returns Promise resolving with an array of ReportCategory
     */
    async getReportCategories(): Promise<ReportCategory[]> {
        try {
            return await this.dao.getAllReportCategories();
        } catch (error) {
            console.error("Error fetching report categories:", error);
            throw error;
        }
    }

    async getReportById(reportId: number): Promise<Report> {
        try {
            return await this.dao.getReportById(reportId);
        } catch (error) {
            console.error("Error fetching report:", error);
            throw error;
        }
    }

    async updateReportStatus(reportId: number, status: ReportStatusType, statusReason?: string): Promise<void> {
        try {
            return await this.dao.updateReportStatus(reportId, status, statusReason);
        } catch (error) {
            console.error(`Error updating status for report ${reportId}:`, error);
            throw error;
        }
    }


    async searchReports(
        page_num: number | null,
        page_size: number | null,
        status: string | null,
        is_public: boolean | null,
        category_id: number | null
    ): Promise<PaginatedResult<Report>> {
        return new Promise<PaginatedResult<Report>>(async (resolve, reject) => {
            try {
                const page = page_num ? Number(page_num) : 1;
                const size = page_size ? Number(page_size) : 10;
                const offset = (page - 1) * size;

                const { reports, totalCount } = await this.dao.getPaginatedReports(
                    status,
                    is_public,
                    category_id,
                    size,
                    offset
                );

                const pagReports = new PaginatedResult<Report>(page, size, totalCount, reports);

                resolve(pagReports);
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Returns all municipality users whose roles are responsible for a given category ID.
     * @param categoryId - The ID of the report category.
     * @returns A Promise that resolves to an array of relevant TOS users.
     */
    async getTOSUsersByCategory(categoryId: number): Promise<User[]> {
        try {
            return await this.dao.getTOSUsersByCategory(categoryId);
        } catch (error) {
            console.error(`Error fetching TOS users for category ${categoryId}:`, error);
            throw error;
        }
    }

    /**
     * Assigns a report to a specific user and sets status to 'Assigned'.
     * @param reportId - The ID of the report.
     * @param assignedToId - The ID of the technician to assign the report to.
     * @returns A Promise that resolves to the updated Report object.
     */
    async assignReportToUser(reportId: number, assignedToId: number): Promise<Report> {
        try {
            await this.dao.assignReportToUser(reportId, assignedToId);
            // Return the updated report so the frontend can update its state
            return await this.dao.getReportById(reportId);
        } catch (error) {
            console.error(`Error assigning report ${reportId}:`, error);
            throw error;
        }
    }

}

export default ReportController