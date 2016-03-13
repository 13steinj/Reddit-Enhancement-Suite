addModule('usernameHider', (module, moduleID) => {
	module.moduleName = 'Username Hider';
	module.category = 'My account';
	module.disabledByDefault = true;
	module.description = `
		Username hider hides your username from displaying on your screen when you're logged in to reddit.
		This way, if someone looks over your shoulder at work, or if you take a screenshot, your reddit username is not shown.
		This only affects your screen. There is no way to post or comment on reddit without your post being linked to the account
		you made it from.
	`;
	module.options = {
		displayText: {
			type: 'text',
			value: '~anonymous~',
			description: 'What to replace your username with. Default is ~anonymous~.'
		},
		perAccountDisplayText: {
			type: 'table',
			addRowText: '+add account',
			fields: [{
				name: 'username',
				type: 'text'
			}, {
				name: 'displayText',
				type: 'text'
			}],
			value: [],
			description: 'Allows you to specify the display text for a specific account. (useful in conjunction with the Account Switcher!)'
		},
		hideAllUsernames: {
			advanced: true,
			type: 'boolean',
			value: true,
			description: 'Hide all accounts listed in perAccountDisplayText, not just the logged-in user.'
		},
		hideAccountSwitcherUsernames: {
			advanced: true,
			type: 'boolean',
			value: true,
			description: `
				Hide all accounts listed in Account Switcher. <br>
				If an username isn't already listed in perAccountDisplayText, then hide that username with the default displayText.
			`
		},
		showUsernameOnHover: {
			type: 'boolean',
			value: false,
			description: `
				Mousing over the text hiding your username reveals your real username.<br>
				This makes it easy to double check that you're commenting/posting from the correct account,
				while still keeping your username hidden from prying eyes.
			`
		}
	};

	module.go = function() {
		if (this.isEnabled() && this.isMatchURL()) {
			hideUsernames();
		}
	};

	module.getDisplayText = function(username) {
		const accounts = module.options.perAccountDisplayText.value;
		if (!username) {
			username = RESUtils.loggedInUser();
		}

		let displayText;
		if (username && accounts) {
			username = username.toLowerCase();

			[, displayText] = accounts.find(([user]) => user.toLowerCase() === username) || [];
		}

		if (!displayText) {
			displayText = module.options.displayText.value ||
				module.options.displayText.default;
		}

		return displayText;
	};

	function hideUsernames() {
		hideUsername();
		if (module.options.hideAllUsernames.value) {
			hideAllUsernames();
		}
		if (module.options.hideAccountSwitcherUsernames.value) {
			hideAccountSwitcherUsernames();
		}
	}

	function hideAllUsernames() {
		module.options.perAccountDisplayText.value.forEach(perAccountDisplayText =>
			hideUsername(perAccountDisplayText[0])
		);
	}

	function hideAccountSwitcherUsernames() {
		const accounts = modules['accountSwitcher'].options.accounts.value;
		if (accounts) {
			accounts.forEach(([username]) => hideUsername(username));
		}
	}

	const _hiddenUsername = {};

	function hideUsername(user) {
		user = user || RESUtils.loggedInUser();
		const curatedBy = document.querySelector('.multi-details > h2 a');
		const displayText = module.getDisplayText(user);

		if (!user) return;

		if (_hiddenUsername[user.toLowerCase()]) {
			return;
		} else {
			_hiddenUsername[user.toLowerCase()] = true;
		}
		// Hide username
		RESUtils.addCSS(`
			p.tagline > a[href*='/${user}'],
			#header .user > a[href*='/${user}'],
			.titlebox .tagline a.author[href*='/${user}'],
			.commentingAs, a.author[href*='/${user}'],
			.bottom a[href*='/${user}'] {
				line-height: 0;
				font-size: 0;
				content: none;
			}

			p.tagline > a[href*='/${user}']:after,
			#header .user > a[href*='/${user}']:after,
			.titlebox .tagline a.author[href*='/${user}']:after,
			a.author[href*='/${user}']:after,
			.bottom a[href*='/${user}']:after {
				content: "${displayText}";
				letter-spacing: normal;
				font-size: 10px;
				background-color: inherit;
				border-radius: inherit;
				padding: inherit;
			}

			.commentingAs:after {
				content: "Commenting as: ${displayText}";
				letter-spacing: normal;
				font-size: 12px;
			}
		`);

		// Show username on hover
		if (module.options.showUsernameOnHover.value) {
			RESUtils.addCSS(`
				p.tagline > a[href*='/${user}']:hover,
				#header .user > a[href*='/${user}']:hover,
				.titlebox .tagline a.author[href*='/${user}']:hover,
				.commentingAs:hover, a.author[href*='/${user}']:hover,
				.bottom a[href*='/${user}']:hover {
					line-height: inherit;
					font-size: inherit;
				}

				p.tagline > a[href*='/${user}']:hover:after,
				#header .user > a[href*='/${user}']:hover:after,
				.titlebox .tagline a.author[href*='/${user}']:hover:after,
				a.author[href*='/${user}']:hover:after,
				.bottom a[href*='/${user}']:hover:after {
					content: none;
				}

				.commentingAs:hover:after {
					content: none;
				}
			`);
		}

		if (curatedBy) {
			const curatedByUsername = curatedBy.href.match(RESUtils.regexes.profile);
			if (curatedByUsername && curatedByUsername[1].toLowerCase() === user.toLowerCase()) {
				curatedBy.textContent = curatedBy.textContent.replace(user, displayText);

				// Show username on hover
				if (module.options.showUsernameOnHover.value) {
					$(curatedBy)
						.on('mouseenter', function() {
							this.textContent = this.textContent.replace(displayText, user);
						})
						.on('mouseleave', function() {
							this.textContent = this.textContent.replace(user, displayText);
						});
				}
			}
		}
	}
});
