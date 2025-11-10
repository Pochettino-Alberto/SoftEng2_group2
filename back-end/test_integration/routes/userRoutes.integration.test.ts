const request = require('supertest')
const { resetTestDB } = require('../helpers/resetTestDB')

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

    const fakeAuth = {
      isAdmin: (req: any, res: any, next: any) => { req.user = { id: 1, username: 'superadmin', user_type: 'admin' }; return next() },
      isLoggedIn: (req: any, res: any, next: any) => { req.user = { id: 1, username: 'superadmin', user_type: 'admin' }; return next() }
    }

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

    const fakeAuth = {
      isAdmin: (req: any, res: any, next: any) => { return res.status(401).json({ error: 'User is not an admin', status: 401 }) },
      isLoggedIn: (req: any, res: any, next: any) => { req.user = { id: target.id, username: target.username, user_type: 'citizen' }; return next() }
    }

    const ur = new UserRoutes(fakeAuth)
    app.use('/users', ur.getRouter())

    const res = await request(app)
      .patch('/users/edit-user')
      .send({ id: target.id, username: 'no_change' })
      .expect(401)

    expect(res.body.error).toBeDefined()
  })
})
