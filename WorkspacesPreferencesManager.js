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
 *  WorkspacesPreferencesManager
 *
 *  Defines the preferences manager for the workspaces extension.
 *  This manager handles the data of all workspaces and keeps it synced
 *  with the preferences.
 *  NOTE: Because Bracket's PreferencesManager is currently not synced 
 *      between all the opened windows, this extension uses a custom 
 *      preferences file to keep all windows up-to-date.
 *
 *  Events fired:
 *  PreferencesLoaded
 *  Initialized
 *
 */
// ------------------------------------------------------------------------
/*global $, define, brackets, window, appshell, console */
/*jslint nomen: true, vars: true */
define(function (require, exports, module) {
    'use strict';
   
    // Load modules
    var FileSystem          = brackets.getModule("filesystem/FileSystem"),
        Workspace           = require("Workspace"),
        
        // Directory and File
        _baseDirectoryPath          = brackets.app.getApplicationSupportDirectory(),
        _preferencesDirectoryPath   = _baseDirectoryPath + "/extensions/extensionsData/brackets-workspaces",
        _preferencesDirectory       = FileSystem.getDirectoryForPath(_preferencesDirectoryPath),
        _preferencesFilePath        = _preferencesDirectoryPath + "/preferences.json",
        _preferencesFile            = FileSystem.getFileForPath(_preferencesFilePath),
        
        // Preferences
        _preferences        = {},       // Preferences object
        _workspaces         = [],       // Workspaces array
        _initialized        = false,    // True if manager initialized, false otherwise
        _lastTimestamp      = -1,       // Timestamp of last preferences edit
        _menuToBeUpdated    = false;    // True if menu needs to be updated, false otherwise
    
// ------------------------------------------------------------------------
/*
 * HELPER FUNCTIONS
 */
// ------------------------------------------------------------------------
    /*
     * Triggers the given event
     */
    function _triggerEvent(event, data) {
        $(exports).triggerHandler(event, data);
    }

    /*
     * Returns a stringified preferences
     */
    function _getStringifiedPreferences() {
        
        // Add workspaces to preference variable
        _preferences.timestamp = new Date().getTime().toString();
        _preferences.workspaces = _workspaces;
        
        // Stringify preferences
        return JSON.stringify(_preferences, null, '\t');
    }
    
// ------------------------------------------------------------------------
/*
 * WORKSPACES FUNCTIONS
 */
// ------------------------------------------------------------------------
    /*
     * Sets the workspaces
     * WARNING: This dones NOT save the workspaces
     */
    function _setWorkspaces(workspaces) {
        
        var i;
        
        // Reset workspaces array
        _workspaces = [];
        
        // Set workspaces
        for (i = 0; i < workspaces.length; i += 1) {
            
            // Get new workspace
            var tempData = workspaces[i],
            
            // Initialize Workspace object
                tempWorkspace = new Workspace.Workspace();
            
            // Load saved data into Workspace
            tempWorkspace.loadData(tempData);
            
            // Add to current workspaces array
            _workspaces.push(tempWorkspace);
        }
    }
    
    /*
     * Returns the corresponding workspaces if exists,
     * null otherwise
     */
    function _getWorkspaceWithId(id) {
        
        var i;
        
        for (i = 0; i < _workspaces.length; i += 1) {
            if (_workspaces[i].getId() === id) {
                return _workspaces[i];
            }
        }
        return null;
    }
    
// ------------------------------------------------------------------------
/*
 * PREFERENCES FUNCTIONS
 */
// ------------------------------------------------------------------------
    
    /*
     * Writes the preferences to file.
     * @return {$.Promise} a promise that is resolved when file has been written.
     *  Rejected if error while writing.
     */
    function _writePreferences() {
        var deferred = $.Deferred(),
        
            // Stringify preferences
            stringified = _getStringifiedPreferences();
        
        // Write preferences to file
        _preferencesFile.write(stringified, "UTF-8", function (err) {
            
            if (err) {
                console.error("Error while writing preferences file: " + err);
                return deferred.reject(err);
            }
            
            return deferred.resolve();
        });
        
        return deferred.promise();
    }
    
    /*
     * Reads the preferences file.
     * @return {$.Promise} a promise that is resolved when file has been read, contains preferences object.
     *  Rejected if error while reading.
     */
    function _readPreferences() {
        var deferred = $.Deferred();
        
        // Read preferences file
        _preferencesFile.read({}, function (err, data) {
            
            if (err) {
                console.error("Error while reading file: " + err);
                return deferred.reject(err);
            }
            
            // If data is not empty
            if (data !== "") {
                return deferred.resolve($.parseJSON(data));
            }
            
            // If data is empty, reject with error
            console.error("File does not contain preferences data");
            return deferred.reject("File does not contain preferences data");
        });
        
        return deferred.promise();
    }
    
    /*
     * Ensures the file.
     * @return {$.Promise} a promise that is resolved when file has been ensured.
     *  Rejected if error while ensuring.
     */
    function _ensureFile() {
        var deferred = $.Deferred();
        
        // Check that preferences file exists, create if not
        _preferencesFile.exists(function (err, exists) {
            
            if (err) {
                console.error("Error while ensuring file: " + err);
                return deferred.reject(err);
            }
            
            if (!exists) {
                // Create preferences file
                _writePreferences().done(function () {
                    return deferred.resolve();
                });
            } else {
                return deferred.resolve();
            }
        });
        
        return deferred.promise();
    }
    
    /*
     * Ensures the directory.
     * @return {$.Promise} a promise that is resolved when folder has been ensured.
     *  Rejected if error while ensuring.
     */
    function _ensureDirectory() {
        var deferred = $.Deferred();
        
        // Check that directory exists, create if not
        _preferencesDirectory.exists(function (err, exists) {
            
            if (err) {
                console.error("Error while ensuring directory: " + err);
                return deferred.reject(err);
            }
            
            // If directory does not exist
            if (!exists) {
                // Create
                _preferencesDirectory.create();
            }
            return deferred.resolve();
        });
        
        return deferred.promise();
    }
    
    /*
     * Ensures the directory and file paths exist
     * @return {$.Promise} a promise that is resolved when directory and file has been ensured.
     *  Rejected if error while ensuring.
     */
    function _ensureDirectoryAndFile() {
        var deferred = $.Deferred();
        
        // Ensure directory first
        _ensureDirectory().done(function () {
            // If directory ensured, ensure file
            _ensureFile().done(function () {
                return deferred.resolve();
            }).fail(function (err) {
                return deferred.reject(err);
            });
        }).fail(function (err) {
            return deferred.reject(err);
        });
        
        return deferred.promise();
    }
    
    /*
     * Loads the preferences
     */
    function _loadPreferences() {
        
        // Read file
        _readPreferences().done(function (preferencesObj) {
            
            // If file changed since last read
            if (_lastTimestamp < preferencesObj.timestamp) {
                
                // Set variables
                _preferences = preferencesObj;
                _setWorkspaces(preferencesObj.workspaces);
                _lastTimestamp = preferencesObj.timestamp;

                // Trigger events
                if (!_initialized) {
                    _initialized = true;
                    _triggerEvent("Initialized");
                } else {
                    // menu always needs to be updated on Windows
                    if (appshell.platform === "win") {
                        _menuToBeUpdated = true;
                    }
                    
                    _triggerEvent("PreferencesLoaded", {"updateMenu": _menuToBeUpdated});
                    
                    _menuToBeUpdated = false;
                }
            }
        }).fail(function (err) {
            console.error("Error while reading file: " + err);
        });
                
    }
    
// ------------------------------------------------------------------------
/*
 * LISTENER FUNCTIONS
 */
// ------------------------------------------------------------------------
    
    /*
     * Listeners for the window.
     * Loads the preferences when focused.
     * This will keep all preferences synced between all windows
     */
    function _setWindowListeners() {
        $(window).focus(function () {
            _loadPreferences();
        });
    }
    
// ------------------------------------------------------------------------
/*
 * API FUNCTIONS
 */
// ------------------------------------------------------------------------
    
    /*
     * Initializes the manager
     */
    function init() {
        
        // Ensure directory and file,
        // Load preferences when done
        _ensureDirectoryAndFile().done(function () {
            _loadPreferences();
            _setWindowListeners();
        }).fail(function (err) {
            console.error("Error while ensuring directory and file: " + err);
        });
    }
    
    /*
     * Returns the workspaces array
     */
    function getWorkspaces() {
        return _workspaces;
    }
    
    /*
     * Adds the given workspace to the preferences
     */
    function addWorkspace(workspace) {
        
        // Get workspace if it already exists
        var tempWorkspace = _getWorkspaceWithId(workspace.getId());
        
        // If workspace already exists
        if (tempWorkspace !== null) {
            
            // Get index in array
            var index = _workspaces.indexOf(tempWorkspace);
            
            // Replace
            _workspaces[index] = workspace;
            
            // If menu needs to be updated
            if ((tempWorkspace.getPaths().length === 0 && workspace.getPaths().length > 0) ||
                    (tempWorkspace.getPaths().length > 0 && workspace.getPaths().length === 0)) {
                _menuToBeUpdated = true;
            }
        } else {
            
            // Add to array
            _workspaces.push(workspace);
            
            // If menu needs to be updated
            if (workspace.getPaths().length > 0) {
                _menuToBeUpdated = true;
            }
        }
        
        // Save array
        _writePreferences().done(function () {
            // When done, reload
            _loadPreferences();
        });
    }
    
    /*
     * Returns the workspace if exists,
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
     * Removes the corresponding workspace from preferences
     */
    function removeWorkspaceWithId(id) {
        
        // Get workspace position
        var workspace = _getWorkspaceWithId(id),
            position = _workspaces.indexOf(workspace);
        
        // If workspace exists
        if (position > -1) {
            // Remove from array
            _workspaces.splice(position, 1);
            
            // If menu needs to be updated
            if (workspace.getPaths().length > 0) {
                _menuToBeUpdated = true;
            }
            
            // Save array to file
            _writePreferences().done(function () {
                // When done, reload
                _loadPreferences();
            });
        } else {
            console.error("Could not remove workspace with negative position");
        }
    }
    // API
    exports.init = init;
    exports.getWorkspaces = getWorkspaces;
    exports.addWorkspace = addWorkspace;
    exports.getWorkspaceWithId = getWorkspaceWithId;
    exports.removeWorkspaceWithId = removeWorkspaceWithId;
});