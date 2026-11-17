import { sql } from "@/lib/neon";
import { hasSchemaFeature } from "@/lib/schema-features.server";

export type PublicIdentity = { diditVerified: boolean; realHuman: boolean };

const NONE: PublicIdentity = { diditVerified: false, realHuman: false };

/**
 * Public identity result per member id, read through db/0282 (rout_public_identity_badges).
 * diditVerified is the blue "KYC Attested" shield: only a KYC attestation sets it; profiles.verified
 * and is_paid are ignored. realHuman is the green "Real Human" shield and comes EXCLUSIVELY from a
 * zero-knowledge proof (db/0288, evidence = 'zk_proof'); before 0288 is live the db/0282
 * answer mixes in KYC and W Identity, so it is ignored and realHuman stays false.
 * Fails closed: an unreachable database or an older schema gives no mark.
 */
export async function readPublicIdentities(userIds: readonly string[]): Promise<Map<string, PublicIdentity>> {
  const ids = [...new Set(userIds.filter(Boolean))].slice(0, 200);
  const out = new Map<string, PublicIdentity>();
  if (!ids.length) return out;
  try {
    const zkOnly = await hasSchemaFeature("0288");
    const rows = (await sql`select user_id, didit_legal_identity, real_human
        from public.rout_public_identity_badges(${ids}::uuid[])`) as Record<string, unknown>[];
    for (const r of rows) {
      out.set(String(r["user_id"]), { diditVerified: r["didit_legal_identity"] === true, realHuman: zkOnly && r["real_human"] === true });
    }
  } catch (error) {
    console.warn("[public-identity:skipped]", error);
  }
  return out;
}

export async function readPublicIdentity(userId: string): Promise<PublicIdentity> {
  return (await readPublicIdentities([userId])).get(userId) ?? NONE;
}
