// ------------------------------------------------------------------------
/*
 * Copyright (c) 2013 Thomas Valera. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 *
 */
// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
/*
 *  MainWindowManager
 *
 *  Defines a manager for the main mainwindow
 *  This manager add a notification in the main window to make MS Windows
 *  aware which if the opened windows is the primary one.
 *  
 *  NOTE: On MS Windows, closing the primary window closes the entire application
 *      and all the opened windows with it.
 *
 *      On Mac, only the indicator in the status bar is displayed.
 *
 */
// ------------------------------------------------------------------------
/*global define, brackets, window, $, Mustache, appshell */
/*jslint nomen: true, vars: true */
define(function (require, exports, module) {
    'use strict';
    
    // Load modules
    var UrlParamsUtils          = brackets.getModule("utils/UrlParams"),
        UrlParams               = new UrlParamsUtils.UrlParams(),
        StatusBar               = brackets.getModule("widgets/StatusBar"),
        PreferencesManager      = brackets.getModule("preferences/PreferencesManager"),
        PreferencesStorage      = PreferencesManager.getPreferenceStorage(module),
        CommandManager          = brackets.getModule("command/CommandManager"),
    
        _isPrimary              = true,
        _isEnabled              = true,
        
        // Global variables
        URL_PRIMARY             = "com-mainwindow-thomasvalera-url-primary",
        INDICATOR_ID            = "com-mainwindow-thomasvalera-indicator",

        // Notification variables
        _unrenderedNotification = require("text!libraries/MainWindow/htmlContent/notification.html"),
        _unrenderedIndicator    = require("text!libraries/MainWindow/htmlContent/partials/indicator.html"),
        _unrenderedToolbar      = require("text!libraries/MainWindow/htmlContent/partials/toolbar.html");
    
// ------------------------------------------------------------------------
/*
 * RENDER FUNCTIONS
 */
// ------------------------------------------------------------------------
    /*
     * Returns a rendered notification view with the given message
     */
    function _renderNotificationView() {
        var view = Mustache.render(_unrenderedNotification);
        return view;
    }
    
    /*
     * Returns a rendered indicator partial
     */
    function _renderIndicatorPartial() {
        var view = Mustache.render(_unrenderedIndicator);
        return view;
    }
    
    /*
     * Returns a rendered toolbar partial
     */
    function _renderToolbarPartial() {
        
        var data = {};
        
        // If enabled adds "active" to the rendered view
        if (_isEnabled) {
            data.active = "active";
        }
        
        var view = Mustache.render(_unrenderedToolbar, data);
        return view;
    }
    
// ------------------------------------------------------------------------
/*
 * EDITOR FUNCTIONS
 */
// ------------------------------------------------------------------------
    /*
     * Resizes the editor.
     * @param substract True if the notification height needs to be 
     * substracted from the editor, false if it needs to be added.
     */
    function _resizeEditor(substract) {
        
        // Get notification and editor-holder height
        var notifHeight = parseInt($("#main-window-warning").css("height").replace("px", ""), 10) + 10, // +10 for padding
            editor = $("#editor-holder"),
            editorHeight = parseInt(editor.css("height").replace("px", ""), 10),
            editorNewHeight = editorHeight,
        
            wrap = $("#editor-holder").find(".CodeMirror-wrap").first(),
            wrapHeight,
            wrapNewHeight;
        
        // If editor already loaded
        if (wrap.length > 0) {
            
            wrapHeight = parseInt(wrap.css("height").replace("px", ""), 10);
            wrapNewHeight = wrapHeight;
            
            // Remove 
            if (substract) {
                editorNewHeight = editorHeight - notifHeight;
                wrapNewHeight = wrapHeight - notifHeight;
            } else {
                // Add
                editorNewHeight = editorHeight + notifHeight;
                wrapNewHeight = wrapHeight + notifHeight;
            }
            
            // Resize containers
            editor.css("height", editorNewHeight);
            wrap.css("height", wrapNewHeight);
        }
    }
    
// ------------------------------------------------------------------------
/*
 * DISPLAY FUNCTIONS
 */
// ------------------------------------------------------------------------
    
    /*
     * Removes the notification if exists
     */
    function _removeNotification() {
        // If exists
        if ($.find("#main-window-warning").length > 0) {
            
            // Resize editor to make for the space created by removing the notification
            _resizeEditor(false);
            
            // Remove notification
            $("#main-window-warning").remove();
        }
    }
    
    /*
     * Displays the notification in the editor
     */
    function _displayNotification() {
        
        // If does not exist
        if ($.find("#main-window-warning").length === 0) {
            
            // Get views
            var view = _renderNotificationView(),
                contentDiv = $($($.find(".main-view")[0]).find(".content")[0]);
            
            // Add notification to content
            contentDiv.first().prepend(view);
            
            // Add listeners
            $("#main-window-warning").click(function () {
                _removeNotification();
            });
            
            // Resize editor to make the status bar reappear
            _resizeEditor(true);
        }
    }
    

    
    /*
     * Displays the indicator in status bar
     */
    function _displayIndicator() {
        // Render indicator
        var view = _renderIndicatorPartial();
            
        // Append and add indicator to statusbar
        $("#status-indicators").prepend(view);
        StatusBar.addIndicator(INDICATOR_ID, $("#main-window-indicator"), true);
        
    }
    
    
    /*
     * Enables the notification.
     * If needed, adds the notification warning.
     */
    function _enable() {
        
        // Get toolbar
        var toolbar = $("#main-window-toolbar");
        
        // If toolbar not active, activate
        if (!toolbar.hasClass("active")) {
            toolbar.addClass("active");
        }
        
        // Set enabled
        _isEnabled = true;
        PreferencesStorage.setValue("enabled", _isEnabled);
        
        // If primary
        if (_isPrimary) {
            _displayNotification();
        }
        
    }
    
    /*
     * Disables the notification.
     * If needed, removes the notification warning.
     */
    function _disable() {
        
        // Get toolbar
        var toolbar = $("#main-window-toolbar");
        
        // If toolbar active, deactivate
        if (toolbar.hasClass("active")) {
            toolbar.removeClass("active");
        }
        
        // Set disabled
        _isEnabled = false;
        PreferencesStorage.setValue("enabled", _isEnabled);
        
        // If primary
        if (_isPrimary) {
            // Remove notification
            _removeNotification();
        }
    }
    /*
     * Displays the toolbar partial
     */
    function _displayToolbar() {
        
        // Render toolbar
        var view = _renderToolbarPartial();
        
        // Add toolbar
        $("#main-toolbar").find("#toolbar-go-live").after(view);
        
        // Add on click
        $("#main-window-toolbar").click(function () {
            // If enabled, disable notifications
            if (_isEnabled) {
                _disable();
            } else {
                // Else enable
                _enable();
            }
        });
    }

// ------------------------------------------------------------------------
/*
 * WINDOW FUNCTIONS
 */
// ------------------------------------------------------------------------
    
    /*
     * Updates the window state with content of urlParams
     */
    function _updateWindowState() {

        window.history.replaceState({},
                                    'MainWindow',
                                    window.location.pathname + "?" + UrlParams.toString());
    }
    
    /*
     * Sets listeners for the commandManager.
     * This function will make sure that if the primary window is reloaded
     * the extension will still know it's the primary window.
     */
    function _setCommandManagerListeners() {
        
        // Set listener when command is executed
        $(CommandManager).on("beforeExecuteCommand", function (event, id) {
            // On reload and if primary
            if (id === "debug.refreshWindow" && _isPrimary) {
                // Clear url (no explicit primary param means primary window)
                UrlParams.put(URL_PRIMARY,"true");
                _updateWindowState();
            }
        });
    }
    
// ------------------------------------------------------------------------
/*
 * API FUNCTIONS
 */
// ------------------------------------------------------------------------

    /*
     * Runs main window extension
     */
    function run() {
        
        // Set listeners
        _setCommandManagerListeners();
        
        // Parse URL
        UrlParams.parse();
        
        // Get param value
        var paramPrimary = UrlParams.get(URL_PRIMARY);
        
        // Set false if explicit, true otherwise
        _isPrimary = paramPrimary === "false" ? false : true;
        
        // Add secondary to url to make sure 
        // futur opened window will know they are secondary
        // Update window state to apply
        UrlParams.put(URL_PRIMARY,"false");
        _updateWindowState();
        
        // Get preferences values
        _isEnabled = PreferencesStorage.getValue("enabled") === false ? false : true;
        
        // If preferences not existent, create
        if (PreferencesStorage.getValue("enabled") === undefined) {
            PreferencesStorage.setValue("enabled", _isEnabled);
        }
        
        // If primary and windows
        if (_isPrimary) {
            
            _displayIndicator();
            
            // If windows, show toolbar and notification
            if (appshell.platform === "win") {
                _displayToolbar();
                
                // If notification enabled
                if (_isEnabled) {
                    _displayNotification();
                }
            }
        }
    }
    
    // API
    exports.run = run;
    exports.URL_PRIMARY = URL_PRIMARY;
});