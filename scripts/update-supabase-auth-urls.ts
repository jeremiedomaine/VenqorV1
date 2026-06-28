/**
 * Met à jour Site URL + Redirect URLs Supabase Auth (Management API).
 * Usage: SUPABASE_ACCESS_TOKEN=sbp_... npx tsx scripts/update-supabase-auth-urls.ts
 */
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const PROJECT_REF = "snszqnrcrjkojmaufwey";
const SITE_URL = "https://app.venqor.app";

const REDIRECT_URLS = [
  "https://app.venqor.app/**",
  "https://app.venqor.app/auth/callback",
  "https://app.venqor.app/auth/callback?next=/reset-password",
  "http://localhost:3000/**",
  "http://localhost:3000/auth/callback",
  "http://localhost:3000/auth/callback?next=/reset-password",
  "https://venqor-v1.vercel.app/**",
  "https://venqor-v1.vercel.app/auth/callback",
];

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!token) {
    console.error("SUPABASE_ACCESS_TOKEN manquant");
    process.exit(1);
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const currentRes = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
    { headers },
  );
  if (!currentRes.ok) {
    console.error("GET auth config failed:", currentRes.status, await currentRes.text());
    process.exit(1);
  }

  const current = (await currentRes.json()) as {
    site_url?: string;
    uri_allow_list?: string;
  };

  const existing = (current.uri_allow_list ?? "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);

  const merged = [...new Set([...existing, ...REDIRECT_URLS])];

  const patchRes = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        site_url: SITE_URL,
        uri_allow_list: merged.join(","),
      }),
    },
  );

  if (!patchRes.ok) {
    console.error("PATCH auth config failed:", patchRes.status, await patchRes.text());
    process.exit(1);
  }

  const updated = await patchRes.json();
  console.log("✓ Site URL:", updated.site_url ?? SITE_URL);
  console.log("✓ Redirect URLs:", updated.uri_allow_list ?? merged.join(","));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
