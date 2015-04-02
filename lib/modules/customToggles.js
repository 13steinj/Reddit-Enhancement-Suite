addModule('customToggles', function (module, moduleID) {
	module.title = 'Custom Toggles';
	module.category = 'Core';
	module.description = 'Set up custom on/off switches for various parts of RES.';

	module.options.toggle = {
		description: 'Enable or disable everything connected to this toggle; and optionally add a toggle to the RES gear dropdown menu',
		type: 'table',
		fields: [{
			name: 'name',
			type: 'text'
		}, {
			name: 'enabled',
			type: 'boolean',
			value: true,
		}, {
			name: 'menuItem',
			type: 'text'
		}]
	};
/*
	module.options.applyToSubreddit = {
		type: 'table',
		addRowText: '+add subreddit',
		fields: [{
			name: 'applyTo',
			description: 'Apply to:',
			value: 'everywhere',
			type: 'enum',
			values: [{
				name: 'Everywhere',
				value: 'everywhere'
			}, {
				name: 'Everywhere but:',
				value: 'exclude'
			}, {
				name: 'Only on:',
				value: 'include'
			}]
		}, {
			name: 'subreddits',
			type: 'list',
			listType: 'subreddits',
		}];
	}
	*/
/*
	module.options.schedule = {
		type: 'table',
		fields: [{
			name: 'toggle',
			type: 'text'
		}, {
			name: 'start/end'
			type: 'enum',
			values: [{
				name: 'start',
				value: 'start'
			}, {
				name: 'end',
				name: 'end'
			}]
		}, {
			name: 'time of day (0-2359)',
			type: 'text',
		}, {
			name: 'day of month (1-31)',
			type: 'text',
		}, {
			name: 'month (1-12)',
			type: 'text',
		}, {
			name: 'day of week (1-7 Monday-Sunday)',
			type: 'text'
		}]
	};
	*/

	var _getBytoggle = {};
	function getOptionByToggleName(optionKey, toggle) {
		if (!_getBytoggle[optionKey]) {
			_getBytoggle[optionKey] = RESUtils.indexOptionTable(moduleID, optionKey, 0)
		}

		return _getBytoggle[optionKey](toggle);
	}


	var _getMenuItems;
	function getMenuItems(menuItemID) {
		if (!_getMenuItems) {
			_getMenuItems = RESUtils.indexOptionTable(moduleID, 'toggle', 2, true)
		}

		if (typeof menuItemID === "undefined") {
			return _getMenuItems;
		} else {
			return _getMenuItems(menuItemID);
		}
	};
	function getAllMenuItems() {
		return getMenuItems().all();
	}

	function gettogglesForMenuItem(menuItemID) {
		var menuItems = getMenuItems(menuItemID);
		var toggles = menuItems
			.map(function(menuItem) {
				return menuItem[0]; // toggle
			});
		return toggles;
	}


	function anyTogglesEnabled(toggles) {
		var enabled = [].concat(toggles)
			.map(function(toggle) {
				return toggle[1]; // enabled
			});
		var anyEnabled = enabled.reduce(function(previousEnabled, enabled) {
				// If any toggle is enabled, then collection is enabled.
				// If all toggles are disabled, then collection is disabled
				return previousEnabled || enabled;
			}, false);
		return anyEnabled;
	};


	module.go = function() {
		createToggleMenuItems();
	};

	module.toggleActive = function(name) {
		var active = true;
		if (name && module.isEnabled() && module.isMatchURL()) {
			var toggles = getOptionByToggleName('toggle', name);
			if (toggles && !anyTogglesEnabled(toggles)) {
				active = false;
			}
		}


		return active;
	};

	// var $menuItems = {};
	function createToggleMenuItems() {
		var menuItems = getAllMenuItems();
		menuItems.forEach(function(menuItem) {
			var menuItemID = menuItem[0][2];

			var $element = RESTemplates.getSync('toggleToggleMenu').html({
				displayName: menuItemID,
				enabled: anyTogglesEnabled(menuItem)
			});
			$element.data('res-toggle-menuitem', menuItemID);

			$element.appendTo('#RESDropdownOptions');
		});

		$("#RESDropdownOptions").on('click', 'li', onClickToggleMenuItem);
	}
	function onClickToggleMenuItem() {
		var menuItemID = $(this).data('res-toggle-menuitem');
		if (typeof menuItemID === 'undefined') return;

		var enabled = module.toggleMenuItem(menuItemID);
		$(this).find(".toggleButton").toggleClass("enabled", enabled);
	}


	module.toggleMenuItem = function(menuItemID) {
		var toggles = gettogglesForMenuItem(menuItemID);
		return module.toggleToggle(toggles);
	};

	module.toggleToggle = function(toggles) {
		var toggles = [].concat(toggles)
			.map(function(toggle) {
				return getOptionByToggleName('toggle', toggle)
			}).reduce(function(toggles, newToggles) {
				return toggles.concat(newToggles);
			}, []);

		var newEnabled = !anyTogglesEnabled(toggles);

		// Update cached settings
		toggles.forEach(function(toggle) {
			toggle[1] = newEnabled;
		});

		// Update settings in storage
		module.options.toggle.value.filter(function(toggle) {
			return toggles.indexOf(toggle[0]) !== -1;
		}).forEach(function(toggle) {
			toggle[1] = newEnabled;

		});
		RESUtils.setOption(moduleID, 'toggle', module.options.toggle.value);


		// Notify listeners
		toggles.forEach(function(toggle) {
			var toggle = toggle[0];
			if (newEnabled) {
				$(module).trigger($.Event('activated', { target: toggle }));
			} else {
				$(module).trigger($.Event('deactivated', { target: toggle }));
			}
		});

		return newEnabled;
	};
});
