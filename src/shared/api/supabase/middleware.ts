import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, serialize } from "@supabase/ssr";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // 현재 세션 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 보호된 라우트에 대한 접근 제어
  const { pathname } = request.nextUrl;

  // 보호된 라우트: /admin, /checkout, /history, /transfer, / 는 로그인 필수
  const protectedRoutes = ["/admin", "/checkout", "/history", "/transfer", "/"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    route === "/" ? pathname === "/" : pathname.startsWith(route),
  );

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 로그인 사용자가 /login 또는 /signup에 접근하면 막음 (layout 단계에서 리다이렉트)
  if ((pathname === "/login" || pathname === "/signup") && user) {
    // layout에서 처리하므로 미들웨어에서는 그냥 통과
    return supabaseResponse;
  }

  return supabaseResponse;
}
