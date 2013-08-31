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
 *  WorkspacesWindowManager
 *
 *  Defines a manager for Bracket's windows.
 *  This manager handles the application's window and native menu bar.
 *  It opens separate windows for the workspaces and makes sure the right
 *  project is loaded into it.
 *  
 */
// ------------------------------------------------------------------------

/*jslint vars: true, plusplus: true, nomen: true*/
/*global define, brackets, window, $ */

define(function (require, exports, module) {
    'use strict';
    
    // Load modules
    var WorkspacesManager    = require('stable/WorkspacesManager'),
        CommandManager          = brackets.getModule("command/CommandManager"),
        Menus                   = brackets.getModule("command/Menus"),
        ProjectManager          = brackets.getModule("project/ProjectManager"),
        NativeFileSystem        = brackets.getModule("file/NativeFileSystem").NativeFileSystem,
        Strings                  = brackets.getModule("strings"),
        WorkspacesGlobals        = require("stable/WorkspacesGlobals"),
        WorkspacesDialogManager  = require('stable/WorkspacesDialogManager'),
        UrlParamsUtils          = brackets.getModule("utils/UrlParams"),
        UrlParams               = new UrlParamsUtils.UrlParams(),
        
        _menu = null;

    /*
     * Opens the manage dialog
     */
    function _openManageDialog() {
        WorkspacesDialogManager.open();
    }

    /*
     * Starts the opening chain of all paths of workspaces.
     * The first path will be loaded in the current window
     * to prevent from having to close the starting window
     * after the workspace has loaded.
     */
    function openWorkspaceAtPathPosition(workspaceId, pathPosition) {
        // Get workspace
        var workspace = WorkspacesManager.getWorkspaceById(workspaceId);
        
        if (workspace) {
            // Get project path at position
            var path = workspace.getPathAtPosition(pathPosition);
            
            if (path) {
                // Get current project root
                var root = ProjectManager.getBaseUrl();
                
                // Open new window
                window.open(root + "?" +
                            WorkspacesGlobals.URL_WORKSPACE_ID + "=" + workspaceId + "&" +
                            WorkspacesGlobals.URL_PATH_POSITION + "=" + pathPosition);
            }
        }
    }
    
    /*
     * Removes the submenu for given workspace
     */
    function removeSubmenuForWorkspace(workspace) {
        if (workspace) {
            _menu.removeMenuItem(workspace.id);
        }
    }
    
    /*
     * Draws the submenu for given workspace
     */
    function drawSubmenuForWorkspace(workspace) {
        // If workspace contains paths
        if (workspace.paths.length > 0) {
            // If command not already registered
            if (CommandManager.get(workspace.id) === undefined) {
                CommandManager.register(workspace.name, workspace.id, function () {openWorkspaceAtPathPosition(workspace.id, 0); });
            }
            // Add the menu to bar
            _menu.addMenuItem(workspace.id);
        }
    }
    
    /*
     *  Draws and register the menu and commands
     */
    function _drawMenu() {
                
        // Get workspaces
        var workspaces = WorkspacesManager.getWorkspaces(),
            i;
        
        // Register menu
        _menu = Menus.addMenu(WorkspacesGlobals.MENU_NAME, WorkspacesGlobals.MENU_ID, Menus.AFTER, Menus.AppMenuBar.VIEW_MENU);
        
        // Register and add submenu
        CommandManager.register(WorkspacesGlobals.SUBMENU_MANAGE_NAME, WorkspacesGlobals.SUBMENU_MANAGE_ID, _openManageDialog);
        _menu.addMenuItem(WorkspacesGlobals.SUBMENU_MANAGE_ID);
        
        _menu.addMenuDivider();
        
        // Add all workspaces having at least one path to submenu
        for (i = 0; i < workspaces.length; i++) {
            drawSubmenuForWorkspace(workspaces[i]);
        }
    }
    
    /*
     * Opens a native browse folder window
     */
    function openBrowseFolder() {
        // Get current project root
        var root = ProjectManager.getBaseUrl();
        
        NativeFileSystem.showOpenDialog(false, true, Strings.CHOOSE_FOLDER, root, null,
            function (files) {
                if (files.length > 0) {
                    var path = files[0];
                    // Add path to view
                    WorkspacesDialogManager.addPathToCurrentView(path);
                    WorkspacesManager.addPathToTemporaryWorkspace(path);
                }
            });
    }
    
        /*
     * Loads the project with the given path
     *
     */
    function _loadProjectWithPath(path) {
        // Get current project root
        var root = ProjectManager.getBaseUrl();

        ProjectManager.openProject(path);
    }
    
    /*
     * Runs the workspace chain handler
     */
    function run() {
        // Parse URL
        UrlParams.parse();
        
        // Get workspace id and path positions
        var workspaceId = UrlParams.get(WorkspacesGlobals.URL_WORKSPACE_ID);
        var pathPosition = UrlParams.get(WorkspacesGlobals.URL_PATH_POSITION);
        
        // If variables found
        if (workspaceId && pathPosition) {
            // Get workspace
            var workspace = WorkspacesManager.getWorkspaceById(workspaceId);
            
            if (workspace) {
                // Get project path at position
                var path = workspace.getPathAtPosition(pathPosition);
                
                if (path) {
                    // Load project
                    _loadProjectWithPath(path);
                    
                    // Increment position for next path
                    pathPosition++;
                    
                    // Remove parameters from URL
                    // This will prevent the reopening of following workspace windows on reload
                    window.history.replaceState({}, 'Workspace ' + workspace.name, window.location.pathname);
                    
                    openWorkspaceAtPathPosition(workspaceId, pathPosition);
                }
            }
        }
    }
    
    /*
     * Sets listeners for window
     */
    function _setWindowListeners() {
        $(window).focus(function () {WorkspacesManager.loadPreferences(); });
    }
    
    /*
     * Initializes the Window Manager
     */
    function init() {
        
        // Draw menu
        _drawMenu();
        // Set listeners
        _setWindowListeners();
        console.log("WorkspacesWindowManager Initialized");
    }
    
    exports.init = init;
    exports.run = run;
    exports.openBrowseFolder = openBrowseFolder;
    exports.drawSubmenuForWorkspace = drawSubmenuForWorkspace;
    exports.removeSubmenuForWorkspace = removeSubmenuForWorkspace;
});