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
 *  This manager listens and handles the events fired by the
 *  WorkspacesDialogViewManager.
 *  The main task of this manager is to keep the data synced between the
 *  extension and the dialog view.
 *
 */
// ------------------------------------------------------------------------

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global Mustache, define, brackets, $*/

define(function (require, exports, module) {
    "use strict";
  
    // Load modules
    var WorkspacesDialogViewManager  = require('WorkspacesDialogViewManager'),
        WorkspacesGlobals        = require("WorkspacesGlobals"),
        WorkspacesManager            = require("WorkspacesManager"),
        WorkspacesWindowManager = require("WorkspacesWindowManager"),
        
        // Define variables
        _workspaces = [];
   
    /*
     * Handles the loadTemporaryWorkspace event
     */
    function _handleLoadTemporaryWorkspace(workspaceId) {
        // Set to null if undefined
        workspaceId = workspaceId === undefined ? null : workspaceId;
        
        WorkspacesManager.loadTemporaryWorkspaceWithId(workspaceId);
    }
    
    /*
     * Handles the viewPushed event
     */
    function _handleViewPushed(previousType) {
        
        if (previousType) {
        
            // If ADD view
            if (previousType === WorkspacesGlobals.VIEW_TYPE_ADD) {
                
                // Remove temp workspace
                WorkspacesManager.removeTemporaryWorkspace();
                
                // Get new add view
                var addView = WorkspacesDialogViewManager.getNewAddView();
                
                // Replace 
                WorkspacesDialogViewManager.replaceView(addView);
                
            } else if (previousType === WorkspacesGlobals.VIEW_TYPE_MODIFY) {
                // If MODIFY view
                
                // Get temporary workspace
                var tempWorkspace = WorkspacesManager.getTemporaryWorkspace();
                
                if (tempWorkspace) {
                    // Get corresponding workspace
                    var workspace = WorkspacesManager.getWorkspaceById(tempWorkspace.id);
                    
                    // Remove Temp
                    WorkspacesManager.removeTemporaryWorkspace();
                    
                    if (workspace) {
                        // Get new modify view
                        var modifyView = WorkspacesDialogViewManager.getNewModifyView(workspace);
                        
                        // Replace
                        WorkspacesDialogViewManager.replaceView(modifyView);
                    }
                }
            }
        }
    }
    
    /*
     * Handles submitWorkspace
     */
    function _handleSubmitWorkspace(name, description) {
        // Set vars in temp workspace
        var data = {
            'name' : name,
            'description' : description
        };
        
        // Set data of new workspace
        WorkspacesManager.setTemporaryWorkspaceData(data);
        
        // Save new workspace
        var workspace = WorkspacesManager.saveTemporaryWorkspace();
        
        // Add workspace to manage view
        WorkspacesDialogViewManager.addWorkspaceToManageView(workspace);
        
        // If paths, draw submenu,
        // Otherwise remove from submenu
        if (workspace.paths.length > 0) {
            WorkspacesWindowManager.drawSubmenuForWorkspace(workspace);
        } else {
            WorkspacesWindowManager.removeSubmenuForWorkspace(workspace);
        }
        
        // Get modify view for new workspace
        var modifyView = WorkspacesDialogViewManager.getNewModifyView(workspace);
        
        // If view does not exist
        // NOTE: The case where the view already exists 
        // is handled in the pushView event handler
        if (!WorkspacesDialogViewManager.modifyViewExistsWithWorkspaceId(workspace.id)) {
            // Add
            WorkspacesDialogViewManager.addView(modifyView);
        }
        
        // Push manage view
        WorkspacesDialogViewManager.pushView(WorkspacesDialogViewManager.getManageView());
    }
    
    /*
     * Handles the removeWorkspace event
     */
    function _handleRemoveWorkspace(workspaceId) {
        var removedWorkspace = WorkspacesManager.removeWorkspaceWithId(workspaceId);
        
        if (removedWorkspace) {
            // Remove workspace from dialog and submenu
            WorkspacesDialogViewManager.removeWorkspaceWithId(removedWorkspace.id);
            WorkspacesWindowManager.removeSubmenuForWorkspace(removedWorkspace);
        }
    }
    
    /*
     * Handles the addPath event
     */
    function _handleAddPath() {
        WorkspacesWindowManager.openBrowseFolder();
    }
    
    /*
     * Handles the removePath event
     */
    function _handleRemovePath(path) {
        WorkspacesManager.removePath(path);
    }
    
    /*
     * Sets listeners for dialog view manager
     */
    function _setDialogViewListeners() {
        $(WorkspacesDialogViewManager).on("viewPushed", function (event, previousType) {
            _handleViewPushed(previousType);
        });
        $(WorkspacesDialogViewManager).on("loadTemporaryWorkspace", function (event, workspaceId) {
            _handleLoadTemporaryWorkspace(workspaceId);
        });
        $(WorkspacesDialogViewManager).on("submitWorkspace", function (event, name, description) {_handleSubmitWorkspace(name, description); });
        $(WorkspacesDialogViewManager).on("addPath", function () { _handleAddPath(); });
        $(WorkspacesDialogViewManager).on("removeWorkspace", function (event, workspaceId) {_handleRemoveWorkspace(workspaceId); });
        $(WorkspacesDialogViewManager).on("removePath", function (event, path) {_handleRemovePath(path); });
    }
    
    /*
     * Adds the path to the current view
     */
    function addPathToCurrentView(path) {
        WorkspacesDialogViewManager.addPathToCurrentView(path);
    }
    
    /*
     * Opens the dialog
     */
    function open() {
        // Open dialog
        WorkspacesDialogViewManager.open(_workspaces);
    }
    
    /*
     * Sets listeners for WorkspaceManager
     */
    function _setWorkspaceManagerListeners() {
        $(WorkspacesManager).on("PreferencesLoaded", function () {
            _workspaces = WorkspacesManager.getWorkspaces();
        });
    }
    
    /*
     * Initializes the dialog manager
     */
    function init() {
        
        // Set listeners
        _setWorkspaceManagerListeners();
        _setDialogViewListeners();
        
        _workspaces = WorkspacesManager.getWorkspaces();
        console.log("WorkspaceDialogManager Initialized");
    }
    
    exports.init = init;
    exports.open = open;
    exports.addPathToCurrentView = addPathToCurrentView;
});