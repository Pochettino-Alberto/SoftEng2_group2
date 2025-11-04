import { UserNotAdminError, UnauthorizedUserError, UserNotFoundError, UserAlreadyExistsError } from "../errors/userError"
import { User } from "../components/user"
import UserDAO from "../dao/userDAO"
import { DateError, Utility } from "../utilities"

/**
 * Represents a controller for managing users.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class UserController {
    private dao: UserDAO

    constructor() {
        this.dao = new UserDAO
    }

    /**
     * Creates a new user
     * @param username - The username of the new user. It must not be null and it must not be already taken.
     * @param name - The name of the new user. It must not be null.
     * @param surname - The surname of the new user. It must not be null.
     * @param email - The email of the new user. It must not be null.
     * @param password - The password of the new user. It must not be null.
     * @param role - The role of the new user. It must not be null and it can only be one of the three allowed types ("Manager", "Customer", "Admin")
     * @returns A Promise that resolves to true if the user has been created.
     */
    async createUser(username: string, name: string, surname: string, email: string, password: string, role: string) /**:Promise<Boolean> */ {
        //return this.dao.createUser(username, name, surname, password, role)
        return new Promise<Boolean>(async (resolve, reject) => {
            const userExists = await this.usernameAlreadyInUse(username);
            if(userExists)
                reject(new UserAlreadyExistsError());
            else
                resolve(await this.dao.createUser(username, name, surname, email, password, role));
        });
    }

    /**
     * Returns all users.
     * @returns A Promise that resolves to an array of users.
     */
    /*async getUsers() {
        return this.dao.getUsers()
    }*/

    /**
     * Returns all users with a specific role.
     * @param role - The role of the users to retrieve. It can only be one of the three allowed types ("Manager", "Customer", "Admin")
     * @returns A Promise that resolves to an array of users with the specified role.
     */
    /*async getUsersByRole(role: string) {
        return new Promise<User[]>((resolve, reject) => {
            this.dao.getUsers().then(userArray => {
                const userFiltered = [...userArray].filter(user => user.role == Utility.getRole(role))
                if(userFiltered.length === 0){
                    throw new UserNotFoundError;
                }
                resolve(userFiltered);
            }).catch(error => {
                reject(error)
            })
        });
    }*/

    /**
     * Returns a specific user.
     * The function has different behavior depending on the role of the user calling it:
     * - Admins can retrieve any user
     * - Other roles can only retrieve their own information
     * @param username - The username of the user to retrieve. The user must exist.
     * @returns A Promise that resolves to the user with the specified username.
     */
    async getUserByUsername(user: User, username: string) /**:Promise<User> */ {
        return new Promise<User>((resolve, reject) => {
            // User is admin || User wants to see his personal information
            if( Utility.isAdmin(user) || user.username == username )
                resolve(this.dao.getUserByUsername(username));
            else reject(new UserNotAdminError)
        });
    }
    /**
     * Same function as the previous one, but does not require any User object.
     * Used inside the middleware in userRoutes to check whether a username has already been used (for sign in)
     * @param username - The username of the user to retrieve
     * @returns A Promise that resolves to true if the provided username exists
     */
    async usernameAlreadyInUse(username: string) /**:Promise<Boolean> */ {
        return new Promise<Boolean>(async (resolve, reject) => {
            try {
                await this.dao.getUserByUsername(username);
                resolve(true);
            } catch(error) {
                if (error instanceof UserNotFoundError){
                    resolve(false);
                } else {
                    reject(error);
                }
            }
        });
    }

    /**
     * Deletes a specific user
     * The function has different behavior depending on the role of the user calling it:
     * - Admins can delete any non-Admin user
     * - Other roles can only delete their own account
     * @param username - The username of the user to delete. The user must exist.
     * @returns A Promise that resolves to true if the user has been deleted.
     */
    /*async deleteUser(user: User, username: string) {
        return new Promise<Boolean>((resolve, reject) => {
            // User is admin || User wants to delete himself
            if( Utility.isAdmin(user) || user.username == username )
                this.dao.getUserByUsername(username)
                    .then(user => user.role != Role.ADMIN ? resolve(this.dao.deleteUser(username)) : reject(new UnauthorizedUserError)).catch(err => reject(err));
            else reject(new UserNotAdminError);
        });
    }*/

    /**
     * Deletes all non-Admin users
     * @returns A Promise that resolves to true if all non-Admin users have been deleted.
     */
    /*async deleteAll() {
        //return this.dao.deleteAll();
        
        return new Promise<Boolean>(async (resolve, reject) => {
            try {
                if (await this.dao.deleteAll()){
                    resolve(true);
                } else {
                    reject(new UserNotFoundError);
                };
            } catch (error) {
                reject(error);
            }
        });
        
    }*/

    /**
     * Updates the personal information of one user. The user can only update their own information.
     * The admin can edit EVERY user
     * @param user The user who wants to update their information
     * @param name The new name of the user
     * @param surname The new surname of the user
     * @param address The new address of the user
     * @param birthdate The new birthdate of the user
     * @param username The username of the user to update. It must be equal to the username of the user parameter.
     * @returns A Promise that resolves to the updated user
     */
    /*async updateUserInfo(user: User, name: string, surname: string, address: string, birthdate: string, username: string) {
        return new Promise<User>((resolve, reject) => {
            if(Utility.isAdmin(user) || user.username == username) {    // todo: I should implement this checks in userRoutes.ts and not inside this controller
                if(birthdate > Utility.now()) {
                    reject(new DateError);
                }
                resolve(this.dao.updateUserInfo(name, surname, address, birthdate, username));
            }
            else reject(new UnauthorizedUserError);
        });
    }*/
}

export default UserController