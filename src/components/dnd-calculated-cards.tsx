import {Platform} from "obsidian";
import {Card} from "./card";

type CalculatedCard = {
	label: string;
	value: string;
	sublabel?: string;
	offlabel?: string;
};

interface DndCalculatedCardsProps {
	cards: CalculatedCard[];
	cardsPerRowDesktop: number;
	cardsPerRowMobile: number;
}

export default function DndCalculatedCards({cards, cardsPerRowDesktop, cardsPerRowMobile}: DndCalculatedCardsProps) {
	const cardsPerRow = Platform.isMobile ? cardsPerRowMobile : cardsPerRowDesktop;
	return (
		<div className="my-3 grid gap-4" style={{gridTemplateColumns: `repeat(${cardsPerRow}, minmax(0, 1fr))`}}>
			{cards.map((c) => (
				<Card className="w-full" key={c.label} label={c.label} value={c.value} sublabel={c.sublabel} offlabel={c.offlabel} />
			))}
		</div>
	);
}
