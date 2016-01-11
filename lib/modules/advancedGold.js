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

	function changeSavePopUp(e) {
		//TODO: make the actual popup >.>
	}

	function setChangeSaveButtonAttributes(buttons) {
		buttons.attr('class', function(index, css) {
			return (css.replace('-unsave-button save-button', '-changesave-button res-save-button'));
		});
	};

	function replaceUnsaveButtons() {
		var unsave_link_buttons = $('.link-unsave-button');
		var unsave_comment_buttons = $('.comment-unsave-button');
		setChangeSaveButtonAttributes(unsave_link_buttons);
		setChangeSaveButtonAttributes(unsave_comment_buttons);
	};

	module.go = function() {
		if ((this.isEnabled()) && (this.isMatchURL())) {
			if (module.options.easyChangeSave.value) {
				replaceUnsaveButtons();
			}
		}
	};
});
