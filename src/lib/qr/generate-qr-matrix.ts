import QRCode from "qrcode";

export interface QrMatrix {
	data: boolean[];
	size: number;
}

export function generateQrMatrix(payload: string): QrMatrix {
	const qr = QRCode.create(payload, { errorCorrectionLevel: "L" });
	const { modules } = qr;
	const size = modules.size;
	const data: boolean[] = [];

	for (let i = 0; i < size * size; i++) {
		data.push(modules.get(Math.floor(i / size), i % size) === 1);
	}

	return { data, size };
}
