import db from '../src/dao/db'
import request from './setup'

// Helper to register and login a user; returns created user and cookies
export async function registerAndLogin(agent: any, username: string, password: string) {
    // register citizen
    const regRes = await agent.post('/users/register-citizen').send({
        username,
        name: 'Test',
        surname: 'User',
        email: `${username}@example.com`,
        password
    })
    if (regRes.status !== 201) throw new Error('Failed to register user: ' + JSON.stringify(regRes.body))

    const createdUser = regRes.body

    // login
    const loginRes = await agent.post('/auth/login').send({ username, password })
    if (loginRes.status !== 200) throw new Error('Failed to login user: ' + JSON.stringify(loginRes.body))
    const cookies = loginRes.headers['set-cookie']
    return { user: createdUser, cookies }
}

// Promote a username to admin in the test DB
export async function promoteToAdmin(username: string) {
    return new Promise<void>((resolve, reject) => {
        db.run("UPDATE users SET user_type='admin' WHERE username = ?", [username], (err: any) => {
            if (err) return reject(err)
            resolve()
        })
    })
}

// Promote a username to municipality in the test DB
export async function promoteToMunicipality(username: string) {
    return new Promise<void>((resolve, reject) => {
        db.run("UPDATE users SET user_type='municipality' WHERE username = ?", [username], (err: any) => {
            if (err) return reject(err)
            resolve()
        })
    })
}

// Create a municipality user and assign maintainer role
export async function createMaintainerUser(agent: any, username: string, password: string) {
    // First create admin to create municipality user
    const adminUsername = `admin_for_maintainer_${Date.now()}`
    const adminPassword = 'AdminP4ss'
    await registerAndLogin(agent, adminUsername, adminPassword)
    await promoteToAdmin(adminUsername)
    const adminLogin = await agent.post('/auth/login').send({ username: adminUsername, password: adminPassword })
    const adminCookie = adminLogin.headers['set-cookie']

    // Create municipality user
    const createRes = await agent.post('/users/admin/create-municipality-user')
        .set('Cookie', adminCookie)
        .send({
            username,
            name: 'Maintainer',
            surname: 'User',
            email: `${username}@maintainer.com`,
            password,
            rolesArray: [7] // external_maintainer role ID
        })
    if (createRes.status !== 201) throw new Error('Failed to create maintainer user: ' + JSON.stringify(createRes.body))

    const createdUser = createRes.body

    // Login as maintainer
    const loginRes = await agent.post('/auth/login').send({ username, password })
    if (loginRes.status !== 200) throw new Error('Failed to login maintainer: ' + JSON.stringify(loginRes.body))
    const cookies = loginRes.headers['set-cookie']
    return { user: createdUser, cookies }
}

// expose the default request for convenience in tests
export { request }
