type ComponentInstance = {
	name: string;
	mountedAt: number;
	unmountedAt?: number;
};

const instances = new Map<string, ComponentInstance[]>();
let isEnabled = false;

export function enableLeakDetector() {
	if (typeof window === "undefined") return;
	isEnabled = true;
	console.log("%c[LeakDetector] Enabled", "color: #888;");
}

export function disableLeakDetector() {
	isEnabled = false;
	instances.clear();
}

export function trackMount(componentName: string, instanceId: string) {
	if (!isEnabled) return;

	const key = `${componentName}:${instanceId}`;
	const existing = instances.get(key) ?? [];
	existing.push({
		name: componentName,
		mountedAt: Date.now(),
	});
	instances.set(key, existing);
}

export function trackUnmount(componentName: string, instanceId: string) {
	if (!isEnabled) return;

	const key = `${componentName}:${instanceId}`;
	const existing = instances.get(key);
	if (existing && existing.length > 0) {
		const last = existing[existing.length - 1];
		if (!last.unmountedAt) {
			last.unmountedAt = Date.now();
		}
	}
}

export function getLeakedComponents(): { name: string; count: number; oldestMountAge: number }[] {
	const leaks: Map<string, { count: number; oldestMountAge: number }> = new Map();
	const now = Date.now();

	for (const [, componentInstances] of instances) {
		for (const instance of componentInstances) {
			if (!instance.unmountedAt) {
				const existing = leaks.get(instance.name) ?? { count: 0, oldestMountAge: 0 };
				existing.count++;
				const age = now - instance.mountedAt;
				if (age > existing.oldestMountAge) {
					existing.oldestMountAge = age;
				}
				leaks.set(instance.name, existing);
			}
		}
	}

	return Array.from(leaks.entries())
		.map(([name, data]) => ({ name, ...data }))
		.sort((a, b) => b.count - a.count);
}

export function reportLeaks() {
	const leaks = getLeakedComponents();

	if (leaks.length === 0) {
		console.log("%c[LeakDetector] No leaked components detected", "color: green;");
		return;
	}

	console.group("%c[LeakDetector] Potential leaks detected", "color: red; font-weight: bold;");
	for (const leak of leaks) {
		const ageMinutes = (leak.oldestMountAge / 60000).toFixed(1);
		console.log(`  ${leak.name}: ${leak.count} unmounted instances (oldest: ${ageMinutes}min ago)`);
	}
	console.groupEnd();
}

export function clearLeakData() {
	instances.clear();
}
