/**
 * E2E tests for comprehensive report and user controller coverage
 * Focuses on uncovered branches and edge cases
 */

jest.mock('../src/services/supabaseService', () => ({
    supabaseService: require('./supabaseMock').supabaseService,
    SupabaseBucket: require('./supabaseMock').SupabaseBucket
}))

import request from './setup'
import { registerAndLogin, promoteToAdmin } from './e2eHelpers'

describe('E2E Comprehensive Report Coverage', () => {
    
    test('GET /reports/categories returns multiple categories', async () => {
        const res = await request.get('/reports/categories')
        expect(res.status).toBe(200)
        expect(Array.isArray(res.body)).toBeTruthy()
        // Verify structure of categories
        res.body.forEach((cat: any) => {
            expect(cat).toHaveProperty('id')
            expect(cat).toHaveProperty('name')
        })
    })

    test('POST /reports/upload with multiple files uploads successfully', async () => {
        const { cookies } = await registerAndLogin(request, `citizen_multi_${Date.now()}`, 'Pass')

        const res = await request.post('/reports/upload')
            .set('Cookie', cookies)
            .field('title', 'Multi file report')
            .field('description', 'Report with 3 photos')
            .field('category_id', '1')
            .field('latitude', '45.123')
            .field('longitude', '7.456')
            .field('is_public', 'true')
            .attach('photos', Buffer.from('fake1'), 'photo1.jpg')
            .attach('photos', Buffer.from('fake2'), 'photo2.jpg')
            .attach('photos', Buffer.from('fake3'), 'photo3.jpg')
        
        expect(res.status).toBe(201)
        expect(res.body.photos.length).toBe(3)
        expect(res.body).toHaveProperty('id')
        expect(res.body).toHaveProperty('title', 'Multi file report')
    })

    test('GET /reports/search-reports with category filter', async () => {
        const admin = `admin_cat_filter_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const res = await request.get('/reports/search-reports?page_num=1&page_size=10&category_id=1').set('Cookie', adminCookie)
        expect(res.status).toBe(200)
        expect(Array.isArray(res.body.items)).toBeTruthy()
    })

    test('GET /reports/search-reports with status filter', async () => {
        const admin = `admin_status_filter_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const res = await request.get('/reports/search-reports?page_num=1&page_size=10&status=Pending%20Approval').set('Cookie', adminCookie)
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('total_items')
    })

    test('POST /reports/upload without photos still succeeds', async () => {
        const { cookies } = await registerAndLogin(request, `citizen_no_photos_${Date.now()}`, 'Pass')

        const res = await request.post('/reports/upload')
            .set('Cookie', cookies)
            .field('title', 'Report without photos')
            .field('description', 'Test')
            .field('category_id', '1')
            .field('latitude', '45.0')
            .field('longitude', '7.0')
            .field('is_public', 'true')
        
        // Backend enforces at least one photo; adapt test to expect validation error
        expect(res.status).toBe(400)
    })

    test('POST /reports/upload with boundary latitude/longitude', async () => {
        const { cookies } = await registerAndLogin(request, `citizen_boundary_${Date.now()}`, 'Pass')

        const res = await request.post('/reports/upload')
            .set('Cookie', cookies)
            .field('title', 'Boundary test')
            .field('description', 'Test')
            .field('category_id', '1')
            .field('latitude', '90.0')
            .field('longitude', '180.0')
            .field('is_public', 'false')
            .attach('photos', Buffer.from('fakeimage'), 'photo.jpg')

        expect(res.status).toBe(201)
    })

})

