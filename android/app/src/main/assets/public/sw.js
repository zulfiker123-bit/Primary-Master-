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
define(['./workbox-43e44e5a'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "384f994169f80c89f4d633776edda53e"
  }, {
    "url": "pwa-512x512.png",
    "revision": "1650f04a8e05b5c29db8e599ccd5a9dd"
  }, {
    "url": "pwa-192x192.png",
    "revision": "a1a518fd40cedd9e5c12ad0783be6336"
  }, {
    "url": "index.html",
    "revision": "124a36f3eccfeb8d75c49ede5f281760"
  }, {
    "url": "icon.svg",
    "revision": "c04efdb684d5a76520ee39fcdff42396"
  }, {
    "url": "favicon.png",
    "revision": "29cc7d4480b0c57cdd56cc384395cde7"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "c64b63ac656c66ce7cfb083531d1c1c8"
  }, {
    "url": "fonts/Kalpurush.woff2",
    "revision": "a43e7768ad2129f687e0ebdcc872377b"
  }, {
    "url": "assets/xlsx-zHa97828.js",
    "revision": null
  }, {
    "url": "assets/workbox-window.prod.es5-Bd17z0YL.js",
    "revision": null
  }, {
    "url": "assets/trash-2-DmCFJn9P.js",
    "revision": null
  }, {
    "url": "assets/sparkles-BceVCL4k.js",
    "revision": null
  }, {
    "url": "assets/send-CErrFkv5.js",
    "revision": null
  }, {
    "url": "assets/rolldown-runtime-XKyaHtl9.js",
    "revision": null
  }, {
    "url": "assets/purify.es-Dzkdzyfv.js",
    "revision": null
  }, {
    "url": "assets/printHelper-C6PngruU.js",
    "revision": null
  }, {
    "url": "assets/plus-CoT9o5cU.js",
    "revision": null
  }, {
    "url": "assets/pencil-B54z-Ido.js",
    "revision": null
  }, {
    "url": "assets/jsx-dev-runtime-DXMB6bYa.js",
    "revision": null
  }, {
    "url": "assets/jspdf.es.min-DvI7bkRp.js",
    "revision": null
  }, {
    "url": "assets/index.es-76raYcq4.js",
    "revision": null
  }, {
    "url": "assets/index-Z8Az_hfD.js",
    "revision": null
  }, {
    "url": "assets/index-CYQGkFZ2.css",
    "revision": null
  }, {
    "url": "assets/html2canvas-Bw0OShmD.js",
    "revision": null
  }, {
    "url": "assets/flnStudentSync-DJ9JJ9L_.js",
    "revision": null
  }, {
    "url": "assets/digital_studio_desk_1794703906737-ktIJ7BBC.jpg",
    "revision": null
  }, {
    "url": "assets/classroom_lesson_visual_1794703907497-hLE22ORQ.jpg",
    "revision": null
  }, {
    "url": "assets/circle-arrow-up-BskXZw3v.js",
    "revision": null
  }, {
    "url": "assets/chevron-right-CF6iHveV.js",
    "revision": null
  }, {
    "url": "assets/calendar-days-P3Kpdke_.js",
    "revision": null
  }, {
    "url": "assets/calendar-C9GS_6YI.js",
    "revision": null
  }, {
    "url": "assets/book-open-check-CUa_f2YK.js",
    "revision": null
  }, {
    "url": "assets/arrow-up-Xj0RG7U8.js",
    "revision": null
  }, {
    "url": "assets/VideosPage-DZabBYvf.js",
    "revision": null
  }, {
    "url": "assets/TerminalCompetenciesPage-GgQNXJBe.js",
    "revision": null
  }, {
    "url": "assets/SuggestionsPage-DOWfdS9H.js",
    "revision": null
  }, {
    "url": "assets/StudentsPage-uEYY3gLN.js",
    "revision": null
  }, {
    "url": "assets/QuestionsPage-Bar9y7wr.js",
    "revision": null
  }, {
    "url": "assets/PortfolioPage-CHyjHkCN.js",
    "revision": null
  }, {
    "url": "assets/PortalsPage-_k9vGQTV.js",
    "revision": null
  }, {
    "url": "assets/PageShell-DWCMXpYm.js",
    "revision": null
  }, {
    "url": "assets/NoticesPage-B4rntm-J.js",
    "revision": null
  }, {
    "url": "assets/MonthlyFlnPage-C3WbKdwB.js",
    "revision": null
  }, {
    "url": "assets/LessonPlanPage-BxZrTx5-.js",
    "revision": null
  }, {
    "url": "assets/InfoPages-Dh-2-Jhr.js",
    "revision": null
  }, {
    "url": "assets/ForumPage-BEaMkjSa.js",
    "revision": null
  }, {
    "url": "assets/EvaluationPage-hEDyBulb.js",
    "revision": null
  }, {
    "url": "assets/CertificatesPage-CqZoDR6R.js",
    "revision": null
  }, {
    "url": "assets/BooksPage-DaLCsd-s.js",
    "revision": null
  }, {
    "url": "assets/ApplicationsPage-1qYFjcnY.js",
    "revision": null
  }, {
    "url": "assets/AdminDashboardPage-WLelJiOL.js",
    "revision": null
  }, {
    "url": "assets/aistudio/IMG_37af5b1e-49c8-43ce-b5f9-886334f0761d_f8bf63d3.png",
    "revision": null
  }, {
    "url": "assets/aistudio/3840px-Government_Seal_of_Bangladesh.svg__1__2d6f6b7f.png",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "c64b63ac656c66ce7cfb083531d1c1c8"
  }, {
    "url": "favicon.png",
    "revision": "29cc7d4480b0c57cdd56cc384395cde7"
  }, {
    "url": "icon.svg",
    "revision": "c04efdb684d5a76520ee39fcdff42396"
  }, {
    "url": "pwa-192x192.png",
    "revision": "a1a518fd40cedd9e5c12ad0783be6336"
  }, {
    "url": "pwa-512x512.png",
    "revision": "1650f04a8e05b5c29db8e599ccd5a9dd"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "384f994169f80c89f4d633776edda53e"
  }, {
    "url": "manifest.webmanifest",
    "revision": "065560a6f079242fd77dd1a409534974"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("/index.html")));
  workbox.registerRoute(/\/version\.json(\?.*)?$/i, new workbox.NetworkOnly(), 'GET');
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
