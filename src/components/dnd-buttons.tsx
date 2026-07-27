import {useState} from "react";
import {Button, ButtonProps} from "./button";

export interface DndButtonDefinition {
	label: string;
	variant?: ButtonProps["variant"];
	size?: ButtonProps["size"];
	update: Record<string, unknown>;
}

export interface DndButtonsProps {
	buttons: DndButtonDefinition[];
	onClick: (button: DndButtonDefinition) => Promise<void>;
}

export function DndButtons({buttons, onClick}: DndButtonsProps) {
	const [pendingIndex, setPendingIndex] = useState<number | null>(null);

	const run = async (button: DndButtonDefinition, index: number) => {
		setPendingIndex(index);
		try {
			await onClick(button);
		} finally {
			setPendingIndex(null);
		}
	};

	return (
		<div className="flex flex-wrap items-center gap-2">
			{buttons.map((button, index) => (
				<Button
					key={index}
					variant={button.variant}
					size={button.size}
					disabled={pendingIndex !== null}
					onClick={() => void run(button, index)}
				>
					{button.label}
				</Button>
			))}
		</div>
	);
}
