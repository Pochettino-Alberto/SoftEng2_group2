import { UserNotAdminError, UnauthorizedUserError, UserNotFoundError, UserAlreadyExistsError, UserIsAdminError } from "../errors/userError"
import { User, UserType } from "../components/user"
import { PaginatedResult } from "../components/common";
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
     * @param type - The type of the new user. It must not be null and it can only be one of the three allowed types ("Manager", "Customer", "Admin")
     * @returns A Promise that resolves to true if the user has been created.
     */
    async createUser(username: string, name: string, surname: string, email: string, password: string, type: string) /**:Promise<Boolean> */ {

        const userExists = await this.usernameAlreadyInUse(username);
        if (userExists)
            throw new UserAlreadyExistsError();
        else
            return await this.dao.createUser(username, name, surname, email, password, type);

    }

    /**
     * Set (replace) roles for a given user.
     * This will add any roleIDs in rolesArray that are missing and remove any existing roles not present in rolesArray.
     * Only admins should call this at route level (enforced in routes).
     */
    async setUserRoles(userId: number, rolesArray: Array<number>): Promise<void> {
        // Reuse the same logic used in updateUserInfo
        // The DAO methods are assignRoles(userId, roleIds) and removeRoles(userId, roleIds)
        try {
            // get current roles for user (db returns [{RoleID, RoleName}, ...])
            const currentRolesDB: { RoleID: number; RoleName: string }[] = await this.getRoles(userId);
            const currentRoles = currentRolesDB.map(r => r.RoleID);

            // compute to add and to remove
            const toAdd = rolesArray.filter(r => !currentRoles.includes(r));
            const toRemove = currentRoles.filter(r => !rolesArray.includes(r));

            await this.dao.assignRoles(userId, toAdd);
            await this.dao.removeRoles(userId, toRemove);

        } catch (err) {
            throw err;
        }
    }

    /**
     * Convenience wrapper to only add roles to a user (does not remove existing roles)
     */
    async assignRolesToUser(userId: number, rolesArray: Array<number>): Promise<void> {
        try {
            await this.dao.assignRoles(userId, rolesArray || []);
        } catch (err) {
            throw err;
        }
    }

    /**
     * Updates the personal information of one user. The user can only update their own information.
     * The admin can edit EVERY user
     * @param user The user who is performing the update (gotten from Authenticator)
     * @param id The ID of the user to update
     * @param username The username of the user to update. It must be equal to the username of the user parameter or have admin privileges.
     * @param name The new name of the user
     * @param surname The new surname of the user
     * @param email The new email of the user
     * @param user_type The new user_type of the user (will be null for /edit-me route)
     * @param rolesArray The new assigned roles of the user (will be null for /edit-me route)
     * @returns A Promise that resolves to the updated user
     */
    async updateUserInfo(user: User, id: number, username?: string, name?: string, surname?: string, email?: string, user_type?: string, rolesArray?: Array<number>) {
        try {
            let userToUpdate = await this.dao.getUserById(id);
            const fetchedUsername = userToUpdate.username;

            if (Utility.isAdmin(user) || user.username == fetchedUsername) {

                if (username) userToUpdate.username = username;
                if (name) userToUpdate.first_name = name;
                if (surname) userToUpdate.last_name = surname;
                if (email) userToUpdate.email = email;
                if (user_type) userToUpdate.user_type = User.getUserType(user_type);

                // Update user roles
                if (rolesArray) {
                    // Getting current user roles
                    const currentRolesDB: { RoleID: number; RoleName: string }[] = await this.getRoles(id);
                    let currentRoles = currentRolesDB.map(role => role.RoleID);
                    // Getting new roles to INSERT
                    let newRoles = rolesArray.filter(r => !currentRoles.includes(r));
                    await this.dao.assignRoles(id, newRoles);
                    // Getting old roles to DELETE
                    let oldRolesToRemove = currentRoles.filter(r => !rolesArray.includes(r));
                    await this.dao.removeRoles(id, oldRolesToRemove);
                }

                // Update user attributes
                return this.dao.updateUserInfo(id, userToUpdate);
            }
            else throw new UnauthorizedUserError;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Retrieve user roles stored on database (optionally for a given user)
     * @returns [{RoleID, RoleName}, {...}, ...]
     */
    async getRoles(userid?: number): Promise<{ RoleID: number; RoleName: string }[]> {
        try {
            return await this.dao.getRoles(userid);
        } catch (err) {
            throw err;
        }
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
        // User is admin || User wants to see his personal information
        if (Utility.isAdmin(user) || user.username == username)
            return this.dao.getUserByUsername(username);
        else throw new UserNotAdminError;
    }
    /**
     * Same function as the previous one, but does not require any User object.
     * Used inside the middleware in userRoutes to check whether a username has already been used (for sign in)
     * @param username - The username of the user to retrieve
     * @returns A Promise that resolves to true if the provided username exists
     */
    async usernameAlreadyInUse(username: string) /**:Promise<Boolean> */ {
        try {
            await this.dao.getUserByUsername(username);
            return true;
        } catch (error) {
            if (error instanceof UserNotFoundError) {
                return false;
            } else {
                throw error;
            }
        }
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
     * Returns a user with a specific id.
     * This function should be called only by an admin, or by the same user (authenticated) that corresponds to that specific id
     * @param requester - the user who called this service
     * @param id - the id of the user
     * @returns A Promise that resolves to a user object.
     */
    async getUserById(requester: User, id: number) {
        // Only the Admin can see any user infos; normal users can see only infos about themselves
        if (!Utility.isAdmin(requester) && requester.id !== id) {
            throw new UserNotAdminError();
        }

        // Delegate to DAO; any errors will propagate to the route error handler
        return this.dao.getUserById(id);
    }

    /**
     * Deletes a specific user
     * The function has different behavior depending on the role of the user calling it:
     * - Admins can delete any non-Admin user
     * - Other roles can only delete their own account
     * Admin accounts cannot be deleted at all, not even by the possessor of the admin account
     * @param userId - The user's id of the user to delete. The user must exist.
     * @returns A Promise that resolves to true if the user has been deleted.
     */
    async deleteUser(requester: User, id: number) {
        // Admins can delete any non-Admin user; other users can delete only their own account
        // First, if the requester is not admin, ensure they are deleting their own account
        if (!Utility.isAdmin(requester)) {
            if (requester.id !== id) {
                throw new UserNotAdminError();
            }

            const deleted = await this.dao.deleteUserById(id);
            if (!deleted) throw new UserNotFoundError();
            return true;
        }

        // Requester is admin: ensure the target exists and isn't an admin
        const userToDelete = await this.dao.getUserById(id); // may throw UserNotFoundError
        if (userToDelete.user_type === UserType.ADMIN) {
            throw new UserIsAdminError();
        }

        const deleted = await this.dao.deleteUserById(id);
        if (!deleted) throw new UserNotFoundError();
        return true;
    }


    /**
     * Searches for users with optional filters and pagination.
     * Only accessible to Admin users.
     * 
     * @param page_num The page number (optional)
     * @param page_size The page size (optional)
     * @param first_name Filter by first name (optional)
     * @param last_name Filter by last name (optional)
     * @param email Filter by email (optional)
     * @param role Filter by user role (optional)
     * @returns A Promise that resolves to an array of matching users
     */
    async searchUsers(
        page_num: number | null,
        page_size: number | null,
        first_name: string | null,
        last_name: string | null,
        email: string | null,
        role: string | null
    ): Promise<PaginatedResult<User>> {
        try {
            const page = page_num ? Number(page_num) : 1;
            const size = page_size ? Number(page_size) : 10;
            const offset = (page - 1) * size;

            const { users, totalCount } = await this.dao.getPaginatedUsers(
                first_name, last_name, email, role, size, offset
            );

            const pagUsers = new PaginatedResult<User>(page, size, totalCount, users);

            return pagUsers;
        } catch (err) {
            throw err;
        }
    }



}

export default UserController