/**
 * CampusQuickBite — Supabase Reverse Proxy
 * Cloudflare Worker that bypasses Indian ISP DNS blocking of *.supabase.co
 * Project URL: https://mwovhehesvriexyhwbsb.supabase.co
 */

const SUPABASE_URL = "https://mwovhehesvriexyhwbsb.supabase.co";
const ALLOWED_ORIGINS = ["*"]; // allow all origins

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        // Handle CORS preflight
        if (request.method === "OPTIONS") {
            return handleCORS(request);
        }

        const url = new URL(request.url);

        // Health check endpoint
        if (url.pathname === "/_proxy/health") {
            return new Response(JSON.stringify({ status: "ok", proxy: SUPABASE_URL }), {
                headers: { "Content-Type": "application/json", ...corsHeaders(request) },
            });
        }

        // Build target Supabase URL (replace worker host with supabase host)
        const targetUrl = new URL(url.pathname + url.search, SUPABASE_URL);

        // Clone headers, remove cf-specific ones, set Host to Supabase
        const requestHeaders = new Headers(request.headers);
        requestHeaders.delete("cf-connecting-ip");
        requestHeaders.delete("cf-ipcountry");
        requestHeaders.delete("cf-ray");
        requestHeaders.delete("cf-visitor");
        requestHeaders.delete("x-forwarded-proto");
        requestHeaders.set("Host", new URL(SUPABASE_URL).hostname);

        // Forward request to Supabase
        let supabaseResponse: Response;
        try {
            supabaseResponse = await fetch(targetUrl.toString(), {
                method: request.method,
                headers: requestHeaders,
                body: ["GET", "HEAD"].includes(request.method) ? null : request.body,
                redirect: "follow",
            });
        } catch (err) {
            return new Response(JSON.stringify({ error: "Proxy connection failed", detail: String(err) }), {
                status: 502,
                headers: { "Content-Type": "application/json", ...corsHeaders(request) },
            });
        }

        // Build response with CORS headers injected
        const responseHeaders = new Headers(supabaseResponse.headers);
        const cors = corsHeaders(request);
        for (const [key, value] of Object.entries(cors)) {
            responseHeaders.set(key, value);
        }

        // Handle WebSocket upgrade (for Supabase Realtime)
        if (supabaseResponse.status === 101) {
            return supabaseResponse;
        }

        return new Response(supabaseResponse.body, {
            status: supabaseResponse.status,
            statusText: supabaseResponse.statusText,
            headers: responseHeaders,
        });
    },
};

function corsHeaders(request: Request): Record<string, string> {
    const origin = request.headers.get("Origin") || "*";
    const allowed =
        ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(origin) ? origin : "";

    return {
        "Access-Control-Allow-Origin": allowed || "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
            "authorization, x-client-info, apikey, content-type, x-supabase-api-version, prefer, range, x-upsert",
        "Access-Control-Expose-Headers": "content-range, x-supabase-api-version",
        "Access-Control-Max-Age": "86400",
    };
}

function handleCORS(request: Request): Response {
    return new Response(null, {
        status: 204,
        headers: corsHeaders(request),
    });
}

interface Env { }
