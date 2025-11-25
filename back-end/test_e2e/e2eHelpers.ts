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

// expose the default request for convenience in tests
export { request }
