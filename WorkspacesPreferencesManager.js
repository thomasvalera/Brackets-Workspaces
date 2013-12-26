//// ------------------------------------------------------------------------
///*
// * Copyright (c) 2013 Thomas Valera. All rights reserved.
// *  
// * Permission is hereby granted, free of charge, to any person obtaining a
// * copy of this software and associated documentation files (the "Software"), 
// * to deal in the Software without restriction, including without limitation 
// * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
// * and/or sell copies of the Software, and to permit persons to whom the 
// * Software is furnished to do so, subject to the following conditions:
// *  
// * The above copyright notice and this permission notice shall be included in
// * all copies or substantial portions of the Software.
// *  
// * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
// * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
// * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
// * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
// * DEALINGS IN THE SOFTWARE.
// *
// */
//// ------------------------------------------------------------------------
//// ------------------------------------------------------------------------
///*
// *  WorkspacesPreferencesManager
// *
// *  Defines the preferences manager for the workspaces extension.
// *  This manager handles the data of all workspaces and keeps it synced
// *  with the preferences.
// *  NOTE: Because Bracket's PreferencesManager is currently not synced 
// *      between all the opened windows, this extension uses a custom 
// *      preferences file to keep all up-to-date.
// *
// *  Events fired: 
// *      Format:
// *          event: arg1, arg2, ...
// *  
// *  PreferencesLoaded
// *  Initialized
// */
//// ------------------------------------------------------------------------
/*global $, define, brackets, window, console */
define(function (require, exports, module) {
    'use strict';
    
    // Load modules
    var FileSystem          = brackets.getModule("filesystem/FileSystem"),
        FileUtils           = brackets.getModule("file/FileUtils"),
        Workspace           = require("Workspace"),
        MenubarManager      = require("WorkspacesMenubarManager"),
        
        // Define variables
        _preferencesFile    = FileSystem.getFileForPath(FileUtils.getNativeModuleDirectoryPath(module) + "/preferences.json"),
        _preferences        = [],
        _initialized        = false,
        
        _timestamp          = -1,
        _workspaces         = [];

    
    /*
     * Triggers the given event
     */
    function _triggerEvent(event, data) {
        $(exports).triggerHandler(event, data);
    }
    
    /*
     * Returns the workspaces array
     */
    function getWorkspaces() {
        return _workspaces;    
    }
    
    /*
     * Returns the corresponding workspaces if exists,
     * null otherwise
     */
    function _getWorkspaceWithId(id) {
        
        for( var i = 0; i < _workspaces.length; i++) {
            if ( _workspaces[i].getId() == id ) {
                return _workspaces[i];
            }
        }
        return null;
    }
    
    /*
     * Listeners for the window.
     * Loads the preferences when focused.
     * This will keep all preferences synced between all windows
     */
    function _setWindowListeners() {
        $(window).focus(function(){
            _loadPreferences();
        });    
    }

// ------------------------------------------------------------------------
/*
 * PREFERENCE FILE FUNCTIONS
 */
// ------------------------------------------------------------------------
    
    /*
     * Sets the workspaces
     *
     * WARNING: This dones NOT save the workspaces
     */
    function _setWorkspaces(workspaces) {
        
        // Reset workspaces array
        _workspaces = [];
        
        // Set workspaces
        for (var i = 0; i < workspaces.length; i++) {
            
            // Get new workspace
            var tempData = workspaces[i];
            
            // Initialize Workspace object
            var tempWorkspace = new Workspace.Workspace();
            
            // Load saved data into Workspace
            tempWorkspace.loadData(tempData);
            
            // Add to current workspaces array
            _workspaces.push(tempWorkspace);
        }
    }
    
    /*
     * Loads the preferences
     */
    function _loadPreferences() {
        
        // If file found
        if (_preferencesFile) {
            
            // Read references file
            FileUtils.readAsText(_preferencesFile).done(function (rawText, readTimestamp) {
                // Parse
                _preferences = $.parseJSON(rawText);
                
                // If newer timestamp
                if (_timestamp < _preferences.timestamp) {
                    
                    // Set workspaces and timestamp
                    _setWorkspaces(_preferences.workspaces);
                    _timestamp = _preferences.timestamp;
                    
                    if (!_initialized) {
                        _initialized = true;
                        _triggerEvent("Initialized");
                    } else {
                        _triggerEvent("PreferencesLoaded");
                    }
                }
            }).fail(function (err) {
                console.error("Error reading saved preferences: " + err.name);
            });   
        } else {
            console.error("PreferencesFile not found!");   
        }
    }
    
        /*
     * Saves the workspaces in preferences
     */
    function _saveWorkspaces() {
        
        if (_preferencesFile) {
            
            // Add workspaces to preference variable
            _preferences.timestamp = new Date().getTime().toString();
            _preferences.workspaces = _workspaces;
            
            // Stringify preferences
            var stringified = JSON.stringify(_preferences, null, '\t');
            
            // Write preferences to file
            _preferencesFile.write(stringified, "UTF-8", function(error) {
                if (error) {
                    console.error("Error while writing preferences to file: " + error);   
                }
            });

        }
    }

// ------------------------------------------------------------------------
/*
 * PREFERENCE ARRAY FUNCTIONS
 */
// ------------------------------------------------------------------------
    /*
     * Adds the given workspace to the preferences
     */
    function addWorkspace(workspace) {
        
        // Get workspace if it already exists
        var tempWorkspace = _getWorkspaceWithId(workspace.getId());
        
        // If workspace already exists
        if (tempWorkspace !== null) {
            // If temp had path but new one doesn't
            if (tempWorkspace.getPaths().length > 0 && workspace.getPaths().length === 0) {
                MenubarManager.removeWorkspace(tempWorkspace);
            }
            
            // Get index in array
            var index = _workspaces.indexOf(tempWorkspace);
            
            // Replace
            _workspaces[index] = workspace;
        } else {
            
            // Add to array
            _workspaces.push(workspace);
        }
        
        // Save array
        _saveWorkspaces();
        
        // Add to menubar
        MenubarManager.addWorkspace(workspace);
        
    }
    
    /*
     * Removes the corresponding workspace from preferences
     */
    function removeWorkspaceWithId(id) {
        
        // Get workspace position
        var workspace = _getWorkspaceWithId(id);
        var position = _workspaces.indexOf(workspace);
        
        // If workspace exists
        if (position > -1) {
            // If workspace has paths
            if (workspace.getPaths().length > 0) {
                // Remove from menubar
                MenubarManager.removeWorkspace(_workspaces[position]);
            }
            
            // Remove from array
            _workspaces.splice(position, 1);
            
            // Save array to file
            _saveWorkspaces();
        } else {
            console.error("Could not remove workspace with negative position");
        }
    }
    
    /*
     * Returns a clone of the corresponding workspaces if exists,
     * null otherwise
     */
    function getWorkspaceWithId(id) {
        
        // Get workspace
        var workspace = _getWorkspaceWithId(id);
        
        // If exists
        if (workspace !== null) {
            // Return clone
            return $.extend(true, {}, workspace);
        }
        return null;
    }
    
    /*
     * Initializes the manager
     */
    function init() {
        // Load the preferences
        _loadPreferences();
        _setWindowListeners();
    }
    
    // API
    exports.init = init;
    exports.getWorkspaces = getWorkspaces;
    exports.addWorkspace = addWorkspace;
    exports.removeWorkspaceWithId = removeWorkspaceWithId;
    exports.getWorkspaceWithId = getWorkspaceWithId;
});