import {ReactNode} from "react";
import {Badge} from "./badge";

export interface DndBadgeItem {
	label: string;
	value: ReactNode;
}

interface DndBadgesProps {
	badges: DndBadgeItem[];
}

export function DndBadges({badges}: DndBadgesProps) {
	return (
		<div className="flex flex-row flex-wrap gap-2">
			{badges.map((badge) => (
				<Badge key={badge.label} label={badge.label} value={badge.value} />
			))}
		</div>
	);
}
