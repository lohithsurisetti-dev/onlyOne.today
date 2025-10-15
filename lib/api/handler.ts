import { NextRequest, NextResponse } from 'next/server'

/**
 * API Error Handler - Centralized error handling for all API routes
 */
export class APIError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

/**
 * Wrapper for API route handlers with automatic error handling
 */
export function apiHandler<T = any>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context)
    } catch (error) {
      console.error('❌ API Error:', error)

      // Handle custom APIError
      if (error instanceof APIError) {
        return NextResponse.json(
          { 
            error: error.message,
            code: error.code,
          },
          { status: error.statusCode }
        )
      }

      // Handle standard errors
      if (error instanceof Error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }

      // Handle unknown errors
      return NextResponse.json(
        { error: 'An unexpected error occurred' },
        { status: 500 }
      )
    }
  }
}

/**
 * Validate required fields in request body
 */
export function validateRequired<T extends Record<string, any>>(
  body: T,
  fields: (keyof T)[]
): void {
  for (const field of fields) {
    if (!body[field]) {
      throw new APIError(
        `Missing required field: ${String(field)}`,
        400,
        'VALIDATION_ERROR'
      )
    }
  }
}

/**
 * Parse and validate JSON body
 */
export async function parseBody<T = any>(request: NextRequest): Promise<T> {
  try {
    const body = await request.json()
    return body as T
  } catch (error) {
    throw new APIError(
      'Invalid JSON in request body',
      400,
      'INVALID_JSON'
    )
  }
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status })
}

/**
 * Error response helper
 */
export function errorResponse(
  message: string,
  status: number = 500,
  code?: string
): NextResponse {
  return NextResponse.json(
    { error: message, code },
    { status }
  )
}

