const USER_NOT_FOUND = "The user does not exist"
const USER_NOT_MUNICIPALITY = "This operation can be performed only by a municipality officer"
const USER_ALREADY_EXISTS = "The username already exists"
const USER_NOT_CITIZEN = "This operation can be performed only by a citizen"
const USER_NOT_ADMIN = "This operation can be performed only by an admin"
const USER_IS_ADMIN = "Admins cannot be deleted"
const UNAUTHORIZED_USER = "You cannot access the information of other users"

/**
 * Represents an error that occurs when a user is not found.
 */
class UserNotFoundError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = USER_NOT_FOUND
        this.customCode = 404
    }
}

/**
 * Represents an error that occurs when a user is not a municipality officer.
 */
class UserNotMunicipalityError extends Error {
    customMessage: String;
    customCode: Number;

    constructor() {
        super()
        this.customMessage = USER_NOT_MUNICIPALITY
        this.customCode = 401
    }
}

/**
 * Represents an error that occurs when a user is not a citizen.
 */
class UserNotCitizenError extends Error {
    customMessage: String;
    customCode: Number;

    constructor() {
        super()
        this.customMessage = USER_NOT_CITIZEN
        this.customCode = 401
    }
}

class UserNotAdminError extends Error {
    customMessage: String;
    customCode: Number;

    constructor() {
        super()
        this.customMessage = USER_NOT_ADMIN
        this.customCode = 401
    }
}



/**
 * Represents an error that occurs when a username is already in use.
 */
class UserAlreadyExistsError extends Error {
    customMessage: String;
    customCode: Number;

    constructor() {
        super()
        this.customMessage = USER_ALREADY_EXISTS
        this.customCode = 409
    }
}

class UserIsAdminError extends Error {
    customMessage: String;
    customCode: Number;

    constructor() {
        super()
        this.customMessage = USER_IS_ADMIN
        this.customCode = 401
    }
}

class UnauthorizedUserError extends Error {
    customMessage: String;
    customCode: Number;

    constructor() {
        super()
        this.customMessage = UNAUTHORIZED_USER
        this.customCode = 401
    }
}

export { UserNotFoundError, UserNotMunicipalityError as UserNotManagerError, UserNotCitizenError as UserNotCustomerError, UserAlreadyExistsError, UserNotAdminError, UserIsAdminError, UnauthorizedUserError }