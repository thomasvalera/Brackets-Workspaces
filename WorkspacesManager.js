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
 *  WorkspacesManager
 *
 *  Defines a manager for the workspaces.
 *  This manager handles the extension's main logic and opens
 *  the workspaces' paths in different windows.
 *
 */
// ------------------------------------------------------------------------
/*global define, brackets, window, $, console */
define(function (require, exports, module) {
    'use strict';
    
    // Load modules
    var ProjectManager          = brackets.getModule("project/ProjectManager"),
        UrlParamsUtils          = brackets.getModule("utils/UrlParams"),
        UrlParams               = new UrlParamsUtils.UrlParams(),
        DialogManager           = require("WorkspacesDialogManager"),
        PreferencesManager      = require("WorkspacesPreferencesManager");
    
    // Package
    var FileSystem      = brackets.getModule("filesystem/FileSystem"),
        FileUtils       = brackets.getModule("file/FileUtils"),
        _packageFile    = FileSystem.getFileForPath(FileUtils.getNativeModuleDirectoryPath(module) + "/package.json"),
        _package        = null;
        
    // Global variables
    var URL_WORKSPACE_ID    = "com-workspaces-thomasvalera-url-workspaceid",
        URL_PATH_POSITION   = "com-workspaces-thomasvalera-url-pathposition";

// ------------------------------------------------------------------------
/*
 * WORKSPACE FUNCTIONS
 */
// ------------------------------------------------------------------------
    
    /*
     * Opens the path of the corresponding workspace in a separate window.
     */
    function _openWorkspaceAtPathPosition(workspace, pathPosition) {
        
        if (workspace) {
            // Get project path at position
            var path = workspace.getPathAtPosition(pathPosition);
            
            if (path) {
                // Get current project root
                var root = ProjectManager.getBaseUrl();
                
                // Open new window
                window.open(root + "?" +
                            URL_WORKSPACE_ID + "=" + workspace.getId() + "&" +
                            URL_PATH_POSITION + "=" + pathPosition);
            }
        }
    }
    
    /*
     * Loads the project in current window with the given path
     *
     */
    function _loadProjectWithPath(path) {
        // Get current project root
        var root = ProjectManager.getBaseUrl();

        ProjectManager.openProject(path);
    }
    
// ------------------------------------------------------------------------
/*
 * PACKAGE FUNCTIONS
 */
// ------------------------------------------------------------------------
        /*
     * Loads the package file
     */
    function _loadPackage() {
        // If file found
        if (_packageFile) {
            
            // Read references file
            FileUtils.readAsText(_packageFile).done(function (rawText, readTimestamp) {
                // Parse
                _package = $.parseJSON(rawText);
            }).fail(function (err) {
                console.error("Error reading saved preferences: " + err.name);
            });   
        } else {
            console.error("PreferencesFile not found!");   
        }
    }
    
// ------------------------------------------------------------------------
/*
 * API FUNCTIONS
 */
// ------------------------------------------------------------------------
    
    /*
     * Starts the opening chain of all paths of workspaces.
     * The first path will be loaded in the current window
     * to prevent from having to close the starting window
     * after the workspace has loaded.
     */
    function openWorkspace(workspace) {
        _openWorkspaceAtPathPosition(workspace, 0);
    }
    
    /*
     * Runs the workspace chain handler
     */
    function run() {
        // Parse URL
        UrlParams.parse();
        
        // Get workspace id and path positions
        var workspaceId = UrlParams.get(URL_WORKSPACE_ID);
        var pathPosition = UrlParams.get(URL_PATH_POSITION);
        
        // If variables found
        if (workspaceId && pathPosition) {
            // Get workspace
            var workspace = PreferencesManager.getWorkspaceWithId(workspaceId);
            
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
                    window.history.replaceState({}, 'Workspace ' + workspace.getName(), window.location.pathname);
                    
                    _openWorkspaceAtPathPosition(workspace, pathPosition);
                }
            }
        }
    }
    
    /*
     * Returns the version number if exists, 1.0 otherwise
     */
    function getPackage() {
        if (_package) {
            return _package;
        }
        console.error("No package found!!");
        return null;
    }
    
    /*
     * Initializes the workspace manager
     */
    function init() {
        _loadPackage();
    }
    
    // API
    exports.openWorkspace = openWorkspace;
    exports.run = run;
    exports.getPackage = getPackage;
    exports.init = init;
});