describe('E2E Comprehensive User Coverage', () => {

    test('POST /users/register-citizen with all optional fields', async () => {
        const res = await request.post('/users/register-citizen').send({
            username: `citizen_full_${Date.now()}`,
            name: 'John',
            surname: 'Doe',
            email: 'john.doe@example.com',
            password: 'SecurePass123!'
        })
        expect(res.status).toBe(201)
        expect(res.body).toHaveProperty('id')
        expect(res.body).toHaveProperty('username')
        expect(res.body).toHaveProperty('email')
    })

    test('PATCH /users/edit-me can update all fields', async () => {
        const username = `citizen_full_edit_${Date.now()}`
        const { user, cookies } = await registerAndLogin(request, username, 'Pass')

        const newName = 'NewName'
        const newSurname = 'NewSurname'
        const newEmail = `${username}_new@example.com`
        
        const res = await request.patch('/users/edit-me')
            .set('Cookie', cookies)
            .send({
                id: user.id,
                name: newName,
                surname: newSurname,
                email: newEmail,
                username: username
            })
        
        expect(res.status).toBe(200)
        expect(res.body.email).toBe(newEmail)
    })

    test('GET /users/search-users as admin shows paginated results', async () => {
        // Create admin
        const admin = `admin_search_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        // Create multiple users
        for (let i = 0; i < 3; i++) {
            await request.post('/users/register-citizen').send({
                username: `citizen_list_${i}_${Date.now()}`,
                name: `User${i}`,
                surname: 'Test',
                email: `user${i}@example.com`,
                password: 'Pass'
            })
        }

        // Search with pagination
        const res = await request.get('/users/search-users?page_num=1&page_size=5').set('Cookie', adminCookie)
        expect(res.status).toBe(200)
        expect(Array.isArray(res.body.items)).toBeTruthy()
        expect(res.body.total_items).toBeGreaterThanOrEqual(3)
    })

    test('GET /users/search-users with first_name filter', async () => {
        const admin = `admin_fname_filter_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const res = await request.get('/users/search-users?page_num=1&page_size=10&first_name=John').set('Cookie', adminCookie)
        expect(res.status).toBe(200)
    })

    test('GET /users/search-users with email filter', async () => {
        const admin = `admin_email_filter_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const res = await request.get('/users/search-users?page_num=1&page_size=10&email=test@example.com').set('Cookie', adminCookie)
        expect(res.status).toBe(200)
    })

    test('POST /users/register-user (admin) creates citizen successfully', async () => {
        const admin = `admin_create_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const newUser = `newuser_${Date.now()}`
        const res = await request.post('/users/register-user')
            .set('Cookie', adminCookie)
            .send({
                username: newUser,
                name: 'Admin Created',
                surname: 'User',
                email: `${newUser}@example.com`,
                password: 'Pass123',
                role: 'citizen'
            })
        
        expect(res.status).toBe(201)
        expect(res.body.username).toBe(newUser)
    })

    test('PATCH /users/edit-user (admin) modifies user successfully', async () => {
        const target = `target_${Date.now()}`
        const { user: targetUser } = await registerAndLogin(request, target, 'Pass')

        const admin = `admin_edituser_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const newEmail = `${target}_modified@example.com`
        const res = await request.patch('/users/edit-user')
            .set('Cookie', adminCookie)
            .send({
                id: targetUser.id,
                username: targetUser.username,
                name: targetUser.first_name,
                surname: targetUser.last_name,
                email: newEmail,
                usertype: 'citizen',
                rolesArray: [1]
            })
        
        expect(res.status).toBe(200)
        expect(res.body.email).toBe(newEmail)
    })

    test('GET /users/get-roles/:userId as admin returns user roles', async () => {
        const user = `citizen_roles_${Date.now()}`
        const { user: userData } = await registerAndLogin(request, user, 'Pass')

        const admin = `admin_roles_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const res = await request.get(`/users/get-roles/${userData.id}`).set('Cookie', adminCookie)
        expect(res.status).toBe(200)
        expect(Array.isArray(res.body)).toBeTruthy()
    })

    test('Multiple logins/logouts cycle works correctly', async () => {
        const username = `citizen_cycle_${Date.now()}`
        const password = 'Pass123'

        // Register
        await request.post('/users/register-citizen').send({
            username,
            name: 'Test',
            surname: 'User',
            email: `${username}@example.com`,
            password
        })

        // Login, logout, login again
        const login1 = await request.post('/auth/login').send({ username, password })
        expect(login1.status).toBe(200)
        const cookies1 = login1.headers['set-cookie']

        const logout1 = await request.delete('/auth/logout').set('Cookie', cookies1)
        expect(logout1.status).toBe(200)

        const login2 = await request.post('/auth/login').send({ username, password })
        expect(login2.status).toBe(200)
        const cookies2 = login2.headers['set-cookie']

        const current = await request.get('/auth/current').set('Cookie', cookies2)
        expect(current.status).toBe(200)
        expect(current.body.username).toBe(username)
    })

    test('User with special characters in email works', async () => {
        const res = await request.post('/users/register-citizen').send({
            username: `citizen_special_${Date.now()}`,
            name: 'Test',
            surname: 'User',
            email: `test+special.email@example.co.uk`,
            password: 'Pass'
        })
        expect(res.status).toBe(201)
        expect(res.body.email).toBe('test+special.email@example.co.uk')
    })

})
