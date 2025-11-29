import { User, UserType, RoleType, UserRole } from "./components/user"
const DATE_ERROR = "Input date is not compatible with the current date"

/**
 * Represents a utility class.
 */
class Utility {
    /**
     * Checks if a user is a municipality.
     * @param {User} user - The user to check.
     * @returns True if the user is a municipality, false otherwise.
     */
    static isMunicipality(user: User): boolean {
        return user.userType === UserType.MUNICIPALITY
    }
    
    static hasRoleType(user: User, roleType: RoleType): boolean {
        return user.userRoles.some(userRole => userRole.type === roleType);
    }

    /**
     * Checks if a user is a citizen.
     * @param {User} user - The user to check.
     * @returns True if the user is a citizen, false otherwise.
     */
    static isCitizen(user: User): boolean {
        return user.userType === UserType.CITIZEN
    }

    static isAdmin(user: User): boolean {
        return user.userType === UserType.ADMIN
    }

    static now(): string {
        return new Date().toISOString().split("T")[0];
    };

}

class DateError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = DATE_ERROR
        this.customCode = 400
    }
}

export { Utility, DateError }