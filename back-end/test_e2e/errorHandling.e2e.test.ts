/**
 * E2E tests for error handling, edge cases, and low-coverage code paths
 * Tests focus on Supabase errors, user errors, validation, and auth edge cases
 */

jest.mock('../src/services/supabaseService', () => ({
    supabaseService: require('./supabaseMock').supabaseService,
    SupabaseBucket: require('./supabaseMock').SupabaseBucket
}))

import request from './setup'
import { registerAndLogin, promoteToAdmin } from './e2eHelpers'

describe('E2E Error Handling and Edge Cases', () => {
    
    test('POST /auth/login with invalid credentials returns 422 (validation)', async () => {
        const res = await request.post('/auth/login').send({ username: '', password: '' })
        expect(res.status).toBe(422)
    })

    test('POST /auth/login with invalid username/password returns 401', async () => {
        const res = await request.post('/auth/login').send({ username: 'nonexistent_user_xyz', password: 'WrongPassword' })
        expect(res.status).toBe(401)
    })

    test('DELETE /auth/logout works and clears session', async () => {
        const username = `citizen_logout_${Date.now()}`
        const password = 'P@ssw0rd'
        const { cookies } = await registerAndLogin(request, username, password)

        // Verify logged in by getting current user
        const current = await request.get('/auth/current').set('Cookie', cookies)
        expect(current.status).toBe(200)

        // Logout with DELETE
        const logoutRes = await request.delete('/auth/logout').set('Cookie', cookies)
        expect(logoutRes.status).toBe(200)

        // Try to access protected route without cookies -> should fail
        const afterLogout = await request.get('/auth/current')
        expect(afterLogout.status).toBe(401)
    })

    test('GET /auth/current without auth returns 401', async () => {
        const res = await request.get('/auth/current')
        expect(res.status).toBe(401)
    })

    test('POST /users/register-citizen with missing fields returns 422', async () => {
        const res = await request.post('/users/register-citizen').send({ username: 'test' })
        expect(res.status).toBe(422)
    })

    test('POST /users/register-citizen with duplicate username returns 409', async () => {
        const username = `citizen_dup_${Date.now()}`
        const password = 'P@ssw0rd'
        
        // Register first user
        await request.post('/users/register-citizen').send({
            username,
            name: 'First',
            surname: 'User',
            email: `${username}@example.com`,
            password
        })

        // Try to register with same username
        const dupRes = await request.post('/users/register-citizen').send({
            username,
            name: 'Second',
            surname: 'User',
            email: `${username}2@example.com`,
            password
        })
        expect(dupRes.status).toBe(409)
    })

    test('POST /users/register-user (admin) with missing fields returns 422', async () => {
        const admin = `admin_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const res = await request.post('/users/register-user').set('Cookie', adminCookie).send({ username: 'test' })
        expect(res.status).toBe(422)
    })

    test('POST /users/register-user (admin) without admin role returns 401', async () => {
        const citizen = `citizen_${Date.now()}`
        const { cookies } = await registerAndLogin(request, citizen, 'Pass')

        const res = await request.post('/users/register-user').set('Cookie', cookies).send({
            username: `newuser_${Date.now()}`,
            name: 'Test',
            surname: 'User',
            email: 'test@example.com',
            password: 'Pass'
        })
        expect(res.status).toBe(401)
    })

    test('GET /users/get-roles without admin role returns 401', async () => {
        const citizen = `citizen_${Date.now()}`
        const { cookies } = await registerAndLogin(request, citizen, 'Pass')

        const res = await request.get('/users/get-roles').set('Cookie', cookies)
        expect(res.status).toBe(401)
    })

    test('GET /users/get-roles as admin returns list of roles', async () => {
        const admin = `admin_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const res = await request.get('/users/get-roles').set('Cookie', adminCookie)
        expect(res.status).toBe(200)
        expect(Array.isArray(res.body)).toBeTruthy()
        expect(res.body.length).toBeGreaterThan(0)
    })

    test('PATCH /users/edit-user without admin role returns 401', async () => {
        const citizen = `citizen_${Date.now()}`
        const { user, cookies } = await registerAndLogin(request, citizen, 'Pass')

        const res = await request.patch('/users/edit-user').set('Cookie', cookies).send({ id: user.id, email: 'newemail@example.com' })
        expect(res.status).toBe(401)
    })

    test('PATCH /users/edit-me updates email correctly', async () => {
        const username = `citizen_edit_${Date.now()}`
        const { user, cookies } = await registerAndLogin(request, username, 'Pass')

        const newEmail = `${username}+new@example.com`
        const res = await request.patch('/users/edit-me').set('Cookie', cookies).send({ id: user.id, email: newEmail })
        expect(res.status).toBe(200)
        expect(res.body.email).toBe(newEmail)
    })

    test('PATCH /users/edit-me with missing fields returns 422', async () => {
        const { cookies } = await registerAndLogin(request, `citizen_${Date.now()}`, 'Pass')
        const res = await request.patch('/users/edit-me').set('Cookie', cookies).send({})
        expect(res.status).toBe(422)
    })

    test('DELETE /users/users/:userId without admin role returns 401 or 404', async () => {
        const citizen1 = `citizen_del_${Date.now()}`
        const { user: user1 } = await registerAndLogin(request, citizen1, 'Pass')

        const citizen2 = `citizen_del2_${Date.now()}`
        const { cookies: cookies2 } = await registerAndLogin(request, citizen2, 'Pass')

        const res = await request.delete(`/users/users/${user1.id}`).set('Cookie', cookies2)
        expect([401, 404]).toContain(res.status)
    })

    test('DELETE /users/1 (default admin) returns 401', async () => {
        const admin = `admin_del_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        // Attempt to delete default admin (id 1)
        const res = await request.delete('/users/1').set('Cookie', adminCookie)
        expect([401, 404]).toContain(res.status)
    })

    test('GET /users/search-users without admin role returns 401', async () => {
        const citizen = `citizen_${Date.now()}`
        const { cookies } = await registerAndLogin(request, citizen, 'Pass')

        const res = await request.get('/users/search-users?page_num=1&page_size=10').set('Cookie', cookies)
        expect(res.status).toBe(401)
    })

    test('GET /users/search-users with invalid page_num returns 422', async () => {
        const admin = `admin_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const res = await request.get('/users/search-users?page_num=invalid&page_size=10').set('Cookie', adminCookie)
        expect(res.status).toBe(422)
    })

    test('POST /reports/upload without auth returns 401', async () => {
        const res = await request.post('/reports/upload')
            .field('title', 'Test')
            .field('description', 'Test')
            .field('category_id', '1')
            .field('latitude', '45.0')
            .field('longitude', '7.0')
            .field('is_public', 'true')
            .attach('photos', Buffer.from('fakeimage'), 'photo.jpg')
        expect(res.status).toBe(401)
    })

    test('POST /reports/upload with missing fields returns 422', async () => {
        const { cookies } = await registerAndLogin(request, `citizen_${Date.now()}`, 'Pass')
        
        const res = await request.post('/reports/upload')
            .set('Cookie', cookies)
            .field('title', 'Test')
        expect([400, 422]).toContain(res.status)
    })

    test('POST /reports/upload with invalid latitude returns 422', async () => {
        const { cookies } = await registerAndLogin(request, `citizen_${Date.now()}`, 'Pass')
        
        const res = await request.post('/reports/upload')
            .set('Cookie', cookies)
            .field('title', 'Test')
            .field('description', 'Test')
            .field('category_id', '1')
            .field('latitude', 'invalid')
            .field('longitude', '7.0')
            .field('is_public', 'true')
            .attach('photos', Buffer.from('fakeimage'), 'photo.jpg')
        expect(res.status).toBe(422)
    })

    test('GET /reports/search-reports without auth returns 401', async () => {
        const res = await request.get('/reports/search-reports?page_num=1&page_size=10')
        expect(res.status).toBe(401)
    })

    test('GET /reports/search-reports without admin role returns 401', async () => {
        const citizen = `citizen_${Date.now()}`
        const { cookies } = await registerAndLogin(request, citizen, 'Pass')

        const res = await request.get('/reports/search-reports?page_num=1&page_size=10').set('Cookie', cookies)
        expect(res.status).toBe(401)
    })

    test('GET /reports/report/:id with non-existent ID returns error', async () => {
        const admin = `admin_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const res = await request.get('/reports/report/999999').set('Cookie', adminCookie)
        expect([404, 500]).toContain(res.status)
    })

    test('GET /reports/report/:id without auth returns 200', async () => {
        const res = await request.get('/reports/report/1')
        expect(res.status).toBe(200)
    })



    test('GET /reports/search-reports with pagination works correctly', async () => {
        const admin = `admin_paginate_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        // Page 1
        const res1 = await request.get('/reports/search-reports?page_num=1&page_size=5').set('Cookie', adminCookie)
        expect(res1.status).toBe(200)
        expect(res1.body).toHaveProperty('items')
        expect(res1.body).toHaveProperty('total_items')

        // Page 2
        const res2 = await request.get('/reports/search-reports?page_num=2&page_size=5').set('Cookie', adminCookie)
        expect(res2.status).toBe(200)
    })

    test('POST /users/register-citizen with weak password still succeeds (no validation)', async () => {
        const res = await request.post('/users/register-citizen').send({
            username: `citizen_weak_${Date.now()}`,
            name: 'Test',
            surname: 'User',
            email: 'test@example.com',
            password: 'a'
        })
        expect(res.status).toBe(201)
    })

    test('PATCH /users/edit-user (admin) sets multiple roles correctly', async () => {
        const target = `edit_target_${Date.now()}`
        const { user: targetUser } = await registerAndLogin(request, target, 'Pass')

        const admin = `admin_edit_roles_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        // Edit with role assignment (roles exist from default values)
        const editRes = await request.patch('/users/edit-user')
            .set('Cookie', adminCookie)
            .send({
                id: targetUser.id,
                username: targetUser.username,
                name: targetUser.first_name,
                surname: targetUser.last_name,
                email: targetUser.email,
                usertype: 'citizen',
                rolesArray: [1, 2]
            })
        expect(editRes.status).toBe(200)
    })

})
