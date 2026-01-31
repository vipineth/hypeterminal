export type ErrorSeverity = "error" | "warning" | "info";

export type ErrorCategory =
	| "connection"
	| "balance"
	| "market"
	| "input"
	| "tpsl"
	| "trigger"
	| "scale"
	| "twap"
	| "deposit"
	| "withdraw"
	| "transaction"
	| "system";

export interface ErrorDefinition {
	id: string;
	code: string;
	severity: ErrorSeverity;
	category: ErrorCategory;
	priority: number;
}

export interface ValidationError extends ErrorDefinition {
	message: string;
}

export interface Validator<TContext> {
	id: string;
	error: ErrorDefinition;
	getMessage: (ctx: TContext) => string;
	validate: (ctx: TContext) => boolean;
}

export interface ValidationResult {
	valid: boolean;
	errors: ValidationError[];
	canSubmit: boolean;
	needsApproval: boolean;
}

export function createValidator<TContext>(config: {
	id: string;
	code: string;
	severity?: ErrorSeverity;
	category: ErrorCategory;
	priority: number;
	getMessage: (ctx: TContext) => string;
	validate: (ctx: TContext) => boolean;
}): Validator<TContext> {
	return {
		id: config.id,
		error: {
			id: config.id,
			code: config.code,
			severity: config.severity ?? "error",
			category: config.category,
			priority: config.priority,
		},
		getMessage: config.getMessage,
		validate: config.validate,
	};
}

export function runValidators<TContext>(validators: Validator<TContext>[], context: TContext): ValidationError[] {
	const errors: ValidationError[] = [];

	for (const validator of validators) {
		const isValid = validator.validate(context);
		if (!isValid) {
			errors.push({
				...validator.error,
				message: validator.getMessage(context),
			});
		}
	}

	return errors.sort((a, b) => a.priority - b.priority);
}

export function getFirstError<TContext>(validators: Validator<TContext>[], context: TContext): ValidationError | null {
	const errors = runValidators(validators, context);
	return errors.length > 0 ? errors[0] : null;
}
