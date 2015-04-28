var RESUtils = RESUtils || {};
RESUtils.bootstrap = RESUtils.bootstrap || {};



setTimeout(function(u) {
	// Don't fire the script on the iframe. This annoyingly fires this whole thing twice. Yuck.
	// Also don't fire it on static.reddit or thumbs.reddit, as those are just images.
	// Also omit blog and code.reddit
	if (sessionStorage.getItem('RES.disabled') ||
		(/\/toolbar\/toolbar\?id/i.test(location.href)) ||
		(/comscore-iframe/i.test(location.href)) ||
		(/(?:static|thumbs|blog|code)\.reddit\.com/i.test(location.hostname)) ||
		(/^[www\.]?(?:i|m)\.reddit\.com/i.test(location.href)) ||
		(/\.(?:compact|mobile)$/i.test(location.pathname)) ||
		(/metareddit\.com/i.test(location.href))) {
		// do nothing.
		return false;
	}

	// call preInit function - work in this function should be kept minimal.  It's for
	// doing stuff as early as possible prior to pageload, and even prior to the localStorage copy
	// from the background.
	// Specifically, this is used to add a class to the document for .res-nightmode, etc, as early
	// as possible to avoid the flash of unstyled content.
	RESUtils.bootstrap.preInit();
	RESUtils.bootstrap.fetchStorage();

	window.addEventListener('DOMContentLoaded', RESUtils.bootstrap.initReadyCheck, false);
	window.addEventListener('load', RESUtils.bootstrap.doAfterLoad, false);
}, 1);

RESUtils.bootstrap.initReadyCheck = function() {
	if (!RESStorage.isReady ||
		(typeof document.body === 'undefined') ||
		(!document.html) ||
		(typeof document.html.classList === 'undefined')
	) {
		setTimeout(RESUtils.bootstrap.initReadyCheck, 50);
	} else {
		RESUtils.runtime.RESInitReadyCheck(RESUtils.bootstrap.init);
	}
}

RESUtils.bootstrap._beforeLoadComplete = false;
RESUtils.bootstrap.beforeLoad = function() {
	var documentReady = (document && document.html && document.html.classList);
	if (!documentReady) {
		setTimeout(RESUtils.bootstrap.beforeLoad, 1);
		return;
	}

	if (RESUtils.bootstrap._beforeLoadComplete) return;
	RESUtils.bootstrap._beforeLoadComplete = true;
	// if (beforeLoadDoneOnce) return;
	// first, go through each module and set all of the options so that if a module needs to check another module's options, they're ready...
	// console.log('get options start: ' + Date());
	RESUtils.bootstrap.loadModules('loadDynamicOptions');

	for (var thisModuleID in modules) {
		if (typeof modules[thisModuleID] === 'object') {
			RESUtils.options.getOptions(thisModuleID);
		}
	}

	// console.log('get options end: ' + Date());
	RESUtils.bootstrap.loadModules('beforeLoad');

	RESUtils.addBodyClasses();

	// apply style...
	RESUtils.addStyle(RESUtils.css);
	// clear out css cache...
	RESUtils.css = '';
}

RESUtils.bootstrap.init = function() {

	// if RESStorage isn't fully loaded, and _beforeLoadComplete isn't true,
	// then wait. It means we haven't read all of the modules' options yet.
	if (!RESStorage.isReady || !RESUtils.bootstrap._beforeLoadComplete) {
		setTimeout(RESUtils.bootstrap.init, 10);
		return;
	}

	RESUtils.addBodyClasses(); // body should be present now, add those classes.
	RESUtils.bootstrap.reportVersion();
	RESUtils.bootstrap.shims();

	RESUtils.initObservers();

	if (!RESUtils.bootstrap.testLocalStorage()) {
		RESUtils.bootstrap.reportStorageFailure();
	} else {
		document.body.addEventListener('mousemove', RESUtils.setMouseXY, false);
		// added this if statement because some people's Greasemonkey "include" lines are getting borked or ignored, so they're calling RES on non-reddit pages.
		if (RESUtils.regexes.all.test(location.href)) {
			// go through each module and run it
			RESUtils.bootstrap.loadModules('go');
			RESUtils.addStyle(RESUtils.css);
			//	console.log('end: ' + Date());
		}
	}

	RESUtils.bootstrap.postLoad = true;
}

