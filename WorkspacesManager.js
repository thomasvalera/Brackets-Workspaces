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
/*jslint nomen: true, vars: true */
define(function (require, exports, module) {
    'use strict';
    
    // Load modules
    var ProjectManager          = brackets.getModule("project/ProjectManager"),
        UrlParamsUtils          = brackets.getModule("utils/UrlParams"),
        UrlParams               = new UrlParamsUtils.UrlParams(),
        PreferencesManager      = require("WorkspacesPreferencesManager"),
        MainWindowManager       = require("libraries/MainWindow/MainWindowManager"),
        
        Dialogs                 = brackets.getModule("widgets/Dialogs"),
        DefaultDialogs          = brackets.getModule("widgets/DefaultDialogs"),
    
        // Package
        FileSystem      = brackets.getModule("filesystem/FileSystem"),
        FileUtils       = brackets.getModule("file/FileUtils"),
        _packageFile    = FileSystem.getFileForPath(FileUtils.getNativeModuleDirectoryPath(module) + "/package.json"),
        _package        = null,

        // Global variables
        URL_WORKSPACE_ID    = "com-workspaces-thomasvalera-url-workspaceid",
        URL_PATH_POSITION   = "com-workspaces-thomasvalera-url-pathposition";
   
    
// ------------------------------------------------------------------------
/*
 * WORKSPACE FUNCTIONS
 */
// ------------------------------------------------------------------------
    
    /*
     * Loads the project in current window with the given path
     *
     */
    function _loadProjectWithPath(path) {

        ProjectManager.openProject(path);
    }
    
    /*
     * Opens the path of the corresponding workspace in a separate window if exists,
     * do nothing otherwise
     */
    function _openWorkspaceAtPathPosition(workspace, pathPosition) {
        
        if (workspace) {
            // Get project path at position
            var path = workspace.getPathAtPosition(pathPosition);
            
            if (path) {
                // Get current project root
                var root = ProjectManager.getBaseUrl();
               
                // If first position
                if (pathPosition === 0) {
                    
                    Dialogs.showModalDialog(
                        DefaultDialogs.DIALOG_ID_INFO,
                        "Workspaces",
                        "Do you wish to load the first folder of this workspace in the current window?",
                        [{ className: Dialogs.DIALOG_BTN_CLASS_PRIMARY, id: Dialogs.DIALOG_BTN_OK, text: "YES" },
                            { className: Dialogs.DIALOG_BTN_CLASS_PRIMARY, id: Dialogs.DIALOG_BTN_CANCEL, text: "NO" }]
                    ).done(function (id) {
                       
                        // If load in current window
                        if (id === Dialogs.DIALOG_BTN_OK) {
                            // Load in current window
                            _loadProjectWithPath(path);
                            
                            // Increment for next position
                            pathPosition += 1;
                            
                            // Open next path if exists
                            _openWorkspaceAtPathPosition(workspace, pathPosition);
                        } else {
                            //  Open new window with incremented position
                            window.open(root + "?" +
                                URL_WORKSPACE_ID + "=" + workspace.getId() + "&" +
                                URL_PATH_POSITION + "=" + pathPosition + "&" +
                                MainWindowManager.URL_PRIMARY + "=false");
                        }
                    });
                } else {
                    //  Open new window with incremented position
                    window.open(root + "?" +
                        URL_WORKSPACE_ID + "=" + workspace.getId() + "&" +
                        URL_PATH_POSITION + "=" + pathPosition + "&" +
                        MainWindowManager.URL_PRIMARY + "=false");
                }
            }
        }
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
            FileUtils.readAsText(_packageFile).done(function (rawText) {
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
     * Runs the workspace chain
     */
    function run() {
        
        // Parse URL
        UrlParams.parse();
        
        // Get workspace id and path positions
        var workspaceId = UrlParams.get(URL_WORKSPACE_ID),
            pathPosition = UrlParams.get(URL_PATH_POSITION);
        
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
                    pathPosition = parseInt(pathPosition, 10);
                    pathPosition += 1;
                    
                    _openWorkspaceAtPathPosition(workspace, pathPosition);
                }
            }
        }
        
    }
    
    /*
     * Returns the package if exists, null otherwise
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