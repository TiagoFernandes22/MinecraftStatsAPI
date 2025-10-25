# Test Suite

Comprehensive test suite for the Minecraft Stats API.

## Running Tests

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
tests/
├── unit/                           # Unit tests for individual modules
│   ├── cache.test.js              # Cache utility tests
│   ├── helpers.test.js            # Helper functions tests
│   └── stats.service.test.js      # Stats service logic tests
├── integration/                    # Integration tests for API endpoints
│   ├── health.test.js             # Health check endpoint
│   ├── auth.test.js               # Authentication middleware
│   ├── admin.test.js              # Admin endpoints
│   ├── cache.test.js              # Cache endpoints
│   ├── stats.test.js              # Stats endpoints
│   ├── player.test.js             # Player endpoints
│   └── world.test.js              # World upload/delete endpoints
├── fixtures/                       # Test data files
│   ├── test-users.json            # Sample user data
│   └── test-player-stats.json     # Sample stats data
└── setup.js                        # Global test configuration

```

## Test Coverage

The test suite covers:

### Unit Tests (35+ tests)
- ✅ Cache operations (set, get, clear, TTL)
- ✅ Helper functions (formatItemName, sanitizeFilename)
- ✅ Stats extraction and parsing
- ✅ Data transformation logic

### Integration Tests (50+ tests)
- ✅ Health check endpoint
- ✅ Authentication (API key & Admin key)
- ✅ Admin user management
- ✅ Cache management endpoints
- ✅ Stats retrieval endpoints
- ✅ Player data endpoints
- ✅ World upload/delete operations
- ✅ Error handling

## Test Requirements

- All endpoints require proper authentication
- Error responses follow consistent format
- Success responses include `success: true`
- Proper HTTP status codes (200, 400, 401, 403, 404, 500)
- Data validation on all inputs

## Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: All critical API paths
- **Error Scenarios**: All error cases handled

## Running Specific Tests

```bash
# Run a specific test file
npm test tests/unit/cache.test.js

# Run tests matching a pattern
npm test -- --testNamePattern="Cache"

# Run with verbose output
npm test -- --verbose
```

## Continuous Integration

Tests are designed to run in CI/CD environments. Set these environment variables:

```bash
NODE_ENV=test
ADMIN_KEY=test-admin-key-123
PORT=3001
```

## Writing New Tests

### Unit Test Example
```javascript
describe('MyFunction', () => {
  it('should do something', () => {
    const result = myFunction(input);
    expect(result).toBe(expectedOutput);
  });
});
```

### Integration Test Example
```javascript
describe('GET /api/endpoint', () => {
  it('should return data', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .set('x-api-key', apiKey);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
  });
});
```

## Troubleshooting

**Tests failing with authentication errors?**
- Ensure `ADMIN_KEY` is set in environment
- Check that test users are created properly in beforeAll hooks

**Tests timing out?**
- Increase timeout in jest.config.js (currently 10000ms)
- Check for infinite loops or unresolved promises

**Coverage not accurate?**
- Clear cache: `npm test -- --clearCache`
- Ensure all files are included in collectCoverageFrom

## Best Practices

1. **Isolate tests**: Each test should be independent
2. **Clean up**: Use afterEach/afterAll to remove test data
3. **Mock external APIs**: Don't rely on external services
4. **Test edge cases**: Empty arrays, null values, invalid inputs
5. **Descriptive names**: Test names should explain what's being tested
