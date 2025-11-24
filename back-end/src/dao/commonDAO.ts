import db from "./db"
import { Report, ReportPhoto, ReportStatus, ReportCategory } from "../components/report"
import { User } from "../components/user"
import { PaginatedResult } from "../components/common";

/**
 * A class that implements the interaction with the database for all user-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class CommonDao {

    /**
     * Builds a User object from a Database Row Object
     * @param dbRow Row Object containing the user data read from the database
     * @returns User Object
     */
    mapDBrowToUserObject(dbRow: any): User {
        return new User(dbRow.id, dbRow.username, dbRow.first_name, dbRow.last_name, dbRow.email, User.getRole(dbRow.user_type));
    }

    /**
     * Builds a ReportCategory object from a database row
     * @param dbRow Row Object containing the category data
     * @returns ReportCategory object
    */
    mapDBrowToReportCategoryObject(dbRow: any): ReportCategory {
        return new ReportCategory(
            dbRow.id,
            dbRow.name,
            dbRow.icon,
            dbRow.description
        );
    }

    /**
     * Builds a ReportPhoto object from a database row
     * @param dbRow Row Object containing the photo data
     * @returns ReportPhoto object
     */
    mapDBrowToReportPhoto(dbRow: any): ReportPhoto  {
        // DDL columns: id, report_id, position, photo_path, photo_public_url
        return new ReportPhoto(
            dbRow.id,
            dbRow.report_id,
            dbRow.position,
            dbRow.photo_public_url ?? "",
            dbRow.photo_path ?? ""
        );
    }

    async mapDBrowToReport(dbRow: any, getSubClasses: boolean = false): Promise<Report> {
        const report = new Report(
            dbRow.id,
            dbRow.category_id,
            dbRow.title,
            dbRow.latitude,
            dbRow.longitude,
            dbRow.status,
            dbRow.is_public === 1 || dbRow.is_public === true,
            dbRow.reporter_id,
            dbRow.updated_by,
            dbRow.description,
            dbRow.status_reason,
            dbRow.created_at,
            dbRow.updated_at
        );

        if(getSubClasses){
            if (dbRow.category_id) 
                report.category = await this.getById('report_categories', dbRow.category_id, this.mapDBrowToReportCategoryObject);
            if (dbRow.reporter_id) 
                report.reporter = await this.getById('users', dbRow.reporter_id, this.mapDBrowToUserObject);
            if (dbRow.updated_by) 
                report.updated = await this.getById('users', dbRow.updated_by, this.mapDBrowToUserObject);
            
            report.photos = await this.getBy('report_photos', this.mapDBrowToReportPhoto, `report_id = ${report.id} ORDER BY position ASC`);

        }

        return report;
    }


    /**
     * Generic function to get an object by ID from a table
     * @param tableName - Name of the table in the database
     * @param id - The ID of the row to fetch
     * @param mapRowFn - Function to map a database row to the desired object
     * @returns Promise resolving to the mapped object
     */
    async getById<T>(
        tableName: string,
        id: number,
        mapRowFn: (row: any) => Promise<T> | T
    ): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const sql = `SELECT * FROM ${tableName} WHERE id = ?`;
            db.get(sql, [id], async (err: Error | null, row: any) => {
                if (err) return reject(err);
                if (!row) return reject(new Error(`${tableName} with id ${id} not found`));

                try {
                    const obj: T = await mapRowFn(row); // await if async
                    resolve(obj);
                } catch (err) {
                    reject(err);
                }
            });
        });
    }

    /**
     * Generic function to fetch rows from a table with an optional WHERE clause
     * @param tableName - Name of the table in the database
     * @param mapRowFn - Function to map a database row to the desired object
     * @param whereClause - Optional WHERE clause (without the 'WHERE' keyword)
     * @param params - Optional array of parameters for the WHERE clause
     * @returns Promise resolving to an array of mapped objects
     */
    async getBy<T>(
        tableName: string,
        mapRowFn: (row: any) => T,
        whereClause?: string
    ): Promise<T[]> {
        return new Promise<T[]>((resolve, reject) => {
            let sql = `SELECT * FROM ${tableName}`;
            if (whereClause) sql += ` WHERE ${whereClause}`;
            
            db.all(sql, [], (err: Error | null, rows: any[]) => {
                if (err) return reject(err);
                const objects = rows.map(row => mapRowFn(row));
                resolve(objects);
            });
        });
    }


}
export default CommonDao