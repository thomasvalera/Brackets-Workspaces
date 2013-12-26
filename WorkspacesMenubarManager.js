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
define(function (require, exports, module) {
    'use strict';
    
    // Set variables
    var PreferencesManager      = require("WorkspacesPreferencesManager"),
        _menu                   = null,
        
        Menus                   = brackets.getModule("command/Menus"),
        CommandManager          = brackets.getModule("command/CommandManager"),
        DialogManager           = require("WorkspacesDialogManager"),
        WorkspacesManager       = require("WorkspacesManager");
    
    // Set global variables
    var MENU_NAME               = "Workspaces",
        MENU_ID                 = "com-workspaces-thomasvalera-menu",
        
        SUBMENU_MANAGE_NAME     = "Manage Workspaces",
        SUBMENU_MANAGE_ID       = "com-workspaces-thomasvalera-manage";

// ------------------------------------------------------------------------
/*
 * HELPER FUNCTIONS
 */
// ------------------------------------------------------------------------
    
    /*
     * Returns true if menuItem exists,
     * false otherwise
     */
    function menuItemExistsWithId(id) {
        return Menus.getMenuItem(MENU_ID + "-" + id) !== undefined;
    }
    
// ------------------------------------------------------------------------
/*
 * LISTENER FUNCTIONS
 */
// ------------------------------------------------------------------------
     /*
     * Sets listeners for WorkspaceManager
     */
    function _setPreferencesManagerListeners() {
        $(PreferencesManager).on("PreferencesLoaded", function () {
            reload();
        });
    }
// ------------------------------------------------------------------------
/*
 * MENU DRAW FUNCTIONS
 */
// ------------------------------------------------------------------------
    
    /*
     * Adds the missing commands to the command manager
     * this will keep all the menus synced
     */
    function _registerCommandForWorkspace(workspace) {
        
        // If command not already registered, register it
        if (CommandManager.get(workspace.getId()) === undefined) {
            CommandManager.register(workspace.getName(), workspace.getId(), function () {
                WorkspacesManager.openWorkspace(workspace);
            });
        } else {
            // Else refresh name of command
            var command = CommandManager.get(workspace.getId());
            command.setName(workspace.getName());
        }
    }
    
    /*
     * Draws a submenu for the given workspace
     * NOTE: Workspaces with no paths are not added!!
     */
    function _drawSubmenuForWorkspace(workspace) {
        
        // If workspace has at least 1 path
        if (workspace.getPaths().length > 0) {
            
            _registerCommandForWorkspace(workspace);
            
            // If menu item does not exist
            if(!menuItemExistsWithId(workspace.getId())) {
                // Add submenu to menu
                _menu.addMenuItem(workspace.getId());
            }
        }
    }
    
    /*
     * Draws the menu and register the commands
     */
    function _drawMenu(workspaces) {
        
        // Register menu
        _menu = Menus.addMenu(MENU_NAME, MENU_ID, Menus.AFTER, Menus.AppMenuBar.VIEW_MENU);
        
        
        // Register and add dialog button
        CommandManager.register(SUBMENU_MANAGE_NAME, 
                                SUBMENU_MANAGE_ID, 
                                function () {
                                    DialogManager.open();
                                });
        // Add submenu
        _menu.addMenuItem(SUBMENU_MANAGE_ID);
        
        // Add divider
        _menu.addMenuDivider();
        
        // Add all workspaces to submenu
        for (var i = 0; i < workspaces.length; i++) {
            _drawSubmenuForWorkspace(workspaces[i]);   
        }
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
        // Get workspaces
        var workspaces = PreferencesManager.getWorkspaces();
        
        // Draw menu
        _drawMenu(workspaces);
        
        _setPreferencesManagerListeners();
    }
    
    /*
     * Adds the workspace to the menubar
     */
    function addWorkspace(workspace){
        
        // Check if valid workspace
        if (workspace !== null && workspace.getName() !== "" && workspace.getName() !== null && workspace.getId() > 0) {
            _drawSubmenuForWorkspace(workspace);
        }
    }
    
    /*
     * Removes the submenu for given workspace
     */
    function removeWorkspace(workspace) {
        // Remove
        _menu.removeMenuItem(workspace.getId());
    }
    
    /*
     * Reload the menubar.
     * This will keep all the submenus synced between all windows
     */
    function reload() {
        
        var workspaces = PreferencesManager.getWorkspaces();
        
        // For all workspaces, register command
        for (var i = 0; i< workspaces.length; i++) {
            
            // If needs to be registered
            if (workspaces[i].getPaths().length > 0) {
                _registerCommandForWorkspace(workspaces[i]);
            }
        }
    }
    
    // API
    exports.init = init;
    exports.addWorkspace = addWorkspace;
    exports.removeWorkspace = removeWorkspace;
    exports.reload = reload;
});