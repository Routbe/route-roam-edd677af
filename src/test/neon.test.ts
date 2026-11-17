// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { afterEach, expect, it, vi } from "vitest";
import { GatewayPool, runBatch, withDbContext } from "@/lib/neon";
import { contextStatements } from "@/lib/db-context";
const { postgresMock } = vi.hoisted(() => ({ postgresMock: vi.fn() }));
vi.mock("postgres", () => ({ default: postgresMock }));

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
it("refuses fake interactive transactions before any network request", async () => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  const pool = new GatewayPool();
  await expect(pool.query("BEGIN")).rejects.toThrow("interactive_transactions_unsupported");
  await expect(pool.query("ROLLBACK")).rejects.toThrow("interactive_transactions_unsupported");
  await expect(pool.connect()).rejects.toThrow("interactive_transactions_unsupported");
  expect(fetch).not.toHaveBeenCalled();
});
it("steps down to rout_app, then sends context and role guard in the same atomic transaction", async () => {
  vi.stubEnv("DATABASE_URL", "postgresql://u:p@ep-steps.neon.tech/db");
  const userId="11111111-1111-4111-8111-111111111111";
  const unsafe=vi.fn(async (query: string) => Object.assign(query === "select true as ok" ? [{ok:true}] : [], { count: 1, command: "SELECT" }));
  const begin=vi.fn(async (fn: (tx: unknown) => unknown) => fn({ unsafe }));
  postgresMock.mockReturnValue({ begin, unsafe, end: vi.fn() });
  const results=await withDbContext({userId,workspaceId:null},()=>runBatch([{query:"select true as ok",params:[]}]));
  expect(unsafe.mock.calls[0]?.[0]).toBe("set local role rout_app");
  expect(unsafe.mock.calls[1]?.[0]).toContain("set_config('rout.current_user_id', $1, true)");
  expect((unsafe.mock.calls[1] as unknown[])?.[1]).toEqual(expect.arrayContaining([userId]));
  expect(unsafe.mock.calls[2]?.[0]).toContain("runtime_role_unsafe");
  expect(results[0]?.rows).toEqual([{ok:true}]);
  expect(begin).toHaveBeenCalledTimes(1);
});
it("PostgreSQL rolls back a late failure and clears transaction-local current_user_id", async () => {
  const db=new PGlite(); const userId="11111111-1111-4111-8111-111111111111";
  try {
    await db.exec("create table tx_probe(id int primary key)");
    await db.exec("BEGIN");
    const statement=contextStatements({userId,workspaceId:null})[0];
    if (!statement) throw new Error("Missing context statement");
    await db.query(statement.query,statement.params);
    expect((await db.query<{uid:string}>("select current_setting('rout.current_user_id',true) as uid")).rows[0]?.uid).toBe(userId);
    await db.exec("insert into tx_probe values(1)");
    await expect(db.exec("insert into tx_probe values(1)")).rejects.toThrow();
    await db.exec("ROLLBACK");
    expect((await db.query("select * from tx_probe")).rows).toEqual([]);
    expect((await db.query<{uid:string|null}>("select nullif(current_setting('rout.current_user_id',true),'') as uid")).rows[0]?.uid).toBeNull();
  } finally { await db.close(); }
}, 30000);