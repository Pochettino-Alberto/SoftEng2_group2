/**
 * E2E tests for critical error paths and max coverage improvements
 */

jest.mock('../src/services/supabaseService', () => ({
    supabaseService: require('./supabaseMock').supabaseService,
    SupabaseBucket: require('./supabaseMock').SupabaseBucket
}))

import request from './setup'
import { registerAndLogin, promoteToAdmin } from './e2eHelpers'

describe('E2E Maximum Coverage Tests', () => {
    
    test('GET /users/search-users with role filter', async () => {
        const admin = `admin_role_filter_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const res = await request.get('/users/search-users?page_num=1&page_size=10&role=citizen').set('Cookie', adminCookie)
        expect(res.status).toBe(200)
        expect(Array.isArray(res.body.items)).toBeTruthy()
    })

    test('GET /users/search-users with last_name filter', async () => {
        const admin = `admin_lname_filter_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const res = await request.get('/users/search-users?page_num=1&page_size=10&last_name=Doe').set('Cookie', adminCookie)
        expect(res.status).toBe(200)
    })

    test('POST /reports/upload with boolean string "false"', async () => {
        const { cookies } = await registerAndLogin(request, `citizen_bool_${Date.now()}`, 'Pass')

        const res = await request.post('/reports/upload')
            .set('Cookie', cookies)
            .field('title', 'Private report')
            .field('description', 'Test')
            .field('category_id', '1')
            .field('latitude', '45.0')
            .field('longitude', '7.0')
            .field('is_public', 'false')
            .attach('photos', Buffer.from('fakeimage'), 'photo.jpg')
        
        expect(res.status).toBe(201)
        expect(res.body.is_public).toBe(false)
    })

    test('GET /reports/categories response contains correct structure', async () => {
        const res = await request.get('/reports/categories')
        expect(res.status).toBe(200)
        expect(Array.isArray(res.body)).toBeTruthy()
        if (res.body.length > 0) {
            const category = res.body[0]
            expect(category).toHaveProperty('id')
            expect(category).toHaveProperty('name')
            expect(category).toHaveProperty('icon')
            expect(category).toHaveProperty('description')
        }
    })

    test('POST /users/register-citizen response includes all user fields', async () => {
        const res = await request.post('/users/register-citizen').send({
            username: `citizen_fields_${Date.now()}`,
            name: 'John',
            surname: 'Doe',
            email: 'john@example.com',
            password: 'Pass123'
        })
        expect(res.status).toBe(201)
        const user = res.body
        expect(user).toHaveProperty('id')
        expect(user).toHaveProperty('username')
        expect(user).toHaveProperty('first_name')
        expect(user).toHaveProperty('last_name')
        expect(user).toHaveProperty('email')
        expect(user).toHaveProperty('user_type')
    })

    test('GET /auth/current returns logged-in user with all fields', async () => {
        const username = `citizen_current_${Date.now()}`
        const { cookies } = await registerAndLogin(request, username, 'Pass')

        const res = await request.get('/auth/current').set('Cookie', cookies)
        expect(res.status).toBe(200)
        expect(res.body.username).toBe(username)
        expect(res.body).toHaveProperty('id')
        expect(res.body).toHaveProperty('user_type')
    })

    test('PATCH /users/edit-me returns updated user with correct fields', async () => {
        const username = `citizen_update_${Date.now()}`
        const { user, cookies } = await registerAndLogin(request, username, 'Pass')

        const newName = 'UpdatedName'
        const res = await request.patch('/users/edit-me')
            .set('Cookie', cookies)
            .send({
                id: user.id,
                name: newName
            })
        
        expect(res.status).toBe(200)
        expect(res.body.first_name).toBe(newName)
    })

    test('DELETE /users/users/:userId as admin deletes user and returns 200', async () => {
        const toDelete = `citizen_del_${Date.now()}`
        const { user: delUser } = await registerAndLogin(request, toDelete, 'Pass')

        const admin = `admin_del_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const res = await request.delete(`/users/users/${delUser.id}`).set('Cookie', adminCookie)
        expect(res.status).toBe(200)
    })

    test('POST /reports/upload creates report with correct default fields', async () => {
        const { cookies } = await registerAndLogin(request, `citizen_defaults_${Date.now()}`, 'Pass')

        const res = await request.post('/reports/upload')
            .set('Cookie', cookies)
            .field('title', 'Test report')
            .field('description', 'Test description')
            .field('category_id', '1')
            .field('latitude', '45.123')
            .field('longitude', '7.456')
            .field('is_public', 'true')
            .attach('photos', Buffer.from('fakeimage'), 'photo.jpg')
        
        expect(res.status).toBe(201)
        const report = res.body
        expect(report).toHaveProperty('id')
        expect(report.title).toBe('Test report')
        expect(report.description).toBe('Test description')
        expect(report.category_id).toBe(1)
        expect(report.latitude).toBe(45.123)
        expect(report.longitude).toBe(7.456)
        expect(report.is_public).toBe(true)
    })

    test('GET /reports/search-reports returns paginated results with correct structure', async () => {
        const admin = `admin_paginate_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const res = await request.get('/reports/search-reports?page_num=1&page_size=10').set('Cookie', adminCookie)
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('items')
        expect(res.body).toHaveProperty('total_items')
        expect(Array.isArray(res.body.items)).toBeTruthy()
    })

    test('GET /users/search-users returns paginated results with correct structure', async () => {
        const admin = `admin_users_paginate_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const res = await request.get('/users/search-users?page_num=1&page_size=10').set('Cookie', adminCookie)
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('items')
        expect(res.body).toHaveProperty('total_items')
        expect(Array.isArray(res.body.items)).toBeTruthy()
        // Verify user structure
        if (res.body.items.length > 0) {
            const user = res.body.items[0]
            expect(user).toHaveProperty('id')
            expect(user).toHaveProperty('username')
        }
    })

    test('POST /users/register-user creates user with correct role assignment', async () => {
        const admin = `admin_role_create_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const newUser = `newuser_role_${Date.now()}`
        const res = await request.post('/users/register-user')
            .set('Cookie', adminCookie)
            .send({
                username: newUser,
                name: 'New',
                surname: 'User',
                email: `${newUser}@example.com`,
                password: 'Pass123',
                role: 'citizen'
            })
        
        expect(res.status).toBe(201)
        expect(res.body.username).toBe(newUser)
        expect(res.body.user_type).toBe('citizen')
    })

    test('PATCH /users/edit-user updates user with role assignment', async () => {
        const target = `target_role_${Date.now()}`
        const { user: targetUser } = await registerAndLogin(request, target, 'Pass')

        const admin = `admin_edit_role_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const res = await request.patch('/users/edit-user')
            .set('Cookie', adminCookie)
            .send({
                id: targetUser.id,
                username: targetUser.username,
                name: targetUser.first_name,
                surname: targetUser.last_name,
                email: targetUser.email,
                usertype: 'citizen',
                rolesArray: [1]
            })
        
        expect(res.status).toBe(200)
        expect(res.body.id).toBe(targetUser.id)
    })

    test('GET /reports/report/:id returns full report with photos array', async () => {
        const citizen = `citizen_photo_${Date.now()}`
        const { cookies: citizenCookies } = await registerAndLogin(request, citizen, 'Pass')

        // Upload report with photos
        const uploadRes = await request.post('/reports/upload')
            .set('Cookie', citizenCookies)
            .field('title', 'Report with photos')
            .field('description', 'Test')
            .field('category_id', '1')
            .field('latitude', '45.0')
            .field('longitude', '7.0')
            .field('is_public', 'true')
            .attach('photos', Buffer.from('fake1'), 'photo1.jpg')
            .attach('photos', Buffer.from('fake2'), 'photo2.jpg')
        
        expect(uploadRes.status).toBe(201)
        const reportId = uploadRes.body.id

        // Create admin and get report
        const admin = `admin_getreport_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const getRes = await request.get(`/reports/report/${reportId}`).set('Cookie', adminCookie)
        expect(getRes.status).toBe(200)
        expect(getRes.body.id).toBe(reportId)
        expect(Array.isArray(getRes.body.photos)).toBeTruthy()
        expect(getRes.body.photos.length).toBe(2)
    })

    test('POST /auth/login with correct credentials logs in successfully', async () => {
        const username = `citizen_login_${Date.now()}`
        const password = 'SecurePass123'

        // Register
        await request.post('/users/register-citizen').send({
            username,
            name: 'Test',
            surname: 'User',
            email: `${username}@example.com`,
            password
        })

        // Login
        const res = await request.post('/auth/login').send({ username, password })
        expect(res.status).toBe(200)
        expect(res.body.username).toBe(username)
        expect(res.headers).toHaveProperty('set-cookie')
    })

})
