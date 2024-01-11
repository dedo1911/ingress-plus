// ==UserScript==
// @name IITC Plugin: Mediagress
// @category Misc
// @version 1.0.0
// @namespace https://ingress.plus
// @downloadURL https://ingress.plus/mediagress.user.js
// @updateURL https://ingress.plus/mediagress.user.js
// @homepageURL https://ingress.plus
// @description Upload your media to Mediagress
// @author Mediagress
// @include https://intel.ingress.com/*
// @match https://intel.ingress.com/*
// @grant none
// ==/UserScript==

// shout out to https://github.com/EisFrei/ and his Live Inventory plugin

function wrapper(pluginInfo) {
  const host = 'https://ingress.plus';
  // Make sure that window.plugin exists. IITC defines it as a no-op function,
  // and other plugins assume the same.
  if (typeof window.plugin !== 'function') window.plugin = function () {};

  window.plugin.Mediagress = function () {};

  // Name of the IITC build for first-party plugins
  pluginInfo.buildName = 'Mediagress';
  // Datetime-derived version of the plugin
  pluginInfo.dateTimeVersion = '202401110000';
  // ID/name of the plugin
  pluginInfo.pluginId = 'mediagress';

  async function getHasActiveSubscription() {
    return new Promise((resolve, reject) => {
      window.postAjax('getHasActiveSubscription', {}, resolve, reject);
    })
  }

  async function getInventory() {
    return new Promise((resolve, reject) => {
      window.postAjax('getInventory', {
        lastQueryTimestamp: 0
      }, resolve, reject);
    })
  }

  function getCountOfMediaOutsideCapsules(rawInventory) {
    return rawInventory.result
      .filter(item => item[2] && item[2].resourceWithLevels && item[2].resourceWithLevels.resourceType === 'MEDIA')
      .length;
  }

  function getMediaFromRawInventory(rawInventory) {
    const flatOneLevel = (arrays) => [].concat.apply([], arrays);
    const mediaInCapsules = flatOneLevel(
      rawInventory
        .result
        .map(arr => arr[2])
        .filter(i => i.container && i.container.stackableItems)
        .map(i => i.container.stackableItems)
    )
      .map(i => i.exampleGameEntity && i.exampleGameEntity[2])
      .filter(i => i && i.resourceWithLevels && i.resourceWithLevels.resourceType === 'MEDIA');
    const deduplicatedByLowestAcquisition = Object.values(
      mediaInCapsules
        .filter(i => i.inInventory && i.storyItem.mediaId)
        .reduce((acc, curr) => {
          const mediaId = curr.storyItem.mediaId
          if (acc[mediaId]
            && +acc[mediaId].inInventory.acquisitionTimestampMs < +curr.inInventory.acquisitionTimestampMs) {
            return acc;
          }
          acc[mediaId] = curr;
          return acc;
        }, {})
    )
    return deduplicatedByLowestAcquisition;
  }

  const settingsKey = 'mediagress';
  const defaultSettings = {
    lastUploadTimestamp: 0,
    uploadedIds: [],
  };

  function getSettings() {
    const existingSettings = localStorage.getItem(settingsKey);
    if (!existingSettings) {
      return defaultSettings;
    }
    try {
      return JSON.parse(existingSettings);
    } catch (e) {
      return defaultSettings;
    }
  }

  // partial of settings object
  function saveSettings(settings) {
    const currentSettings = getSettings();
    localStorage.setItem(settingsKey, JSON.stringify({
      ...currentSettings,
      ...settings,
    }));
  }

  let uploadInProgress = false;
  async function uploadMedia() {
    if (uploadInProgress) {
      return;
    }
    uploadInProgress = true;
    try {
      const { uploadedIds, lastUploadTimestamp } = getSettings();
      if (lastUploadTimestamp > Date.now() - 1000 * 60 * 5) {
        return alert('Try again in 5 minutes');
      }
      if (!(await getHasActiveSubscription()).result) {
        return alert('Your inventory is only available on Intel if you have an active C.O.R.E. subscription :c')
      }
      const rawInventory = await getInventory();
      const mediaOutsideCapsulesCount = getCountOfMediaOutsideCapsules(rawInventory);
      // todo use dialog?
      if (mediaOutsideCapsulesCount > 0
        && !confirm(`You have ${mediaOutsideCapsulesCount} Media outside of capsules; these won't be uploaded. Do you wish to proceed?`)) {
        return;
      }
      const medias = getMediaFromRawInventory(rawInventory);
      const filteredMedia = medias.filter((item) => !uploadedIds.flat().includes(item.storyItem.mediaId));
      if (!filteredMedia.length) {
        console.log('No new media to upload, skipping');
        alert('No new media has been found in your inventory.');
        saveSettings({
          lastUploadTimestamp: Date.now(),
        });
        return;
      }
      const response = await fetch(`${host}/api/mediagress/v1/upload-media`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ medias: filteredMedia, player: PLAYER }),
      });
      if (response.ok) {
        const responseBody = await response.json();
        if (responseBody.previouslyUnknownMediaCount) {
          alert(`${filteredMedia.length} media have been uploaded, of which ${responseBody.previouslyUnknownMediaCount} were new! Please give us some time to approve and categorize them before they appear on the website.`);
        } else {
          alert(`${filteredMedia.length} media have been uploaded. Sadly, none of them were new, but we thank you for your contribution none the less!`);
        }
        saveSettings({
          uploadedIds: [...uploadedIds.flat(), ...filteredMedia.map(item => item.storyItem.mediaId)],
          lastUploadTimestamp: Date.now(),
        });
        return;
      }
      console.error(`Error making request to Mediagress: ${response.status} ${await response.text()}`);
      alert('Error :C please contact the developers at https://t.me/Mediagress');
      return;
    } catch (e) {
      alert('Failed to get inventory data from Intel. Try again in a moment');
      console.error(e);
    } finally {
      uploadInProgress = false;
    }
  }

  function setup() {
    $('<a href="#">')
      .text('Upload to Mediagress')
      .click(uploadMedia)
      .appendTo($('#toolbox'));
  }
  setup.info = pluginInfo;

  if (window.iitcLoaded) {
    setup();
  } else {
    if (!window.bootPlugins) {
      window.bootPlugins = [];
    }
    window.bootPlugins.push(setup);
  }
}

((() => {
  const pluginInfo = {};
  if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) {
    pluginInfo.script = {
      version: GM_info.script.version,
      name: GM_info.script.name,
      description: GM_info.script.description,
    };
  }
  // Greasemonkey. It will be quite hard to debug
  if (typeof unsafeWindow !== 'undefined' || typeof GM_info === 'undefined' || GM_info.scriptHandler != 'Tampermonkey') {
    // inject code into site context
    const script = document.createElement('script');
    script.appendChild(document.createTextNode(`(${wrapper})(${JSON.stringify(pluginInfo)});`));
    (document.body || document.head || document.documentElement).appendChild(script);
  } else {
    // Tampermonkey, run code directly
    wrapper(pluginInfo);
  }
})());
