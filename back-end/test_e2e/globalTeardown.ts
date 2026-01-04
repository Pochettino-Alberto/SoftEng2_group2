export default async function globalTeardown() {
    if (!process.argv.some(a => a.includes('test_e2e'))) return
}