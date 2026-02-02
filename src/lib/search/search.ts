import { buildSearchIndex } from "./index-builder";
import {
	DEFAULT_MATCH_SCORES,
	type MatchType,
	type SearchConfig,
	type Searcher,
	type SearchIndex,
	type SearchResult,
} from "./types";
import { binarySearchLowerBound, buildCharMask, canContain, levenshtein, normalize, reverseString } from "./utils";

const SCORE_BUFFER_INITIAL = 4096;
let scoreBuffer = new Float32Array(SCORE_BUFFER_INITIAL);
let matchTypeBuffer = new Uint8Array(SCORE_BUFFER_INITIAL);
let matchFieldBuffer: string[] = new Array(SCORE_BUFFER_INITIAL);
let matchValueBuffer: string[] = new Array(SCORE_BUFFER_INITIAL);

function ensureBufferCapacity(size: number) {
	if (size > scoreBuffer.length) {
		const newSize = Math.max(size, scoreBuffer.length * 2);
		scoreBuffer = new Float32Array(newSize);
		matchTypeBuffer = new Uint8Array(newSize);
		matchFieldBuffer = new Array(newSize);
		matchValueBuffer = new Array(newSize);
	}
}

function resetBuffers(size: number) {
	for (let i = 0; i < size; i++) {
		scoreBuffer[i] = 0;
		matchTypeBuffer[i] = 0;
		matchFieldBuffer[i] = "";
		matchValueBuffer[i] = "";
	}
}

const MATCH_TYPE_MAP: MatchType[] = ["exact", "prefix", "suffix", "wordPrefix", "contains", "fuzzy"];

function updateScore(idx: number, score: number, matchTypeIdx: number, fieldName: string, value: string): void {
	if (score > scoreBuffer[idx]) {
		scoreBuffer[idx] = score;
		matchTypeBuffer[idx] = matchTypeIdx;
		matchFieldBuffer[idx] = fieldName;
		matchValueBuffer[idx] = value;
	}
}

