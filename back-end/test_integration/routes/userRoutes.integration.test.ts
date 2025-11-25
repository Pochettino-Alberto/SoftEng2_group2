const request = require('supertest')
const { resetTestDB } = require('../helpers/resetTestDB')
const { makeFakeAuth } = require('../helpers/makeFakeAuth')

beforeAll(async () => {
  process.env.NODE_ENV = 'test'
  await resetTestDB()
})

describe('UserRoutes integration - edit-user', () => {
  test('admin can edit another user via PATCH /users/edit-user', async () => {
    const express = require('express')
    const app = express()
    app.use(express.json())

    const UserDAO = require('../../src/dao/userDAO').default
    const { UserRoutes } = require('../../src/routers/userRoutes')

    const dao = new UserDAO()
    await dao.createUser('targetuser', 'First', 'Last', 't@int.test', 'pwd', 'citizen')
    const target = await dao.getUserByUsername('targetuser')

    const fakeAuth = makeFakeAuth({
      isAdmin: (req: any, res: any, next: any) => { req.user = { id: 1, username: 'superadmin', user_type: 'admin' }; return next() },
      isLoggedIn: (req: any, res: any, next: any) => { req.user = { id: 1, username: 'superadmin', user_type: 'admin' }; return next() }
    })

    const ur = new UserRoutes(fakeAuth)
    app.use('/users', ur.getRouter())

    const res = await request(app)
      .patch('/users/edit-user')
      .send({ id: target.id, username: 'updated_user', name: 'UpdatedFirst', surname: 'UpdatedLast', email: 'upd@int.test', usertype: 'municipality' })
      .expect(200)

    expect(res.body.username).toBe('updated_user')
    expect(res.body.email).toBe('upd@int.test')

    const stored = await dao.getUserById(target.id)
    expect(stored.username).toBe('updated_user')
    expect(stored.first_name).toBe('UpdatedFirst')
    expect(stored.last_name).toBe('UpdatedLast')
    expect(stored.email).toBe('upd@int.test')
    expect(stored.user_type).toBe('municipality')
  })

  test('non-admin accessing edit-user returns 401', async () => {
    const express = require('express')
    const app = express()
    app.use(express.json())

    const UserDAO = require('../../src/dao/userDAO').default
    const { UserRoutes } = require('../../src/routers/userRoutes')

    const dao = new UserDAO()
    await dao.createUser('otheruser', 'O', 'User', 'o@int.test', 'pwd', 'citizen')
    const target = await dao.getUserByUsername('otheruser')

    const fakeAuth = makeFakeAuth({
      isAdmin: (req: any, res: any, next: any) => { return res.status(401).json({ error: 'User is not an admin', status: 401 }) },
      isLoggedIn: (req: any, res: any, next: any) => { req.user = { id: target.id, username: target.username, user_type: 'citizen' }; return next() }
    })

    const ur = new UserRoutes(fakeAuth)
    app.use('/users', ur.getRouter())

    const res = await request(app)
      .patch('/users/edit-user')
      .send({ id: target.id, username: 'no_change' })
      .expect(401)

    expect(res.body.error).toBeDefined()
  })

  test('POST /users/register-citizen creates a new citizen (no auth)', async () => {
    const express = require('express')
    const app = express()
    app.use(express.json())

    const UserDAO = require('../../src/dao/userDAO').default
    const { UserRoutes } = require('../../src/routers/userRoutes')

    const dao = new UserDAO()

    const fakeAuth = makeFakeAuth()
    const ur = new UserRoutes(fakeAuth)
    app.use('/users', ur.getRouter())

    await request(app)
      .post('/users/register-citizen')
      .send({ username: 'newcitizen', name: 'C', surname: 'Citizen', email: 'c@int.test', password: 'pwd' })
      .expect(201)

    const stored = await dao.getUserByUsername('newcitizen')
    expect(stored).toBeDefined()
    expect(stored.user_type).toBe('citizen')
  })

  test('POST /users/register-user requires admin and creates user', async () => {
    const express = require('express')
    const app = express()
    app.use(express.json())

    const UserDAO = require('../../src/dao/userDAO').default
    const { UserRoutes } = require('../../src/routers/userRoutes')

    const dao = new UserDAO()

    const fakeAuth = makeFakeAuth({ isAdmin: (req: any, res: any, next: any) => { req.user = { id: 1, username: 'superadmin', user_type: 'admin' }; return next() } })

    const ur = new UserRoutes(fakeAuth)
    app.use('/users', ur.getRouter())

    await request(app)
      .post('/users/register-user')
      .send({ username: 'managed', name: 'M', surname: 'User', email: 'm@int.test', password: 'pwd', role: 'municipality' })
      .expect(201)

    const stored = await dao.getUserByUsername('managed')
    expect(stored).toBeDefined()
    expect(stored.user_type).toBe('municipality')
  })

  test('PATCH /users/edit-me allows logged-in user to update own info', async () => {
    const express = require('express')
    const app = express()
    app.use(express.json())

    const UserDAO = require('../../src/dao/userDAO').default
    const { UserRoutes } = require('../../src/routers/userRoutes')

    const dao = new UserDAO()
    await dao.createUser('selfie', 'S', 'Elf', 's@int.test', 'pwd', 'citizen')
    const stored = await dao.getUserByUsername('selfie')

    const fakeAuth = makeFakeAuth({ isLoggedIn: (req: any, res: any, next: any) => { req.user = { id: stored.id, username: stored.username, user_type: stored.user_type }; return next() } })

    const ur = new UserRoutes(fakeAuth)
    app.use('/users', ur.getRouter())

    const res = await request(app)
      .patch('/users/edit-me')
      .send({ id: stored.id, username: 'selfie_new', name: 'SelfNew', surname: 'New', email: 'sn@int.test' })
      .expect(200)

    expect(res.body.username).toBe('selfie_new')
    const reloaded = await dao.getUserById(stored.id)
    expect(reloaded.username).toBe('selfie_new')
    expect(reloaded.email).toBe('sn@int.test')
  })

  test('GET /users/users/:userId returns user when authorized', async () => {
    const express = require('express')
    const app = express()
    app.use(express.json())

    const UserDAO = require('../../src/dao/userDAO').default
    const { UserRoutes } = require('../../src/routers/userRoutes')

    const dao = new UserDAO()
    await dao.createUser('getme', 'G', 'Et', 'g@int.test', 'pwd', 'citizen')
    const target = await dao.getUserByUsername('getme')

    const fakeAuth = makeFakeAuth({ isLoggedIn: (req: any, res: any, next: any) => { req.user = { id: target.id, username: target.username, user_type: target.user_type }; return next() } })

    const ur = new UserRoutes(fakeAuth)
    app.use('/users', ur.getRouter())

    const res = await request(app)
      .get(`/users/users/${target.id}`)
      .expect(200)

    expect(res.body.username).toBe('getme')
  })

  test('DELETE /users/users/:userId allows admin to delete another user', async () => {
    const express = require('express')
    const app = express()
    app.use(express.json())

    const UserDAO = require('../../src/dao/userDAO').default
    const { UserRoutes } = require('../../src/routers/userRoutes')

    const dao = new UserDAO()
    await dao.createUser('todelete', 'T', 'Del', 'td@int.test', 'pwd', 'citizen')
    const target = await dao.getUserByUsername('todelete')

    const fakeAuth = makeFakeAuth({
      isLoggedIn: (req: any, res: any, next: any) => { req.user = { id: 1, username: 'superadmin', user_type: 'admin' }; return next() },
      isAdmin: (req: any, res: any, next: any) => { req.user = { id: 1, username: 'superadmin', user_type: 'admin' }; return next() }
    })

    const ur = new UserRoutes(fakeAuth)
    app.use('/users', ur.getRouter())

    await request(app)
      .delete(`/users/users/${target.id}`)
      .expect(200)

    const { UserNotFoundError } = require('../../src/errors/userError')
    await expect(dao.getUserById(target.id)).rejects.toBeInstanceOf(UserNotFoundError)
  })

  test('GET /users/search-users returns paginated users for admin', async () => {
    const express = require('express')
    const app = express()
    app.use(express.json())

    const UserDAO = require('../../src/dao/userDAO').default
    const { UserRoutes } = require('../../src/routers/userRoutes')
    const ErrorHandler = require('../../src/helper').default

    const dao = new UserDAO()

    // create multiple users to test pagination and results
    for (let i = 0; i < 5; i++) {
      await dao.createUser(`search${i}`, `First${i}`, `Last${i}`, `s${i}@int.test`, 'pwd', 'citizen')
    }

    const fakeAuth = makeFakeAuth({ isAdmin: (req: any, res: any, next: any) => { req.user = { id: 1, username: 'superadmin', user_type: 'admin' }; return next() } })

    const ur = new UserRoutes(fakeAuth)
    app.use('/users', ur.getRouter())
    ErrorHandler.registerErrorHandler(app)

    const res = await request(app)
      .get('/users/search-users')
      .expect(200)

    expect(res.body).toHaveProperty('page_num')
    expect(res.body).toHaveProperty('page_size')
    expect(res.body).toHaveProperty('total_items')
    expect(res.body).toHaveProperty('items')
    expect(Array.isArray(res.body.items)).toBe(true)
    expect(res.body.total_items).toBeGreaterThanOrEqual(5)
  })

  test('GET /users/search-users filters by first_name and role', async () => {
    const express = require('express')
    const app = express()
    app.use(express.json())

    const UserDAO = require('../../src/dao/userDAO').default
    const { UserRoutes } = require('../../src/routers/userRoutes')
    const ErrorHandler = require('../../src/helper').default

    const dao = new UserDAO()
    // create unique user for filter
    await dao.createUser('uniqueSearcher', 'UniqueFirst', 'FindMe', 'uniq@int.test', 'pwd', 'municipality')

    const fakeAuth = makeFakeAuth({ isAdmin: (req: any, res: any, next: any) => { req.user = { id: 1, username: 'superadmin', user_type: 'admin' }; return next() } })

    const ur = new UserRoutes(fakeAuth)
    app.use('/users', ur.getRouter())
    ErrorHandler.registerErrorHandler(app)

    const res = await request(app)
      .get('/users/search-users')
      .query({ first_name: 'UniqueFirst', role: 'municipality' })
      .expect(200)

    expect(res.body.items.some((u: any) => u.username === 'uniqueSearcher')).toBe(true)
  })

  test('GET /users/search-users invalid page_num returns 422', async () => {
    const express = require('express')
    const app = express()
    app.use(express.json())

    const { UserRoutes } = require('../../src/routers/userRoutes')
    const ErrorHandler = require('../../src/helper').default

    const fakeAuth = makeFakeAuth({ isAdmin: (req: any, res: any, next: any) => { req.user = { id: 1, username: 'superadmin', user_type: 'admin' }; return next() } })

    const ur = new UserRoutes(fakeAuth)
    app.use('/users', ur.getRouter())
    ErrorHandler.registerErrorHandler(app)

    const res = await request(app)
      .get('/users/search-users')
      .query({ page_num: 'not-an-int' })
      .expect(422)

    expect(res.body.error).toBeDefined()
  })

  test('GET /users/search-users returns 401 for non-admin', async () => {
    const express = require('express')
    const app = express()
    app.use(express.json())

    const { UserRoutes } = require('../../src/routers/userRoutes')
    const ErrorHandler = require('../../src/helper').default

    const fakeAuth = makeFakeAuth({ isAdmin: (req: any, res: any, next: any) => { return res.status(401).json({ error: 'User is not an admin', status: 401 }) } })

    const ur = new UserRoutes(fakeAuth)
    app.use('/users', ur.getRouter())
    ErrorHandler.registerErrorHandler(app)

    const res = await request(app)
      .get('/users/search-users')
      .expect(401)

    expect(res.body.error).toBeDefined()
  })

  test('GET /users/get-roles returns roles for admin', async () => {
    const express = require('express')
    const app = express()
    app.use(express.json())

    const UserDAO = require('../../src/dao/userDAO').default
    const { UserRoutes } = require('../../src/routers/userRoutes')
    const ErrorHandler = require('../../src/helper').default

    const dao = new UserDAO()

    const fakeAuth = makeFakeAuth({ isAdmin: (req: any, res: any, next: any) => { req.user = { id: 1, username: 'superadmin', user_type: 'admin' }; return next() } })

    const ur = new UserRoutes(fakeAuth)
    app.use('/users', ur.getRouter())
    // register centralized error handler so thrown errors map to proper JSON responses
    ErrorHandler.registerErrorHandler(app)

    const res = await request(app)
      .get('/users/get-roles')
      .expect(200)

    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThanOrEqual(0)
  })

  test('GET /users/get-roles/:userId returns roles for specific user', async () => {
    const express = require('express')
    const app = express()
    app.use(express.json())

    const UserDAO = require('../../src/dao/userDAO').default
    const { UserRoutes } = require('../../src/routers/userRoutes')
    const ErrorHandler = require('../../src/helper').default

    const dao = new UserDAO()
    await dao.createUser('roleuser', 'R', 'User', 'ru@int.test', 'pwd', 'citizen')
    const target = await dao.getUserByUsername('roleuser')

    // assign a known role id (1 exists in default values)
    await dao.assignRoles(target.id, [1])

    const fakeAuth = makeFakeAuth({ isAdmin: (req: any, res: any, next: any) => { req.user = { id: 1, username: 'superadmin', user_type: 'admin' }; return next() } })

    const ur = new UserRoutes(fakeAuth)
    app.use('/users', ur.getRouter())
    ErrorHandler.registerErrorHandler(app)

    const res = await request(app)
      .get(`/users/get-roles/${target.id}`)
      .expect(200)

    expect(Array.isArray(res.body)).toBe(true)
    // should contain at least the role we assigned
    const ids = res.body.map((r: any) => r.RoleID)
    expect(ids).toContain(1)
  })

  test('GET /users/get-roles/:userId invalid param returns 422', async () => {
    const express = require('express')
    const app = express()
    app.use(express.json())

    const { UserRoutes } = require('../../src/routers/userRoutes')
    const ErrorHandler = require('../../src/helper').default

    const fakeAuth = makeFakeAuth({ isAdmin: (req: any, res: any, next: any) => { req.user = { id: 1, username: 'superadmin', user_type: 'admin' }; return next() } })

    const ur = new UserRoutes(fakeAuth)
    app.use('/users', ur.getRouter())
    ErrorHandler.registerErrorHandler(app)

    const res = await request(app)
      .get('/users/get-roles/not-an-int')
      .expect(422)

    expect(res.body.error).toBeDefined()
  })

  test('POST /users/admin/create-municipality-user with rolesArray assigns roles', async () => {
    const express = require('express')
    const app = express()
    app.use(express.json())

    const UserDAO = require('../../src/dao/userDAO').default
    const { UserRoutes } = require('../../src/routers/userRoutes')

    const dao = new UserDAO()

    const fakeAuth = makeFakeAuth({ isAdmin: (req: any, res: any, next: any) => { req.user = { id: 1, username: 'superadmin', user_type: 'admin' }; return next() } })

    const ur = new UserRoutes(fakeAuth)
    app.use('/users', ur.getRouter())

    const payload = { username: 'muni_user', name: 'M', surname: 'U', email: 'mu@int.test', password: 'pwd', rolesArray: [1] }

    await request(app)
      .post('/users/admin/create-municipality-user')
      .send(payload)
      .expect(201)

    const stored = await dao.getUserByUsername('muni_user')
    expect(stored).toBeDefined()

    const roles = await dao.getRoles(stored.id)
    expect(Array.isArray(roles)).toBe(true)
    expect(roles.map((r: any) => r.RoleID ?? r.id)).toContain(1)
  })

  test('POST /users/admin/assign-roles validates input and sets roles', async () => {
    const express = require('express')
    const app = express()
    app.use(express.json())

    const UserDAO = require('../../src/dao/userDAO').default
    const { UserRoutes } = require('../../src/routers/userRoutes')

    const dao = new UserDAO()
    const created = await dao.createUser('assign_target', 'A', 'T', 'at@int.test', 'pwd', 'citizen')

    const fakeAuth = makeFakeAuth({ isAdmin: (req: any, res: any, next: any) => { req.user = { id: 1, username: 'superadmin', user_type: 'admin' }; return next() } })

    const ur = new UserRoutes(fakeAuth)
    app.use('/users', ur.getRouter())

    // invalid payload (missing rolesArray) should return 422
    await request(app)
      .post('/users/admin/assign-roles')
      .send({ userId: created.id })
      .expect(422)

    // valid payload sets roles
    await request(app)
      .post('/users/admin/assign-roles')
      .send({ userId: created.id, rolesArray: [1, 2] })
      .expect(200)

    const roles = await dao.getRoles(created.id)
    expect(roles.map((r: any) => r.RoleID ?? r.id)).toEqual(expect.arrayContaining([1,2]))
  })
})
