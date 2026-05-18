self.__BUILD_MANIFEST = {
  "polyfillFiles": [
    "static/chunks/polyfills.js"
  ],
  "devFiles": [
    "static/chunks/react-refresh.js"
  ],
  "ampDevFiles": [],
  "lowPriorityFiles": [],
  "rootMainFiles": [],
  "pages": {
    "/404": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/404.js"
    ],
    "/_app": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/_app.js"
    ],
    "/_error": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/_error.js"
    ],
    "/artists": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/artists.js"
    ],
    "/blog": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/blog.js"
    ],
    "/events": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/events.js"
    ],
    "/promoters": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/promoters.js"
    ],
    "/shop": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/shop.js"
    ]
  },
  "ampFirstPages": []
};
self.__BUILD_MANIFEST.lowPriorityFiles = [
"/static/" + process.env.__NEXT_BUILD_ID + "/_buildManifest.js",
,"/static/" + process.env.__NEXT_BUILD_ID + "/_ssgManifest.js",

];