/* eslint-disable no-unused-vars */

import _ from 'lodash';
import { $ } from '../vendor';
import { Thing, bodyClasses, isMatchURL, isPageType, observe, range, string } from '../utils';
import { isFirefox } from './browserDetect';
import { storage } from '../environment';

const modules = {};
function addModule(moduleID, extend) {
	const base = {
		moduleID,
		moduleName: moduleID,
		category: 'General',
		options: {},
		description: '',
		isEnabled() {
			return this._enabled;
		},
		isMatchURL() {
			return isMatchURL(this.moduleID);
		},
		include: [
			'all'
		],
		exclude: [],
		onToggle(state) {}, // eslint-disable-line no-unused-vars
		loadLibraries() {},
		loadDynamicOptions() {},
		beforeLoad() {},
		go() {},
		afterLoad() {},
		addOptionsBodyClasses() {
			// Adds body classes for enabled options that have `bodyClass: true`
			// In the form `res-moduleId-optionKey` for boolean options
			// and `res-moduleId-optionKey-optionValue` for enum options
			// spaces in enum option values will be replaced with underscores
			if (!(this.isEnabled() && this.isMatchURL())) return;

			$.each(this.options, (optId, opt) => {
				if (!(opt.bodyClass && opt.value)) return;

				if (opt.type !== 'enum' && opt.type !== 'boolean') {
					throw new Error(`modules['${this.moduleID}'].options['${optId}'] - only enum and boolean options may generate body classes`);
				}

				let cls = typeof opt.bodyClass === 'string' ? opt.bodyClass : `res-${this.moduleID}-${optId}`;

				if (opt.type === 'enum') {
					cls += `-${opt.value.replace(/\s/g, '_')}`;
				}

				bodyClasses.add(cls);
			});
		}
	};

	let module = extend(base, moduleID);
	module = $.extend(true, base, module);
	modules[moduleID] = module;
	return module;
}

const libraries = {};
function addLibrary(libraryID, moduleID, library) {
	if (typeof moduleID !== 'string') {
		library = moduleID;
		moduleID = undefined;
	}

	if (typeof moduleID === 'string') {
		library.moduleID = moduleID;
	}

	if (typeof library.name === 'undefined') {
		library.name = moduleID;
	}

	if (libraryID && moduleID) {
		libraries[libraryID] = libraries[libraryID] || {};
		libraries[libraryID][moduleID] = library;
	} else if (libraryID) {
		libraries[libraryID] = library;
	}
}

// define common RESUtils - reddit related functions and data that may need to be accessed...
const RESUtils = {};

RESUtils.firstValid = (...vals) =>
	vals.find(val =>
		val !== undefined && val !== null && (typeof val !== 'number' || !isNaN(val))
	);

RESUtils.indexOptionTable = function(moduleID, optionKey, keyFieldIndex) {
	const source = modules[moduleID].options[optionKey].value;
	const keyIsList =
		modules[moduleID].options[optionKey].fields[keyFieldIndex].type === 'list' ?
		',' :
		false;
	return RESUtils.indexArrayByProperty(source, keyFieldIndex, keyIsList);
};
RESUtils.indexArrayByProperty = function(source, keyIndex, keyValueSeparator) {
	let index;
	if (!source || !source.length) {
		index = {
			items: [],
			keys: []
		};
	} else {
		index = createIndex();
	}

	Reflect.defineProperty(getItem, 'keys', {
		value: index.keys,
		writeable: false
	});
	Reflect.defineProperty(getItem, 'all', {
		value: getAllItems,
		writeable: false
	});
	return getItem;

	function createIndex() {
		const itemsByKey = {};
		let allKeys = [];

		for (const item of source) {
			const key = item && item[keyIndex];
			if (!key) continue;

			let keys;
			if (keyValueSeparator) {
				keys = key.split(keyValueSeparator);
			} else {
				keys = [key && key];
			}
			for (const k of keys) {
				const key = k.toLowerCase();
				itemsByKey[key] = itemsByKey[key] || [];
				itemsByKey[key].push(item);
			}

			allKeys = allKeys.concat(keys);
		}

		// remove duplicates
		allKeys = allKeys.filter((value, index, array) => array.indexOf(value, index + 1) === -1);

		return {
			items: itemsByKey,
			keys: allKeys
		};
	}

	function getItem(key) {
		key = key && key.toLowerCase();
		return index.items[key];
	}

	function getAllItems() {
		return index.keys.map(getItem);
	}
};

