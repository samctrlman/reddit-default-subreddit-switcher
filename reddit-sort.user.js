// ==UserScript==
// @name         Reddit Global Default Sort (Hot/New/etc)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Force Reddit to use your chosen post filter (hot, new, top) across all subreddit visits, even with internal navigation (React router)
// @author       turrytherobot
// @match        https://www.reddit.com/*
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const validFilters = ['hot', 'new', 'top', 'rising', 'controversial', 'best'];

    function getPreferredFilter() {
        return GM_getValue('preferredFilter', 'hot');
    }

    function setPreferredFilter(filter) {
        if (validFilters.includes(filter)) {
            GM_setValue('preferredFilter', filter);
            alert(`Reddit default filter set to: ${filter}`);
        } else {
            alert(`Invalid filter selected: ${filter}`);
        }
    }

    function showFilterMenu() {
        validFilters.forEach(filter => {
            GM_registerMenuCommand(`Set filter to "${filter}"`, () => setPreferredFilter(filter));
        });
    }

    showFilterMenu();

    const isPostPage = (path) => /^\/r\/[^\/]+\/comments\//.test(path);
    const isFiltered = (path) => /(\/hot\/|\/new\/|\/top\/|\/rising\/|\/controversial\/)/.test(path);
    const isSubredditRoot = (path) => /^\/r\/[^\/]+\/?$/.test(path);
    const isAllOrPopular = (path) => /^\/r\/(all|popular)\/?$/.test(path);

    let lastPathname = null;

    function tryRedirect(path) {
        const preferred = getPreferredFilter();

        if (
            (isSubredditRoot(path) || isAllOrPopular(path)) &&
            !isFiltered(path) &&
            !isPostPage(path)
        ) {
            const newUrl = `${window.location.origin}${path.replace(/\/$/, '')}/${preferred}/`;
            if (window.location.href !== newUrl) {
                window.location.replace(newUrl);
            }
        }
    }

    function watchPathChanges() {
        setInterval(() => {
            const currentPath = window.location.pathname;
            if (currentPath !== lastPathname) {
                lastPathname = currentPath;
                tryRedirect(currentPath);
            }
        }, 250); // Reddit routing is fast af, but 250ms polling is plenty
    }

    watchPathChanges();
    tryRedirect(window.location.pathname);
})();
