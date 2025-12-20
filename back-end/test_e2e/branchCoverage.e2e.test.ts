/**
 * E2E tests for critical branch coverage on components and DAO
 */

jest.mock('../src/services/supabaseService', () => ({
    supabaseService: require('./supabaseMock').supabaseService,
    SupabaseBucket: require('./supabaseMock').SupabaseBucket
}))

import request from './setup'
import { registerAndLogin, promoteToAdmin } from './e2eHelpers'

describe('E2E Critical Branch and Component Coverage', () => {

    test('POST /reports/upload with multiple photos creates report with all photos', async () => {
        const { cookies } = await registerAndLogin(request, `citizen_multiphoto_${Date.now()}`, 'Pass')

        const res = await request.post('/reports/upload')
            .set('Cookie', cookies)
            .field('title', 'Multi photo report')
            .field('description', 'Test')
            .field('category_id', '2')
            .field('latitude', '45.123')
            .field('longitude', '7.789')
            .field('is_public', 'false')
            .attach('photos', Buffer.from('photo1'), 'photo1.jpg')
            .attach('photos', Buffer.from('photo2'), 'photo2.jpg')
            .attach('photos', Buffer.from('photo3'), 'photo3.jpg')
        
        expect(res.status).toBe(201)
        expect(res.body.photos.length).toBe(3)
        expect(res.body.category_id).toBe(2)
        expect(res.body.is_public).toBe(false)
        // Check photos have correct structure
        res.body.photos.forEach((photo: any, index: number) => {
            expect(photo).toHaveProperty('position', index + 1)
            expect(photo).toHaveProperty('photo_public_url')
            expect(photo).toHaveProperty('photo_path')
        })
    })

    test('GET /reports/search-reports with different page sizes', async () => {
        const admin = `admin_pagesize_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        // Create multiple reports to test pagination
        for (let i = 0; i < 5; i++) {
            const citizen = `citizen_${i}_${Date.now()}`
            const { cookies } = await registerAndLogin(request, citizen, 'Pass')
            await request.post('/reports/upload')
                .set('Cookie', cookies)
                .field('title', `Report ${i}`)
                .field('description', 'Test')
                .field('category_id', '1')
                .field('latitude', `45.${i}`)
                .field('longitude', `7.${i}`)
                .field('is_public', 'true')
        }

        // Test page_size=2
        const res1 = await request.get('/reports/search-reports?page_num=1&page_size=2').set('Cookie', adminCookie)
        expect(res1.status).toBe(200)
        expect(res1.body.items.length).toBeLessThanOrEqual(2)

        // Test page_size=10
        const res2 = await request.get('/reports/search-reports?page_num=1&page_size=10').set('Cookie', adminCookie)
        expect(res2.status).toBe(200)
        expect(res2.body.items.length).toBeLessThanOrEqual(10)
    })

    test('GET /users/search-users returns users with complete information', async () => {
        const admin = `admin_userinfo_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const res = await request.get('/users/search-users?page_num=1&page_size=20').set('Cookie', adminCookie)
        expect(res.status).toBe(200)
        expect(res.body.total_items).toBeGreaterThanOrEqual(0)
        
        // Verify structure of returned users
        res.body.items.forEach((user: any) => {
            expect(user).toHaveProperty('id')
            expect(user).toHaveProperty('username')
            expect(user).toHaveProperty('first_name')
            expect(user).toHaveProperty('last_name')
            expect(user).toHaveProperty('email')
            expect(user).toHaveProperty('user_type')
        })
    })

    test('POST /users/register-citizen with maximum realistic data', async () => {
        const timestamp = Date.now()
        const res = await request.post('/users/register-citizen').send({
            username: `citizen_maxdata_${timestamp}`,
            name: 'VeryLongFirstNameForTesting',
            surname: 'VeryLongLastNameForTesting',
            email: `firstname.lastname.${timestamp}@example.domain.com`,
            password: 'ComplexPassword123!@#'
        })
        expect(res.status).toBe(201)
        expect(res.body.first_name).toBe('VeryLongFirstNameForTesting')
        expect(res.body.last_name).toBe('VeryLongLastNameForTesting')
    })

    test('PATCH /users/edit-me with all optional fields', async () => {
        const username = `citizen_editall_${Date.now()}`
        const { user, cookies } = await registerAndLogin(request, username, 'Pass')

        const res = await request.patch('/users/edit-me')
            .set('Cookie', cookies)
            .send({
                id: user.id,
                username: `${username}_updated`,
                name: 'NewName',
                surname: 'NewSurname',
                email: `${username}_new@example.com`
            })
        
        expect(res.status).toBe(200)
        expect(res.body.first_name).toBe('NewName')
        expect(res.body.last_name).toBe('NewSurname')
        expect(res.body.email).toBe(`${username}_new@example.com`)
    })

    test('POST /users/register-user creates user with all metadata', async () => {
        const admin = `admin_metadata_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const newUser = `created_${Date.now()}`
        const res = await request.post('/users/register-user')
            .set('Cookie', adminCookie)
            .send({
                username: newUser,
                name: 'CreatedUser',
                surname: 'ByAdmin',
                email: `${newUser}@example.com`,
                password: 'Pass123',
                role: 'citizen'
            })
        
        expect(res.status).toBe(201)
        expect(res.body.username).toBe(newUser)
        expect(res.body.first_name).toBe('CreatedUser')
        expect(res.body.last_name).toBe('ByAdmin')
        expect(res.body.user_type).toBe('citizen')
        expect(res.body).toHaveProperty('id')
    })

    test('GET /reports/search-reports with multiple filters combined', async () => {
        const admin = `admin_multifilter_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        // Create reports with different properties
        const citizen1 = `citizen_cat1_${Date.now()}`
        const { cookies: cookies1 } = await registerAndLogin(request, citizen1, 'Pass')
        
        await request.post('/reports/upload')
            .set('Cookie', cookies1)
            .field('title', 'Public report cat1')
            .field('category_id', '1')
            .field('latitude', '45.0')
            .field('longitude', '7.0')
            .field('is_public', 'true')

        // Query with combined filters
        const res = await request.get('/reports/search-reports?page_num=1&page_size=10&category_id=1&is_public=true').set('Cookie', adminCookie)
        expect(res.status).toBe(200)
        expect(Array.isArray(res.body.items)).toBeTruthy()
    })

    test('PATCH /users/edit-user updates user and maintains consistency', async () => {
        const target = `target_consistency_${Date.now()}`
        const { user: targetUser } = await registerAndLogin(request, target, 'Pass')

        const admin = `admin_consistency_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        // Edit the user
        const editRes = await request.patch('/users/edit-user')
            .set('Cookie', adminCookie)
            .send({
                id: targetUser.id,
                username: targetUser.username,
                name: 'EditedName',
                surname: 'EditedSurname',
                email: `${target}_edited@example.com`,
                usertype: 'citizen',
                rolesArray: [1]
            })
        
        expect(editRes.status).toBe(200)
        expect(editRes.body.first_name).toBe('EditedName')
        expect(editRes.body.last_name).toBe('EditedSurname')
    })

    test('POST /auth/login then DELETE /auth/logout then POST /auth/login again', async () => {
        const username = `citizen_cycle2_${Date.now()}`
        const password = 'Pass123'

        // Register
        await request.post('/users/register-citizen').send({
            username,
            name: 'Test',
            surname: 'User',
            email: `${username}@example.com`,
            password
        })

        // First login
        const login1 = await request.post('/auth/login').send({ username, password })
        expect(login1.status).toBe(200)
        const cookies1 = login1.headers['set-cookie']

        // Verify logged in
        const current1 = await request.get('/auth/current').set('Cookie', cookies1)
        expect(current1.status).toBe(200)
        expect(current1.body.username).toBe(username)

        // Logout
        const logout = await request.delete('/auth/logout').set('Cookie', cookies1)
        expect(logout.status).toBe(200)

        // Verify logged out
        const notLoggedIn = await request.get('/auth/current').set('Cookie', cookies1)
        expect(notLoggedIn.status).toBe(401)

        // Login again
        const login2 = await request.post('/auth/login').send({ username, password })
        expect(login2.status).toBe(200)
        const cookies2 = login2.headers['set-cookie']

        // Verify new session works
        const current2 = await request.get('/auth/current').set('Cookie', cookies2)
        expect(current2.status).toBe(200)
        expect(current2.body.username).toBe(username)
    })

    test('GET /reports/report/:id returns report with all fields populated', async () => {
        const citizen = `citizen_fullreport_${Date.now()}`
        const { cookies: citizenCookies } = await registerAndLogin(request, citizen, 'Pass')

        // Upload a detailed report
        const uploadRes = await request.post('/reports/upload')
            .set('Cookie', citizenCookies)
            .field('title', 'Detailed Report')
            .field('description', 'This is a detailed description')
            .field('category_id', '1')
            .field('latitude', '45.6789')
            .field('longitude', '7.1234')
            .field('is_public', 'true')
            .attach('photos', Buffer.from('fakeimage'), 'photo.jpg')
        
        expect(uploadRes.status).toBe(201)
        const reportId = uploadRes.body.id

        // Get the report as admin
        const admin = `admin_fullreport_${Date.now()}`
        await registerAndLogin(request, admin, 'AdminPass')
        await promoteToAdmin(admin)
        const loginRes = await request.post('/auth/login').send({ username: admin, password: 'AdminPass' })
        const adminCookie = loginRes.headers['set-cookie']

        const getRes = await request.get(`/reports/report/${reportId}`).set('Cookie', adminCookie)
        expect(getRes.status).toBe(200)
        
        const report = getRes.body
        expect(report.id).toBe(reportId)
        expect(report.title).toBe('Detailed Report')
        expect(report.description).toBe('This is a detailed description')
        expect(report.category_id).toBe(1)
        expect(report.latitude).toBe(45.6789)
        expect(report.longitude).toBe(7.1234)
        expect(report.is_public).toBe(true)
        expect(report.photos.length).toBe(1)
    })

})
