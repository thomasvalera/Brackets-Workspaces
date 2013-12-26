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
 *  WorkspacesDialogManager
 *
 *  Defines a manager for the dialog.
 *  This manager handles the user input received from the DialogViewManager
 *  to reflect the in the extension.
 *  Listens to the PreferencesManager to stay up-to-date and refreshes the
 *  DialogViewManager if needed.
 *
 */
// ------------------------------------------------------------------------
/*global define, brackets, $ */
define(function (require, exports, module) {
    "use strict";
    
    // Load modules
    var PreferencesManager  = require("WorkspacesPreferencesManager"),
        DialogViewManager   = require("WorkspacesDialogViewManager"),
        ProjectManager      = brackets.getModule("project/ProjectManager"),
        FileSystem          = brackets.getModule("filesystem/FileSystem"),
        WorkspaceManager    = require("WorkspacesManager"),
        Workspace           = require("Workspace");
    
    var _tempWorkspace = new Workspace.Workspace();
   
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
 * TEMPORARY WORKSPACE FUNCTIONS
 */
// ------------------------------------------------------------------------

    /*
     * Adds the given path to the temp workspace
     */
    function _addPathToTemporaryWorkspace(path) {
        _tempWorkspace.addPath(path);    
    }
    
// ------------------------------------------------------------------------
/*
 * API FUNCTIONS
 */
// ------------------------------------------------------------------------   
    
    /*
     * Initializes the dialog manager
     */
    function init() {
        _setPreferencesManagerListeners();
    }
    
    /*
     * Opens the dialog
     */
    function open() {
        
        // Get current version
        var extensionPackage = WorkspaceManager.getPackage();
        
        // Open dialog
        DialogViewManager.open(extensionPackage);
    }   
    
    /*
     * Opens the folder browser
     */
    function openFolderBrowser() {
        // Get current project root
        var root = ProjectManager.getBaseUrl();
        
        FileSystem.showOpenDialog(false, true, "Choose a folder to open", root, null,
            function (files, directories) {
                
                // If directory selected
                if (directories.length > 0) {
                    // Get path
                    var path = directories[0];
                    
                    // Add path to view and temporary workspace
                    DialogViewManager.addPathPartial(path);
                    _addPathToTemporaryWorkspace(path);
                }
            });
    }
    
    /* 
     * Saves the temporary worksapce
     */
    function saveTemporaryWorkspace() {
        // Add workspace to preferences
        PreferencesManager.addWorkspace(_tempWorkspace);
        
        // Reset temp workspace
        _tempWorkspace = new Workspace.Workspace();
        
        // Get workspaces
        var workspaces = PreferencesManager.getWorkspaces();
        
        // Reload workspaces of dialog view manager
        DialogViewManager.reloadWorkspaces();
        
    }
    
    /*
     * Add the given info to the temporary workspace
     */
    function addTemporaryWorkspaceInfo(name, description) {
        
        _tempWorkspace.setName(name);
        _tempWorkspace.setDescription(description);
    }
    
 
    /*
     * Removes the workspace with the given id
     */
    function removeWorkspaceWithId(id) {
        PreferencesManager.removeWorkspaceWithId(id);
        
        // Reload workspaces of dialog view manager
        DialogViewManager.reloadWorkspaces();
    }
    
    /*
     * Returns the workspaces
     */
    function getWorkspaces() {
        return PreferencesManager.getWorkspaces();
    }
    
    /*
     * Returns the workspace with the given id
     */
    function getWorkspaceWithId(id) {
        
        // Load workspace in temp
        _tempWorkspace = PreferencesManager.getWorkspaceWithId(id);
        
        return _tempWorkspace;
    }
    
    /*
     * Remove url from the temporary workspace
     */
    function removeUrlFromTemporaryWorkspace(url) {
        _tempWorkspace.removePath(url);  
    }
    
    /*
     * Reloads dialog manager and view manager to keep it synced between all windows
     */
    function reload() {
        DialogViewManager.reloadWorkspaces();
    }
    
    
    // API
    exports.init= init;
    exports.open = open;
    exports.openFolderBrowser = openFolderBrowser;
    exports.saveTemporaryWorkspace = saveTemporaryWorkspace;
    exports.addTemporaryWorkspaceInfo = addTemporaryWorkspaceInfo;
    exports.removeWorkspaceWithId = removeWorkspaceWithId;
    exports.getWorkspaces = getWorkspaces;
    exports.getWorkspaceWithId = getWorkspaceWithId;
    exports.removeUrlFromTemporaryWorkspace = removeUrlFromTemporaryWorkspace;
    exports.reload = reload;
});