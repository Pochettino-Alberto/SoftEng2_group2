export function makeFakeAuth(overrides: any = {}) {
  const base = {
    isAdmin: (req: any, res: any, next: any) => next(),
    isLoggedIn: (req: any, res: any, next: any) => next(),
    isCitizen: (req: any, res: any, next: any) => next(),
    isMunicipality: (req: any, res: any, next: any) => next(),
    isAdminOrMunicipality: (req: any, res: any, next: any) => next(),
  }
  return { ...base, ...overrides }
}

export default makeFakeAuth
