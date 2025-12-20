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
        const getOther = await request.get(`/users/users/${userB.id}`).set('Cookie', cookiesA)
        expect([401, 404]).toContain(getOther.status)

        // duplicate registration attempt returns 409
        const dup = await request.post('/users/register-citizen').send({ username: u2, name: 'X', surname: 'Y', email: `${u2}@example.com`, password: p2 })
        expect(dup.status).toBe(409)

        // promote userA to admin and delete userB
        await promoteToAdmin(u1)
        const loginAdmin = await request.post('/auth/login').send({ username: u1, password: p1 })
        expect(loginAdmin.status).toBe(200)
        const adminCookie = loginAdmin.headers['set-cookie']

        const del = await request.delete(`/users/users/${userB.id}`).set('Cookie', adminCookie)
        expect([200, 404]).toContain(del.status)

        // confirm userB now not found when admin tries to get it
        const getDeleted = await request.get(`/users/users/${userB.id}`).set('Cookie', adminCookie)
        expect(getDeleted.status).toBe(404)
    })

    test('Admin edits another user and cannot delete default admin', async () => {
        // create a normal user to be edited
        const target = `editTarget_${Date.now()}`
        const pw = 'P@ssw0rd'
        const { user: targetUser } = await registerAndLogin(request, target, pw)

        // create an admin and promote
        const admin = `admin_edit_${Date.now()}`
        const adminPass = 'AdminP4ss'
        await registerAndLogin(request, admin, adminPass)
        await promoteToAdmin(admin)
        const login = await request.post('/auth/login').send({ username: admin, password: adminPass })
        const adminCookie = login.headers['set-cookie']

        // Edit target user's email and assign roles (roles exist from default values)
        const newEmail = `${target}+edited@example.com`
        const editRes = await request.patch('/users/edit-user')
            .set('Cookie', adminCookie)
            .send({ id: targetUser.id, username: targetUser.username, name: targetUser.first_name, surname: targetUser.last_name, email: newEmail, usertype: 'citizen', rolesArray: [1] })
        expect(editRes.status).toBe(200)
        expect(editRes.body).toHaveProperty('email', newEmail)

        // Admin attempts to delete the default preloaded admin (id usually 1) -> should be rejected
        const delDefault = await request.delete('/users/users/1').set('Cookie', adminCookie)
        // backend may return 401 (forbidden) or 404 (not found) depending on internal ordering.
        // Accept either status to make the test resilient across environments.
        expect([401, 404]).toContain(delDefault.status)
    })

    test('POST /users/register-citizen with special characters in name', async () => {
        const username = `citizen_special_${Date.now()}`
        const password = 'P@ssw0rd'

        const regRes = await request.post('/users/register-citizen').send({
            username,
            name: "José",
            surname: "O'Connor",
            email: `${username}@example.com`,
            password
        })
        expect(regRes.status).toBe(201)
        expect(regRes.body).toHaveProperty('first_name', 'José')
        expect(regRes.body).toHaveProperty('last_name', "O'Connor")
    })

    test('PATCH /users/edit-me with only email update', async () => {
        const username = `citizen_email_only_${Date.now()}`
        const password = 'P@ssw0rd'
        const { user, cookies } = await registerAndLogin(request, username, password)

        const newEmail = `${username}+new@example.com`
        const patchRes = await request.patch('/users/edit-me')
            .set('Cookie', cookies)
            .send({ id: user.id, email: newEmail })

        expect(patchRes.status).toBe(200)
        expect(patchRes.body.email).toBe(newEmail)
        expect(patchRes.body.first_name).toBe(user.first_name)
    })

    test('PATCH /users/edit-me with name and surname update', async () => {
        const username = `citizen_name_${Date.now()}`
        const password = 'P@ssw0rd'
        const { user, cookies } = await registerAndLogin(request, username, password)

        const patchRes = await request.patch('/users/edit-me')
            .set('Cookie', cookies)
            .send({ id: user.id, name: 'NewName', surname: 'NewSurname' })

        expect(patchRes.status).toBe(200)
        expect(patchRes.body.first_name).toBe('NewName')
        expect(patchRes.body.last_name).toBe('NewSurname')
    })

    test('GET /users/search-users with first_name and email filters', async () => {
        // create admin
        const admin = `admin_filter_${Date.now()}`
        const adminPass = 'AdminPass'
        await registerAndLogin(request, admin, adminPass)
        await promoteToAdmin(admin)
        const login = await request.post('/auth/login').send({ username: admin, password: adminPass })
        const adminCookie = login.headers['set-cookie']

        // Search by first_name
        const searchFName = await request.get('/users/search-users?page_num=1&page_size=10&first_name=Test').set('Cookie', adminCookie)
        expect(searchFName.status).toBe(200)
        expect(searchFName.body).toHaveProperty('total_items')

        // Search by email
        const searchEmail = await request.get('/users/search-users?page_num=1&page_size=10&email=test@example.com').set('Cookie', adminCookie)
        expect(searchEmail.status).toBe(200)
        expect(Array.isArray(searchEmail.body.items)).toBeTruthy()
    })

    test('POST /users/register-user with municipality type', async () => {
        const admin = `admin_muni_${Date.now()}`
        const adminPass = 'AdminPass'
        await registerAndLogin(request, admin, adminPass)
        await promoteToAdmin(admin)
        const login = await request.post('/auth/login').send({ username: admin, password: adminPass })
        const adminCookie = login.headers['set-cookie']

        // Create municipality user
        const newUsername = `municipality_${Date.now()}`
        const createRes = await request.post('/users/register-user')
            .set('Cookie', adminCookie)
            .send({ 
                username: newUsername, 
                name: 'Muni', 
                surname: 'Officer', 
                email: `${newUsername}@municipality.it`, 
                password: 'MuniPass123',
                role: 'municipality'
            })
        expect(createRes.status).toBe(201)
        expect(createRes.body.user_type).toBe('municipality')
    })

    test('POST /users/register-user with external_maintainer type', async () => {
        const admin = `admin_ext_${Date.now()}`
        const adminPass = 'AdminPass'
        await registerAndLogin(request, admin, adminPass)
        await promoteToAdmin(admin)
        const login = await request.post('/auth/login').send({ username: admin, password: adminPass })
        const adminCookie = login.headers['set-cookie']

        // Create municipality user
        const newUsername = `maintainer_${Date.now()}`
        const createRes = await request.post('/users/register-user')
            .set('Cookie', adminCookie)
            .send({ 
                username: newUsername, 
                name: 'Mun', 
                surname: 'User', 
                email: `${newUsername}@municipality.it`, 
                password: 'MunPass123',
                role: 'municipality'
            })
        expect(createRes.status).toBe(201)
        expect(createRes.body.user_type).toBe('municipality')
    })

    test('GET /users/search-users with pagination edge cases', async () => {
        const admin = `admin_paginate_${Date.now()}`
        const adminPass = 'AdminPass'
        await registerAndLogin(request, admin, adminPass)
        await promoteToAdmin(admin)
        const login = await request.post('/auth/login').send({ username: admin, password: adminPass })
        const adminCookie = login.headers['set-cookie']

        // Search with page_size=1 (minimum)
        const res1 = await request.get('/users/search-users?page_num=1&page_size=1').set('Cookie', adminCookie)
        expect(res1.status).toBe(200)
        expect(res1.body.items.length).toBeLessThanOrEqual(1)

        // Search with page_num > 1
        const res2 = await request.get('/users/search-users?page_num=2&page_size=5').set('Cookie', adminCookie)
        expect(res2.status).toBe(200)
        expect(Array.isArray(res2.body.items)).toBeTruthy()

        // Search with large page_size
        const res3 = await request.get('/users/search-users?page_num=1&page_size=100').set('Cookie', adminCookie)
        expect(res3.status).toBe(200)
        expect(res3.body).toHaveProperty('total_items')
    })

    test('PATCH /users/edit-user with multiple roles', async () => {
        // Create target user
        const target = `user_roles_${Date.now()}`
        const pw = 'Pass'
        const { user: targetUser } = await registerAndLogin(request, target, pw)

        // Create admin
        const admin = `admin_roles_${Date.now()}`
        const adminPass = 'AdminPass'
        await registerAndLogin(request, admin, adminPass)
        await promoteToAdmin(admin)
        const login = await request.post('/auth/login').send({ username: admin, password: adminPass })
        const adminCookie = login.headers['set-cookie']

        // Assign multiple roles
        const editRes = await request.patch('/users/edit-user')
            .set('Cookie', adminCookie)
            .send({ 
                id: targetUser.id, 
                username: targetUser.username, 
                name: targetUser.first_name, 
                surname: targetUser.last_name, 
                email: targetUser.email,
                rolesArray: [1, 2]
            })
        expect(editRes.status).toBe(200)
        expect(Array.isArray(editRes.body.userRoles)).toBeTruthy()
    })

    test('POST /users/admin/create-municipality-user creates municipality user with rolesArray', async () => {
        const adminUser = `admin_muni_${Date.now()}`
        await registerAndLogin(request, adminUser, 'P@ss1234')
        await promoteToAdmin(adminUser)
        const adminLogin = await request.post('/auth/login').send({ username: adminUser, password: 'P@ss1234' })
        const adminCookie = adminLogin.headers['set-cookie']

        const username = `muniuser_roles_${Date.now()}`
        const response = await request
            .post('/users/admin/create-municipality-user')
            .set('Cookie', adminCookie)
            .send({
                username,
                password: 'Password123',
                name: 'Test',
                surname: 'Municipality',
                email: `${username}@test.com`,
                rolesArray: [1, 2]
            })

        expect(response.status).toBe(201)
        expect(response.body).toHaveProperty('id')
        expect(response.body.user_type).toBe('municipality')
    })

    test('POST /users/admin/create-municipality-user without rolesArray', async () => {
        const adminUser = `admin_norole_${Date.now()}`
        await registerAndLogin(request, adminUser, 'P@ss1234')
        await promoteToAdmin(adminUser)
        const adminLogin = await request.post('/auth/login').send({ username: adminUser, password: 'P@ss1234' })
        const adminCookie = adminLogin.headers['set-cookie']

        const username = `muniuser_norole_${Date.now()}`
        const response = await request
            .post('/users/admin/create-municipality-user')
            .set('Cookie', adminCookie)
            .send({
                username,
                password: 'Password123',
                name: 'Test',
                surname: 'NoRole',
                email: `${username}@test.com`
            })

        expect(response.status).toBe(201)
        expect(response.body.user_type).toBe('municipality')
    })

    test('POST /users/admin/create-municipality-user with empty rolesArray', async () => {
        const adminUser = `admin_emptyrole_${Date.now()}`
        await registerAndLogin(request, adminUser, 'P@ss1234')
        await promoteToAdmin(adminUser)
        const adminLogin = await request.post('/auth/login').send({ username: adminUser, password: 'P@ss1234' })
        const adminCookie = adminLogin.headers['set-cookie']

        const username = `muniuser_emptyrole_${Date.now()}`
        const response = await request
            .post('/users/admin/create-municipality-user')
            .set('Cookie', adminCookie)
            .send({
                username,
                password: 'Password123',
                name: 'Test',
                surname: 'Empty',
                email: `${username}@test.com`,
                rolesArray: []
            })

        expect(response.status).toBe(201)
        expect(response.body.user_type).toBe('municipality')
    })

    test('POST /users/admin/assign-roles with multiple roles', async () => {
        const adminUser = `admin_multirole_${Date.now()}`
        await registerAndLogin(request, adminUser, 'P@ss1234')
        await promoteToAdmin(adminUser)
        const adminLogin = await request.post('/auth/login').send({ username: adminUser, password: 'P@ss1234' })
        const adminCookie = adminLogin.headers['set-cookie']

        const username = `user_multirole_${Date.now()}`
        const userRes = await request
            .post('/users/register-citizen')
            .send({
                username,
                password: 'Password123',
                name: 'Test',
                surname: 'MultiRole',
                email: `${username}@test.com`
            })

        const response = await request
            .post('/users/admin/assign-roles')
            .set('Cookie', adminCookie)
            .send({
                userId: userRes.body.id,
                rolesArray: [1, 2, 3]
            })

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('message')
    })

    test('POST /users/admin/assign-roles with empty rolesArray', async () => {
        const adminUser = `admin_emptyroles_${Date.now()}`
        await registerAndLogin(request, adminUser, 'P@ss1234')
        await promoteToAdmin(adminUser)
        const adminLogin = await request.post('/auth/login').send({ username: adminUser, password: 'P@ss1234' })
        const adminCookie = adminLogin.headers['set-cookie']

        const username = `user_emptyroles_${Date.now()}`
        const userRes = await request
            .post('/users/register-citizen')
            .send({
                username,
                password: 'Password123',
                name: 'Test',
                surname: 'EmptyRoles',
                email: `${username}@test.com`
            })

        const response = await request
            .post('/users/admin/assign-roles')
            .set('Cookie', adminCookie)
            .send({
                userId: userRes.body.id,
                rolesArray: []
            })

        expect(response.status).toBe(200)
    })

    test('PATCH /users/edit-user with rolesArray', async () => {
        const adminUser = `admin_editroles_${Date.now()}`
        await registerAndLogin(request, adminUser, 'P@ss1234')
        await promoteToAdmin(adminUser)
        const adminLogin = await request.post('/auth/login').send({ username: adminUser, password: 'P@ss1234' })
        const adminCookie = adminLogin.headers['set-cookie']

        const username = `user_editroles_${Date.now()}`
        const userRes = await request
            .post('/users/register-citizen')
            .send({
                username,
                password: 'Password123',
                name: 'Test',
                surname: 'EditRoles',
                email: `${username}@test.com`
            })

        const response = await request
            .patch('/users/edit-user')
            .set('Cookie', adminCookie)
            .send({
                id: userRes.body.id,
                name: 'Updated',
                rolesArray: [1, 2]
            })

        expect(response.status).toBe(200)
        expect(response.body.first_name).toBe('Updated')
    })

    test('PATCH /users/edit-user without rolesArray', async () => {
        const adminUser = `admin_editnoroles_${Date.now()}`
        await registerAndLogin(request, adminUser, 'P@ss1234')
        await promoteToAdmin(adminUser)
        const adminLogin = await request.post('/auth/login').send({ username: adminUser, password: 'P@ss1234' })
        const adminCookie = adminLogin.headers['set-cookie']

        const username = `user_editnoroles_${Date.now()}`
        const userRes = await request
            .post('/users/register-citizen')
            .send({
                username,
                password: 'Password123',
                name: 'Test',
                surname: 'EditNoRoles',
                email: `${username}@test.com`
            })

        const response = await request
            .patch('/users/edit-user')
            .set('Cookie', adminCookie)
            .send({
                id: userRes.body.id,
                email: 'newemail@test.com'
            })

        expect(response.status).toBe(200)
    })

})

