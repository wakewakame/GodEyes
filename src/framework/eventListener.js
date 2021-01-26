const EventListener = class {
	constructor() {
		this.events = new Map();
	}
	addEventListener(name, func) {
		if (!this.events.has(name)) this.events.set(name, new Array());
		this.events.get(name).push(func);
	}
	dispatchEvent(name, arg) {
		if (!this.events.has(name)) this.events.set(name, new Array());
		this.events.get(name).forEach(callback => { callback(arg); })
	}
	removeEventListener(name, func) {
		if (!this.events.has(name)) this.events.set(name, new Array());
		const callbacks = this.events.get(name);
		callbacks = callbacks.filter(callback => (callback !== func));
		if (callbacks.length === 0) this.events.delete(name);
		else this.events.set(name, callbacks);
	}
};
