const { execSync } = require('child_process')

beforeAll(() => {
  console.log('Building library for E2E tests...')
  execSync('npm run build', { stdio: 'inherit' })
})
