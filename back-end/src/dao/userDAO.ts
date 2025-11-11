import db from "./db"
import { User } from "../components/user"
import crypto from "crypto"
import { UserAlreadyExistsError, UserNotFoundError, UnauthorizedUserError } from "../errors/userError";

/**
 * A class that implements the interaction with the database for all user-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class UserDAO {
    /**
     * Builds a User object from a Database Row Object
     * @param dbRow Row Object containing the user data read from the database
     * @returns User Object
     */
    mapDBrowToUserObject(dbRow: any): User {
        return new User(dbRow.id, dbRow.username, dbRow.first_name, dbRow.last_name, dbRow.email, User.getRole(dbRow.user_type));
    }

    /**
     * Checks whether the information provided during login (username and password) is correct.
     * @param username The username of the user.
     * @param plainPassword The password of the user (in plain text).
     * @returns A Promise that resolves to true if the user is authenticated, false otherwise.
     */
    getIsUserAuthenticated(username: string, plainPassword: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            /**
             * Example of how to retrieve user information from a table that stores username, encrypted password and salt (encrypted set of 16 random bytes that ensures additional protection against dictionary attacks).
             * Using the salt is not mandatory (while it is a good practice for security), however passwords MUST be hashed using a secure algorithm (e.g. scrypt, bcrypt, argon2).
             */
            const sql = "SELECT username, password_hash, salt FROM users WHERE username = ?"
            db.get(sql, [username], (err: Error | null, row: any) => {
                if (err) reject(err)
                //If there is no user with the given username, or the user salt is not saved in the database, the user is not authenticated.
                if (!row || row.username !== username || !row.salt) {
                    resolve(false)
                } else {
                    //Hashes the plain password using the salt and then compares it with the hashed password stored in the database
                    const hashedPassword = crypto.scryptSync(plainPassword, row.salt, 16)
                    const passwordHex = Buffer.from(row.password_hash, "hex")
                    if (!crypto.timingSafeEqual(passwordHex, hashedPassword)) resolve(false)
                    resolve(true)
                }

            });

        });
    }

    /**
     * Creates a new user and saves their information in the database
     * @param username The username of the user. It must be unique.
     * @param name The name of the user
     * @param surname The surname of the user
     * @param email The email of the user
     * @param password The password of the user. It must be encrypted using a secure algorithm (e.g. scrypt, bcrypt, argon2)
     * @param role The role of the user. It must be one of the three allowed types ("citizen", "municipality", "admin")
     * @returns A Promise that resolves to true if the user has been created.
     */
    createUser(username: string, name: string, surname: string, email: string, password: string, role: string): Promise<User> {
        return new Promise<User>((resolve, reject) => {
            const salt = crypto.randomBytes(16)
            // scryptSync is a syncronous functions that generates a password-based key in hexadecimal, 
            // designed to be computationally expensive. It takes a plain password, unique salt string at least 16 bytes long and KeyLength
            const hashedPassword = crypto.scryptSync(password, salt, 16)
            const sql = "INSERT INTO users(username, first_name, last_name, email, user_type, password_hash, salt) VALUES(?, ?, ?, ?, ?, ?, ?)"
            db.run(sql, [username, name, surname, email, role, hashedPassword, salt], function (err: Error | null) {
                if (err) {
                    if (err.message.includes("UNIQUE constraint failed: users.username")) reject(new UserAlreadyExistsError)
                    reject(err)
                }
                const user = new User(this.lastID, username, name, surname, email, User.getRole(role));
                resolve(user);
            })

        })
    }

    /**
     * Returns a user object from the database based on the username.
     * @param username The username of the user to retrieve
     * @returns A Promise that resolves the information of the requested user
     */
    getUserByUsername(username: string): Promise<User> {
        return new Promise<User>((resolve, reject) => {
            const sql = "SELECT * FROM users WHERE username = ?"
            db.get(sql, [username], (err: Error | null, row: any) => {
                if (err) {
                    reject(err)
                    return
                }
                if (!row) {
                    reject(new UserNotFoundError)
                    return
                }
                const user: User = this.mapDBrowToUserObject(row);
                resolve(user);
            });

        })
    }
    /**
     * Returns a user object from the database based on the ID.
     * @param ID The ID of the user to retrieve
     * @returns A Promise that resolves the information of the requested user
     */
    getUserById(ID: number): Promise<User> {
        return new Promise<User>((resolve, reject) => {
            const sql = "SELECT * FROM users WHERE id = ?"
            db.get(sql, [ID], (err: Error | null, row: any) => {
                if (err) {
                    reject(err);
                    return
                }
                if (!row) {
                    reject(new UserNotFoundError);
                    return
                }
                const user: User = this.mapDBrowToUserObject(row);
                resolve(user);
            });

        })
    }

    /**
     * Delete a user in the database, given its id
     * @returns A Promise that resolves to true if the user is deleted or false if it does not exists
     */
    deleteUserById(ID: number): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            const sql = 'DELETE FROM users WHERE id = ?';
            db.run(sql, [ID], function(err: Error | null) {
                if(err) {
                    reject(err);
                    return;
                }
                if(!this.changes) {
                    resolve(false);
                    return;
                }
                resolve(true);
            });
        });
    }

    /**
     * Updates the personal information of one user. The user can only update their own information (except for the admin, which can also update other accounts).
     * @param id The immutable ID of the user
     * @param user The updated user object
     * @returns A Promise that resolves to the updated user
     */
    updateUserInfo(id: number, user: User) {
        return new Promise<User>( (resolve, reject) => {
            const sql = "UPDATE users SET username=?, first_name=?, last_name=?, email=?, user_type=? WHERE id=?";

            db.run(sql, [user.username, user.first_name, user.last_name, user.email, user.user_type, id], (err: Error | null, row: any) => {
                if(err) {
                    reject(err);
                    return;
                }
                //resolve(await this.getUserByUsername(username));
                //this.getUserByUsername(username).then((user) => resolve(user)).catch((err) => reject(err))
                resolve(user);
            });
        });
    }

    /**
     * Retrieve user roles stored on database (optionally for a given user)
     * @returns [{RoleID, RoleName}, {...}, ...]
     */
    getRoles(userid?: number): Promise<{ RoleID: number; RoleName: string }[]> {
        return new Promise((resolve, reject) => {
            const sql = userid ? 
            `SELECT id AS RoleID, label AS RoleName FROM roles R, user_roles UR
            WHERE R.id = UR.role_id AND UR.user_id = ?` 
            : `SELECT id, label FROM roles`;

            const params = userid ? [userid] : [];
            db.all(sql, params, (err: Error | null, rows: { RoleID: number; RoleName: string }[]) => {
                if(err) reject(err);
                else resolve(rows);
            });
        });
    }

    /**
     * Assign existing roles to a given user
     * @param userId the id of the user
     * @param roleIds array of role identifiers to assign to the user
     */
    assignRoles(userId: number, roleIds: Array<number>) {
        return new Promise<void>((resolve, reject) => {
            if (roleIds.length === 0) {
                return resolve();
            }

            const sql = `
                INSERT OR IGNORE INTO user_roles (user_id, role_id)
                VALUES (?, ?)
            `;

            db.serialize(() => {
                const stmt = db.prepare(sql);

                roleIds.forEach(roleId => {
                    stmt.run([userId, roleId], function (err: Error | null) {
                        if (err) {
                            stmt.finalize();
                            return reject(err);
                        }
                    });
                });

                stmt.finalize(err => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        });
    }

    /**
     * Remove existing roles to a given user
     * @param userId the id of the user
     * @param roleIds array of role identifiers to remove from the user
     */
    removeRoles(userId: number, roleIds: Array<number>) {
        return new Promise<void>((resolve, reject) => {

            if (roleIds.length === 0) {
                return resolve();
            }

            const sql = `
                DELETE FROM user_roles
                WHERE user_id = ? AND role_id = ?
            `;

            db.serialize(() => {
                const stmt = db.prepare(sql);

                roleIds.forEach(roleId => {
                    stmt.run([userId, roleId], function (err: Error | null) {
                        if (err) {
                            stmt.finalize();
                            return reject(err);
                        }
                    });
                });

                stmt.finalize(err => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        });
    }

    /**
     * [Admin reserved function] Returns all users data from the database.
     * @returns A Promise that resolves the information of the requested user
     */
    /*getUsers(): Promise<User[]> {
        return new Promise<User[]>((resolve, reject) => {
            const sql = 'SELECT * FROM users';
            db.all(sql, [], (err: Error | null, rows: any) => {
                if(err) {
                    reject(err);
                    return;
                }
                if(!rows) {
                    reject(new UserNotFoundError());
                    return;
                }

                let userArray = [...rows].map(row => this.mapDBrowToUserObject(row));
                resolve(userArray);
            });
        });
    }*/

    /**
     * Delete a user in the database, given its username
     * @returns A Promise that resolves to true if the user is deleted or false if it does not exists
     */
    /*deleteUser(username: string): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            const sql = 'DELETE FROM users WHERE username=?';
            db.run(sql, [username], function(err) {
                if(err) {
                    reject(err);
                    return;
                }
                if(!this.changes) {
                    resolve(false);
                    return;
                }
                resolve(true);
            });
        });
    }*/

    /**
     * Delete every non-admin users
     * @returns A Promise that resolves to true if at least one user is deleted, otherwise resolves to false
     */
    /*deleteAll(): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            const sql = "DELETE FROM users WHERE role != 'Admin'";
            db.run(sql, [], function(err) {
                if(err) {
                    reject(err);
                    return;
                }
                if(!this.changes) {
                    resolve(false);
                    return;
                }
                resolve(true);
            });
        });
    }*/
}
export default UserDAO