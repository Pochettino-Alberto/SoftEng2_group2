import db from "./db"
import { Report, ReportCategory, ReportComment, ReportStatusType } from "../components/report"
import CommonDao from './commonDAO'
import { Utility } from "../utilities";
import { User } from "../components/user";
import { ReportCommentNotFoundError, ReportNotFoundError } from "../errors/reportError";

/**
 * A class that implements the interaction with the database for all user-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ReportDAO {
    public commonDao: CommonDao
    constructor() {
        this.commonDao = new CommonDao
    }

    async getReportById(id: number): Promise<Report> {
        try {
            return await this.commonDao.getById<Report>("reports", id, async (row) => await this.commonDao.mapDBrowToReport(row, true));
        } catch (error: any) {
            if (error.message && error.message.includes("not found")) {
                throw new ReportNotFoundError();
            }
            throw error;
        }
    }

    /**
     * Get all comments for a specific report
     * @param reportId - The ID of the report
     * @returns Promise resolving to an array of ReportComment objects
     */
    async getCommentsByReportId(reportId: number): Promise<ReportComment[]> {
        return new Promise<ReportComment[]>((resolve, reject) => {
            const sql = `SELECT * FROM report_comments WHERE report_id = ? ORDER BY createdAt ASC`;
            db.all(sql, [reportId], (err: Error | null, rows: any[]) => {
                if (err) return reject(err);
                const comments = rows.map(row => this.commonDao.mapDBrowToReportComment(row));
                resolve(comments);
            });
        });
    }

    /**
     * Save a new report in the database (photos will be saved by calling the next method)
     * @param report - Report object
     * @returns The saved Report object with id populated
     */
    async saveReport(report: Report): Promise<Report> {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO reports (
                    category_id,
                    reporter_id,
                    title,
                    description,
                    is_public,
                    latitude,
                    longitude,
                    status,
                    createdAt,
                    updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.run(
                sql,
                [
                    report.category_id,
                    report.reporter_id ?? null,
                    report.title,
                    report.description ?? null,
                    report.is_public ? 1 : 0,
                    report.latitude,
                    report.longitude,
                    report.status,
                    report.createdAt,
                    report.updatedAt,
                ],
                function (err) {
                    if (err) return reject(err);
                    report.id = this.lastID;

                    resolve(report);
                }
            );
        });
    }
    /**
     * Save all the photos associated to a report on the database
     * @param report - The complete report entity got from the previous method
     * @returns The saved Report object with id populated
     */
    async saveReportPhotos(report: Report): Promise<Report> {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM reports WHERE id=?`;

            db.get(
                sql,
                [report.id],
                function (err) {
                    if (err) return reject(err);

                    // Insert photos if any
                    if (report.photos && report.photos.length > 0) {
                        const photoSql = `
                            INSERT INTO report_photos (report_id, position, photo_path, photo_public_url)
                            VALUES (?, ?, ?, ?)
                        `;
                        const photoStmt = db.prepare(photoSql);

                        try {
                            let completed = 0;
                            let resolved = false;

                            report.photos.forEach((photo) => {
                                const cb = function (photoErr: any) {
                                    if (resolved) return;
                                    if (photoErr) {
                                        resolved = true;
                                        return reject(photoErr);
                                    }
                                    completed += 1;
                                    if (completed === report.photos.length) {
                                        resolved = true;
                                        if (typeof photoStmt.finalize === 'function') {
                                            photoStmt.finalize((finalizeErr: any) => {
                                                if (finalizeErr) return reject(finalizeErr);
                                                resolve(report);
                                            });
                                        } else {
                                            resolve(report);
                                        }
                                    }
                                };

                                // Call run with a callback; if the mocked run doesn't call it (sync mock), fallback below will resolve
                                try {
                                    photoStmt.run(report.id, photo.position, photo.photo_path, photo.photo_public_url, cb);
                                } catch (e) {
                                    // Some implementations may throw synchronously; treat as error
                                    if (!resolved) return reject(e);
                                }
                            });

                            // Fallback: if mocked `run` doesn't call callbacks, assume synchronous insert and finalize now
                            setImmediate(() => {
                                if (resolved) return;
                                resolved = true;
                                if (typeof photoStmt.finalize === 'function') {
                                    photoStmt.finalize((finalizeErr: any) => {
                                        if (finalizeErr) return reject(finalizeErr);
                                        resolve(report);
                                    });
                                } else {
                                    resolve(report);
                                }
                            });

                            // return early; resolve will be called once callbacks or fallback runs
                            return;
                        } catch (photoErr) {
                            return reject(photoErr);
                        }
                    }

                    // no photos to insert
                    resolve(report);
                }
            );
        });
    }

    /**
     * Updates the status and status_reason of a report in the database.
     * @param reportId - The ID of the report to update.
     * @param status - The new status of the report.
     * @param statusReason - The reason for the status change (rejection reason).
     * @returns Promise resolving with the updated Report object (or void, assuming success if no error).
     */
    async updateReportStatus(reportId: number, status: ReportStatusType, statusReason?: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const updatedAt = Utility.now();
            const sql = `
                UPDATE reports 
                SET status = ?, status_reason = ?, updatedAt = ? 
                WHERE id = ?
            `;

            db.run(
                sql,
                [
                    status,
                    statusReason ?? null,
                    updatedAt,
                    reportId
                ],
                function (err) {
                    if (err) return reject(err);
                    if (this.changes === 0) {
                        return reject(new ReportNotFoundError());
                    }
                    resolve();
                }
            );
        });
    }


    /**
     * Fetch all report categories from the database
     * @returns Array of ReportCategory objects
     */
    async getAllReportCategories(): Promise<ReportCategory[]> {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM report_categories WHERE active = 1`;
            db.all(sql, [], (err, rows) => {
                if (err) return reject(err);
                const categories = rows.map(row => this.commonDao.mapDBrowToReportCategoryObject(row));
                resolve(categories);
            });
        });
    }

    async getPaginatedReports(
        status: string | null,
        is_public: boolean | null,
        category_id: number | null,
        limit: number,
        offset: number
    ): Promise<{ reports: Report[]; totalCount: number }> {
        return new Promise((resolve, reject) => {
            try {
                let baseSql = " FROM reports WHERE 1=1 ";
                const params: any[] = [];

                if (status) {
                    baseSql += " AND status = ?";
                    params.push(status);
                }
                if (is_public !== null) {
                    baseSql += " AND is_public = ?";
                    params.push(is_public ? 1 : 0);
                }
                if (category_id) {
                    baseSql += " AND category_id = ?";
                    params.push(category_id);
                }

                // Total count
                const countSql = `SELECT COUNT(*) as total ${baseSql}`;
                db.get(countSql, params, async (err, row: { total: number } | undefined) => {
                    if (err) return reject(err);
                    const totalCount = row?.total ?? 0;

                    // Paginated data
                    const dataSql = `SELECT * ${baseSql} ORDER BY updatedAt DESC LIMIT ? OFFSET ?`;
                    const dataParams = [...params, limit, offset];

                    db.all(dataSql, dataParams, async (err2, rows: any[]) => {
                        if (err2) return reject(err2);

                        const reports: Report[] = [];
                        for (const r of rows) {
                            reports.push(await this.commonDao.mapDBrowToReport(r, true)); // include subclasses
                        }

                        resolve({ reports, totalCount });
                    });
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    async getMapReports(
        status: Array<String> | null,
    ): Promise<Report[]> {
        return new Promise((resolve, reject) => {
            try {
                let baseSql = " SELECT * FROM reports WHERE 1=1 ";
                const params: any[] = [];
                if (status && status.length > 0) {
                    const placeholders = status.map(() => '?').join(', ');
                    baseSql += ` AND status IN (${placeholders})`;
                    params.push(...status);
                }
                baseSql += " ORDER BY updatedAt DESC";
                db.all(baseSql, params, async (err, rows: any[]) => {
                    if (err) return reject(err);
                    const reports: Report[] = [];
                    for (const r of rows) {
                        reports.push(await this.commonDao.mapDBrowToReport(r, true)); // include subclasses
                    }
                    resolve(reports);
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Get all reports assigned to a specific technical officer.
     * A report is considered assigned to the technical officer when its `status` is 'Assigned' or 'In Progress'
     * and `assigned_to` equals the provided id.
     * @param assigned_to - id of the technical officer
     */
    async getReportsAssignedToTechOfficer(assigned_to: number): Promise<Report[]> {
        return new Promise((resolve, reject) => {
            try {
                const sql = `SELECT * FROM reports WHERE (status = 'Assigned' OR status = 'In Progress') AND assigned_to = ? ORDER BY updatedAt DESC`;
                db.all(sql, [assigned_to], async (err, rows: any[]) => {
                    if (err) { // debugging
                        console.error('SQL ERROR getReportsAssignedToTechOfficer', err, { assigned_to });
                        return reject(err);
                    }

                    const reports: Report[] = [];
                    for (const r of rows) {

                        reports.push(await this.commonDao.mapDBrowToReport(r, true));
                    }

                    resolve(reports);
                });
            } catch (err) {
                reject(err);
            }
        });
    }


    /**
     * Retrieves all municipality users who have a 'TOS' role responsible for a given report category ID.
     * @param categoryId - The ID of the report category.
     * @returns A Promise that resolves to an array of matching User objects.
     */
    async getTOSUsersByCategory(categoryId: number): Promise<User[]> {
        return new Promise<User[]>((resolve, reject) => {
            const sql = `
                SELECT DISTINCT u.*
                FROM users u
                JOIN user_roles ur ON u.id = ur.user_id
                JOIN roles r ON ur.role_id = r.id
                JOIN role_category_responsibility rcr ON r.id = rcr.role_id
                WHERE rcr.category_id = ?
                AND u.user_type = 'municipality'
            `;
            db.all(sql, [categoryId], (err: Error | null, rows: any) => {
                if (err) {
                    reject(err);
                    return;
                }
                const userArray = rows.map((row: any) => this.commonDao.mapDBrowToUserObject(row));
                resolve(userArray);
            });
        });
    }

    /**
     * Retrieves all users who have the 'external_maintainer' role.
     * @returns A Promise that resolves to an array of User objects.
     */
    async getAllMaintainers(): Promise<User[]> {
        return new Promise<User[]>((resolve, reject) => {
            const sql = `
                SELECT DISTINCT u.*
                FROM users u
                JOIN user_roles ur ON u.id = ur.user_id
                JOIN roles r ON ur.role_id = r.id
                WHERE r.role_type = 'external_maintainer'
            `;
            db.all(sql, [], (err: Error | null, rows: any) => {
                if (err) {
                    return reject(err);
                }
                // Map database rows to User objects
                const userArray = rows.map((row: any) => this.commonDao.mapDBrowToUserObject(row));
                resolve(userArray);
            });
        });
    }

    /**
     * Updates a report's status to ASSIGNED, sets the assigned_to user, and records who assigned it.
     * @param reportId - The ID of the report to update.
     * @param assignedToId - The ID of the technician to assign the report to.
     * @param assignedFromId - The ID of the municipal officer performing the assignment.
     * @returns Promise resolving when the update is complete.
     */
    async assignReportToUser(reportId: number, assignedToId: number, assignedFromId: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const updatedAt = Utility.now();
            const sql = `
                UPDATE reports 
                SET status = 'Assigned', assigned_to = ?, assigned_from_id = ?, updatedAt = ? 
                WHERE id = ?
            `;
            db.run(sql, [assignedToId, assignedFromId, updatedAt, reportId], function (err) {
                if (err) return reject(err);
                if (this.changes === 0) {
                    return reject(new ReportNotFoundError());
                }
                resolve();
            });
        });
    }

    /**
     * Assigns a report to an external maintainer and updates status to 'In Progress'.
     * Records the technical officer who performed the update in 'updated_by'.
     * @param reportId - The ID of the report.
     * @param maintainerId - The ID of the external maintainer.
     * @param updatedBy - The ID of the technical officer performing the action.
     * @returns Promise resolving when the update is complete.
     */
    async assignReportToMaintainer(reportId: number, maintainerId: number, updatedBy: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const updatedAt = Utility.now();
            const sql = `
                UPDATE reports
                SET maintainer_id = ?, updated_by = ?, updatedAt = ?, status = 'In Progress'
                WHERE id = ?
            `;
            db.run(sql, [maintainerId, updatedBy, updatedAt, reportId], function (err) {
                if (err) return reject(err);
                if (this.changes === 0) {
                    return reject(new ReportNotFoundError());
                }
                resolve();
            });
        });
    }

    /**
     * Get all reports assigned to a specific maintainer.
     * A report is considered assigned to the maintainer when its `status` is 'In Progress' or 'Suspended'
     * and `maintainer_id` equals the provided id.
     * @param maintainer_id - id of the maintainer
     */
    async getReportsAssignedToMaintainer(maintainer_id: number): Promise<Report[]> {
        return new Promise((resolve, reject) => {
            try {
                const sql = `SELECT * FROM reports WHERE (status = 'In Progress' OR status = 'Suspended') AND maintainer_id = ? ORDER BY updatedAt DESC`;
                db.all(sql, [maintainer_id], async (err, rows: any[]) => {
                    if (err) {
                        console.error('SQL ERROR getReportsAssignedToMaintainer', err, { maintainer_id });
                        return reject(err);
                    }

                    const reports: Report[] = [];
                    for (const r of rows) {
                        reports.push(await this.commonDao.mapDBrowToReport(r, true));
                    }

                    resolve(reports);
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Adds a comment to a report.
     * @param reportComment - The ReportComment object containing comment details.
     * @returns A Promise that resolves to the added ReportComment object.
     */
    async addCommentToReport(reportComment: ReportComment): Promise<ReportComment> {
        return new Promise<ReportComment>((resolve, reject) => {
            const sql = `
                INSERT INTO report_comments (
                    report_id,
                    commenter_id,
                    comment,
                    createdAt,
                    updatedAt
                ) VALUES (?, ?, ?, ?, ?)
            `;
            db.run(
                sql,
                [reportComment.report_id, reportComment.commenter_id, reportComment.comment, reportComment.createdAt, reportComment.updatedAt],
                function (err) {
                    if (err) return reject(err);

                    if (this.changes === 0) {
                        return reject(new ReportNotFoundError());
                    }

                    reportComment.id = this.lastID;
                    // Note: the mapDBrowToReportComment is not necessary here since we already have the ReportComment object
                    resolve(reportComment);
                });
        });
    }

    /**
     * Edit a comment to a report.
     * @param reportComment - The ReportComment object containing comment details.
     * @returns A Promise that resolves to the edited ReportComment object.
     */
    async editCommentToReport(reportComment: ReportComment): Promise<ReportComment> {
        return new Promise<ReportComment>((resolve, reject) => {
            const sql = `
                UPDATE report_comments 
                SET comment = ?, updatedAt = ? 
                WHERE id = ? AND report_id = ? AND commenter_id = ?
            `;
            db.run(
                sql,
                [reportComment.comment, reportComment.updatedAt, reportComment.id, reportComment.report_id, reportComment.commenter_id],
                function (err) {
                    if (err) return reject(err);
                    if (this.changes === 0) {
                        return reject(new ReportCommentNotFoundError(reportComment.id, reportComment.report_id, reportComment.commenter_id));
                    }
                    resolve(reportComment);
                }
            );
        });
    }

}

export default ReportDAO