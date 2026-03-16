import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
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

const SYSTEM_PROMPT = `You are an expert sommelier and liquor specialist. Analyze the provided image of a liquor bottle/label and extract detailed information.

Return a JSON object with the following structure:
{
  "name": "주류 이름 (한국어)",
  "name_original": "원어 이름",
  "category": "wine|sake|traditional_korean|whisky|beer|spirits",
  "sub_category": "세부 분류 (예: red, white, junmai, IPA 등)",
  "country": "생산 국가",
  "region": "생산 지역",
  "producer": "생산자/양조장",
  "vintage": null or 연도(숫자),
  "abv": null or 도수(숫자),
  "price_range": "가격대 (예: 3-5만원)",
  "description": "이 주류에 대한 간결한 설명 (2-3문장, 한국어)",
  "aroma_options": ["향1", "향2", ...],  // 이 주류에서 느낄 수 있는 향 8-12개 (한국어)
  "taste_options": ["맛1", "맛2", ...],  // 이 주류에서 느낄 수 있는 맛 6-10개 (한국어)
  "finish_options": ["여운1", "여운2", ...],  // 여운 특성 4-8개 (한국어)
  "food_pairing_options": ["음식1", "음식2", ...],  // 추천 음식 페어링 6-10개 (한국어)
  "drinking_timing": "식전주|식중주|식후주|언제든지 중 이 주류에 가장 어울리는 음용 타이밍 1개",
  "overall_review": "대중적인 종합 후기 (3-5문장, 한국어). 이 주류의 전반적인 평가와 특징을 정리.",
  "avg_rating": null or 대중 평균 평점 (1.0-5.0)
}

Important:
- All text fields should be in Korean
- Provide realistic, knowledgeable options based on the actual liquor characteristics
- For aroma/taste/finish options, include both common and distinctive characteristics
- For drinking_timing, choose exactly one of: 식전주, 식중주, 식후주, 언제든지
- If you cannot identify the liquor, make your best guess based on visible label information
- Return ONLY valid JSON, no markdown or extra text`;

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "인증이 필요합니다." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 토큰 유효성 검증
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authUser) {
      return new Response(JSON.stringify({ error: "유효하지 않은 인증입니다." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { imageUrl, imageBase64, liquorName, dryRun, confirmedData } = await req.json();
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "이미지 URL이 필요합니다." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If confirmedData is provided, skip AI call and save directly to DB
    let liquorData;

    if (confirmedData) {
      // 허용된 필드만 추출 (임의 데이터 주입 방지)
      const allowedFields = [
        "name", "name_original", "category", "sub_category", "country", "region",
        "producer", "vintage", "abv", "price_range", "description",
        "aroma_options", "taste_options", "finish_options", "food_pairing_options",
        "drinking_timing", "overall_review", "avg_rating",
      ];
      liquorData = Object.fromEntries(
        Object.entries(confirmedData).filter(([k]) => allowedFields.includes(k))
      );

      // name 필드 필수 검증
      if (!liquorData.name || typeof liquorData.name !== "string") {
        return new Response(JSON.stringify({ error: "name 필드는 필수입니다." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Build user message based on whether a corrected name was provided
      const userText = liquorName
        ? `이 이미지의 주류는 "${liquorName}"입니다. 이 주류의 정확한 정보를 분석하고 JSON으로 반환해주세요. 이미지와 이름이 일치하는지 확인하고, name 필드에는 정확한 한국어 이름을, name_original에는 정확한 원어 표기를 사용하세요.`
        : "이 주류의 라벨을 분석하고 상세 정보를 JSON으로 제공해주세요.";

      // Use base64 from frontend if available, otherwise use URL
      const openaiImageUrl = imageBase64 || imageUrl;

      // Call OpenAI GPT-4o Vision
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: [
                { type: "text", text: userText },
                { type: "image_url", image_url: { url: openaiImageUrl, detail: "high" } },
              ],
            },
          ],
          max_tokens: 2000,
          temperature: 0.3,
        }),
      });

      if (!openaiResponse.ok) {
        const errText = await openaiResponse.text();
        console.error("OpenAI error:", errText);
        return new Response(JSON.stringify({ error: "AI 인식에 실패했습니다." }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const openaiData = await openaiResponse.json();
      const content = openaiData.choices?.[0]?.message?.content;

      if (!content) {
        console.error("Empty AI response:", JSON.stringify(openaiData));
        return new Response(JSON.stringify({ error: "AI 응답이 비어있습니다." }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Parse JSON from response (handle markdown code blocks and surrounding text)
      try {
        // First try: strip markdown fences and parse directly
        const stripped = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        liquorData = JSON.parse(stripped);
      } catch {
        // Second try: extract JSON object from mixed text+JSON response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            liquorData = JSON.parse(jsonMatch[0]);
          } catch {
            console.error("Failed to parse extracted JSON:", jsonMatch[0]);
            return new Response(JSON.stringify({ error: content }), {
              status: 422,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } else {
          // No JSON found — likely not a liquor image
          console.error("No JSON in AI response:", content);
          return new Response(JSON.stringify({ error: content }), {
            status: 422,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // dryRun: return AI result without saving to DB
      if (dryRun) {
        return new Response(JSON.stringify(liquorData), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // dryRun은 confirmedData 경로에서도 적용
    if (dryRun) {
      return new Response(JSON.stringify(liquorData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // imageUrl 유효성 검증 (Supabase Storage URL만 허용)
    if (!imageUrl.includes("supabase.co/storage")) {
      return new Response(JSON.stringify({ error: "유효하지 않은 이미지 URL입니다." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save to liquors table (cache) using service role
    // supabaseAdmin은 이미 상단에서 생성됨

    // Check for existing liquor with same name (대소문자 무시)
    const { data: existing } = await supabaseAdmin
      .from("liquors")
      .select("id")
      .eq("name", liquorData.name)
      .maybeSingle();

    let liquorRecord;

    if (existing) {
      // Update existing
      const { data, error } = await supabaseAdmin
        .from("liquors")
        .update({
          ...liquorData,
          image_url: imageUrl,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      liquorRecord = data;
    } else {
      // Insert new
      const { data, error } = await supabaseAdmin
        .from("liquors")
        .insert({
          ...liquorData,
          image_url: imageUrl,
        })
        .select()
        .single();

      if (error) throw error;
      liquorRecord = data;
    }

    return new Response(JSON.stringify(liquorRecord), {
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