export function searchIndex<T>(index: SearchIndex<T>, query: string): SearchResult<T>[] {
	const q = normalize(query);
	if (!q) return [];

	const itemCount = index.items.length;
	ensureBufferCapacity(itemCount);
	resetBuffers(itemCount);

	const scores = index.config.matchScores ?? DEFAULT_MATCH_SCORES;
	const exactScore = scores.exact ?? DEFAULT_MATCH_SCORES.exact;
	const prefixScore = scores.prefix ?? DEFAULT_MATCH_SCORES.prefix;
	const suffixScore = scores.suffix ?? DEFAULT_MATCH_SCORES.suffix;
	const wordPrefixScore = scores.wordPrefix ?? DEFAULT_MATCH_SCORES.wordPrefix;
	const containsScore = scores.contains ?? DEFAULT_MATCH_SCORES.contains;
	const fuzzyScore = scores.fuzzy ?? DEFAULT_MATCH_SCORES.fuzzy;

	const qMask = buildCharMask(q);
	const qLen = q.length;
	const qReversed = reverseString(q);
	const fuzzyMinLen = index.config.fuzzyMinLength ?? 3;
	const fuzzyMaxDist = index.config.fuzzyMaxDistance ?? 2;

	// Phase 1: Exact matches
	for (let i = 0; i < itemCount; i++) {
		const indexed = index.items[i];
		for (const [fieldName, fields] of indexed.fields) {
			const weight = index.fieldWeights.get(fieldName) ?? 1.0;
			for (const field of fields) {
				if (field.normalized === q) {
					updateScore(i, exactScore * weight, 0, fieldName, field.original);
				}
			}
		}
	}

	// Phase 2: Prefix matches via binary search
	const prefixStart = binarySearchLowerBound(index.prefixTable, q);
	for (let i = prefixStart; i < index.prefixTable.length; i++) {
		const entry = index.prefixTable[i];
		if (!entry.normalized.startsWith(q)) break;
		if (entry.normalized === q) continue; // Already handled as exact

		const score = prefixScore * entry.weight;
		updateScore(entry.itemIdx, score, 1, entry.fieldName, entry.original);
	}

	// Phase 3: Suffix matches via binary search on reversed strings
	const suffixStart = binarySearchLowerBound(index.suffixTable, qReversed);
	for (let i = suffixStart; i < index.suffixTable.length; i++) {
		const entry = index.suffixTable[i];
		if (!entry.normalized.startsWith(qReversed)) break;

		const originalNormalized = reverseString(entry.normalized);
		if (originalNormalized === q) continue; // Exact match
		if (originalNormalized.startsWith(q)) continue; // Prefix match

		const score = suffixScore * entry.weight;
		updateScore(entry.itemIdx, score, 2, entry.fieldName, entry.original);
	}

	// Phase 4: Word prefix matches
	for (let i = 0; i < itemCount; i++) {
		if (scoreBuffer[i] >= suffixScore) continue;

		const indexed = index.items[i];
		for (const [fieldName, fields] of indexed.fields) {
			const weight = index.fieldWeights.get(fieldName) ?? 1.0;
			for (const field of fields) {
				for (const word of field.words) {
					if (word !== q && word.startsWith(q)) {
						const score = wordPrefixScore * weight;
						updateScore(i, score, 3, fieldName, field.original);
						break;
					}
				}
			}
		}
	}

	// Phase 5: Contains matches with bitmask pre-filter
	for (let i = 0; i < itemCount; i++) {
		if (scoreBuffer[i] >= wordPrefixScore) continue;

		const indexed = index.items[i];
		for (const [fieldName, fields] of indexed.fields) {
			const weight = index.fieldWeights.get(fieldName) ?? 1.0;
			for (const field of fields) {
				if (!canContain(field.charMask, qMask)) continue;

				if (field.normalized.includes(q)) {
					const score = containsScore * weight;
					updateScore(i, score, 4, fieldName, field.original);
				}
			}
		}
	}

	// Phase 6: Fuzzy matches (only for unmatched items, short fields)
	if (qLen >= fuzzyMinLen) {
		for (let i = 0; i < itemCount; i++) {
			if (scoreBuffer[i] > 0) continue;

			const indexed = index.items[i];
			for (const [fieldName, fields] of indexed.fields) {
				if (!index.fieldFuzzy.get(fieldName)) continue;

				const weight = index.fieldWeights.get(fieldName) ?? 1.0;
				for (const field of fields) {
					if (field.normalized.length > qLen + 4) continue;

					const dist = levenshtein(field.normalized, q);
					if (dist <= fuzzyMaxDist) {
						const proximity = 1 - dist / (fuzzyMaxDist + 1);
						const score = fuzzyScore * weight * proximity;
						updateScore(i, score, 5, fieldName, field.original);
					}
				}
			}
		}
	}

	// Collect results
	const results: SearchResult<T>[] = [];
	for (let i = 0; i < itemCount; i++) {
		if (scoreBuffer[i] > 0) {
			results.push({
				item: index.items[i].item,
				score: scoreBuffer[i],
				matches: [
					{
						field: matchFieldBuffer[i],
						type: MATCH_TYPE_MAP[matchTypeBuffer[i]],
						value: matchValueBuffer[i],
						score: scoreBuffer[i],
					},
				],
			});
		}
	}

	// Sort by score descending
	results.sort((a, b) => b.score - a.score);

	return results;
}

export function createSearcher<T>(items: T[], config: SearchConfig<T>): Searcher<T> {
	let index = buildSearchIndex(items, config);

	return {
		search(query: string): SearchResult<T>[] {
			return searchIndex(index, query);
		},

		setItems(newItems: T[]) {
			index = buildSearchIndex(newItems, config);
		},

		getItems() {
			return index.items.map((i) => i.item);
		},
	};
}

export function search<T>(items: T[], query: string, config: SearchConfig<T>): SearchResult<T>[] {
	if (!query.trim()) return [];
	const index = buildSearchIndex(items, config);
	return searchIndex(index, query);
}
