import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  const destination = requestedNext?.startsWith("/")
    ? requestedNext
    : profile?.role === "admin" || user?.email?.toLowerCase() === "ezzouhir2122@gmail.com"
      ? "/admin"
      : "/dashboard";
  return NextResponse.redirect(`${origin}${destination}`);
}