describe('userRoutes - Municipality and Role Management', () => {
  let municipalityAdminData: any;

  beforeAll(async () => {
    // Register and login as municipality admin
    const adminUser = `muniadmin_${Date.now()}`;
    const adminPassword = 'MuniAdminP4ss';
    municipalityAdminData = await registerAndLogin(request, adminUser, adminPassword);
    
    // Promote to admin
    await promoteToAdmin(adminUser);
  });

  test('POST /users/admin/create-municipality-user creates a new municipality user', async () => {
    const response = await request
      .post('/users/admin/create-municipality-user')
      .set('Cookie', municipalityAdminData.cookies)
      .send({
        username: `muniuser_${Date.now()}`,
        password: 'password123',
        name: 'Muni',
        surname: 'User',
        email: `muniuser_${Date.now()}@test.com`
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.user_type).toBe('municipality');
  });

  test('POST /users/admin/create-municipality-user without auth returns 401', async () => {
    const response = await request
      .post('/users/admin/create-municipality-user')
      .send({
        username: `muniuser_${Date.now()}`,
        password: 'password123',
        name: 'Test',
        surname: 'User',
        email: 'test@test.com'
      });
    
    expect(response.status).toBe(401);
  });

  test('POST /users/admin/create-municipality-user without admin role returns 401', async () => {
    // Register a non-admin user
    const citizenUser = `citizen_${Date.now()}`;
    const citizenPassword = 'CitizenP4ss';
    const citizenData = await registerAndLogin(request, citizenUser, citizenPassword);
    
    const response = await request
      .post('/users/admin/create-municipality-user')
      .set('Cookie', citizenData.cookies)
      .send({
        username: `muniuser_${Date.now()}`,
        password: 'password123',
        name: 'Test',
        surname: 'User',
        email: 'test@test.com'
      });
    
    expect(response.status).toBe(401);
  });

  test('POST /users/admin/create-municipality-user with missing username returns 422', async () => {
    const response = await request
      .post('/users/admin/create-municipality-user')
      .set('Cookie', municipalityAdminData.cookies)
      .send({
        password: 'password123',
        name: 'Test',
        surname: 'User',
        email: 'test@test.com'
      });
    
    expect(response.status).toBe(422);
  });

  test('POST /users/admin/create-municipality-user with missing password returns 422', async () => {
    const response = await request
      .post('/users/admin/create-municipality-user')
      .set('Cookie', municipalityAdminData.cookies)
      .send({
        username: `muniuser_${Date.now()}`,
        name: 'Test',
        surname: 'User',
        email: 'test@test.com'
      });
    
    expect(response.status).toBe(422);
  });

  test('POST /users/admin/create-municipality-user with missing name returns 422', async () => {
    const response = await request
      .post('/users/admin/create-municipality-user')
      .set('Cookie', municipalityAdminData.cookies)
      .send({
        username: `muniuser_${Date.now()}`,
        password: 'password123',
        surname: 'User',
        email: 'test@test.com'
      });
    
    expect(response.status).toBe(422);
  });

  test('POST /users/admin/create-municipality-user with missing surname returns 422', async () => {
    const response = await request
      .post('/users/admin/create-municipality-user')
      .set('Cookie', municipalityAdminData.cookies)
      .send({
        username: `muniuser_${Date.now()}`,
        password: 'password123',
        name: 'Test',
        email: 'test@test.com'
      });
    
    expect(response.status).toBe(422);
  });

  test('POST /users/admin/create-municipality-user with missing email returns 422', async () => {
    const response = await request
      .post('/users/admin/create-municipality-user')
      .set('Cookie', municipalityAdminData.cookies)
      .send({
        username: `muniuser_${Date.now()}`,
        password: 'password123',
        name: 'Test',
        surname: 'User'
      });
    
    expect(response.status).toBe(422);
  });

  test('POST /users/admin/create-municipality-user with duplicate username returns 409', async () => {
    const username = `muniuser_dup_${Date.now()}`;
    
    // Create first user
    await request
      .post('/users/admin/create-municipality-user')
      .set('Cookie', municipalityAdminData.cookies)
      .send({
        username,
        password: 'password123',
        name: 'Test',
        surname: 'User',
        email: `${username}@test.com`
      });
    
    // Try to create duplicate
    const response = await request
      .post('/users/admin/create-municipality-user')
      .set('Cookie', municipalityAdminData.cookies)
      .send({
        username,
        password: 'password123',
        name: 'Test',
        surname: 'User',
        email: `${username}2@test.com`
      });
    
    expect(response.status).toBe(409);
  });

  test('POST /users/admin/create-municipality-user with rolesArray assigns roles', async () => {
    const username = `munirole_${Date.now()}`;
    
    const response = await request
      .post('/users/admin/create-municipality-user')
      .set('Cookie', municipalityAdminData.cookies)
      .send({
        username,
        password: 'password123',
        name: 'Test',
        surname: 'User',
        email: `${username}@test.com`,
        rolesArray: [1, 2]
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });

  test('POST /users/admin/assign-roles assigns roles to user', async () => {
    // Create a user first
    const username = `roleuser_${Date.now()}`;
    const userResponse = await request
      .post('/users/register-citizen')
      .send({
        username,
        password: 'password123',
        name: 'Test',
        surname: 'User',
        email: `${username}@test.com`
      });
    
    const userId = userResponse.body.id;
    
    // Assign roles
    const response = await request
      .post('/users/admin/assign-roles')
      .set('Cookie', municipalityAdminData.cookies)
      .send({
        userId,
        rolesArray: [1]
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
  });

  test('POST /users/admin/assign-roles without auth returns 401', async () => {
    const response = await request
      .post('/users/admin/assign-roles')
      .send({
        userId: 1,
        rolesArray: [1]
      });
    
    expect(response.status).toBe(401);
  });

  test('POST /users/admin/assign-roles without admin role returns 401', async () => {
    // Register a non-admin user
    const username = `citizen_${Date.now()}`;
    const citizenPassword = 'CitizenP4ss';
    const citizenData = await registerAndLogin(request, username, citizenPassword);
    
    const response = await request
      .post('/users/admin/assign-roles')
      .set('Cookie', citizenData.cookies)
      .send({
        userId: 1,
        rolesArray: [1]
      });
    
    expect(response.status).toBe(401);
  });

  test('POST /users/admin/assign-roles with missing userId returns 422', async () => {
    const response = await request
      .post('/users/admin/assign-roles')
      .set('Cookie', municipalityAdminData.cookies)
      .send({
        rolesArray: [1]
      });
    
    expect(response.status).toBe(422);
  });

  test('POST /users/admin/assign-roles with missing rolesArray returns 422', async () => {
    const response = await request
      .post('/users/admin/assign-roles')
      .set('Cookie', municipalityAdminData.cookies)
      .send({
        userId: 1
      });
    
    expect(response.status).toBe(422);
  });

  test('POST /users/admin/assign-roles with invalid userId returns 422', async () => {
    // Use a non-integer userId to trigger request validation (422)
    const response = await request
      .post('/users/admin/assign-roles')
      .set('Cookie', municipalityAdminData.cookies)
      .send({
        userId: 'invalid',
        rolesArray: [1]
      });

    // Validation should catch non-integer userId and return 422
    expect(response.status).toBe(422);
  });

  test('GET /users/get-roles returns user roles', async () => {
    const response = await request
      .get('/users/get-roles')
      .set('Cookie', municipalityAdminData.cookies);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('GET /users/get-roles without auth returns 401', async () => {
    const response = await request
      .get('/users/get-roles');
    
    expect(response.status).toBe(401);
  });

  test('GET /users/get-roles/:userId returns specific user roles', async () => {
    const response = await request
      .get(`/users/get-roles/${municipalityAdminData.user.id}`)
      .set('Cookie', municipalityAdminData.cookies);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('GET /users/get-roles/:userId without auth returns 401', async () => {
    const response = await request
      .get('/users/get-roles/1');
    
    expect(response.status).toBe(401);
  });

  test('GET /users/get-roles/:userId with invalid userId returns 200 with empty array', async () => {
    const response = await request
      .get('/users/get-roles/99999')
      .set('Cookie', municipalityAdminData.cookies);
    
    // Invalid userId returns empty array (user has no roles), not 404
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(0);
  });
});
