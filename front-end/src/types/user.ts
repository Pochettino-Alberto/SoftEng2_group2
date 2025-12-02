export const UserType = {
  MUNICIPALITY: "municipality",
  CITIZEN: "citizen",
  ADMIN: "admin"
} as const;

export type UserType = typeof UserType[keyof typeof UserType];

export const UserRoleType = {
  REL_OFFICER: "publicRelations_officer",
  MAINTAINER: "external_maintainer",
  TECH_OFFICER: "technical_officer"
} as const;

export type UserRoleType = typeof UserRoleType[keyof typeof UserRoleType];

export interface UserRole {
    id: number;
    role_type: UserRoleType;
    label: string;
    description: string;
}


export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  user_type: UserType;
  userRoles : UserRole[];
}

export interface RegisterData {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface MunicipalityUser extends RegisterData {
  role?: string;
  rolesArray: number[];
}

export interface LoginData {
  username: string;
  password: string;
}

