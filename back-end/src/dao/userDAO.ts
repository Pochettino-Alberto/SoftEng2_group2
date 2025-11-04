import db from "./db"
import { Role, User } from "../components/user"
import crypto from "crypto"
import { UserAlreadyExistsError, UserNotFoundError, UnauthorizedUserError } from "../errors/userError";
import { Utility } from "../utilities";

/**
 * A class that implements the interaction with the database for all user-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class UserDAO {

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
     * @param role The role of the user. It must be one of the three allowed types ("Manager", "Customer", "Admin")
     * @returns A Promise that resolves to true if the user has been created.
     */
    createUser(username: string, name: string, surname: string, email: string, password: string, role: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const salt = crypto.randomBytes(16)
            // scryptSync is a syncronous functions that generates a password-based key in hexadecimal, 
            // designed to be computationally expensive. It takes a plain password, unique salt string at least 16 bytes long and KeyLength
            const hashedPassword = crypto.scryptSync(password, salt, 16)
            const sql = "INSERT INTO users(username, first_name, last_name, email, user_type, password_hash, salt) VALUES(?, ?, ?, ?, ?, ?, ?)"
            db.run(sql, [username, name, surname, email, role, hashedPassword, salt], (err: Error | null) => {
                if (err) {
                    if (err.message.includes("UNIQUE constraint failed: users.username")) reject(new UserAlreadyExistsError)
                    reject(err)
                }
                resolve(true)
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
     * Builds a User object from a Database Row Object
     * @param dbRow Row Object containing the user data read from the database
     * @returns User Object
     */
    mapDBrowToUserObject(dbRow: any): User {
        return new User(dbRow.id, dbRow.username, dbRow.first_name, dbRow.last_name, dbRow.email, Utility.getRole(dbRow.user_type));
    }

    /**
     * [Admin reserved function] Returns all users data from the database.
     * @returns A Promise that resolves the information of the requested user
     */
    getUsers(): Promise<User[]> {
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
    }

    /**
     * Delete a user in the database, given its username
     * @returns A Promise that resolves to true if the user is deleted or false if it does not exists
     */
    deleteUser(username: string): Promise<Boolean> {
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
    }

    /**
     * Delete every non-admin users
     * @returns A Promise that resolves to true if at least one user is deleted, otherwise resolves to false
     */
    deleteAll(): Promise<Boolean> {
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
    }

    /**
     * Updates the personal information of one user. The user can only update their own information.
     * @param name The new name of the user
     * @param surname The new surname of the user
     * @param address The new address of the user
     * @param birthdate The new birthdate of the user
     * @param username The username of the user to update.
     * @returns A Promise that resolves to the updated user
     */
    updateUserInfo(name: string, surname: string, address: string, birthdate: string, username: string) {
        return new Promise<User>( (resolve, reject) => {
            const sql = "UPDATE users SET name=?, surname=?, address=?, birthdate=? WHERE username=?";

            db.run(sql, [name, surname, address, birthdate, username], (err: Error | null, row: any) => {
                if(err) {
                    reject(err);
                    return;
                }
                //resolve(await this.getUserByUsername(username));
                this.getUserByUsername(username).then((user) => resolve(user)).catch((err) => reject(err))
            });
        });
    }
}
export default UserDAO