RESUtils.rpc = function(moduleID, method, args) {
	if (args && args[args.length - 1] === 'rpc') {
		console.warn('rpc warning: loop.', moduleID, method, args);
		return 'rpc loop suspected';
	}
	const module = modules[moduleID];
	if (!module || typeof module[method] !== 'function') {
		console.warn('rpc error: could not find method.', moduleID, method, args);
		return 'could not find method';
	}

	const sanitized = args ?
		[].concat(JSON.parse(JSON.stringify(args))) :
		[];

	return module[method](...sanitized, 'rpc');
};

RESUtils.createElement = function(elementType, id, classname, contents) {
	const element = document.createElement(elementType);
	if (id) {
		element.setAttribute('id', id);
	}
	if ((typeof classname !== 'undefined') && classname && (classname !== '')) {
		element.setAttribute('class', classname);
	}
	if (contents) {
		if (contents.jquery) {
			contents.appendTo(element);
		} else if (contents.tagName) {
			element.appendChild(contents);
		} else if (classname && classname.split(' ').indexOf('noCtrlF') !== -1) {
			element.setAttribute('data-text', contents);
		} else {
			element.textContent = contents;
		}
	}
	return element;
};
RESUtils.createElementWithID = RESUtils.createElement; // legacy alias
RESUtils.createElement.toggleButton = function(moduleID, fieldID, enabled, onText, offText, isTable) {
	enabled = enabled || false;
	onText = onText || 'on';
	offText = offText || 'off';
	const thisToggle = document.createElement('div');
	thisToggle.setAttribute('class', 'toggleButton');
	thisToggle.setAttribute('id', `${fieldID}Container`);

	const toggleOn = RESUtils.createElement('span', null, 'toggleOn noCtrlF', onText);
	const toggleOff = RESUtils.createElement('span', null, 'toggleOff noCtrlF', offText);
	const field = RESUtils.createElement('input', fieldID);
	field.name = fieldID;
	field.type = 'checkbox';
	if (enabled) {
		field.checked = true;
	}
	if (isTable) {
		field.setAttribute('tableOption', 'true');
	}

	thisToggle.appendChild(toggleOn);
	thisToggle.appendChild(toggleOff);
	thisToggle.appendChild(field);
	thisToggle.addEventListener('click', function() {
		const thisCheckbox = this.querySelector('input[type=checkbox]');
		const enabled = thisCheckbox.checked;
		thisCheckbox.checked = !enabled;
		if (enabled) {
			this.classList.remove('enabled');
		} else {
			this.classList.add('enabled');
		}
		if (moduleID) {
			modules['settingsConsole'].onOptionChange(moduleID, fieldID, enabled, !enabled);
		}
	}, false);
	if (enabled) thisToggle.classList.add('enabled');
	return thisToggle;
};
RESUtils.createElement.icon = function(iconName, tagName, className, title) {
	tagName = tagName || 'span';
	className = className || '';
	iconName = iconName.match(/(\w+)/)[0];
	title = title || '';

	const icon = document.createElement(tagName);
	icon.className = className;
	icon.classList.add('res-icon');
	icon.innerHTML = `&#x${iconName};`; // sanitized above
	icon.setAttribute('title', title);
	return icon;
};
RESUtils.createElement.commaDelimitedNumber = function(nStr) {
	nStr = typeof nStr === 'string' ? nStr.replace(/[^\w]/, '') : nStr;
	const number = Number(nStr);
	// some locales incorrectly use _ as a delimiter
	const locale = (document.documentElement.getAttribute('lang') || 'en').replace('_', '-');
	try {
		return number.toLocaleString(locale);
	} catch (e) {
		return number.toLocaleString('en');
	}
};
RESUtils.createElement.table = function(items, callback) {
	if (!items) throw new Error('items is null/undef');
	if (!callback) throw new Error('callback is null/undef');
	// Sanitize single item into items array
	if (!(items.length && typeof items !== 'string')) items = [items];

	const description = [];
	description.push('<table>');

	items
		.map(callback)
		.forEach(item => {
			if (typeof item === 'string') {
				description.push(item);
			} else if (item.length) {
				description.push(...item);
			}
		});
	description.push('</table>');

	return description.join('\n');
};
RESUtils.initObservers = function() {
	if (!isPageType('comments')) {
		// initialize sitetable observer...
		const siteTable = Thing.thingsContainer();

		if (siteTable) {
			observe(siteTable, { childList: true }, mutation => {
				if ($(mutation.addedNodes[0]).is(Thing.containerSelector)) {
					// when a new sitetable is loaded, we need to add new observers for selftexts within that sitetable...
					$(mutation.addedNodes[0]).find('.entry div.expando').each(function() {
						RESUtils.addSelfTextObserver(this);
					});
					RESUtils.watchers.siteTable.forEach(callback => callback(mutation.addedNodes[0]));
				}
			});
		}
	} else {
		// initialize sitetable observer...
		const siteTable = document.querySelector('.commentarea > .sitetable') || document.querySelector('.sitetable');

		if (siteTable) {
			observe(siteTable, { childList: true }, mutation => {
				// handle comment listing pages (not within a post)
				const $container = $(mutation.addedNodes[0]);
				if ($container.is('[id^="siteTable"]')) {
					// when a new sitetable is loaded, we need to add new observers for selftexts within that sitetable...
					$container.find('.entry div.expando').each(function() {
						RESUtils.addSelfTextObserver(this);
					});
					RESUtils.watchers.siteTable.forEach(callback => callback(mutation.addedNodes[0]));
				}

				if (mutation.addedNodes.length > 0 && mutation.addedNodes[0].classList.contains('thing')) {
					const thing = mutation.addedNodes[0];
					const newCommentEntry = thing.querySelector('.entry');
					if (!$(newCommentEntry).data('alreadyDetected')) {
						$(newCommentEntry).data('alreadyDetected', true);
						$(thing).find('.child').each(function() {
							RESUtils.addNewCommentFormObserver(this);
						});
						RESUtils.watchers.newComments.forEach(callback => callback(newCommentEntry));
					}
				}
			});
		}
	}

	$('.entry div.expando').each(function() {
		RESUtils.addSelfTextObserver(this);
	});

	// initialize new comments observers on demand, by first wiring up click listeners to "load more comments" buttons.
	// on click, we'll add a mutation observer...
	$('.morecomments a').on('click', RESUtils.addNewCommentObserverToTarget);

	// initialize new comments forms observers on demand, by first wiring up click listeners to reply buttons.
	// on click, we'll add a mutation observer...
	// $('body').on('click', 'ul.flat-list li a[onclick*=reply]', RESUtils.addNewCommentFormObserver);
	$('.thing .child').each(function() {
		RESUtils.addNewCommentFormObserver(this);
	});
};

