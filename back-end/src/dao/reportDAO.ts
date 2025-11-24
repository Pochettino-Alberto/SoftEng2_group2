import db from "./db"
import { Report, ReportPhoto, ReportStatus, ReportCategory } from "../components/report"
import { PaginatedResult } from "../components/common";
import CommonDao from './commonDAO'
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
        return await this.commonDao.getById<Report>("reports", id, async (row) => await this.commonDao.mapDBrowToReport(row, true));
    }

    /**
     * Save a new report in the database along with its photos
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

                    // `this` inside callback refers to the statement
                    report.id = this.lastID;

                    // Insert photos if any
                    if (report.photos_id && report.photos_id.length > 0) {
                        const photoSql = `
                            INSERT INTO report_photos (report_id, photo_id, position)
                            VALUES (?, ?, ?)
                        `;
                        const photoStmt = db.prepare(photoSql);

                        try {
                            report.photos_id.forEach((photo_id, index) => {
                                photoStmt.run(report.id, photo_id, index + 1);
                            });
                        } catch (photoErr) {
                            return reject(photoErr);
                        }
                    }

                    resolve(report);
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
                    const dataSql = `SELECT * ${baseSql} ORDER BY updated_at DESC LIMIT ? OFFSET ?`;
                    const dataParams = [...params, limit, offset];

                    db.all(dataSql, dataParams, async (err2, rows: any[]) => {
                        if (err2) return reject(err2);

                        const reports: Report[] = [];
                        for (const r of rows) {
                            reports.push(await this.commonDao.mapDBrowToReport(r, false)); // include subclasses
                        }

                        resolve({ reports, totalCount });
                    });
                });
            } catch (err) {
                reject(err);
            }
        });
    }

}

export default ReportDAO