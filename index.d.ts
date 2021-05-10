import * as React from "react";
import * as ReactDOM from "react-dom";
import * as http from "http";
import * as React_Popper from "react-popper";
import classNames from "classnames";
import popperJs from "popper.js";
import _Bettersignal from "./index";
import request from "request";

export { Signal } from "../ts/window";

export interface BsApi {
	translate: {
		locale: string;
		get: (
			key: string,
			substitutions: {},
			messages?: {
				key: {
					locale: string;
				};
			},
			locale?: string
		) => string;
	};
	util: {
		React: typeof React;
		ReactDOM: typeof ReactDOM;
		http: typeof http;
		E: (type: string) => HTMLElement;
		popperJs: typeof popperJs;
		classnames: typeof classNames;
		request: typeof request;
	};
	log: {
		info: (...message) => any;
		error: (...message) => any;
		warn: (...message) => any;
	};
	injectCss: (cssObj: object) => any;
	showToast: (
		message: string,
		options?: {
			events?: object;
			initialize?: Function;
			type?: string;
		}
	) => any;
	waitForElement: (selector: string, callback: Function) => MutationObserver;
}

declare global {
	interface HTMLElement {
		set: (options: { props?: object; events?: object; children?: Array<HTMLElement | string> }) => HTMLElement;
	}
	interface String {
		isURL: () => boolean;
		isPath: () => boolean;
	}
	interface Date {
		format: (format: string) => string;
	}
}

declare class Popup {
	constructor(content: string, options?: { size: string; actions: []; type: string });
	content: string;
	actions: [];
	size: String;
	id: number;
	page: HTMLElement;
	open: () => boolean;
	close: () => boolean;
}

export interface Bettersignal {
	translate: {
		get: (key: string, substitutions?: {}, messages?: {}, local?: string) => string;
		messages: {};
	};
	toast: {
		new: (message: string, options?: { events: {}; initialize: () => void; type: string; icon: string }) => void;
	};
	popup: {
		new: (message: string, options?: { size: string; actions: []; type: string }) => Popup;
		progress: (message: string) => { remove: () => void };
		confirm: (options: { message: string; resolve: () => void; okText: string; confirmStyle?: "affirmative" | "negative"; cancelText?: string; reject?: (error: Error) => void }) => void;
	};
	wait: {
		element: (selector: string, callback: (element: HTMLElement) => {}) => MutationObserver
		elementOnce: (selector: string) => Promise<HTMLElement>
	}
	storage: {
		saveData: () => Promise<string>
	}
}
