import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { generateQrMatrix } from "@/lib/qr/generate-qr-matrix";

interface Props {
	payload: string;
	revealed: boolean;
	size?: number;
}

interface ScatterPosition {
	x: number;
	y: number;
	rotate: number;
}

function generateScatterPositions(count: number, gridSize: number, moduleSize: number): ScatterPosition[] {
	const totalSize = gridSize * moduleSize;
	const positions: ScatterPosition[] = [];
	for (let i = 0; i < count; i++) {
		positions.push({
			x: Math.random() * totalSize * 1.2 - totalSize * 0.1,
			y: Math.random() * totalSize * 1.2 - totalSize * 0.1,
			rotate: Math.random() * 360 - 180,
		});
	}
	return positions;
}

export function ShuffledQrCode({ payload, revealed, size = 240 }: Props) {
	const prefersReducedMotion = useReducedMotion();
	const matrix = generateQrMatrix(payload);
	const padding = 16;
	const moduleSize = (size - padding * 2) / matrix.size;
	const svgSize = size;

	const darkModuleCount = matrix.data.filter(Boolean).length;
	const scatterRef = useRef<ScatterPosition[]>(generateScatterPositions(darkModuleCount, matrix.size, moduleSize));
	const [, setScatterTick] = useState(0);

	useEffect(() => {
		if (revealed || prefersReducedMotion) return;

		const interval = setInterval(() => {
			scatterRef.current = generateScatterPositions(darkModuleCount, matrix.size, moduleSize);
			setScatterTick((k) => k + 1);
		}, 3000);

		return () => clearInterval(interval);
	}, [revealed, darkModuleCount, matrix.size, moduleSize, prefersReducedMotion]);

	let darkIndex = 0;

	return (
		<svg
			width={svgSize}
			height={svgSize}
			viewBox={`0 0 ${svgSize} ${svgSize}`}
			className="bg-text-10 rounded-xs"
			role="img"
			aria-label="QR code"
		>
			{matrix.data.map((isDark, i) => {
				if (!isDark) return null;

				const row = Math.floor(i / matrix.size);
				const col = i % matrix.size;
				const key = `${row}-${col}`;
				const gridX = padding + col * moduleSize;
				const gridY = padding + row * moduleSize;

				const currentDarkIndex = darkIndex;
				darkIndex++;

				const scatter = scatterRef.current[currentDarkIndex];
				if (!scatter) return null;

				if (prefersReducedMotion) {
					return (
						<rect
							key={key}
							x={revealed ? gridX : scatter.x}
							y={revealed ? gridY : scatter.y}
							width={moduleSize - 1}
							height={moduleSize - 1}
							rx={1}
							className="fill-text-950"
							opacity={revealed ? 1 : 0.6}
						/>
					);
				}

				return (
					<motion.rect
						key={key}
						animate={{
							x: revealed ? gridX : scatter.x,
							y: revealed ? gridY : scatter.y,
							rotate: revealed ? 0 : scatter.rotate,
							opacity: revealed ? 1 : 0.6,
						}}
						transition={{
							type: "spring",
							stiffness: 200,
							damping: 25,
							mass: 0.8,
						}}
						width={moduleSize - 1}
						height={moduleSize - 1}
						rx={1}
						className="fill-text-950"
					/>
				);
			})}
		</svg>
	);
}
