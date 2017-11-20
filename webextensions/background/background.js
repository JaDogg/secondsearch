/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

gLogContext = 'BG';

const SearchEngines = {
  cachedEngines: null,
  cachedEnginesById: null,
  recentlyUsedEngines: [],

  reset: async function() {
    var bookmarks = await browser.bookmarks.search({ query: '%s' });
    var engines = [];
    this.cachedEnginesById = {};
    for (let bookmark of bookmarks) {
      if (bookmark.type != 'bookmark' ||
          !/%s/i.test(bookmark.url))
        continue;
      if (!bookmark.favIconUrl)
        bookmark.favIconUrl = this.buildFavIconURI(bookmark);
      bookmark._recentlyUsedIndex = configs.recentlyUsedEngines.indexOf(bookmark.id);
      engines.push(bookmark);
      this.cachedEnginesById[bookmark.id] = bookmark;
    }
    this.cachedEngines = engines;
    this.sort();
  },

  buildFavIconURI(aEngine) {
    var uriMatch = aEngine.url.match(/^(\w+:\/\/[^\/]+)/);
    if (!uriMatch)
      return null;
    return `https://www.google.com/s2/favicons?domain=${uriMatch[1]}`;
  },

  sort() {
    this.cachedEngines.sort((aA, aB) =>
      aA._recentlyUsedIndex < 0 && aB._recentlyUsedIndex > -1 ?
        1 :
        aA._recentlyUsedIndex > -1 && aB._recentlyUsedIndex < 0 ?
          -1 :
          aA._recentlyUsedIndex - aB._recentlyUsedIndex ||
            aA.title > aB.title);
    configs.cachedEngines = this.cachedEngines;
  },

  onUsed(aId) {
    var index = this.recentlyUsedEngines.indexOf(aId);
    if (index > -1)
      this.recentlyUsedEngines.splice(index, 1);
    this.recentlyUsedEngines.unshift(aId);
    configs.recentlyUsedEngines = this.recentlyUsedEngines;
    this.recentlyUsedEngines.forEach((aId, aIndex) => {
      this.cachedEnginesById[aId]._recentlyUsedIndex = aIndex;
    });
    this.sort();
  }
};

configs.$loaded.then(() => {
  SearchEngines.cachedEngines = configs.cachedEngines;
  SearchEngines.recentlyUsedEngines = configs.recentlyUsedEngines;
  if (!SearchEngines.cachedEngines)
    SearchEngines.reset();
});

browser.runtime.onMessage.addListener((aMessage, aSender) => {
  if (!aMessage ||
      typeof aMessage.type != 'string' ||
      aMessage.type.indexOf('secondsearch:') != 0)
    return;

  switch (aMessage.type) {
    case kCOMMAND_GET_SEARCH_ENGINES:
      return Promise.resolve(SearchEngines.cachedEngines);

    case kCOMMAND_NOTIFY_SEARCH_ENGINE_USED:
      SearchEngines.onUsed(aMessage.id);
      break;
  }
});
