/**
 * Represents a user in the system.
 */
class User {
    id: number
    username: string
    first_name: string
    last_name: string
    email: string
    userType: UserType

    userRoles: UserRole[]
    /**
     * Creates a new instance of the User class.
     * @param id - The identifier of the user. This is unique for each user. Default value is zero (when inserting a new user)
     * @param username - The username of the user. This is unique for each user.
     * @param first_name - The name of the user.
     * @param last_name - The surname of the user.
     * @param email - The email of the user.
     * @param role - The role of the user. This can be "citizen" (default value), "municipality" or "admin".
     */
    constructor(id: number = 0, username: string, first_name: string, last_name: string, email: string, role: UserType = UserType.CITIZEN) {
        this.id = id
        this.username = username
        this.first_name = first_name
        this.last_name = last_name
        this.email = email
        this.userType = role
        this.userRoles = []
    }

    /**
     * @param roleString - The role string stored in the database ('citizen', 'municipality' or 'admin')
     * @returns Corresponding Role entry inside Role enum
     */
    static getUserType(roleString: string): UserType {
        try {
            switch (roleString) {
                case 'citizen': return UserType.CITIZEN;
                case 'municipality': return UserType.MUNICIPALITY;
                case 'admin': return UserType.ADMIN;
                default: throw Error;
            }
        } catch {
            console.error(`Could not parse the role-string '${roleString}' into Role enum`);
            return null;
        }
    }
}

/**
 * Represents the user-type of a user.
 * The values present in this enum are the only valid values for the user-type of a user.
 */
enum UserType {
    MUNICIPALITY = "municipality",
    CITIZEN = "citizen",
    ADMIN = "admin"
}


/**
 * Represents the user-type of a user.
 * The values present in this enum are the only valid values for the user-type of a user.
 */
enum RoleType {
    REL_OFFICER = "publicRelations_officer",
    MAINTAINER = "external_maintainer",
    TECH_OFFICER = "technical_officer"
}


class UserRole {
    id: number
    type: RoleType
    label: string
    description: string
    /**
     * Creates a new instance of the UserRole.
     * @param id - 
     * @param type - The RoleType of the user.
     * @param label - The label of the UserRole.
     * @param description - The description of the userRole.
     */
    constructor(id: number = 0, type: string | RoleType, label: string, description: string) {
        this.id = id
        this.label = label
        this.description = description
        
        if(Object.values(RoleType).includes(type as RoleType)){
            this.type = type as RoleType
        } else {
            switch (type) {
                case 'publicRelations_officer': this.type = RoleType.REL_OFFICER; break;
                case 'external_maintainer': this.type = RoleType.MAINTAINER; break;
                case 'technical_officer': this.type = RoleType.TECH_OFFICER; break;
            }
        }
    }
}

export { User, UserType, RoleType, UserRole }