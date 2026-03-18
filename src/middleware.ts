import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Aplica middleware a todas las rutas excepto:
     * - Archivos estáticos de Next.js (_next/static, _next/image)
     * - favicon.ico, sitemap.xml, robots.txt
     * - Imágenes estáticas
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
