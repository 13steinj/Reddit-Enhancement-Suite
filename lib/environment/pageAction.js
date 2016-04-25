import { _addListener, _sendMessage } from 'environment';
import { currentSubreddit } from '../utils';

_addListener('pageActionClick', () => {
	const toggle = !modules['styleTweaks'].isSubredditStyleEnabled();
	modules['styleTweaks'].toggleSubredditStyle(toggle, currentSubreddit());
});

_addListener('pageActionRefresh', () => modules['styleTweaks'].updatePageAction());

/**
 * @param {boolean} [state=false]
 * @returns {Promise<void, *>}
 */
export function show(state = false) {
	return _sendMessage('pageAction', { operation: 'show', state });
}

/**
 * @returns {Promise<void, *>}
 */
export function hide() {
	return _sendMessage('pageAction', { operation: 'hide' });
}

/**
 * @returns {Promise<void, *>}
 */
export function destroy() {
	return _sendMessage('pageAction', { operation: 'destroy' });
}
