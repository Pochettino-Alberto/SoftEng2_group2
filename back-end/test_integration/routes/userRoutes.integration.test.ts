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
})
