import request from './setup'
import { registerAndLogin, promoteToAdmin } from './e2eHelpers'
import db from '../src/dao/db'

describe('E2E User Routes', () => {
    test('POST /users/register-citizen and POST /auth/login', async () => {
        const username = `citizen_${Date.now()}`
        const password = 'P@ssw0rd'

        // register
        const regRes = await request.post('/users/register-citizen').send({
            username,
            name: 'Jane',
            surname: 'Citizen',
            email: `${username}@example.com`,
            password
        })
        expect(regRes.status).toBe(201)

        // login
        const loginRes = await request.post('/auth/login').send({ username, password })
        expect(loginRes.status).toBe(200)
        expect(loginRes.body).toHaveProperty('username', username)
    })

    test('PATCH /users/edit-me updates own info', async () => {
        const username = `citizen_${Date.now()}_edit`
        const password = 'P@ssw0rd'
        const { user, cookies } = await registerAndLogin(request, username, password)

        // update own info
        const newEmail = `${username}+edited@example.com`
        const patchRes = await request.patch('/users/edit-me')
            .set('Cookie', cookies)
            .send({ id: user.id, email: newEmail })

        expect(patchRes.status).toBe(200)
        expect(patchRes.body).toHaveProperty('email', newEmail)
    })

    test('Admin routes: register-user, get-roles, search-users', async () => {
        // create and promote an admin
        const adminName = `admin_${Date.now()}`
        const adminPass = 'AdminP4ss'
        const { user: adminUser, cookies: adminCookies } = await registerAndLogin(request, adminName, adminPass)
        await promoteToAdmin(adminName)

        // login again after promotion to ensure session reflects new role
        const loginAfterProm = await request.post('/auth/login').send({ username: adminName, password: adminPass })
        expect(loginAfterProm.status).toBe(200)
        const cookieAfter = loginAfterProm.headers['set-cookie']

        // create a new user via admin endpoint
        const newUsername = `user_from_admin_${Date.now()}`
        const createRes = await request.post('/users/register-user')
            .set('Cookie', cookieAfter)
            .send({ username: newUsername, name: 'Created', surname: 'ByAdmin', email: `${newUsername}@example.com`, password: 'UserP4ss', role: 'citizen' })
        expect(createRes.status).toBe(201)

        // get roles (admin only)
        const rolesRes = await request.get('/users/get-roles').set('Cookie', cookieAfter)
        expect(rolesRes.status).toBe(200)
        expect(Array.isArray(rolesRes.body)).toBeTruthy()

        // search-users
        const searchRes = await request.get('/users/search-users?page_num=1&page_size=10').set('Cookie', cookieAfter)
        expect(searchRes.status).toBe(200)
        expect(searchRes.body).toHaveProperty('items')
        // API uses `total_items`
        expect(searchRes.body).toHaveProperty('total_items')
    })

    test('Controller/DAO behaviors: get-by-id, unauthorized, duplicate register, delete user', async () => {
        // create two users
        const u1 = `userA_${Date.now()}`
        const p1 = 'P@ssw0rd'
        const { user: userA, cookies: cookiesA } = await registerAndLogin(request, u1, p1)

        const u2 = `userB_${Date.now()}`
        const p2 = 'P@ssw0rd'
        const { user: userB, cookies: cookiesB } = await registerAndLogin(request, u2, p2)

        // userA can see own info via auth current
        const current = await request.get('/auth/current').set('Cookie', cookiesA)
        expect(current.status).toBe(200)
        expect(current.body).toHaveProperty('username', u1)

        // userA cannot GET userB info (either unauthorized or not found depending on test ordering)
        const getOther = await request.get(`/users/${userB.id}`).set('Cookie', cookiesA)
        expect([401, 404]).toContain(getOther.status)

        // duplicate registration attempt returns 409
        const dup = await request.post('/users/register-citizen').send({ username: u2, name: 'X', surname: 'Y', email: `${u2}@example.com`, password: p2 })
        expect(dup.status).toBe(409)

        // promote userA to admin and delete userB
        await promoteToAdmin(u1)
        const loginAdmin = await request.post('/auth/login').send({ username: u1, password: p1 })
        expect(loginAdmin.status).toBe(200)
        const adminCookie = loginAdmin.headers['set-cookie']

        const del = await request.delete(`/users/${userB.id}`).set('Cookie', adminCookie)
        expect([200, 404]).toContain(del.status)

        // confirm userB now not found when admin tries to get it
        const getDeleted = await request.get(`/users/${userB.id}`).set('Cookie', adminCookie)
        expect(getDeleted.status).toBe(404)
    })

})
