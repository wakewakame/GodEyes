'use strict';

const Component = class {
	constructor(left, top, width, height) {
		this.p5 = null;
		this.left = left ? left : 0;
		this.top = top ? top : 0;
		this.width = width ? width : 0;
		this.height = height ? height : 0;
		this.children = [];
	}
	addChild(child) {
		this.children.push(child);
		child._setup(this.p5);
	}
	_setup(p5) {
		this.p5 = p5;
		this.setup();
	}
	_draw() {
		this.draw();
		this.children.forEach(child => {
			this.p5.push();
			this.p5.translate(child.left, child.top);
			child._draw();
			this.p5.pop();
		});
	}
	setup() {}
	draw() {}
};

const RootComponent = class extends Component {
	constructor(p5) {
		super(0, 0, p5.width, p5.height);
		this._setup(p5);
	}
};

const MainComponent = class extends Component {
	setup() {
		const Child = class extends Component {
			draw() {
				this.p5.noStroke();
				this.p5.fill(255, 0, 0);
				this.p5.rect(0, 0, this.width, this.height);
			}
		};
		this.addChild(new Child(100, 100, 100, 100));
	}
	draw() {
		this.p5.fill(255, 255, 255);
		this.p5.rect(0, 0, this.width, this.height);
		this.children[0].left = this.p5.mouseX;
		this.children[0].top = this.p5.mouseY;
	}
};

let rootComponent;
function setup() {
	createCanvas(windowWidth, windowHeight);
	rootComponent = new RootComponent(this);
	rootComponent.addChild(new MainComponent(0, 0, rootComponent.width, rootComponent.height));
}

function draw() {
	rootComponent._draw();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
