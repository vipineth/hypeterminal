import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, cspDirectives } from "@/config/security-headers";

describe("security-headers CSP", () => {
	it("does not allow unsafe-inline in script-src", () => {
		expect(cspDirectives["script-src"]).not.toContain("'unsafe-inline'");
	});

	it("does not allow bare https: in connect-src", () => {
		const connectSrc = cspDirectives["connect-src"] ?? "";
		expect(connectSrc.split(" ")).not.toContain("https:");
	});

	it("does not allow bare wss: in connect-src", () => {
		const connectSrc = cspDirectives["connect-src"] ?? "";
		expect(connectSrc.split(" ")).not.toContain("wss:");
	});

	it("does not allow bare https: in frame-src", () => {
		const frameSrc = cspDirectives["frame-src"] ?? "";
		expect(frameSrc.split(" ")).not.toContain("https:");
	});

	it("keeps object-src as 'none'", () => {
		expect(cspDirectives["object-src"]).toBe("'none'");
	});

	it("keeps frame-ancestors as 'none'", () => {
		expect(cspDirectives["frame-ancestors"]).toBe("'none'");
	});

	it("keeps base-uri as 'self'", () => {
		expect(cspDirectives["base-uri"]).toBe("'self'");
	});

	it("serializes all directives into the policy string", () => {
		for (const directive of Object.keys(cspDirectives)) {
			expect(contentSecurityPolicy).toContain(directive);
		}
	});
});
