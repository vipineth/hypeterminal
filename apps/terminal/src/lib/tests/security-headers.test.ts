import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, cspDirectives } from "@/config/security-headers";

describe("security-headers CSP", () => {
	it("allows only the SSR bootstrap-compatible script sources", () => {
		expect(cspDirectives["script-src"]).toBe("'self' blob: 'unsafe-inline'");
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

	it("allows blob: iframes for the TradingView charting library", () => {
		const frameSrc = cspDirectives["frame-src"] ?? "";
		expect(frameSrc.split(" ")).toContain("blob:");
	});

	it("allows blob: stylesheets for the chart custom_css_url", () => {
		const styleSrc = cspDirectives["style-src"] ?? "";
		expect(styleSrc.split(" ")).toContain("blob:");
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
