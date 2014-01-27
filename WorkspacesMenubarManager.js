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
 *  WorkspacesMenubarManager
 *
 *  Defines a manager for the menubar
 *  This manager handles the native menubar and the extension's submenu.
 *  Listens to the PreferencesManager to stay up-to-date.
 *
 */
// ------------------------------------------------------------------------
/*global define, brackets, $ */
/*jslint nomen: true, vars: true */
define(function (require, exports, module) {
    'use strict';
   
    // Set variables
    var PreferencesManager      = require("WorkspacesPreferencesManager"),
        Menus                   = brackets.getModule("command/Menus"),
        CommandManager          = brackets.getModule("command/CommandManager"),
        DialogManager           = require("WorkspacesDialogManager"),
        WorkspacesManager       = require("WorkspacesManager"),
        
        _menu                   = null,
        _workspaces = [],
    
        // Set global variables
        MENU_NAME               = "Workspaces",
        MENU_ID                 = "thomasvalera-workspaces-menu",
        
        SUBMENU_MANAGE_NAME     = "Manage Workspaces",
        SUBMENU_MANAGE_ID       = "thomasvalera-workspaces-manage";
    
// ------------------------------------------------------------------------
/*
 * MENU FUNCTIONS
 */
// ------------------------------------------------------------------------
    
    /*
     * Registers the command for the given workspace
     */
    function _registerCommandForWorkspace(workspace) {
        
        // If command does not exist
        if (!CommandManager.get(workspace.getId())) {
            CommandManager.register(workspace.getName(), workspace.getId(), function () {
                // When command called, open the workspace
                WorkspacesManager.openWorkspace(workspace);
            });
        }
    }
    
// ------------------------------------------------------------------------
/*
 * DRAW FUNCTIONS
 */
// ------------------------------------------------------------------------
    
    /*
     * Draws a submenu for the given workspace
     */
    function _drawSubmenuForWorkspace(workspace) {
            
        // Register command
        _registerCommandForWorkspace(workspace);
        // Add submenu to menu
        _menu.addMenuItem(workspace.getId());
    }
    
    /*
     * Draws the submenu
     * NOTE: Workspaces with no paths are not added!!
     */
    function _drawSubmenu() {
        
        var workspaces = PreferencesManager.getWorkspaces(),
            itemCount = 0,
            i;
        
        for (i = 0; i < workspaces.length; i += 1) {
            
            var workspace = workspaces[i];
            
            // If workspaces has paths, draw submenu
            if (workspace.getPaths().length > 0) {
                // If first item to add
                if (itemCount === 0) {
                    // Add divider
                    _menu.addMenuDivider();
                }
                
                _drawSubmenuForWorkspace(workspace);
                
                // Increment count
                itemCount += 1;
            }
        }
        
        // Set workspaces
        _workspaces = workspaces;
    }
    /*
     * Draws and registers the menu
     */
    function _drawMenu() {
        
        // Get menu
        _menu = Menus.addMenu(MENU_NAME, MENU_ID, Menus.AFTER, Menus.AppMenuBar.VIEW_MENU);
        
        // If command does not exist
        if (!CommandManager.get(SUBMENU_MANAGE_ID)) {
            // Register manage item
            CommandManager.register(SUBMENU_MANAGE_NAME,
                                    SUBMENU_MANAGE_ID,
                                    function () {
                    DialogManager.openMainDialog();
                });
        }
        // Add manage item
        _menu.addMenuItem(SUBMENU_MANAGE_ID);
    }

// ------------------------------------------------------------------------
/*
 * LISTENER FUNCTIONS
 */
// ------------------------------------------------------------------------
    /*
     * Redraws the menubar
     */
    function _redraw() {
        
        // Remove menu
        if (_menu !== null) {
            Menus.removeMenu(_menu.id);
        }
        
        // Redraw menu
        _drawMenu();
        _drawSubmenu();
    }
    
    /*
     * Sets listeners for WorkspaceManager
     */
    function _setListeners() {
        $(PreferencesManager).on("PreferencesLoaded", function (event, data) {
            if (data.updateMenu === true) {
                _redraw();
            }
        });
    }
// ------------------------------------------------------------------------
/*
 * API FUNCTIONS
 */
// ------------------------------------------------------------------------  
    
    /*
     * Initializes the Menubar manager
     */
    function init() {
        
        // Draw menu
        _drawMenu();
        _drawSubmenu();
        
        _setListeners();
    }
    
    // API
    exports.init = init;
});