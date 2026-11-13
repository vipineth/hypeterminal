import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { describe, expect, it } from "vitest";
import type { FakeAccount } from "./fake-hl";

const here = dirname(new URL(import.meta.url).pathname);

function restart(seed: Partial<FakeAccount>, args = ["--only", "none"]) {
	const principalKey = generatePrivateKey();
	const agentKey = generatePrivateKey();
	const statePath = join(mkdtempSync(join(tmpdir(), "hl-live-restart-")), "account.json");
	const account: FakeAccount = {
		mode: "disabled",
		spotUsdc: 30,
		collateral: { "": 500 },
		positions: [],
		orders: [],
		agents: [privateKeyToAccount(agentKey).address],
		exchange: [],
		...seed,
	};
	writeFileSync(statePath, JSON.stringify(account));
	const { HL_PRINCIPAL: _principal, ...env } = process.env;
	const run = spawnSync("bun", ["--preload", join(here, "fake-hl.ts"), join(here, "run.ts"), "--testnet", ...args], {
		cwd: join(here, "../.."),
		encoding: "utf8",
		env: { ...env, HL_ENV_FILE: "/dev/null", HL_LIVE_PRINCIPAL_KEY: principalKey, HL_LIVE_AGENT_KEY: agentKey, FAKE_HL_STATE: statePath },
		timeout: 60_000,
	});
	return { code: run.status, output: `${run.stdout}${run.stderr}`, after: JSON.parse(readFileSync(statePath, "utf8")) as FakeAccount };
}

describe("restart after a killed run", () => {
	it("leaves unified and restores the split before refusing an account under 100 USDC", () => {
		const { code, output, after } = restart({ mode: "unifiedAccount", spotUsdc: 99, collateral: { "": 0 } });
		expect(output).toMatch(/needs 100/);
		expect(code).toBe(2);
		expect(after).toMatchObject({ mode: "disabled", spotUsdc: 30, collateral: { "": 69 } });
	});

	it("stops an unfunded key with no exchange request", () => {
		const { code, after } = restart({ spotUsdc: 0, collateral: { "": 0 }, agents: [] });
		expect(code).toBe(2);
		expect(after.exchange).toEqual([]);
	});

	it("closes builder exposure left in unified mode when restarted without --builder", () => {
		const { code, output, after } = restart({
			mode: "unifiedAccount",
			spotUsdc: 400,
			collateral: { "": 0, xyz: 0 },
			positions: [{ coin: "xyz:NVDA", szi: 0.5 }],
			orders: [{ coin: "xyz:NVDA", oid: 9 }],
		});
		expect(after.positions.filter((position) => position.szi !== 0)).toEqual([]);
		expect(after.orders).toEqual([]);
		expect(after.mode).toBe("disabled");
		expect(code, output).toBe(0);
	});

	it("returns builder collateral stranded by an interrupted transfer, without --builder", () => {
		const { after } = restart({ mode: "unifiedAccount", spotUsdc: 829, collateral: { "": 0, xyz: 1 } });
		expect(after).toMatchObject({ mode: "disabled", spotUsdc: 30, collateral: { "": 800, xyz: 0 } });
	});

	it("never lets a later builder round trip adopt a stranded balance", () => {
		const { after } = restart({ spotUsdc: 30, collateral: { "": 799, xyz: 1 } }, ["--builder", "xyz:NVDA", "--only", "dex sendAsset"]);
		expect(after.collateral.xyz).toBe(0);
		expect(after.collateral[""] + after.spotUsdc).toBe(830);
	});
});
