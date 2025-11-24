// Use a fake supabaseService by overriding the real import via jest mocking
jest.mock('../src/services/supabaseService', () => ({
    supabaseService: require('./supabaseMock').supabaseService,
    SupabaseBucket: require('./supabaseMock').SupabaseBucket
}))

import request from './setup'
import { teardownTestDb } from './testDb'
import db from '../src/dao/db'
import fs from 'fs'
import path from 'path'

// Helper to register and login a citizen user and return a cookie jar for session
async function registerAndLogin(agent: any, username: string, password: string) {
    // register citizen
    const regRes = await agent.post('/users/register-citizen').send({
        username,
        name: 'Test',
        surname: 'User',
        email: `${username}@example.com`,
        password
    })
    expect(regRes.status).toBe(201)

    // login
    const loginRes = await agent.post('/auth/login').send({ username, password })
    expect(loginRes.status).toBe(200)
    // capture cookies for authenticated session
    const cookies = loginRes.headers['set-cookie']
    return cookies
}

describe('E2E Report Routes', () => {
    let agent: any
    beforeAll(() => {
        agent = request
    })

    test('GET /reports/categories returns categories', async () => {
        const res = await agent.get('/reports/categories')
        expect(res.status).toBe(200)
        expect(Array.isArray(res.body)).toBeTruthy()
        expect(res.body.length).toBeGreaterThan(0)
    })

    test('POST /reports/upload create report with photos and then GET /reports/report/:id', async () => {
        const username = `citizen_${Date.now()}`
        const password = 'P@ssw0rd'
        const cookies = await registerAndLogin(agent, username, password)

        // Build multipart form
        const res = await agent.post('/reports/upload')
            .set('Cookie', cookies)
            .field('title', 'Pothole near plaza')
            .field('description', 'There is a big hole')
            .field('category_id', '1')
            .field('latitude', '45.0')
            .field('longitude', '7.0')
            .field('is_public', 'true')
            .attach('photos', Buffer.from('fakeimage1'), 'photo1.jpg')
            .attach('photos', Buffer.from('fakeimage2'), 'photo2.jpg')

        expect(res.status).toBe(201)
        const savedReport = res.body
        expect(savedReport).toHaveProperty('id')
        expect(savedReport.photos.length).toBe(2)

        // GET by id (admin-only route) - create an admin user for the test and promote it in the DB
        const adminUsername = `admin_${Date.now()}`
        const adminPassword = 'AdminP4ss'
        await registerAndLogin(agent, adminUsername, adminPassword)
        // promote the newly created user to admin role directly in the test DB
        await new Promise<void>((resolve, reject) => {
            db.run("UPDATE users SET user_type='admin' WHERE username = ?", [adminUsername], (err: any) => {
                if (err) return reject(err)
                resolve()
            })
        })
        const adminLogin = await agent.post('/auth/login').send({ username: adminUsername, password: adminPassword })
        expect(adminLogin.status).toBe(200)
        const adminCookie = adminLogin.headers['set-cookie']

        const getRes = await agent.get(`/reports/report/${savedReport.id}`).set('Cookie', adminCookie)
        expect(getRes.status).toBe(200)
        expect(getRes.body.id).toBe(savedReport.id)
    })

    test('GET /reports/search-reports supports pagination and filters', async () => {
        // create an admin user for this test and promote it to admin in the DB
        const adminUsername = `admin_${Date.now()}`
        const adminPassword = 'AdminSearchP4ss'
        await registerAndLogin(request, adminUsername, adminPassword)
        await new Promise<void>((resolve, reject) => {
            db.run("UPDATE users SET user_type='admin' WHERE username = ?", [adminUsername], (err: any) => {
                if (err) return reject(err)
                resolve()
            })
        })

        // login as the promoted admin to access search
        const adminLogin = await request.post('/auth/login').send({ username: adminUsername, password: adminPassword })
        expect(adminLogin.status).toBe(200)
        const adminCookie = adminLogin.headers['set-cookie']

        const res = await request.get('/reports/search-reports?page_num=1&page_size=10').set('Cookie', adminCookie)
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('items')
        // API returns `total_items` instead of `total`
        expect(res.body).toHaveProperty('total_items')
    })
})
