describe('ErrorHandler', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  describe('validateRequest', () => {
    it('returns next when no errors', () => {
      jest.doMock('express-validator', () => ({ validationResult: jest.fn(() => ({ isEmpty: () => true })) }))

      const ErrorHandler = require('../src/helper').default
      const handler = new ErrorHandler()
      const next = jest.fn()
      const req = {}
      const res = {}

      handler.validateRequest(req, res, next)
      expect(next).toHaveBeenCalled()
    })

    it('returns 422 error response when validation fails', () => {
      const errors = [
        { value: 'testval', msg: 'must be valid', location: 'body' },
        { value: '123', msg: 'must be numeric', location: 'query' }
      ]
      jest.doMock('express-validator', () => ({
        validationResult: jest.fn(() => ({
          isEmpty: () => false,
          array: () => errors
        }))
      }))

      const ErrorHandler = require('../src/helper').default
      const handler = new ErrorHandler()
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
      const req = {}
      const next = jest.fn()

      handler.validateRequest(req, res, next)

      expect(res.status).toHaveBeenCalledWith(422)
      expect(res.json).toHaveBeenCalled()
      const errorObj = (res.json as jest.Mock).mock.calls[0][0]
      expect(errorObj.error).toContain('testval')
      expect(errorObj.error).toContain('must be valid')
    })

    it('includes all error details in response', () => {
      const errors = [
        { value: 'test1', msg: 'error 1', location: 'body' },
        { value: 'test2', msg: 'error 2', location: 'query' },
        { value: 'test3', msg: 'error 3', location: 'params' }
      ]
      jest.doMock('express-validator', () => ({
        validationResult: jest.fn(() => ({
          isEmpty: () => false,
          array: () => errors
        }))
      }))

      const ErrorHandler = require('../src/helper').default
      const handler = new ErrorHandler()
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
      const req = {}
      const next = jest.fn()

      handler.validateRequest(req, res, next)

      const errorObj = (res.json as jest.Mock).mock.calls[0][0]
      expect(errorObj.error).toContain('test1')
      expect(errorObj.error).toContain('test2')
      expect(errorObj.error).toContain('test3')
      expect(errorObj.error).toContain('error 1')
      expect(errorObj.error).toContain('error 2')
      expect(errorObj.error).toContain('error 3')
    })
  })

  describe('registerErrorHandler', () => {
    it('returns error with customCode and customMessage in test environment', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'test'

      const mockApp = { use: jest.fn() }
      const ErrorHandler = require('../src/helper').default
      ErrorHandler.registerErrorHandler(mockApp as any)

      expect(mockApp.use).toHaveBeenCalled()

      const errorHandler = (mockApp.use as jest.Mock).mock.calls[0][0]
      const err: any = new Error('test error')
      err.customCode = 418
      err.customMessage = 'I am a teapot'

      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
      const req = {}
      const next = jest.fn()

      errorHandler(err, req, res, next)

      expect(res.status).toHaveBeenCalledWith(418)
      const responseObj = (res.json as jest.Mock).mock.calls[0][0]
      expect(responseObj.error).toBe('I am a teapot')
      expect(responseObj.status).toBe(418)

      process.env.NODE_ENV = originalEnv
    })

    it('returns 500 when error has no customCode', () => {
      const mockApp = { use: jest.fn() }
      const ErrorHandler = require('../src/helper').default
      ErrorHandler.registerErrorHandler(mockApp as any)

      const errorHandler = (mockApp.use as jest.Mock).mock.calls[0][0]
      const err: any = new Error('some error')
      // no customCode or customMessage set

      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
      const req = {}
      const next = jest.fn()

      errorHandler(err, req, res, next)

      expect(res.status).toHaveBeenCalledWith(500)
    })

    it('returns generic message in production environment', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const mockApp = { use: jest.fn() }
      const ErrorHandler = require('../src/helper').default
      ErrorHandler.registerErrorHandler(mockApp as any)

      const errorHandler = (mockApp.use as jest.Mock).mock.calls[0][0]
      const err: any = new Error('secret error details')
      err.customMessage = 'Custom error'
      err.customCode = 400

      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
      const req = {}
      const next = jest.fn()

      errorHandler(err, req, res, next)

      const responseObj = (res.json as jest.Mock).mock.calls[0][0]
      // In production, should use customMessage
      expect(responseObj.error).toBe('Custom error')

      process.env.NODE_ENV = originalEnv
    })
  })
})
