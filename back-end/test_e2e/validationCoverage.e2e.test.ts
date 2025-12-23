/**
 * E2E tests for advanced controller coverage and branch paths
 */

jest.mock('../src/services/supabaseService', () => ({
    supabaseService: require('./supabaseMock').supabaseService,
    SupabaseBucket: require('./supabaseMock').SupabaseBucket
}))

import request from './setup'
import { registerAndLogin, promoteToAdmin } from './e2eHelpers'

describe('E2E Advanced Controller and Router Coverage', () => {
    
    test('POST /users/register-citizen validates required name field', async () => {
        const res = await request.post('/users/register-citizen').send({
            username: `citizen_${Date.now()}`,
            surname: 'User',
            email: 'test@example.com',
            password: 'Pass'
        })
        expect(res.status).toBe(422)
    })

    test('POST /users/register-citizen validates required surname field', async () => {
        const res = await request.post('/users/register-citizen').send({
            username: `citizen_${Date.now()}`,
            name: 'Test',
            email: 'test@example.com',
            password: 'Pass'
        })
        expect(res.status).toBe(422)
    })

    test('POST /users/register-citizen validates required email field', async () => {
        const res = await request.post('/users/register-citizen').send({
            username: `citizen_${Date.now()}`,
            name: 'Test',
            surname: 'User',
            password: 'Pass'
        })
        expect(res.status).toBe(422)
    })

    test('POST /users/register-citizen validates required password field', async () => {
        const res = await request.post('/users/register-citizen').send({
            username: `citizen_${Date.now()}`,
            name: 'Test',
            surname: 'User',
            email: 'test@example.com'
        })
        expect(res.status).toBe(422)
    })

    test('POST /auth/login validates required username', async () => {
        const res = await request.post('/auth/login').send({ password: 'pass' })
        expect(res.status).toBe(422)
    })

    test('POST /auth/login validates required password', async () => {
        const res = await request.post('/auth/login').send({ username: 'user' })
        expect(res.status).toBe(422)
    })

    test('POST /reports/upload validates required title field', async () => {
        const { cookies } = await registerAndLogin(request, `citizen_${Date.now()}`, 'Pass')
        
        const res = await request.post('/reports/upload')
            .set('Cookie', cookies)
            .field('description', 'Test')
            .field('category_id', '1')
            .field('latitude', '45.0')
            .field('longitude', '7.0')
            .field('is_public', 'true')
            .attach('photos', Buffer.from('fakeimage'), 'photo.jpg')
        expect(res.status).toBe(422)
    })

    test('POST /reports/upload validates required category_id field', async () => {
        const { cookies } = await registerAndLogin(request, `citizen_${Date.now()}`, 'Pass')
        
        const res = await request.post('/reports/upload')
            .set('Cookie', cookies)
            .field('title', 'Test')
            .field('description', 'Test')
            .field('latitude', '45.0')
            .field('longitude', '7.0')
            .field('is_public', 'true')
            .attach('photos', Buffer.from('fakeimage'), 'photo.jpg')
        expect(res.status).toBe(422)
    })

    test('POST /reports/upload validates required latitude field', async () => {
        const { cookies } = await registerAndLogin(request, `citizen_${Date.now()}`, 'Pass')
        
        const res = await request.post('/reports/upload')
            .set('Cookie', cookies)
            .field('title', 'Test')
            .field('description', 'Test')
            .field('category_id', '1')
            .field('longitude', '7.0')
            .field('is_public', 'true')
            .attach('photos', Buffer.from('fakeimage'), 'photo.jpg')
        expect(res.status).toBe(422)
    })

    test('POST /reports/upload validates required longitude field', async () => {
        const { cookies } = await registerAndLogin(request, `citizen_${Date.now()}`, 'Pass')
        
        const res = await request.post('/reports/upload')
            .set('Cookie', cookies)
            .field('title', 'Test')
            .field('description', 'Test')
            .field('category_id', '1')
            .field('latitude', '45.0')
            .field('is_public', 'true')
            .attach('photos', Buffer.from('fakeimage'), 'photo.jpg')
        expect(res.status).toBe(422)
    })

    test('POST /reports/upload is_public field is optional', async () => {
        const { cookies } = await registerAndLogin(request, `citizen_${Date.now()}`, 'Pass')
        
        const res = await request.post('/reports/upload')
            .set('Cookie', cookies)
            .field('title', 'Test')
            .field('description', 'Test')
            .field('category_id', '1')
            .field('latitude', '45.0')
            .field('longitude', '7.0')
            .attach('photos', Buffer.from('fakeimage'), 'photo.jpg')
        // is_public is optional, so should succeed with 201
        expect(res.status).toBe(201)
    })

    test('GET /reports/search-reports validates page_num as positive integer', async () => {
        const admin = `admin_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const res = await request.get('/reports/search-reports?page_num=0&page_size=10').set('Cookie', adminCookie)
        expect(res.status).toBe(422)
    })

    test('GET /reports/search-reports validates page_size as positive integer', async () => {
        const admin = `admin_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const res = await request.get('/reports/search-reports?page_num=1&page_size=0').set('Cookie', adminCookie)
        expect(res.status).toBe(422)
    })

    test('GET /users/search-users validates page_num as positive integer', async () => {
        const admin = `admin_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const res = await request.get('/users/search-users?page_num=-1&page_size=10').set('Cookie', adminCookie)
        expect(res.status).toBe(422)
    })

    test('PATCH /users/edit-me validates id field as integer', async () => {
        const { cookies } = await registerAndLogin(request, `citizen_${Date.now()}`, 'Pass')
        
        const res = await request.patch('/users/edit-me')
            .set('Cookie', cookies)
            .send({ id: 'not_an_int', email: 'test@example.com' })
        expect(res.status).toBe(422)
    })

    test('PATCH /users/edit-user validates id field required', async () => {
        const admin = `admin_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const res = await request.patch('/users/edit-user')
            .set('Cookie', adminCookie)
            .send({ email: 'test@example.com' })
        expect(res.status).toBe(422)
    })

    test('POST /users/register-user validates required fields', async () => {
        const admin = `admin_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const res = await request.post('/users/register-user')
            .set('Cookie', adminCookie)
            .send({ username: 'test' })
        expect(res.status).toBe(422)
    })

    test('POST /users/register-user validates role field', async () => {
        const admin = `admin_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const res = await request.post('/users/register-user')
            .set('Cookie', adminCookie)
            .send({
                username: `user_${Date.now()}`,
                name: 'Test',
                surname: 'User',
                email: 'test@example.com',
                password: 'Pass',
                role: 'invalid_role'
            })
        expect(res.status).toBe(422)
    })

    test('GET /users/get-roles/:userId validates userId as positive integer', async () => {
        const admin = `admin_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const res = await request.get('/users/get-roles/invalid').set('Cookie', adminCookie)
        expect(res.status).toBe(422)
    })

    test('GET /reports/report/:id with invalid id returns error', async () => {
        const admin = `admin_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const res = await request.get('/reports/report/invalid').set('Cookie', adminCookie)
        // Invalid ID results in 500 or 422 depending on implementation
        //expect([422, 500]).toContain(res.status)
        expect(res.status).toBe(404)
    })

    test('POST /users/register-user with duplicate username returns 409', async () => {
        const admin = `admin_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const username = `dupuser_${Date.now()}`
        
        // Create first user
        await request.post('/users/register-user')
            .set('Cookie', adminCookie)
            .send({
                username,
                name: 'Test',
                surname: 'User',
                email: 'first@example.com',
                password: 'Pass',
                role: 'citizen'
            })

        // Try to create second with same username
        const res = await request.post('/users/register-user')
            .set('Cookie', adminCookie)
            .send({
                username,
                name: 'Another',
                surname: 'User',
                email: 'second@example.com',
                password: 'Pass',
                role: 'citizen'
            })
        expect(res.status).toBe(409)
    })

    test('PATCH /users/edit-me can update optional fields individually', async () => {
        const username = `citizen_partial_${Date.now()}`
        const { user, cookies } = await registerAndLogin(request, username, 'Pass')

        // Update only name
        const res1 = await request.patch('/users/edit-me')
            .set('Cookie', cookies)
            .send({ id: user.id, name: 'UpdatedName' })
        expect(res1.status).toBe(200)
        expect(res1.body.first_name).toBe('UpdatedName')

        // Update only surname
        const res2 = await request.patch('/users/edit-me')
            .set('Cookie', cookies)
            .send({ id: user.id, surname: 'UpdatedSurname' })
        expect(res2.status).toBe(200)
        expect(res2.body.last_name).toBe('UpdatedSurname')
    })

})
