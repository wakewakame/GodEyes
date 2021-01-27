'use strict';

const Tmp = class extends Component {
	onSetup() {
		this.button = this.addChild(new ButtonComp("abc", 2, 2, this.width - 4, this.height - 4));
		this.button.addEventListener("click", e => {
			console.log(this.parent.children.findIndex(c => (c === this)));
		});
	}
	onUpdate() {
		this.button.width = this.width - 4;
		this.button.height = this.height - 4;
	}
};

const MainComponent = class extends Component {
	onSetup() {
		const list = this.addChild(new ListComp(10, 10, 300, 500));
		for(let i = 0; i < 100; i++) {
			list.addListItem(new Tmp(0, 0, 1, 40));
		}
	}
	onUpdate() {
	}
	onDraw() {
		this.context.fillStyle = "#FFF";
		this.context.fillRect(0, 0, this.width, this.height);
	}
};
