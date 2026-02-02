export type MatchType = "exact" | "prefix" | "suffix" | "wordPrefix" | "contains" | "fuzzy";

export interface SearchField<T> {
	extract: (item: T) => string | string[] | null | undefined;
	weight?: number;
	fuzzy?: boolean;
}

export interface SearchConfig<T> {
	fields: Record<string, SearchField<T>>;
	matchScores?: Partial<Record<MatchType, number>>;
	fuzzyMinLength?: number;
	fuzzyMaxDistance?: number;
}

export interface SearchMatch {
	field: string;
	type: MatchType;
	value: string;
	score: number;
}

export interface SearchResult<T> {
	item: T;
	score: number;
	matches: SearchMatch[];
}

export interface IndexedField {
	original: string;
	normalized: string;
	words: string[];
	charMask: number;
}

export interface IndexedItem<T> {
	item: T;
	index: number;
	fields: Map<string, IndexedField[]>;
}

export interface PrefixEntry {
	normalized: string;
	itemIdx: number;
	fieldName: string;
	fieldIdx: number;
	weight: number;
	original: string;
}

export interface SearchIndex<T> {
	items: IndexedItem<T>[];
	prefixTable: PrefixEntry[];
	suffixTable: PrefixEntry[];
	config: SearchConfig<T>;
	fieldWeights: Map<string, number>;
	fieldFuzzy: Map<string, boolean>;
}

export const DEFAULT_MATCH_SCORES: Record<MatchType, number> = {
	exact: 1000,
	prefix: 500,
	suffix: 350,
	wordPrefix: 300,
	contains: 100,
	fuzzy: 50,
};

export interface Searcher<T> {
	search: (query: string) => SearchResult<T>[];
	setItems: (items: T[]) => void;
	getItems: () => T[];
}
