import type { IndexedField, IndexedItem, PrefixEntry, SearchConfig, SearchIndex } from "./types";
import { buildCharMask, normalize, reverseString, tokenize } from "./utils";

function extractFieldValues<T>(item: T, extract: (item: T) => string | string[] | null | undefined): string[] {
	const result = extract(item);
	if (result == null) return [];
	if (Array.isArray(result)) return result.filter((v): v is string => v != null && v !== "");
	if (result === "") return [];
	return [result];
}

function createIndexedField(value: string): IndexedField {
	const normalized = normalize(value);
	return {
		original: value,
		normalized,
		words: tokenize(normalized),
		charMask: buildCharMask(normalized),
	};
}

export function buildSearchIndex<T>(items: T[], config: SearchConfig<T>): SearchIndex<T> {
	const fieldWeights = new Map<string, number>();
	const fieldFuzzy = new Map<string, boolean>();

	for (const [name, field] of Object.entries(config.fields)) {
		fieldWeights.set(name, field.weight ?? 1.0);
		fieldFuzzy.set(name, field.fuzzy ?? false);
	}

	const indexedItems: IndexedItem<T>[] = [];
	const prefixEntries: PrefixEntry[] = [];
	const suffixEntries: PrefixEntry[] = [];

	for (let itemIdx = 0; itemIdx < items.length; itemIdx++) {
		const item = items[itemIdx];
		const fields = new Map<string, IndexedField[]>();

		for (const [fieldName, fieldConfig] of Object.entries(config.fields)) {
			const values = extractFieldValues(item, fieldConfig.extract);
			const indexedFields: IndexedField[] = [];

			for (let fieldIdx = 0; fieldIdx < values.length; fieldIdx++) {
				const indexed = createIndexedField(values[fieldIdx]);
				indexedFields.push(indexed);

				const weight = fieldWeights.get(fieldName) ?? 1.0;

				prefixEntries.push({
					normalized: indexed.normalized,
					itemIdx,
					fieldName,
					fieldIdx,
					weight,
					original: indexed.original,
				});

				suffixEntries.push({
					normalized: reverseString(indexed.normalized),
					itemIdx,
					fieldName,
					fieldIdx,
					weight,
					original: indexed.original,
				});
			}

			if (indexedFields.length > 0) {
				fields.set(fieldName, indexedFields);
			}
		}

		indexedItems.push({ item, index: itemIdx, fields });
	}

	prefixEntries.sort((a, b) => (a.normalized < b.normalized ? -1 : a.normalized > b.normalized ? 1 : 0));
	suffixEntries.sort((a, b) => (a.normalized < b.normalized ? -1 : a.normalized > b.normalized ? 1 : 0));

	return {
		items: indexedItems,
		prefixTable: prefixEntries,
		suffixTable: suffixEntries,
		config,
		fieldWeights,
		fieldFuzzy,
	};
}
