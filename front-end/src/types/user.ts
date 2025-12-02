export const UserType = {
  MUNICIPALITY: "municipality",
  CITIZEN: "citizen",
  ADMIN: "admin"
} as const;

export type UserType = typeof UserType[keyof typeof UserType];

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  user_type: UserType;
  userRoles?: Role[];
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
  rolesArray:  number[];
}

export interface LoginData {
  username: string;
  password: string;
}

export interface Role {
  id: number;
  label: string;
  description: string;
  role_type: string;
}
