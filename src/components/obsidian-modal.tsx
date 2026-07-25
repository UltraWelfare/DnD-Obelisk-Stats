import {App, Modal} from "obsidian";
import {createRoot, Root} from "react-dom/client";

interface ModalProps {
	content: string;
}

function ModalContent({content}: ModalProps) {
	return <p>{content}</p>;
}

export class ObsidianModal extends Modal {
	private readonly props: ModalProps;
	private root: Root | null = null;

	constructor(app: App, props: ModalProps) {
		super(app);
		this.props = props;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.empty();
		this.modalEl.addClass("dnd-stat-modal-container");
		this.root = createRoot(contentEl);
		this.root.render(<ModalContent {...this.props} />);
	}

	onClose() {
		if (this.root) {
			this.root.unmount();
		}
		this.contentEl.empty();
	}
}
