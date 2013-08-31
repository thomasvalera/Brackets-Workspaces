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
 *  Defines a manager for the workspaces extension.
 *  This manager handles the data of all workspaces and keeps it synced
 *  with the preferences.
 *  NOTE: Because Bracket's PreferencesManager is currently not synced 
 *      between all the opened windows, this extension uses custom 
 *      preferences to keep all the windows synced.
 *
 *  Events fired: 
 *      Format:
 *          event: arg1, arg2, ...
 *  
 *  PreferencesLoaded 
 */
// ------------------------------------------------------------------------

/*jslint vars: true, plusplus: true, nomen: true*/
/*global define, brackets, $ */

define(function (require, exports, module) {
    'use strict';
    
    // Load modules
    var NativeFileSystem        = brackets.getModule("file/NativeFileSystem").NativeFileSystem,
        FileUtils               = brackets.getModule("file/FileUtils"),
        Workspace               = require("Workspace"),
        
        // Define variables
        _preferencesFilePath    = FileUtils.getNativeModuleDirectoryPath(module) + "/preferences.json",
        _preferencesFile        = new NativeFileSystem.FileEntry(_preferencesFilePath),
        _preferences = [],
        
        _workspaces = [],
        _temporaryWorkspace = null,
        
        _isInitialized = false;
    
    /*
     * Triggers the given event
     */
    function _triggerEvent(event, data) {
        $(exports).triggerHandler(event, data);
    }
    
    /*
     * Saves the workspaces in preferences
     */
    function _saveWorkspaces() {
        
        if (_preferencesFile) {
            _preferencesFile.createWriter(function (fileWriter) {
                
                fileWriter.onerror = function (err) {
                    console.error("Error while writing preferences to disk!");
                };
                
                // Set and write preferences
                _preferences.workspaces = _workspaces;
                fileWriter.write(JSON.stringify(_preferences, null, '\t'));
            });
        }
    }
    
    /*
     * Sets the workspaces
     * WARN: This does not save the workspaces!
     */
    function _setWorkspaces(workspaces) {
        var i;
        
        // Reset workspaces array
        _workspaces = [];
        
        // Load workspaces
        for (i = 0; i < workspaces.length; i++) {
            // Get one workspace
            var data = workspaces[i];
            
            // Create new workspace
            var newWorkspace = new Workspace.Workspace();
            
            // Load data of workspace and add to array
            newWorkspace.loadData(data);
            _workspaces.push(newWorkspace);
        }
    }
    
    /*
     * Loads the preferences
     */
    function loadPreferences() {
        if (_preferencesFile) {
            // Read references file
            FileUtils.readAsText(_preferencesFile).done(function (rawText, readTimestamp) {
                // Parse
                _preferences = $.parseJSON(rawText);
                
                // Set workspaces
                _setWorkspaces(_preferences.workspaces);
                
                _triggerEvent("PreferencesLoaded");
                
                // If not initialized continue initialization
                if (!_isInitialized) {
                    _isInitialized = true;
                    _triggerEvent("initialized");
                }
            }).fail(function (err) {
                console.error("Error reading saved preferences: " + err.name);
            });
        }
    }
    
    /*
     * Returns the workspace with corresponding id if exists,
     * null otherwise
     */
    function getWorkspaceById(id) {
        var i;
        
        if (id) {
            for (i = 0; i < _workspaces.length; i++) {
                if (_workspaces[i].id === id) {
                    return _workspaces[i];
                }
            }
        }
        return null;
    }
    
    /*
     * Returns the temporary workspace
     */
    function getTemporaryWorkspace() {
        return _temporaryWorkspace;
    }
    
    /*
     * Loads the corresponding workspace in temporaryWorksapce if exists,
     * loads new workspace otherwise
     */
    function loadTemporaryWorkspaceWithId(workspaceId) {
        
        // Get workspace
        var workspace = getWorkspaceById(workspaceId);
        
        if (!workspace) {
            workspace = new Workspace.Workspace();
        }
        
        _temporaryWorkspace = new Workspace.Workspace();
        _temporaryWorkspace.loadData(workspace.getData());
    }
    
    /*
     * Returns worksapce position if exists,
     * -1 otherwise
     */
    function _getWorkspaceViewPositionById(id) {
        var i;
        
        if (id) {
            for (i = 0; i < _workspaces.length; i++) {
                if (_workspaces[i].id === id) {
                    return i;
                }
            }
        }
        return -1;
    }
    
    /*
     * Removes the temporary workspace
     */
    function removeTemporaryWorkspace() {
        _temporaryWorkspace = null;
    }
    
    /*
     * Adds the temporary workspace to the list of workspaces
     * and saves it to the preferences.
     * Returns the workspace
     */
    function saveTemporaryWorkspace() {
        
        // Get existing workspace
        var existingWorkspace = getWorkspaceById(_temporaryWorkspace.id);
        
        // If workspace already exists
        if (existingWorkspace) {
            // Get current position in array
            var position = _getWorkspaceViewPositionById(existingWorkspace.id);
            if (position > -1) {
                // Replace workspace
                _workspaces[position] = _temporaryWorkspace;
            }
        } else {
            // Add temporary to array
            _workspaces.push(_temporaryWorkspace);
        }
        
        var tempWorkspace = _temporaryWorkspace;
        
        // Save to preferences
        _saveWorkspaces();
        
        return tempWorkspace;
    }
    
    /*
     * Sets the given data in the temporary workspace
     */
    function setTemporaryWorkspaceData(data) {
        if (data) {
            _temporaryWorkspace.loadData(data);
        }
    }
    
    /*
     * Removes and returns the workspace with corresponding id if exists,
     * null otherwise
     */
    function removeWorkspaceWithId(id) {
        var i;
        if (id) {
            for (i = 0; i < _workspaces.length; i++) {
                if (_workspaces[i].id === id) {
                    var workspace = _workspaces[i];
                    _workspaces.splice(i, 1);
                    _saveWorkspaces();
                    return workspace;
                }
            }
        }
        return null;
    }
    
    /*
     * Removes the given path from the list of temporary workspace
     */
    function removePath(path) {
        var i;
        
        if (path) {
            // Search and remove
            for (i = 0; i < _temporaryWorkspace.paths.length; i++) {
                if (_temporaryWorkspace.paths[i] === path) {
                    // Remove
                    _temporaryWorkspace.paths.splice(i, 1);
                }
            }
        } else {
            console.error("Path: " + path + " is invalid");
        }
    }
    
    /*
     * Adds the given path to the teporary workspace
     */
    function addPathToTemporaryWorkspace(path) {
        if (path) {
            _temporaryWorkspace.paths.push(path);
        }
    }
    
    /*
     * Returns the workspaces array
     */
    function getWorkspaces() {
        return _workspaces;
    }
    
    /*
     * Initialize workspace manager
     */
    function init() {
        
        // Loads the preferences
        loadPreferences();
        
        console.log("WorkspacesManager Initialized");
    }
    
    // API
    exports.addPathToTemporaryWorkspace = addPathToTemporaryWorkspace;
    exports.getWorkspaces = getWorkspaces;
    exports.getTemporaryWorkspace = getTemporaryWorkspace;
    exports.getWorkspaceById = getWorkspaceById;
    exports.init = init;
    exports.loadPreferences = loadPreferences;
    exports.loadTemporaryWorkspaceWithId = loadTemporaryWorkspaceWithId;
    exports.removeTemporaryWorkspace = removeTemporaryWorkspace;
    exports.removeWorkspaceWithId = removeWorkspaceWithId;
    exports.removePath = removePath;
    exports.setTemporaryWorkspaceData = setTemporaryWorkspaceData;
    exports.saveTemporaryWorkspace = saveTemporaryWorkspace;
    
});