RESUtils.bootstrap.doAfterLoad = function() {
	RESUtils.bootstrap.loadModules('afterLoad');
}

RESUtils.bootstrap._loadErrors = {};
RESUtils.bootstrap.loadModules = function(stage) {
	for (var moduleID in modules) {
		if (!modules.hasOwnProperty(moduleID)) continue;
		if (RESUtils.bootstrap._loadErrors[moduleID]) continue;
		if (typeof modules[moduleID][stage] === 'function') {
			try {
				// console.log('Loading RES module', moduleID, stage, Date.now());
				// perfTest(thisModuleID+' start');
				modules[moduleID][stage]();
				// perfTest(thisModuleID+' end');
				// console.log('Loaded RES module', moduleID, stage, Date.now());
			} catch (error) {
				RESUtils.bootstrap._loadErrors[moduleID] = error;
				console.error('Could not load RES module', moduleID, stage, error, error.stack);
			}
		}
	}
}

RESUtils.bootstrap.reportVersion = function() {
	// report the version of RES to reddit's advisory checker.
	var RESVersionReport = RESUtils.createElement('div','RESConsoleVersion');
	RESVersionReport.setAttribute('style','display: none;');
	RESVersionReport.textContent = RESMetadata.version;
	document.body.appendChild(RESVersionReport);
}

RESUtils.bootstrap.shims = function() {

	// $.browser shim since jQuery removed it
	$.browser = {
		safari: BrowserDetect.isSafari(),
		mozilla: BrowserDetect.isFirefox(),
		chrome: BrowserDetect.isChrome(),
		opera: BrowserDetect.isOpera()
	};

	$.fn.safeHtml = function(string) {
		if (!string) return '';
		else return $(this).html(RESUtils.sanitizeHTML(string));
	};
}

RESUtils.bootstrap.testLocalStorage = function() {
	var success = true;
	/*
	var backup = {};
	$.extend(backup, RESStorage);
	delete backup.getItem;
	delete backup.setItem;
	delete backup.removeItem;
	console.log(backup);
	*/

	// Check for localStorage functionality...
	try {
		localStorage.setItem('RES.localStorageTest', 'test');
		RESUtils.runtime.localStorageTest();
	} catch (e) {
		success = false;
	}

	return success;
}

RESUtils.bootstrap.reportStorageFailure = function() {
	var RESFail = 'Sorry, but localStorage seems inaccessible. Reddit Enhancement Suite can\'t work without it. \n\n';
	if (BrowserDetect.isSafari()) {
		RESFail += 'Since you\'re using Safari, it might be that you\'re in private browsing mode, which unfortunately is incompatible with RES until Safari provides a way to allow extensions localStorage access.';
	} else if (BrowserDetect.isChrome()) {
		RESFail += 'Since you\'re using Chrome, you might just need to go to your extensions settings and check the "Allow in Incognito" box.';
	} else if (BrowserDetect.isOpera()) {
		RESFail += 'Since you\'re using Opera, you might just need to go to your extensions settings and click the gear icon, then click "privacy" and check the box that says "allow interaction with private tabs".';
	} else {
		RESFail += 'Since it looks like you\'re using Firefox, you probably need to go to about:config and ensure that dom.storage.enabled is set to true, and that dom.storage.default_quota is set to a number above zero (i.e. 5120, the normal default)".';
	}
	var userMenu = document.querySelector('#header-bottom-right');
	if (userMenu) {
		var preferencesUL = userMenu.querySelector('UL');
		var separator = document.createElement('span');
		separator.setAttribute('class', 'separator');
		separator.textContent = '|';
		var RESPrefsLink = document.createElement('a');
		RESPrefsLink.setAttribute('href', '#');
		RESPrefsLink.addEventListener('click', function(e) {
			e.preventDefault();
			alert(RESFail);
		}, true);
		RESPrefsLink.textContent = '[RES - ERROR]';
		RESPrefsLink.setAttribute('style', 'color: red; font-weight: bold;');
		RESUtils.insertAfter(preferencesUL, RESPrefsLink);
		RESUtils.insertAfter(preferencesUL, separator);
	}
}
