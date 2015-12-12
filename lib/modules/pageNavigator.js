addModule('pageNavigator', function(module, moduleID) {
	module.moduleName = 'Post Navigator';
	module.category = 'Posts';
	module.description = 'Provides a post navigation tool to get you up and down the page';
	module.go = function() {
		if ((this.isEnabled()) && (this.isMatchURL())) {
			RESTemplates.load('pageNavigator-CSS', function(template) {
				RESUtils.addCSS(template.text());
			});

			addElements();
		}
	};

	function addElements() {
		var backToTop = $('<a class="pageNavigator res-icon" data-id="top" href="#header" alt="back to top">&#xF148;</a>');
		backToTop.on('click', '[data-id="top"]', function(e) {
			e.preventDefault();
			RESUtils.scrollTo(0, 0);
		});
		modules['floater'].addElement(backToTop);
	}
});
