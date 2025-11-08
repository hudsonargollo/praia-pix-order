import '@testing-library/jest-dom'

// Mock environment variables for tests
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_MERCADOPAGO_ACCESS_TOKEN: 'test_access_token',
    VITE_MERCADOPAGO_PUBLIC_KEY: 'test_public_key',
  },
  writable: true,
})

// Mock timers for tests
vi.useFakeTimers()

// Mock fetch globally
global.fetch = vi.fn()

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
  },
  writable: true,
})