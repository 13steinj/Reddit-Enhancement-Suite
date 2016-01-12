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
		var html = '<form class="res-change-save hover-bubble anchor-left save-selector" style="visibility: visible; display: block; left: {left_value}px; top: 1079px; opacity: 1;">'.replace('{left_value}', left_position)
		html += '<label for="savedcategory">save category</label><span class="throbber"></span><select><option value="">no category</option>
		for (var option in options) {
			html += '<option value="{option_value}">{option_value}</option>'.replace('{option_value}', 'foo')
		
		html += '</select><input maxlength="20" class="savedcategory" name="savedcategory" placeholder="new category"><input type="submit" value="save">'
		html += '<div class="error"></div></form>'
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
