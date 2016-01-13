addModule('advancedGold', function(module, moduleID) {
	module.moduleName = 'Advanced Gold Features';
	module.category = 'Productivity';
	module.description = 'Advanced features for reddit gold!';
	module.options = {
		easyChangeSave: {
			type: 'boolean',
			value: false,
			description: 'Replace the "unsave" button with "change save", so that you can change the post/comment category in one click.'
		}
	};
	module.include = [
		'all'
	];
	module.exclude = [];

	function getOptions() {
		return [];
	}

	function changeSavePopUp(e) {
		e.stopPropagation();
		e.preventDefault();
		var options = getOptions();
		var rect = this.getBoundingClientRect();
		var left_position = rect.left + 42
		var form = document.createElement('form');
		form.setAttribute('class', 'res-change-save hover-bubble anchor-left save-selector');
		form.setAttribute('style', 'visibility: visible; display: block; left: {left_value}px; top: 1079px; opacity: 1;'.replace('{left_value}', left_position));
		var label = document.createElement('label');
		label.setAttribute('for', 'savedcategory');
		label.textContent = 'save category';
		form.appendChild(label);
		var throbber = document.createElement('span');
		throbber.setAttribute('class', 'throbber');
		form.appendChild(throbber);
		var selector = document.createElement('select');
		var baseoption = document.createElement('option');
		baseoption.setAttribute('value', '');
		baseoption.textContent = 'no category';
		selector.appendChild(baseoption);
		for (var option in options) {
			var optionel = document.createElement('option');
			optionel.setAttribute('value', options[option]);
			optionel.textContent = options[option];
			selector.appendChild(optionel);
		}
		form.appendChild(selector)
		html += '<input maxlength="20" class="savedcategory" name="savedcategory" placeholder="new category"><input type="submit" value="save">'
		html += '<div class="error"></div>'
	}

	function setChangeSaveButtonAttributes(buttons) {
		buttons.attr('class', function(index, css) {
			return (css.replace('-unsave-button save-button', '-changesave-button res-save-button'));
		});
		buttons.find('a').text('change save');
	};

	function replaceUnsaveButtons() {
		var unsave_link_buttons = $('.link-unsave-button');
		var unsave_comment_buttons = $('.comment-unsave-button');
		setChangeSaveButtonAttributes(unsave_link_buttons);
		setChangeSaveButtonAttributes(unsave_comment_buttons);
		$("body").on("click", '.comment-changesave-button a, .link-changesave-button a,', changeSavePopup);
	};

	module.;go = function() {
		if ((module.isEnabled()) && (module.isMatchURL())) {
			if (module.options.easyChangeSave.value) {
				replaceUnsaveButtons();
			}
		}
	};
});
