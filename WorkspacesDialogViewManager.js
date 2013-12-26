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
 *  WorkspacesDialogViewManager
 *
 *  Defines a manager for the dialog view.
 *  This manager handles the popup's viewing logic and handles the user 
 *  input.
 *  This manager depends on the DialogManager to reflect the changes
 *  made by the user.
 *  
 *  
 */
// ------------------------------------------------------------------------
/*jslint nomen: true, vars: true */
/*globals define, Mustache, $, brackets */
define(function (require, exports, module) {
    "use strict";
   
    // Load modules
    var Dialogs                     = brackets.getModule("widgets/Dialogs"),
        DialogManager               = require('WorkspacesDialogManager'),
        
        // Load unrendered views
        _unrenderedIndexView        = require("text!htmlContent/index.html"),
        _unrenderedManageView       = require("text!htmlContent/manage.html"),
        _unrenderedViewAdd          = require("text!htmlContent/add.html"),
        _unrenderedViewModify       = require("text!htmlContent/modify.html"),
        
        // Load partial views
        _unrenderedWorkspacePartial = require("text!htmlContent/partials/workspace.html"),
        _unrenderedPathPartial      = require("text!htmlContent/partials/path.html"),
        
        // Rendered views
        _renderedIndexView  = null,
        _renderedManageView = null,
        _renderedAddView    = null,
        _renderedModifyView = null,
        
        // Define variables
        _dialog             = null,
        _currentView        = null;

// ------------------------------------------------------------------------
/*
 * HELPER FUNCTIONS
 */
// ------------------------------------------------------------------------

    /*
     * Returns the type of the view if exists,
     * null otherwise
     */
    function _getTypeForView(view) {
        var type = $(view).attr("data-type");
        
        return type === undefined ? null : type;
    }
    
    /*
     * Returns true if all required fields are filled, false otherwise.
     * Highlights requireed fields that are empty.
     */
    function _checkFields() {
        
        // Get name field
        var nameField = $(_currentView).find("#name").first();
        
        var descriptionField = $(_currentView).find("#name").first();
        
        var filled = (nameField.val() !== "" && nameField.val() !== undefined);
        
        nameField.removeClass("wksp-error");
        
        if (!filled) {
            nameField.addClass("wksp-error");
        }
        
        return filled;
    }

// ------------------------------------------------------------------------
/*
 * NAVBAR FUNCTIONS
 */
// ------------------------------------------------------------------------
    
    /*
     * Activates the corresponding tab
     */
    function _activateTab(type) {
        
        // Remove current active tab
        _dialog.getElement().find("#addTab").removeClass("active");
        _dialog.getElement().find("#manageTab").removeClass("active");
        _dialog.getElement().find("#modifyTab").removeClass("active");
        
        
        // Activate new tab
        if (type == "manage") {
            _dialog.getElement().find("#manageTab").addClass("active");
        } else if ( type == "add") {
            _dialog.getElement().find("#addTab").addClass("active");
        } else if ( type == "modify" ) {
            _dialog.getElement().find("#modifyTab").addClass("active");
        }
    }

    
// ------------------------------------------------------------------------
/*
 * RENDER FUNCTIONS
 */
// ------------------------------------------------------------------------

   /*
    * Returns a rendered index view
    */
    function _renderIndexView(extensionPackage) {
        // Render index view
        var view = $(Mustache.render(_unrenderedIndexView, {"extensionPackage" : extensionPackage}));
        return _setListenersForView(view);
    }
    
    /*
     * Returns a rendered add view
     */
    function _renderAddView() {
        var view = $(Mustache.render(_unrenderedViewAdd));
        return view;
    }
    
    /*
     * Returns a rendered modified view
     */
    function _renderModifyView() {
        var view = $(Mustache.render(_unrenderedViewModify));
        return view;
    }
    
    /*
     * Returns a rendered manage view for all the given workspaces
     */
    function _renderManageView() {
        
        // Render manage view
        var view = $(Mustache.render(_unrenderedManageView));
        return view;
    } 
    
    /*
     * Returns a rendered path partial for the given path
     */
    function _renderPathPartial(path) {
        var view = Mustache.render(_unrenderedPathPartial, {'path': {'url' : path}});
        return view;
    }
    
    /*
     * Returns a rendered list item partial for the given workspace
     */
    function _renderWorkspacePartial(workspace) {
        return Mustache.render(_unrenderedWorkspacePartial, {'workspace' : workspace});
    }
    
// ------------------------------------------------------------------------
/*
 * DISPLAY FUNCTIONS
 */
// ------------------------------------------------------------------------
    
    /*
     * Displays the given view
     */
    function _displayView(view) {
        _currentView = view;
        _activateTab(_getTypeForView(view));
        _dialog.getElement().find(".wksp-content").html(view);
    }
    
    /*
     * Displays the add view
     */
    function _displayAddView() {
        var view = _setListenersForView(_renderedAddView);
        
        // Reset view
        view.find("#name").first().val("").removeClass("wksp-error");
        view.find("#description").first().val("");
        view.find("#message-no-path").first().show();
        
        $(view).find("[data-type='path']").each(function(position, element){
            element.remove();
        });
        
        // Display view
        _displayView(view);
    }
    
    /*
     * Displays the modify view
     */
    function _displayModifyView(workspaceId) {
        var view = _setListenersForView(_renderedModifyView);
        
        var workspace = DialogManager.getWorkspaceWithId(workspaceId);
        
        // Reset view
        view.find("#name").first().val(workspace.getName());
        view.find("#description").first().val(workspace.getDescription());
        view.find("#message-no-path").first().show();
        $(view).find("[data-type='path']").each(function(position, element){
            element.remove();
        });
        
        // Display view
        _displayView(view);
        
        var paths = workspace.getPaths();
        // Add partials to view
        for(var i = 0; i < paths.length; i++) {
            _displayPartialForPath(paths[i]);
        }
    }
    
    /*
     * Displays the manage view
     */
    function _displayManageView() {
        var view = _setListenersForView(_renderedManageView);
        _displayView(view);
        
        // Load all workspaces
        var workspaces = DialogManager.getWorkspaces();
        
        // Add partials to view
        for(var i = 0; i < workspaces.length; i++) {
            _displayPartialForWorkspace(workspaces[i]);
        }
    }
    
    /*
     * Displays a path partial for the given path
     */
    function _displayPartialForPath(path) {
        // Render partial
        var partial = $(_renderPathPartial(path));
        
        // If view currently has no path, hide message
        if (_currentView.find("[data-type=path]").length === 0) {
            _currentView.find("#message-no-path").first().hide();
        }
        
        // Set listener
        _setListenersForPartial(partial);
        
        // Add to view
        _currentView.find("#message-add-note").first().after(partial);
        
    }
    
    /*
     * Displays a workspace partial for the given workspace
     */
    function _displayPartialForWorkspace(workspace) {
        
        // Render partial
        var partial = $(_renderWorkspacePartial(workspace));
        
        // If view currently has no worksapces, hide message and prepend partial
        if (_currentView.find("[data-type=workspace]").length === 0) {
            _currentView.find("#message-workspace-note").first().hide();
            _currentView.find("#message-workspace-note").first().before(partial);
        
        } else {
            
            // If workspace partial already exists
            if (_currentView.find("#"+workspace.getId()).length > 0) {
                // Replace
                _currentView.find("#" + workspace.getId()).replaceWith(partial);
            } else {
                // Prepend new partial to first workspace partial   
                _currentView.find("[data-type=workspace]").first().before(partial);
            }
        }
        // Set listener
        _setListenersForPartial(partial);
    }
    
// ------------------------------------------------------------------------
/*
 * LISTENER FUNCTIONS
 */
// ------------------------------------------------------------------------
    
     /*
     * Sets the listeners for the view
     */
    function _setListenersForView(view) {
       
        // Get type
        var type = _getTypeForView(view);
        
        switch(type) {
            case "index":
                // Set listeners for tab
                view.find("#manageTab").click(function (e) {
                    // If manage view not currently displayed
                    if (_getTypeForView(_currentView) != "manage") {
                        _displayManageView();
                    }
                });
                
                view.find("#addTab").click(function (e) {
                    // If manage view not currently displayed
                    if (_getTypeForView(_currentView) != "add") {
                        _displayAddView();
                    }
                });
                break;
            case "manage":
                // Close button listener
                view.find("#closeButton").click(function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    _dialog.close();
                });
                break;
            case "add":
                // Cancel button listener
                view.find("#cancelButton").click(function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    _displayManageView();
                });
                // Add folder button listener
                view.find("#addFolderButton").click(function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    DialogManager.openFolderBrowser();
                });
                // Save button listener
                view.find("#saveButton").click(function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    
                    // Check if all required fields are set
                    if(_checkFields()) {
                        
                        // Get name and description
                        var name = $(_currentView).find("#name").first().val();
                        var description = $(_currentView).find("#description").first().val();
                        
                        // Add name and description
                        DialogManager.addTemporaryWorkspaceInfo(name, description);
                        
                        // Save
                        DialogManager.saveTemporaryWorkspace();
                        // Go to manageview
                        _displayManageView();
                    }
                });
                break;
            case "modify":
                // Cancel button listener
                view.find("#cancelButton").click(function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    _displayManageView();
                });
                // Add folder button listener
                view.find("#addFolderButton").click(function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    DialogManager.openFolderBrowser();
                });
                // Save button listener
                view.find("#saveButton").click(function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    
                    // Check if all required fields are set
                    if(_checkFields()) {
                        
                        // Get name and description
                        var name = $(_currentView).find("#name").first().val();
                        var description = $(_currentView).find("#description").first().val();
                        
                        // Add name and description
                        DialogManager.addTemporaryWorkspaceInfo(name, description);
                        
                        // Save
                        DialogManager.saveTemporaryWorkspace();
                        // Go to manageview
                        _displayManageView();
                    }
                });
                break;
        }
        return view;
    }   
    
    /*
     * Sets the listeners for the partial view
     */
    function _setListenersForPartial(view) {
        
        // Get type
        var type = _getTypeForView(view);
        
        switch(type) {
            case "path":
                // Get remove button
                var removeButton = $(view).find(".button-remove").first();
                
                // Set listener
                $(removeButton).click(function(){
                    // Show confirmation
                    $(this).html("Confirm?");
                    
                    // Rebind click
                    $(this).unbind("click");
                    $(this).click(function(){
                        // Remove corresponding row
                        $(view).remove();
                        
                        // Get url
                        var url = view.find(".row-path").first().html().trim();
                        
                        DialogManager.removeUrlFromTemporaryWorkspace(url);
                    });
                });
                break;
            case "workspace":
                
                // Get remove button
                removeButton = $(view).find(".button-remove").first();
                
                // Set listener for remove button
                $(removeButton).click(function(){
                    // Show confirmation
                    $(this).html("Confirm?");
                    
                    // Rebind click
                    $(this).unbind("click");
                    $(this).click(function(){
                        // Remove corresponding row
                        $(view).remove();
                        
                        // Get id
                        var id = view.attr("id");
                        
                        DialogManager.removeWorkspaceWithId(id);
                    });
                });
                
                // Get modify button
                var modifyButton = $(view).find(".button-modify").first();
                
                // Set listener for remove button
                $(modifyButton).click(function(){
                    // Get id
                    var id = view.attr("id");
                    
                    // Display modify view
                    _displayModifyView(id);
                });
                
                break;
        }
    }
    

    
    
    