RESUtils.addNewCommentObserverToTarget = function(e) {
	const ele = $(e.currentTarget).closest('.sitetable')[0];
	// mark this as having an observer so we don't add multiples...
	if (!$(ele).hasClass('hasObserver')) {
		$(ele).addClass('hasObserver');
		RESUtils.addNewCommentObserver(ele);
	}
};
RESUtils.addNewCommentObserver = function(ele) {
	const observer = observe(ele, { childList: true }, mutation => {
		// look at the added nodes, and find comment containers.
		Array.from(mutation.addedNodes).forEach(node => {
			if (node.classList.contains('thing')) {
				const $node = $(node);

				$node.find('.child').each(function() {
					RESUtils.addNewCommentFormObserver(this);
				});

				// check for "load new comments" links within this group as well...
				$node.find('.morecomments a').click(RESUtils.addNewCommentObserverToTarget);

				// look at the comment containers and find actual comments...
				Array.from(node.querySelectorAll('.entry')).forEach(subComment => {
					const $subComment = $(subComment);
					if (!$subComment.data('alreadyDetected')) {
						$subComment.data('alreadyDetected', true);
						RESUtils.watchers.newComments.forEach(callback => callback(subComment));
					}
				});
			}
		});

		// disconnect this observer once all callbacks have been run.
		// unless we have the nestedlisting class, in which case don't disconnect because that's a
		// bottom level load more comments where even more can be loaded after, so they all drop into this
		// same .sitetable div.
		if (!$(ele).hasClass('nestedlisting')) {
			observer.disconnect();
		}
	});
};
RESUtils.addNewCommentFormObserver = function(ele) {
	observe(ele, { childList: true }, mutation => {
		const form = $(mutation.target).children('form');
		if (form.length === 1) {
			RESUtils.watchers.newCommentsForms.forEach(callback => callback(form[0]));
		} else {
			const newOwnComment = $(mutation.target).find(' > div.sitetable > .thing:first-child'); // assumes new comment will be prepended to sitetable's children
			if (newOwnComment.length === 1) {
				// new comment detected from the current user...
				RESUtils.watchers.newComments.forEach(callback => callback(newOwnComment[0]));
			}
		}
		// only the first mutation (legacy behavior)
		return true;
	});
};
RESUtils.addSelfTextObserver = function(ele) {
	observe(ele, { childList: true }, mutation => {
		const form = $(mutation.target).find('form');
		if (form.length) {
			RESUtils.watchers.selfText.forEach(callback => callback(form[0]));
		}
		// only the first mutation (legacy behavior)
		return true;
	});
};
RESUtils.watchForElement = function(type, callback) {
	switch (type) {
		case 'siteTable':
			RESUtils.watchers.siteTable.push(callback);
			break;
		case 'newComments':
			RESUtils.watchers.newComments.push(callback);
			break;
		case 'selfText':
			RESUtils.watchers.selfText.push(callback);
			break;
		case 'newCommentsForms':
			RESUtils.watchers.newCommentsForms.push(callback);
			break;
		default:
			throw new Error(`Invalid watcher type: ${type}`);
	}
};
RESUtils.watchers = {
	siteTable: [],
	newComments: [],
	selfText: [],
	newCommentsForms: []
};
// A link is a comment code if all these conditions are true:
// * It has no content (i.e. content.length === 0)
// * Its href is of the form "/code" or "#code"
//
// In case it's not clear, here is a list of some common comment
// codes on a specific subreddit:
// http://www.reddit.com/r/metarage/comments/p3eqe/full_updated_list_of_comment_faces_wcodes/
// also for CSS hacks to do special formatting, like /r/CSSlibrary

RESUtils.COMMENT_CODE_REGEX = /^[\/#].+$/;
RESUtils.isCommentCode = function(link) {
	// don't add annotations for hidden links - these are used as CSS
	// hacks on subreddits to do special formatting, etc.

	// Note that link.href will return the full href (which includes the
	// reddit.com domain). We don't want that.
	const href = link.getAttribute('href');

	const emptyText = link.textContent.length === 0;
	const isCommentCode = RESUtils.COMMENT_CODE_REGEX.test(href);

	return emptyText && isCommentCode;
};
RESUtils.isEmptyLink = function(link) {
	// Note that link.href will return the full href (which includes the
	// reddit.com domain). We don't want that.
	const href = link.getAttribute('href');
	return typeof href !== 'string' || href.substring(0, 11) === 'javascript:'; // eslint-disable-line no-script-url
};

RESUtils.MINUTE = 1000 * 60;
RESUtils.HOUR = 60 * RESUtils.MINUTE;
RESUtils.DAY = 24 * RESUtils.HOUR;
