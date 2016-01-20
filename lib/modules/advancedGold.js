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
	};

	var changeSavePopup = function(e) {
		e.stopPropagation();
		e.preventDefault();
		var options = getOptions();
		var offset = $(this).offset();
		var left_position = offset.left + 59.562625;
		var form = document.createElement('form');
		form.setAttribute('class', 'res-change-save hover-bubble anchor-left save-selector');
		form.setAttribute('style', 'visibility: visible; display: block; left: {left_value}px; top: 1079px; opacity: 1;'.replace('{left_value}', left_position)).replace('{top_value}', offset.top);
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
		form.appendChild(selector);
		var manual_input = document.createElement('input');
		manual_input.setAttribute('maxlength', '20');
		manual_input.setAttribute('class', 'savedcategory');
		manual_input.setAttribute('name', 'savedcategory');
		manual_input.setAttribute('placeholder', 'new category');
		var save_input = document.createElement('input');
		save_input.setAttribute('type', 'submit');
		save_input.setAttribute('value', 'save');
		var error_div = document.createElement('div');
		error_div.setAttribute('class', 'error');
		form.appendChild(manual_input);
		form.appendChild(save_input);
		form.appendChild(error_div);
		form.parent_button = this;
		$("body").append(form);
		console.log('test');
	};

	function setChangeSaveButtonAttributes(buttons) {
		buttons.attr('class', function(index, css) {
			return (css.replace('-unsave-button save-button', '-changesave-button res-save-button'));
		});
		buttons.find('a').text('change save');
		buttons.find('a').on("click", module.changeSavePopup);
	};

	function replaceUnsaveButtons() {
		var unsave_link_buttons = $('.link-unsave-button');
		var unsave_comment_buttons = $('.comment-unsave-button');
		setChangeSaveButtonAttributes(unsave_link_buttons);
		setChangeSaveButtonAttributes(unsave_comment_buttons);
	};

	module.go = function() {
		if ((module.isEnabled()) && (module.isMatchURL())) {
			if (module.options.easyChangeSave.value) {
				replaceUnsaveButtons();
			}
		}
	};
});
