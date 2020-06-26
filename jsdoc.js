module.exports = {
  tags: {
    allowUnknownTags: false,
  },
  source: {
    include:        [ "./srcs", "./client", "./publisher", "./subscriber", "./README.md" ],
    includePattern: ".js(doc)?$",
    excludePattern: "__tests__/.*",
  },
  plugins: [
    "plugins/markdown",
  ],
  opts: {
    template:    "node_modules/docdash",
    encoding:    "utf8",
    destination: "docs/",
    recurse:     true,
    verbose:     true,
  },
  templates: {
    cleverLinks:    false,
    monospaceLinks: false,
  },
  docdash: {
    static:       true,           // Display the static members inside the navbar
    sort:         false,          // Sort the methods in the navbar
    sectionOrder: [               // Order the main section in the navbar (default order shown here)
      "Interfaces",
      "Modules",
      "Namespaces",
      "Classes",
      "Events",
      "Mixins",
      "Externals",
      "Tutorials",
    ],
    disqus:    "",                // Shortname for your disqus (subdomain during site creation)
    openGraph: {                  // Open Graph options (mostly for Facebook and other sites to easily extract meta information)
      title:     "",              // Title of the website
      type:      "website",       // Type of the website
      image:     "",              // Main image/logo
      site_name: "",              // Site name
      url:       "",              // Main canonical URL for the main page of the site
    },
    meta: {                       // Meta information options (mostly for search engines that have not indexed your site yet)
      title:       "",            // Also will be used as postfix to actualy page title, prefixed with object/document name
      description: "",            // Description of overal contents of your website
      keyword:     "",            // Keywords for search engines
    },
    search:       true,           // Display seach box above navigation which allows to search/filter navigation items
    collapse:     false,          // Collapse navigation by default except current object's navigation of the current page
    wrap:         false,          // Wrap long navigation names instead of trimming them
    typedefs:     true,           // Include typedefs in menu
    navLevel:     -1,             // depth level to show in navbar, starting at 0 (false or -1 to disable)
    private:      false,          // set to false to not show @private in navbar
    removeQuotes: "trim",         // Remove single and double quotes, trim removes only surrounding ones
    scripts:      [],             // Array of external (or relative local copied using templates.default.staticFiles.include) js or css files to inject into HTML,
    // menu:         {               // Adding additional menu items after Home
    //   "Project Website": {        // Menu item name
    //     href:   "https://myproject.com", // the rest of HTML properties to add to manu item
    //     target: "_blank",
    //     class:  "menu-item",
    //     id:     "website_link",
    //   },
    //   "Forum": {
    //     href:   "https://myproject.com.forum",
    //     target: "_blank",
    //     class:  "menu-item",
    //     id:     "forum_link",
    //   },
    // },
  },
}
