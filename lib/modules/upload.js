function shuffle(array) { // From http://stackoverflow.com/q/2450954
  var currentIndex = array.length, temporaryValue, randomIndex ;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

modules['uploader'] = {
	moduleID: 'uploader',
	moduleName: 'Submit Page Uploader',
	category: 'UI',
	options: {
		preferredHost: {
			type: 'enum',
			value: 'mediacrush', // There are no other hosts at the moment, so the default is just MediaCrush
			values: [
				{
					name: '<img width=16 height=16 src="' + MediaCrush.logo + '" style="position: relative; top: 3px" /> \
						<a href="https://mediacru.sh/about" target="_blank">MediaCrush</a>',
					value: 'mediacrush'
				}
			],
			description: 'Choose the website you wish to host your files on. Do you own a hosting site you want to add?\
				<a href="todo">Read here</a> for information on how to get yours added.'
		}
	},
	description: 'Lets you upload files from the submit page.',
	isEnabled: function() {
		return RESConsole.getModulePrefs(this.moduleID);
	},
	include: [
		/^https?:\/\/([a-z]+)\.reddit\.com\/r\/[a-zA-Z0-9_-]+\/submit.*/i
	],
	exclude: [ ],
	isMatchURL: function() {
		return RESUtils.isMatchURL(this.moduleID);
	},
	go: function() {
		if (!this.isEnabled() || !this.isMatchURL()) {
			return;
		}
		var host = this.hosts[this.options.preferredHost.value];

		var url = document.getElementById('url-field');
		url.style.position = 'relative';
		var blurb = document.createElement('span');
		blurb.className = 'blurb';
		blurb.innerHTML = host.blurb;
		blurb.style.color = '#444';
		blurb.style.fontSize = '8pt';
		blurb.style.position = 'absolute';
		blurb.style.bottom = '15px';
		url.appendChild(blurb);
		var input = document.createElement('input');
		input.style.display = 'none';
		input.type = 'file';
		url.appendChild(input);
		var progress = document.createElement('span');
		progress.className = 'progress';
		var pw = document.createElement('div');
		pw.className = 'progress-wrapper';
		pw.appendChild(progress);
		url.appendChild(pw);

		function handle(file) {
			if (host.maxSize !== -1) {
				if (file.size > host.maxSize) {
					blurb.innerHTML = 'This file is too large.';
					return;
				}
			}
			host.handleFile(file, url, progress);
		}
		input.addEventListener('change', function(e) {
			handle(input.files[0]);
		}, false);
		blurb.querySelector('.file-trigger').addEventListener('click', function(e) {
			e.preventDefault();
			input.click();
		}, false);
		function nop(e) { e.stopPropagation(); e.preventDefault(); }
		window.addEventListener('dragenter', nop, false);
		window.addEventListener('dragover', nop, false);
		window.addEventListener('dragleave', nop, false);
		window.addEventListener('drop', function(e) {
			nop(e);
			handle(e.dataTransfer.files[0]);
		}, false);

		host.load(url);
	},
	hosts: {}
};
