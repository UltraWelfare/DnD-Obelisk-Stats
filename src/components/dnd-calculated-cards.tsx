import {Card} from "./card";

type CalculatedCard = {
	label: string;
	value: string;
};

interface DndCalculatedCardsProps {
	cards: CalculatedCard[];
	cardsPerRow: number;
}

export default function DndCalculatedCards({cards, cardsPerRow}: DndCalculatedCardsProps) {
	return (
		<div className="grid gap-4" style={{gridTemplateColumns: `repeat(${cardsPerRow}, minmax(0, 1fr))`}}>
			{cards.map((c) => (
				<Card className="w-full" key={c.label} label={c.label} value={c.value} />
			))}
		</div>
	);
}
