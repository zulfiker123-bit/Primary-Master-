/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "9a3e3883532d8461e4720a09d3555384"
  }, {
    "url": "pwa-512x512.png",
    "revision": "842bbec695b5b8c518e67508544adcdb"
  }, {
    "url": "pwa-192x192.png",
    "revision": "df9e61dfaab6c7ee36b7993266925ae7"
  }, {
    "url": "index.html",
    "revision": "9a7b7558583688e896ea6ee28872710e"
  }, {
    "url": "icon.svg",
    "revision": "eeb411e9dab4673abb8fd7ca9f0dfb9e"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "0358fc398eb0aaf50f737f2acb110df9"
  }, {
    "url": "assets/xlsx-zHa97828.js",
    "revision": null
  }, {
    "url": "assets/workbox-window.prod.es5-Bd17z0YL.js",
    "revision": null
  }, {
    "url": "assets/trash-2-lBjueRG0.js",
    "revision": null
  }, {
    "url": "assets/share-2-CGbUe1uW.js",
    "revision": null
  }, {
    "url": "assets/send-DeEGIPIe.js",
    "revision": null
  }, {
    "url": "assets/search-SLxOjvjz.js",
    "revision": null
  }, {
    "url": "assets/rolldown-runtime-XKyaHtl9.js",
    "revision": null
  }, {
    "url": "assets/purify.es-Dzkdzyfv.js",
    "revision": null
  }, {
    "url": "assets/printHelper-B-eCrOaU.js",
    "revision": null
  }, {
    "url": "assets/plus-C3HekEpK.js",
    "revision": null
  }, {
    "url": "assets/jspdf.es.min-D5HWKAwv.js",
    "revision": null
  }, {
    "url": "assets/index.es-CYGHRa1Y.js",
    "revision": null
  }, {
    "url": "assets/index-ppKMf9hh.css",
    "revision": null
  }, {
    "url": "assets/index-B4U8aCBX.js",
    "revision": null
  }, {
    "url": "assets/html2canvas-Bw0OShmD.js",
    "revision": null
  }, {
    "url": "assets/hero_education_hub_1794703905998-D9xdIUFY.jpg",
    "revision": null
  }, {
    "url": "assets/file-text-B0N31YPV.js",
    "revision": null
  }, {
    "url": "assets/eye-C3Jmc1-K.js",
    "revision": null
  }, {
    "url": "assets/digital_studio_desk_1794703906737-ktIJ7BBC.jpg",
    "revision": null
  }, {
    "url": "assets/classroom_lesson_visual_1794703907497-hLE22ORQ.jpg",
    "revision": null
  }, {
    "url": "assets/calendar-PbsMmX34.js",
    "revision": null
  }, {
    "url": "assets/building-2-Ce83JbBR.js",
    "revision": null
  }, {
    "url": "assets/VideosPage-DorrwJjF.js",
    "revision": null
  }, {
    "url": "assets/SuggestionsPage-DoTXFcs4.js",
    "revision": null
  }, {
    "url": "assets/StudentsPage-2Ce7qtHq.js",
    "revision": null
  }, {
    "url": "assets/QuestionsPage-CQcnJzQ7.js",
    "revision": null
  }, {
    "url": "assets/PortfolioPage-PDv0-ayS.js",
    "revision": null
  }, {
    "url": "assets/PortalsPage-r_hbsTkg.js",
    "revision": null
  }, {
    "url": "assets/PageShell-D8YvX9Bd.js",
    "revision": null
  }, {
    "url": "assets/NoticesPage-2lCMUsLq.js",
    "revision": null
  }, {
    "url": "assets/MaskabariPage-IPCUL7GS.js",
    "revision": null
  }, {
    "url": "assets/LessonPlanPage-CV8hS5VD.js",
    "revision": null
  }, {
    "url": "assets/InfoPages-lZOGxQtu.js",
    "revision": null
  }, {
    "url": "assets/ForumPage-DjIBpjJI.js",
    "revision": null
  }, {
    "url": "assets/EvaluationPage-Dv6t2Xso.js",
    "revision": null
  }, {
    "url": "assets/CertificatesPage-BLkN07cT.js",
    "revision": null
  }, {
    "url": "assets/BooksPage-Ca2TSsHE.js",
    "revision": null
  }, {
    "url": "assets/ApplicationsPage-CVdlcdOK.js",
    "revision": null
  }, {
    "url": "assets/AdminDashboardPage-DlxSUeJs.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "0358fc398eb0aaf50f737f2acb110df9"
  }, {
    "url": "icon.svg",
    "revision": "eeb411e9dab4673abb8fd7ca9f0dfb9e"
  }, {
    "url": "pwa-192x192.png",
    "revision": "df9e61dfaab6c7ee36b7993266925ae7"
  }, {
    "url": "pwa-512x512.png",
    "revision": "842bbec695b5b8c518e67508544adcdb"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "9a3e3883532d8461e4720a09d3555384"
  }, {
    "url": "manifest.webmanifest",
    "revision": "4acdcf0ca6a5a51294b9dcf8dee177f6"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("/index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 15,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 20,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
