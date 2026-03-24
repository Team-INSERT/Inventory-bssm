import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // In mock mode, we just pass through or check for our mock cookie
  const mockRole = request.cookies.get('mock_role')?.value
  
  // If we are on a protected route and no mock role, we COULD redirect to login
  // but for "test mode", let's keep it very permissive.
  
  return NextResponse.next()
}
