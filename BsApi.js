const React = require("react");
const ReactDOM = require("react-dom");
const http = require("http");
const https = require("https");
const popperJs = require("popper.js");
const classnames = require("classnames");
const react_contextmenu = require("react-contextmenu");
const fs = require("fs");

const { Bettersignal } = require("./index")

module.exports = function (/** @type {Bettersignal} */Bs, { E }) {
	window.BsApi = {
		translate: {
			locale: Bs.settings.props.language,
			get: Bs.translate.get,
			messages: function(key, substitutions = {}, messages, locale) {
				return Bs.translate.get(key, substitutions, messages, locale)
			} 
		},
		util: {
			React,
			ReactDOM,
			http,
			https,
			popperJs,
			classnames,
			E,
			react_contextmenu,
		},
		log: {
			info: Bs.log.info,
			error: Bs.log.error,
			warn: Bs.log.warn,
		},
		toast: {
			new: function (message, { events = {}, initialize = undefined, type = undefined } = {}) {
				return Bs.toast.new(message, { events, initialize, type });
			},
		},
		css: {
			inject: function (cssObj) {
				return Bs.css.inject(cssObj);
			},
		},
		windows: {
			openFolder: function (path) {
				fs.access(path, fs.constants.R_OK, (err) => {
					if (err) throw new Error("openFolder: Invalid argument: Folder doesn't exist");
					return Bs.windows.openFolder(path);
				});
			},
		},
		wait: {
			element: function(selector, callback) {
				return Bs.wait.element(selector, callback);
			},
			elementOnce: function(selector) {
				return Bs.wait.elementOnce(selector)
			}
		},
		popup: {
			new: function (message, {size, actions, type}) {
				return Bs.popup.new(message, { size, actions, type})
			},
			progress: function(message) {
				return Bs.popup.progress(message)
			},
			confirm: function({ message, resolve = () => {}, okText, confirmStyle, cancelText, reject }) {
				return Bs.popup.confirm({ message, resolve, okText, confirmStyle, cancelText, reject })
			}
		},
		conversation: {
			get: function(id) {
				return Bs.conversation.get(id)
			},
			getAll: function() {
				return Bs.conversation.getAll()
			},
			current: function() {
				return Bs.conversation.current()
			}
		},
		messages: {
			send: function() {
				return Bs.messages.send()
			},
			getById: function(id) {
				return Bs.messages.getById(id)
			},
			getFromElement: function(elem) {
				return Bs.messages.getFromElement(elem)
			}
		}
	};
};
