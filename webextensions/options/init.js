/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

gLogContext = 'Options';
var options = new Options(configs);

function onConfigChanged(aKey) {
  switch (aKey) {
    case 'debug':
      if (configs.debug)
        document.documentElement.classList.add('debugging');
      else
        document.documentElement.classList.remove('debugging');
      break;
  }
}

async function updateDefaultEngineUI() {
  const field   = document.getElementById('defaultEngine');
  if (await Permissions.isGranted(Permissions.SEARCH_PERMISSION)) {
    field.setAttribute('disabled', true);
    field.parentNode.setAttribute('disabled', true);
  }
  else {
    field.removeAttribute('disabled');
    field.parentNode.removeAttribute('disabled');
  }
}

configs.$addObserver(onConfigChanged);
window.addEventListener('DOMContentLoaded', () => {
  ShortcutCustomizeUI.build().then(aUI => {
    document.getElementById('shortcuts').appendChild(aUI);
  });

  configs.$loaded.then(() => {
    options.buildUIForAllConfigs(document.querySelector('#debug-configs'));
    onConfigChanged('debug');
  });

  /*
  const searchPermissionCheck = document.getElementById('searchPermission');
  Permissions.initUI({
    checkbox: searchPermissionCheck,
    permission: Permissions.SEARCH_PERMISSION,
    onChange() {
      configs.cachedEnginesById = null;
      updateDefaultEngineUI();
    }
  });
  */
  updateDefaultEngineUI();
}, { once: true });

