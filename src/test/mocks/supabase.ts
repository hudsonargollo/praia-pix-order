/**
 * Centralized Supabase Mock Infrastructure
 * 
 * This module provides a complete mock implementation of the Supabase client
 * with all query builder methods properly chained.
 */

import { vi } from 'vitest';

/**
 * Creates a chainable query builder mock with all common methods
 */
export function createQueryBuilderMock(data: any = [], error: any = null) {
  const queryBuilder: any = {
    // Data to return
    _data: data,
    _error: error,
    _status: error ? 400 : 200,

    // SELECT methods
    select: vi.fn().mockReturnThis(),
    
    // FILTER methods
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    rangeGt: vi.fn().mockReturnThis(),
    rangeGte: vi.fn().mockReturnThis(),
    rangeLt: vi.fn().mockReturnThis(),
    rangeLte: vi.fn().mockReturnThis(),
    rangeAdjacent: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    
    // MODIFIER methods
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    abortSignal: vi.fn().mockReturnThis(),
    single: vi.fn(function(this: any) {
      // Return single item or error
      return Promise.resolve({
        data: this._error ? null : (Array.isArray(this._data) ? this._data[0] : this._data),
        error: this._error,
        status: this._status,
        statusText: this._error ? 'Error' : 'OK'
      });
    }),
    maybeSingle: vi.fn(function(this: any) {
      return Promise.resolve({
        data: this._error ? null : (Array.isArray(this._data) ? this._data[0] : this._data),
        error: this._error,
        status: this._status,
        statusText: this._error ? 'Error' : 'OK'
      });
    }),
    
    // MUTATION methods
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    
    // EXECUTION methods (terminal - return promises)
    then: vi.fn(function(this: any, resolve: any) {
      const result = {
        data: this._error ? null : this._data,
        error: this._error,
        status: this._status,
        statusText: this._error ? 'Error' : 'OK',
        count: Array.isArray(this._data) ? this._data.length : null
      };
      return Promise.resolve(result).then(resolve);
    }),
  };

  // Make it thenable (Promise-like)
  queryBuilder.catch = vi.fn((reject: any) => {
    return Promise.resolve({
      data: queryBuilder._error ? null : queryBuilder._data,
      error: queryBuilder._error,
      status: queryBuilder._status,
      statusText: queryBuilder._error ? 'Error' : 'OK'
    }).catch(reject);
  });

  return queryBuilder;
}

/**
 * Creates a complete Supabase client mock
 */
export function createSupabaseMock(options: {
  selectData?: any;
  selectError?: any;
  insertData?: any;
  insertError?: any;
  updateData?: any;
  updateError?: any;
  deleteData?: any;
  deleteError?: any;
  rpcData?: any;
  rpcError?: any;
} = {}) {
  const {
    selectData = [],
    selectError = null,
    insertData = null,
    insertError = null,
    updateData = null,
    updateError = null,
    deleteData = null,
    deleteError = null,
    rpcData = null,
    rpcError = null,
  } = options;

  return {
    from: vi.fn((table: string) => {
      const builder = createQueryBuilderMock(selectData, selectError);
      
      // Override insert to return insert data/error
      builder.insert = vi.fn(() => createQueryBuilderMock(insertData, insertError));
      
      // Override update to return update data/error
      builder.update = vi.fn(() => createQueryBuilderMock(updateData, updateError));
      
      // Override delete to return delete data/error
      builder.delete = vi.fn(() => createQueryBuilderMock(deleteData, deleteError));
      
      return builder;
    }),
    
    rpc: vi.fn((functionName: string, params?: any) => {
      return Promise.resolve({
        data: rpcError ? null : rpcData,
        error: rpcError,
        status: rpcError ? 400 : 200,
        statusText: rpcError ? 'Error' : 'OK'
      });
    }),
    
    auth: {
      getSession: vi.fn(() => Promise.resolve({
        data: { session: { access_token: 'mock-token', user: { id: 'mock-user-id' } } },
        error: null
      })),
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'mock-user-id', email: 'test@example.com' } },
        error: null
      })),
      signIn: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
      signUp: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
    },
    
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        download: vi.fn(() => Promise.resolve({ data: new Blob(), error: null })),
        remove: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        list: vi.fn(() => Promise.resolve({ data: [], error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/file.jpg' } })),
      })),
    },
    
    functions: {
      invoke: vi.fn((functionName: string, options?: any) => {
        return Promise.resolve({
          data: rpcData,
          error: rpcError
        });
      }),
    },
    
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    })),
  };
}

/**
 * Creates a mock for specific table operations
 */
export function createTableMock(tableName: string, mockData: any[] = []) {
  return {
    select: vi.fn(() => createQueryBuilderMock(mockData)),
    insert: vi.fn(() => createQueryBuilderMock(mockData)),
    update: vi.fn(() => createQueryBuilderMock(mockData)),
    delete: vi.fn(() => createQueryBuilderMock([])),
    upsert: vi.fn(() => createQueryBuilderMock(mockData)),
  };
}

/**
 * Helper to create error responses
 */
export function createSupabaseError(message: string, code: string = 'PGRST116') {
  return {
    message,
    code,
    details: '',
    hint: ''
  };
}

/**
 * Helper to create successful responses
 */
export function createSupabaseResponse<T>(data: T, count: number | null = null) {
  return {
    data,
    error: null,
    status: 200,
    statusText: 'OK',
    count
  };
}

/**
 * Helper to create error responses
 */
export function createSupabaseErrorResponse(error: any) {
  return {
    data: null,
    error,
    status: 400,
    statusText: 'Error',
    count: null
  };
}
