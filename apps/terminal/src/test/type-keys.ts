import type * as React from "react";

type InputHandlers = Pick<React.ComponentProps<"input">, "onKeyDown" | "onChange">;

export function typeKeys(
	renderInput: (value: string, commit: (next: string) => void) => InputHandlers,
	keys: string[],
	initialValue = "",
): string {
	let value = initialValue;
	for (const key of keys) {
		const input = renderInput(value, (next) => {
			value = next;
		});
		let prevented = false;
		input.onKeyDown?.({
			key,
			currentTarget: { value, selectionStart: value.length },
			preventDefault: () => {
				prevented = true;
			},
		} as unknown as React.KeyboardEvent<HTMLInputElement>);
		if (prevented) continue;
		const next = key === "Backspace" ? value.slice(0, -1) : value + key;
		input.onChange?.({ target: { value: next } } as React.ChangeEvent<HTMLInputElement>);
	}
	return value;
}
