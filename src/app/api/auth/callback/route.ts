import { NextRequest, NextResponse } from 'next/server';

// OAuth callback handler — receives the code from the OAuth provider,
// exchanges it for a session, and redirects to the dashboard.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/host/dashboard';

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', request.url));
  }

  // Exchange code for session via Supabase SSR helper or your auth provider.
  // For now we redirect — wire in your provider's token exchange here.
  return NextResponse.redirect(new URL(next, request.url));
}
