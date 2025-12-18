import db from "./db"
import { Report, ReportPhoto, ReportStatus, ReportCategory, ReportComment } from "../components/report"
import { User, UserRole } from "../components/user"
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
        return new User(dbRow.id, dbRow.username, dbRow.first_name, dbRow.last_name, dbRow.email, User.getUserType(dbRow.user_type));
    }

    /**
     * Builds a UserRole object from a Database Row Object
     * @param dbRow Row Object containing the user data read from the database
     * @returns User Object
     */
    mapDBrowToUserRoleObject(dbRow: any): UserRole {
        return new UserRole(dbRow.id, dbRow.role_type, dbRow.label, dbRow.description);
    }
    async mapDBrowToUserObjectWithRoles(dbRow: any): Promise<User> {
        const user = new User(dbRow.id, dbRow.username, dbRow.first_name, dbRow.last_name, dbRow.email, User.getUserType(dbRow.user_type));
        user.userRoles = await this.getUserRolesByUserId(dbRow.id)
        return user;
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

    /**
     * Builds a ReportComment object from a database row
     * @param dbRow Row Object containing the comment data
     * @returns ReportComment object
     */
    mapDBrowToReportComment(dbRow: any): ReportComment  {
        return new ReportComment(
            dbRow.id,
            dbRow.report_id,
            dbRow.commenter_id,
            dbRow.comment,
            dbRow.created_at,
            dbRow.updated_at
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
            dbRow.assigned_from_id,
            dbRow.maintainer_id,
            dbRow.updated_by,
            dbRow.description,
            dbRow.status_reason,
            dbRow.created_at,
            dbRow.updated_at
        );

        // Populate assignment target (technical officer) even if subclasses are not fetched
        report.assigned_to_id = dbRow.assigned_to;

        if(getSubClasses){
            if (dbRow.category_id) 
                report.category = await this.getById('report_categories', dbRow.category_id, this.mapDBrowToReportCategoryObject);
            if (dbRow.reporter_id) 
                report.reporter = await this.getById('users', dbRow.reporter_id, this.mapDBrowToUserObject);
            if (dbRow.assigned_to) 
                report.assigned_to = await this.getById('users', dbRow.assigned_to, this.mapDBrowToUserObject);
            if (dbRow.assigned_from_id) 
                report.assigned_from = await this.getById('users', dbRow.assigned_from_id, this.mapDBrowToUserObject);
            if (dbRow.maintainer_id) 
                report.maintainer = await this.getById('users', dbRow.maintainer_id, this.mapDBrowToUserObject);
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
    async getUserRolesByUserId(userId: number): Promise<UserRole[]> {
        return new Promise<UserRole[]>((resolve, reject) => {
            const sql = `
                SELECT r.* 
                FROM roles r
                JOIN user_roles ur ON r.id = ur.role_id
                WHERE ur.user_id = ?`;

            db.all(sql, [userId], async (err: Error | null, rows: any[]) => {
                if (err) return reject(err);
                if (!rows || rows.length === 0) return resolve([]);

                try {
                    const userRoles: UserRole[] = [];
                    for (const row of rows) {
                        userRoles.push(this.mapDBrowToUserRoleObject(row));
                    }
                    resolve(userRoles);
                } catch (err) {
                    reject(err);
                }
            });
        });
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