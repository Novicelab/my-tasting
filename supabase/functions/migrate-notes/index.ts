import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ALLOWED_ORIGINS = [
  "https://my-tasting.vercel.app",
  "http://localhost:5173",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 호출자 인증 확인
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "인증이 필요합니다." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 호출자의 user_id 확인 (새 계정)
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "유효하지 않은 인증입니다." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 익명 사용자가 아닌 경우에만 마이그레이션 허용
    if (user.is_anonymous) {
      return new Response(JSON.stringify({ error: "정식 계정으로 로그인 후 이용 가능합니다." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { anonymousUserId } = await req.json();
    if (!anonymousUserId) {
      return new Response(JSON.stringify({ error: "anonymousUserId가 필요합니다." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // anonymousUserId가 실제 익명 계정인지 검증 (노트 탈취 방지)
    const { data: { user: anonUser }, error: anonCheckError } =
      await supabaseAuth.auth.admin.getUserById(anonymousUserId);

    if (anonCheckError || !anonUser || !anonUser.is_anonymous) {
      return new Response(JSON.stringify({ error: "유효하지 않은 익명 계정입니다." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newUserId = user.id;

    // 같은 user_id면 마이그레이션 불필요
    if (anonymousUserId === newUserId) {
      return new Response(JSON.stringify({ migrated: 0, message: "동일한 계정입니다." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // service_role로 tasting_notes의 user_id를 이관
    const { data, error } = await supabaseAuth
      .from("tasting_notes")
      .update({ user_id: newUserId })
      .eq("user_id", anonymousUserId)
      .select("id");

    if (error) {
      console.error("Migration error:", error);
      return new Response(JSON.stringify({ error: "데이터 이관에 실패했습니다.", detail: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const count = data?.length || 0;
    console.log(`Migrated ${count} notes from ${anonymousUserId} to ${newUserId}`);

    return new Response(JSON.stringify({ migrated: count }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: "서버 오류가 발생했습니다." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
