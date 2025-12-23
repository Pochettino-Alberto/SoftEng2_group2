import { Report, ReportCategory, ReportComment, ReportStatusType } from "../components/report"
import { PaginatedResult } from "../components/common";
import ReportDAO from "../dao/reportDAO"
import { User } from "../components/user";

/**
 * Represents a controller for managing users.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class ReportController {
    private dao: ReportDAO

    constructor() {
        this.dao = new ReportDAO
    }


    async saveReport(report: Report): Promise<Report> {
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

    /**
     * Fetch all comments for a specific report
     * @param reportId - The ID of the report
     * @returns Promise resolving with an array of ReportComment
     */
    async getCommentsByReportId(reportId: number): Promise<ReportComment[]> {
        try {
            // Check if report exists (throws ReportNotFoundError if not found)
            await this.getReportById(reportId);
            return await this.dao.getCommentsByReportId(reportId);
        } catch (error) {
            console.error("Error fetching report comments:", error);
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

            return pagReports;
        } catch (err) {
            throw err;
        }
    }

    async getMapReports(
        status: Array<String> | null,
    ): Promise<Report[]> {
        try {
            const reports = await this.dao.getMapReports(status);
            return reports;
        } catch (err) {
            throw err;
        }
    }

    /**
     * This controller function calls the reportDAO function in charge of getting all the reports with status
     * "Assigned" and with a specific "assigned_from_id" (which correspons to the technical officer's id) 
     * @param assigned_to
     * @returns Array of reports 
     */
    async getReportsAssignedToTechOfficer(assigned_to: number): Promise<Report[]> {
        try {
            return await this.dao.getReportsAssignedToTechOfficer(assigned_to);
        } catch (error) {
            console.error(`Error fetching reports assigned to technical officer ${assigned_to}:`, error);
            throw error;
        }
    }

    /**
     * This controller function calls the reportDAO function in charge of getting all the reports with status
     * "In Progress" or "Suspended" and with a specific "maintainer_id"
     * @param maintainer_id
     * @returns Array of reports 
     */
    async getReportsAssignedToMaintainer(maintainer_id: number): Promise<Report[]> {
        try {
            return await this.dao.getReportsAssignedToMaintainer(maintainer_id);
        } catch (error) {
            console.error(`Error fetching reports assigned to maintainer ${maintainer_id}:`, error);
            throw error;
        }
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

    async getAllMaintainers(): Promise<User[]> {
        try {
            return await this.dao.getAllMaintainers();
        } catch (error) {
            console.error("Error fetching maintainers:", error);
            throw error;
        }
    }

    /**
     * Assigns a report to a specific user, records who performed the assignment,
     * and sets status to 'Assigned'.
     * @param reportId - The ID of the report.
     * @param assignedToId - The ID of the technician to assign the report to.
     * @param assignedFromId - The ID of the municipal officer performing the assignment.
     * @returns A Promise that resolves to the updated Report object.
     */
    async assignReportToUser(reportId: number, assignedToId: number, assignedFromId: number): Promise<Report> {
        try {
            await this.dao.assignReportToUser(reportId, assignedToId, assignedFromId);
            // Return the updated report so the frontend can update its state
            return await this.dao.getReportById(reportId);
        } catch (error) {
            console.error(`Error assigning report ${reportId}:`, error);
            throw error;
        }
    }

    /**
     * Assigns a report to an external maintainer.
     * @param reportId - The ID of the report.
     * @param maintainerId - The ID of the maintainer user.
     * @param techOfficerId - The ID of the technical officer (used for updated_by).
     * @returns A Promise that resolves to the updated Report object.
     */
    async assignReportToMaintainer(reportId: number, maintainerId: number, techOfficerId: number): Promise<Report> {
        try {
            await this.dao.assignReportToMaintainer(reportId, maintainerId, techOfficerId);
            return await this.dao.getReportById(reportId);
        } catch (error) {
            console.error(`Error assigning report ${reportId} to maintainer ${maintainerId}:`, error);
            throw error;
        }
    }

    /**
     * Adds a comment to a report.
     * @param reportComment - The ReportComment object containing comment details.
     * @returns A Promise that resolves to the added ReportComment object.
     */
    async addCommentToReport(reportComment: ReportComment): Promise<ReportComment> {
        try {
            return await this.dao.addCommentToReport(reportComment);
        } catch (error) {
            console.error(`Error adding comment to report ${reportComment.report_id}:`, error);
            throw error;
        }
    }
    
    /**
     * Edit a comment to a report.
     * @param reportComment - The ReportComment object containing comment details.
     * @returns A Promise that resolves to the edited ReportComment object.
     */
    async editCommentToReport(reportComment: ReportComment): Promise<ReportComment> {
        try {
            return await this.dao.editCommentToReport(reportComment);
        } catch (error) {
            console.error(`Error editing comment ${reportComment.id} to report ${reportComment.report_id}:`, error);
            throw error;
        }
    }

}

export default ReportController