// ------------------------------------------------------------------------
/*
 * API FUNCTIONS
 */
// ------------------------------------------------------------------------
    
    /*
     * Opens the dialog
     */
    function open(extensionPackage) {
        
        // Render views
        _renderedIndexView  = _renderIndexView(extensionPackage);
        _renderedManageView = _renderManageView();
        _renderedAddView    = _renderAddView();
        _renderedModifyView = _renderModifyView();
        
        // Open dialog
        _dialog = Dialogs.showModalDialogUsingTemplate(_renderedIndexView, false);
        
        _displayManageView();
    }
    
    /*
     * Adds the given path to the current view
     */
    function addPathPartial(path) {
        
        // Display partial if current view if MODIFY or ADD
        if( _getTypeForView(_currentView) === "modify" || _getTypeForView(_currentView) === "add" ) {
            _displayPartialForPath(path);
        }
    }
    
    /*
     * Sets the workspaces
     */
    function reloadWorkspaces() {
        
        var currentType = _getTypeForView(_currentView);
        
        if (currentType === "manage") {
            _renderedManageView = _renderManageView();
            _displayManageView();   
        }
    }
    
    // API
    exports.open = open;
    exports.addPathPartial = addPathPartial;
    exports.reloadWorkspaces = reloadWorkspaces;
});