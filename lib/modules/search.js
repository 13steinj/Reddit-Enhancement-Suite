import optionLinkTemplate from '../templates/optionLinkSnudown.hbs';
import searchFormTemplate from '../templates/settingsConsoleSearch.hbs';
import searchPanelTemplate from '../templates/searchPanel.hbs';
import searchResultTemplate from '../templates/searchResultOption.hbs';
import { $ } from '../vendor';
import { gdAlert } from '../utils';

addModule('search', (module, moduleID) => {
	module.moduleName = 'Search RES Settings';
	module.category = 'About RES';
	module.alwaysEnabled = true;
	module.sort = -9;
	module.description = searchPanelTemplate();

	module.go = function() {
		const $menuItem = $('<span>', {
			id: 'RESSearchMenuItem',
			class: 'RESMenuItemButton res-icon',
			text: '\uF094',
			title: 'search settings',
			click: e => {
				e.preventDefault();
				e.stopPropagation();
				showSearch();
			}
		});
		$menuItem.appendTo(modules['settingsConsole'].menuItem);

		modules['commandLine'].registerCommand(/^set(?:t?ings?)?$/, 'settings [words to search for]- search RES settings console',
			(command, val) => {
				let str = 'Search RES settings';
				if (val && val.length) {
					str += ` for: ${val}`;
				}
				return str;
			},
			(command, val) => module.search(val)
		);
	};

	module.search = function(query) {
		getSearchResults(query);
		modules['settingsNavigation'].setUrlHash('search', query);
	};

	module.PRESERVE_SPACES = true;

	function showSearch() {
		modules['RESMenu'].hidePrefsDropdown();
		drawSearchResults();
		$('#SearchRES-input').focus();
	}

	function getSearchResults(query) {
		if (!query || !query.toString().length) {
			drawSearchResults(query, []);
			return;
		}

		const sanitizedQuery = sanitizeString(query, module.PRESERVE_SPACES);
		const queryTerms = sanitizedQuery && sanitizedQuery.length ? sanitizedQuery.split(' ') : [];
		let results = [];

		// Search options
		if (queryTerms && queryTerms.length) {
			results = searchDomain();

			results = results
				.map(item => {
					item.rank = item.getRank(queryTerms, ...item.context);
					return item;
				})
				.filter(item => item && item.rank !== false && item.rank !== Infinity)
				.sort((a, b) => b.rank - a.rank)
				.map(item => item.format(...item.context));
		}

		drawSearchResults(query, results);
	}

	function searchDomain() {
		const results = [];
		for (const moduleID in modules) {
			if (!modules.hasOwnProperty(moduleID)) continue;
			if (moduleID === module.moduleID) continue;
			const mod = modules[moduleID];
			if (mod.hidden) continue;

			results.push({ context: [moduleID], getRank: rankModule, format: makeModuleSearchResult });

			const options = mod.options;

			for (const optionKey in options) {
				if (!options.hasOwnProperty(optionKey)) continue;
				const option = options[optionKey];
				if (option.noconfig) continue;

				results.push({ context: [moduleID, optionKey], getRank: rankOption, format: makeOptionSearchResult });
			}
		}

		return results;
	}

	function rankString(queryTerms, string) {
		if (!queryTerms || !queryTerms.length || !string) {
			return false;
		}
		const indexes = indexesOfSearchTermsInString(queryTerms, sanitizeString(string, false));
		// Better score: lower value and lower matchedIndex
		const weighted = indexes.map(item => 100 - (item.value * ((Math.log(item.matchedIndex + 1) / Math.log(5)) + 1)));
		return weighted.length ?
			weighted.reduce((a, b) => a + b, 0) :
			Infinity;
	}

	function rankModule(queryTerms, moduleID) {
		const mod = modules[moduleID];
		const string = mod.moduleID + mod.moduleName + [].concat(mod.category).join('') + mod.description;
		return rankString(queryTerms, string) * 0.9;
	}

	function rankOption(queryTerms, moduleID, optionKey) {
		const mod = modules[moduleID];
		const option = mod.options[optionKey];
		const string = optionKey + mod.moduleID + mod.moduleName + [].concat(mod.category).join('') + option.description;
		return rankString(queryTerms, string);
	}

	function indexesOfSearchTermsInString(needles, haystack) {
		if (!haystack || !haystack.length) return false;

		return needles
			.filter(needle => haystack.indexOf(needle) !== -1)
			.map((needle, i) => ({
				matchedIndex: i,
				value: haystack.indexOf(needle)
			}));
	}

	function sanitizeString(text, preserveSpaces) {
		if (text === undefined || text === null) {
			return '';
		}

		const replaceSpacesWith = preserveSpaces ? ' ' : '';
		return text.toString().toLowerCase()
			.replace(/[,\/\s]+/g, replaceSpacesWith);
	}

	function makeOptionSearchResult(moduleKey, optionKey) {
		const mod = modules[moduleKey];
		const option = mod.options[optionKey];

		const result = {};
		result.type = 'option';
		result.breadcrumb = ['RES settings console',
			[].concat(mod.category)[0],
			`${mod.moduleName} (${mod.moduleID})`
		].join(' > ');
		result.title = optionKey;
		result.description = (option.description || '').replace(/<(?:br|p|div|span)>/g, '\n').split('\n')[0];
		result.advanced = option.advanced;
		result.category = [].concat(mod.category)[0];
		result.moduleName = mod.moduleName;
		result.moduleID = moduleKey;
		result.optionKey = optionKey;

		return result;
	}

	function makeModuleSearchResult(moduleKey) {
		const mod = modules[moduleKey];

		const result = {};
		result.type = 'module';
		result.breadcrumb = ['RES settings console',
			[].concat(mod.category)[0],
			`(${mod.moduleID})`
		].join(' > ');
		result.title = mod.moduleName;
		result.moduleName = mod.moduleName;
		result.description = mod.description;
		result.category = [].concat(mod.category)[0];
		result.moduleID = moduleKey;

		return result;
	}

	function onSearchResultSelected(result) {
		if (!result) return;

		switch (result.type) {
			case 'module':
				modules['settingsNavigation'].loadSettingsPage(result.moduleID);
				break;
			case 'option':
				modules['settingsNavigation'].loadSettingsPage(result.moduleID, result.optionKey);
				break;
			default:
				gdAlert.open('Could not load search result');
				break;
		}
	}

	// ---------- View ------
	module.renderSearchForm = async container => {
		$(container).find('#SearchRES-input-container').replaceWith(searchFormTemplate());

		$(container).on('submit', '#SearchRES-input-container', e => {
			e.preventDefault();
			const RESSearchBox = container.querySelector('#SearchRES-input');
			module.search(RESSearchBox.value);

			return false;
		});
	};

	async function drawSearchResults(query, results) {
		await modules['settingsConsole'].open('search');

		const $resultsContainer = $('#SearchRES-results-container');
		$resultsContainer.off('click', handleSearchResultClick)
			.on('click', '.SearchRES-result-item', handleSearchResultClick);

		if (!query || !query.length) {
			$resultsContainer.hide();
			return;
		}

		let count = 0;
		let advancedResults = 0;
		if (results) {
			results.forEach(result => {
				if (result.advanced) {
					advancedResults++;
				} else {
					count++;
				}
			});
		}

		// display number of results.
		const plural = (count !== 1 ? 's' : '');
		const resultsMessage = `${count} result${plural} for ${query}`;
		$('#SearchRES-count').text(resultsMessage);

		$resultsContainer.show();
		$resultsContainer.find('#SearchRES-query').text(query);
		$('#SearchRES-input', module.searchForm).val(query);

		if (advancedResults) {
			$resultsContainer.find('#SearchRES-results-hidden').addClass('advancedResults');
			$('#SearchRES-results-hidden a').off('click').on('click', () => {
				$(document.getElementById('RESAllOptions')).click();
				getSearchResults(query);
				return false;
			});
		} else {
			$resultsContainer.find('#SearchRES-results-hidden').removeClass('advancedResults');
		}
		if (!results || !results.length) {
			$resultsContainer.find('#SearchRES-results').hide();
		} else {
			const resultsList = $('#SearchRES-results', $resultsContainer).show();

			resultsList.empty();
			for (const result of results) {
				const element = drawSearchResultItem(result);
				resultsList.append(element);
			}
		}
	}

	function drawSearchResultItem(result) {
		const element = $('<li>')
			.addClass('SearchRES-result-item')
			.toggleClass('advanced', !!result.advanced)
			.data('SearchRES-result', result);

		$('<span>', { class: 'SearchRES-result-copybutton res-icon' })
			.html('&#xF159')
			.appendTo(element)
			.attr('title', 'copy this for a comment');

		const details = searchResultTemplate(result);
		element.append(details);

		return element;
	}

	function handleSearchResultClick(e) {
		const $element = $(this);
		const result = $element.data('SearchRES-result');
		if ($(e.target).is('.SearchRES-result-copybutton')) {
			onSearchResultCopy(result, $element);
		} else {
			onSearchResultSelected(result);
		}
		e.preventDefault();
	}

	function onSearchResultCopy(result) {
		const markdown = makeOptionSearchResultLink(result);
		gdAlert.open(`<textarea rows="5" cols="50">${markdown}</textarea><p>Copy and paste this into your comment</p>`);
	}

	function makeOptionSearchResultLink(result) {
		const baseUrl = location.pathname;

		const context = $.extend(true, {}, result);
		$.extend(context, {
			url: baseUrl + modules['settingsNavigation'].makeUrlHash(result.moduleID, result.optionKey),
			settingsUrl: baseUrl + modules['settingsNavigation'].makeUrlHash(),
			moduleUrl: baseUrl + modules['settingsNavigation'].makeUrlHash(result.moduleID),
			optionUrl: baseUrl + modules['settingsNavigation'].makeUrlHash(result.moduleID, result.optionKey)
		});

		return `${optionLinkTemplate(context).trim()}\n\n\n`;
	}
});
