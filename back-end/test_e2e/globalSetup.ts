export default async function globalSetup() {
    if (!process.argv.some(a => a.includes('test_e2e'))) return

    const { resetTestDb } = await import('./testDb')
    await resetTestDb()
}