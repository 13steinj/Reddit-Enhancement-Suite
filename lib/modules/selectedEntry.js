addModule('selectedEntry', function(module, moduleID) {
	module.moduleName = 'Selected Entry';
	module.category = [ 'Style', 'Comment', 'Post' ];
	module.include = [ 'comments', 'linklist', 'profile', 'inbox' ];
	module.description = 'When a post or comment is selected, show extra styling and tools';

	module.options.autoSelectOnScroll = {
		type: 'boolean',
		value: false,
		description: 'Automatically select the topmost element for keyboard navigation on window scroll'
	};
	module.options.selectOnClick = {
		type: 'boolean',
		value: true,
		description: 'Select a link or comment when clicked with the mouse',
		advanced: true
	};

	addSelectListeners();
	module.beforeLoad = function() {
		if (!(module.isMatchURL() && module.isEnabled())) return;

		addNewElementListeners();
	}

	module.go = function() {
		if (!(module.isMatchURL() && module.isEnabled())) return;

		if (module.options.autoSelectOnScroll.value) {
			window.addEventListener('scroll', function(e) { RESUtils.debounce(moduleID + '.autoSelectOnScroll', 300, onScroll); });
		}
		if (module.options.selectOnClick.value) {
			var throttled;
			$(document.body).on('click', '.thing', function(e) {
				if (!throttled) {
					throttled = true;
					setTimeout(function() { throttled = false; }, 100);
					onClick.call(this, e);
				}
			});
		}

		setTimeout(selectLastSelected, 100);
	}

	var selectedEntry, selectedThing, selectedContainer;
	module.select = function(thing, scrollToTop) {
		if (!thing || ('length' in thing && thing.length === 0)) return;
		select(thing, scrollToTop);
	};

	module.unselect = function() {
		var prevSelected = selected;
		select(undefined);
		return prevSelected;
	};

	module.selected = function() {
		return selectedEntry;
	};
	module.selectedThing = function() {
		return selectedThing;
	};

	module.selectableThings = function selectableThings() {
		return $('.linklisting .thing, .nestedlisting .thing');
	};

	var listeners;
	module.addListener = addListener;
	function addListener(callback) {
		if (!listeners) listeners = new $.Callbacks();
		listeners.add(callback);
	}



	function select(thingOrEntry, options) {
		var newThing = $(thingOrEntry).closest('.thing')[0];
		if (newThing === selectedThing) return;

		var oldSelected = selectedEntry;
		var newEntry = newThing && newThing.querySelector('.entry');

		options = options || {};
		listeners && listeners.fire(newEntry, oldSelected, options);

		selectedEntry = newEntry;
		selectedThing = newThing;
		selectedContainer = newThing && $(newThing).parent().closest('.thing');

	}

	function onNewComments(entries) {
		if (selectedThing && !selectedThing.parentNode) {
			// Selected thing was replaced, so select the replacement
			var newContainer = $(entries).closest('.thing').parent().closest('.thing')
			if (newContainer.filter(selectedContainer).length) {
				select(entries, {
					replacement: true
				});
			}
		}
	}

	function addSelectListeners() {
		addListener(function(selected, unselected) { if (unselected) modules['hover'].close(false); });
		addListener(updateActiveElement);
		addListener(scrollTo);
		addListener(updateLastSelectedCache);

	}

	function addNewElementListeners() {
		RESUtils.watchForElement('newComments', onNewComments);
	}

	function scrollTo(thing, last, options) {
		if (!thing) return;
		var entry = thing.querySelector('.entry');
		RESUtils.scrollToElement(thing, {
			makeVisible: entry,
			scrollToTop: options.scrollToTop
		});

	}

	function updateActiveElement(newEntry, oldEntry) {
		newEntry && newEntry.classList.add('RES-keyNav-activeElement');
		oldEntry && oldEntry.classList.remove('RES-keyNav-activeElement');
	}

	function onScroll() {
		if (modules['keyboardNav'].recentKeyPress) return;

		var selected = module.selected();
		if (selected && RESUtils.elementInViewport(selected)) return;


		var things = $('.thing');
		for (var i = 0, len = things.length; i < len; i++) {
			if (RESUtils.elementInViewport(things[i])) {
				select(things[i]);
			}
		}
	}

	function onClick(e) {
		var thing = $(this).closest('.thing')[0];
		select(thing);
	}

	var lastSelectedCache,
		lastSelectedKey = 'RESmodules.selectedThing.lastSelectedCache';
	function setupLastSelectedCache() {
		if (lastSelectedCache) return;
		lastSelectedCache = safeJSON.parse(RESStorage.getItem(lastSelectedKey), lastSelectedKey) || {};

		// clean cache every so often and delete any urls that haven't been visited recently
		var clearCachePeriod = 21600000; // 6 hours
		var itemExpiration = 3600000; // 1 hour
		var now = Date.now();
		if (!lastSelectedCache.lastScan || (now - lastSelectedCache.lastScan > clearCachePeriod)) {
			for (var idx in lastSelectedCache) {
				if (lastSelectedCache[idx] && (now - lastSelectedCache[idx].updated > itemExpiration)) {
					delete lastSelectedCache[idx];
				}
			}
			lastSelectedCache.lastScan = now;
			RESStorage.setItem(lastSelectedKey, JSON.stringify(lastSelectedCache));
		}
	}

	function urlForSelectedCache() {
		var url = document.location.pathname;
		// remove any trailing slash from the URL
		if (url.substr(-1) === '/') {
			url = url.substr(0, url.length - 1);
		}

		return url;
	}


	function updateLastSelectedCache(thing) {
		if (!RESUtils.isPageType('linklist', 'profile')) return;

		var url = urlForSelectedCache();
		var now = Date.now();
		lastSelectedCache[url] = {
			fullname: thing && thing.getAttribute('data-fullname'),
			updated: now
		};
		RESStorage.setItem('RESmodules.selectedThing.lastSelectedCache', JSON.stringify(lastSelectedCache));
	}

	function selectLastSelected() {
		var url = urlForSelectedCache();
		var lastSelected = (lastSelected = lastSelectedCache[url]) && lastSelected.fullname;
		if (lastSelected) {
			var target = selectableThings().filter(function() {
				return this.getAttribute('data-fullname') === lastSelected;
			});
			select(target);
		}
	}

});
