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
 *  This manager handles to presentation of the different views and handles
 *  the user inputs received.
 *  
 *  Events fired: 
 *      Format:
 *          event: arg1, arg2, ...
 *  
 *  viewPushed: previousType, currentType, workspaceId
 *  loadTemporaryWorkspace: workspaceId
 *  submitWorkspace: name, description
 *  removeWorkspace: workspaceId
 *  addPath
 *  removePath: path
 *  
 */
// ------------------------------------------------------------------------

/*jslint vars: true, plusplus: true, nomen: true,  */
/*global Mustache, define, brackets, $*/

define(function (require, exports, module) {
    "use strict";
   
    // Load modules
    var Dialogs                 = brackets.getModule("widgets/Dialogs"),
        WorkspacesGlobals        = require("stable/WorkspacesGlobals"),
        
        // Load unrendered views
        _unrenderedViewIndex               = require("text!stable/htmlContent/index.html"),
        _unrenderedViewManage           = require("text!stable/htmlContent/manage.html"),
        _unrenderedViewModify           = require("text!stable/htmlContent/modify.html"),
        _unrenderedViewAdd              = require("text!stable/htmlContent/add.html"),
        
        _unrenderedPartialPath           = require("text!stable/htmlContent/partials/path.html"),
        _unrenderedPartialWorkspace     = require("text!stable/htmlContent/partials/workspace.html"),
        
        // Define variables
        _dialog                         = null,
        _currentView                    = null,
        _previousView                   = null,
        _pushInProgress                 = false;

    /*
     * Triggers the given event
     */
    function _triggerEvent(event, data) {
        $(exports).triggerHandler(event, data);
    }

    /*
     * Returns the current tab type if exists,
     * null otherwise
     */
    function getTypeForView(view) {
        var type = $(view).attr("data-type");
        
        return type === undefined ? null : type;
    }
    
    /*
     * Returns the current tab position,
     * null if no position found.
     */
    function _getTabPositionForView(view) {
        
        // Get view type
        var type = getTypeForView(view);
        
        switch (type) {
        case WorkspacesGlobals.VIEW_TYPE_MODIFY:
            return WorkspacesGlobals.VIEW_POSITION_MODIFY;
        case WorkspacesGlobals.VIEW_TYPE_MANAGE:
            return WorkspacesGlobals.VIEW_POSITION_MANAGE;
        case WorkspacesGlobals.VIEW_TYPE_ADD:
            return WorkspacesGlobals.VIEW_POSITION_ADD;
        default:
            return null;
        }
    }

    /*
     * Removes the view's style.
     */
    function _removeViewStyle(view) {
    
        // Remove all position classes
        view.removeClass("position-left");
        view.removeClass("position-center");
        view.removeClass("position-right");
        // Remove margin
        view.css("margin-left", "");
        view.css("margin-right", "");
        
        // Hide view
        view.hide();
    }
 
    /*
     * Sets the view on the left side.
     */
    function _setViewLeft(view, hide) {
        // Remove all styles from view
        _removeViewStyle(view);
        
        // Set the view to the left
        view.addClass("position-left");
        
        if (!hide) {
            view.css("display", "inline-block");
        }
    }
    
    /*
     * Sets the view on the right side.
     */
    function _setViewRight(view, hide) {
        // Remove all style from view
        _removeViewStyle(view);
        
        // Set the view to the right
        view.addClass("position-right");
        
        if (!hide) {
            view.css("display", "inline-block");
        }
    }

    /*
     * Sets the view in the center of the popup (front/in sight).
     */
    function _setViewCenter(view, hide) {
        // Remove all style from view
        _removeViewStyle(view);
        
        // Set the view to the center
        view.addClass("position-center");
        
        if (!hide) {
            view.css("display", "inline-block");
        }
    }
 
    /*
     * Sets the current view.
     */
    function _setCurrentView(view) {
        _currentView = view;
    }

    /*
     * Sets the footer for the given type
     */
    function _setFooterForType(type) {
        
        // Hide all buttons
        $("#closeButton").hide();
        $("#cancelButton").hide();
        $("#submitButton").hide();
        $("#addFolderButton").hide();
        
        switch (type) {
        case WorkspacesGlobals.VIEW_TYPE_MODIFY:
            $("#cancelButton").show();
            $("#submitButton").show();
            $("#submitButton").removeAttr("disabled");
            $("#addFolderButton").show();
            break;
        case WorkspacesGlobals.VIEW_TYPE_MANAGE:
            $("#closeButton").show();
            break;
        case WorkspacesGlobals.VIEW_TYPE_ADD:
            $("#cancelButton").show();
            $("#submitButton").show();
            $("#addFolderButton").show();
            $("#submitButton").attr("disabled", "disabled");
            break;
                
        }
    }

    /*
     * Selects the corresponding tab
     */
    function _selectTabForView(view) {
        // Get type
        var type = getTypeForView(view);
        
        if (type) {
            // Remove previously selected tab
            $("#manageTab").removeClass("active");
            $("#addTab").removeClass("active");
            
            // Select new tab
            if (type === WorkspacesGlobals.VIEW_TYPE_MANAGE || type === WorkspacesGlobals.VIEW_TYPE_MODIFY) {
                $("#manageTab").addClass("active");
            } else if (type === WorkspacesGlobals.VIEW_TYPE_ADD) {
                $("#addTab").addClass("active");
            }
        }
    }

    /*
     * Returns the workspace id for given view if exists,
     * null otherwise
     */
    function _getWorkspaceIdForView(view) {
        var id = view.attr("data-workspace-id");
        return id === undefined ? null : id;
    }
    
     /*
     * Pushes the given view from left to right.
     * The current view is pushed out of sight.
     * The next view is pushed in sight.
     */
    function _pushViewFromLeft(nextView) {
        
        // Prepare views
        _setViewCenter(_currentView);
        _setViewLeft(nextView);
        
        // Animate push
        nextView.animate(
            {
                "margin-left" : "+=0px"
            },
            WorkspacesGlobals.VIEW_ANIMATION_TIME,
            function () {
                
                // Set previous view
                _previousView = _currentView;
                
                // Set current view
                _setCurrentView(nextView);
                
                // Ensure positions
                _setViewRight(_previousView, true);
                _setViewCenter(_currentView);
                
                // Set footer and tabbar
                _setFooterForType(getTypeForView(_currentView));
                _selectTabForView(_currentView);
                
                // Get new type
                var type = getTypeForView(_currentView);
                
                // Trigger events if needed
                if (type === WorkspacesGlobals.VIEW_TYPE_ADD) {
                    _triggerEvent("loadTemporaryWorkspace", null);
                } else if (type === WorkspacesGlobals.VIEW_TYPE_MODIFY) {
                    // Get workspace id   
                    var workspaceId = _getWorkspaceIdForView(_currentView);
                    _triggerEvent("loadTemporaryWorkspace", workspaceId);
                }
                
                // Finish animation
                _pushInProgress = false;
                
                _triggerEvent("viewPushed", [
                    getTypeForView(_previousView),
                    getTypeForView(_currentView)
                ]);
            }
        );
    }
    
    /*
     * Pushes the given views from right to left.
     * The current view is pushed out of sight.
     * The next view is pushed in sight.
     */
    function _pushViewFromRight(nextView) {
        
        /// Prepare views
        _setViewCenter(_currentView);
        _setViewRight(nextView);
        
        // Animate push
        _currentView.animate(
            {
                "margin-left" : "-=730px"
            },
            WorkspacesGlobals.VIEW_ANIMATION_TIME,
            function () {
                
                // Set previous view
                _previousView = _currentView;
                
                // Set current view
                _setCurrentView(nextView);
                
                // Ensure positions
                _setViewLeft(_previousView, true);
                _setViewCenter(_currentView);
                
                // Set footer and tabbar
                _setFooterForType(getTypeForView(_currentView));
                _selectTabForView(_currentView);
                
                // Get new type
                var type = getTypeForView(_currentView);
                
                // Trigger events if needed
                if (type === WorkspacesGlobals.VIEW_TYPE_ADD) {
                    _triggerEvent("loadTemporaryWorkspace", null);
                } else if (type === WorkspacesGlobals.VIEW_TYPE_MODIFY) {
                    // Get workspace id   
                    var workspaceId = _getWorkspaceIdForView(_currentView);
                    _triggerEvent("loadTemporaryWorkspace", workspaceId);
                }
                
                // Finish animation
                _pushInProgress = false;
                
                _triggerEvent("viewPushed", [
                    getTypeForView(_previousView),
                    getTypeForView(_currentView)
                ]);
            }
        );
    }
    
    /*
     * Pushes the given view in front
     */
    function pushView(nextView) {
     
        if (nextView) {
            if (!_pushInProgress) {
                
                /* Set push in progress to true.
                 * This will prevent visual glitches when
                 * pushing a view while another is already 
                 * being pushed
                */
                _pushInProgress = true;
                
                // If there already is a current view
                if (_currentView) {
                    
                    // Get next view tab position
                    var nextPosition = _getTabPositionForView(nextView);
                    
                    // Get current tab position
                    var currentPosition = _getTabPositionForView(_currentView);
                    
                    // If positions are valid
                    if (nextPosition !== null && currentPosition !== null) {
                        
                        // If next view should come from the right
                        if (nextPosition > currentPosition) {
                            _pushViewFromRight(nextView);
                        } else if (nextPosition < currentPosition) {
                            // If next view shoud come from the left
                            _pushViewFromLeft(nextView);
                        } else if (nextPosition === currentPosition) {
                            // If next view already in front
                            _pushInProgress = false;
                        }
                    }
                } else {
                    // If no current view yet,
                    // push view in front
                    _setViewCenter(nextView);
                    _setCurrentView(nextView);
                    _pushInProgress = false;
                    
                    _triggerEvent("viewPushed", [
                        getTypeForView(_previousView),
                        getTypeForView(_currentView)
                    ]);
                }
            } else {
                console.error("Cannot push view, a previous push is still in progress");
            }
        } else {
            console.error("Cannot push undefined view");
        }
    }
 
    /*
     * Returns the modify view
     */
    function _getModifyView(workspaceID) {
        var viewList = _dialog.getElement().find("#modify-view-" + workspaceID);
        
        return viewList.length === 0 ? null : $(viewList[0]);
    }

    /*
     * Returns the manage view if it exists,
     * null otherwise
     */
    function getManageView() {
        var viewList = _dialog.getElement().find("#manage-view");
        
        return viewList.length === 0 ? null : $(viewList[0]);
    }

    /*
     * Returns the add view
     */
    function getAddView() {
        var viewList = _dialog.getElement().find("#add-view");
        
        return viewList.length === 0 ? null : $(viewList[0]);
    }

    /*
     * Returns the partial view with all listeners attached
     */
    function _setListenersForPartial(partial, parentView) {
        
        // Get type
        var type = getTypeForView(partial);
        
        // Listeners for path partial
        if (type === WorkspacesGlobals.PARTIAL_TYPE_PATH) {
            // Add listener to remove path button
            partial.find(".button-remove").first().click(function () {
                
                $(this).html("Are you sure?");
                
                // Unbind listener and
                // set listener to confirm removal
                $(this).unbind("click");
                $(this).click(function () {
                    _triggerEvent("removePath", partial.attr("data-path"));
                    // Remove path
                    partial.remove();
                    
                    // If currentview has no paths,
                    // show message
                    if (parentView.find("[data-type=path]").length === 0) {
                        parentView.find("#no-path-message").first().show();
                    }
                });
            });
        } else if (type === WorkspacesGlobals.PARTIAL_TYPE_WORKSPACE) {
            // Add listeners to modify buttons
            partial.find(".button-modify").first().click(function () {
                
                pushView(_getModifyView(partial.attr("id")));
            });
            
            
            // Add listeners to remove button
            partial.find(".button-remove").first().click(function () {
                
                $(this).html("Are you sure?");
                // Unbind listener and
                // set listener to confirm removal
                $(this).unbind("click");
                $(this).click(function () {
                    _triggerEvent("removeWorkspace", partial.attr("id"));
                    
                    // Remove workspace partial
                    partial.remove();
                    
                    // If view has no workspaces left,
                    // show message
                    if (parentView.find("[data-type=" + WorkspacesGlobals.PARTIAL_TYPE_WORKSPACE + "]").length === 0) {
                        parentView.find("#no-workspace-message").first().show();
                    }
                });
            });
        }
    }
    
    /*
     * Returns the view with all listeners attached
     */
    function _setListenersForView(view) {
        
        // Get type
        var type = getTypeForView(view);
        
        // Listeners for ADD and MODIFY views
        if (type === WorkspacesGlobals.VIEW_TYPE_ADD ||
                type === WorkspacesGlobals.VIEW_TYPE_MODIFY) {
            
            // Add listener to name input
            view.find("#workspaceName").change(function () {
                if ($(this).val().trim().length > 0) {
                    $("#submitButton").removeAttr("disabled");
                } else {
                    $("#submitButton").attr("disabled", "disabled");
                }
            });
            // Set listeners for all path partials
            view.find("[data-type=" + WorkspacesGlobals.PARTIAL_TYPE_PATH + "]").each(function () {
                _setListenersForPartial($(this), view);
            });
            
        } else if (type === WorkspacesGlobals.VIEW_TYPE_MANAGE) {
            // Set listeners for all workspace partials
            view.find("[data-type=" + WorkspacesGlobals.PARTIAL_TYPE_WORKSPACE + "]").each(function () {
                _setListenersForPartial($(this), view);
            });
        }
        return view;
    }

    /*
     * Returns a rendered add view
     */
    function _renderAddView() {
        var view = $(Mustache.render(_unrenderedViewAdd));
        return view;
    }
    
    /*
     * Returns a rendered workspace partial view
     */
    function _renderWorkspacePartial(workspace) {
        var view = Mustache.render(_unrenderedPartialWorkspace, {'workspace' : workspace});
        return view;
    }
    
    /* 
     * Returns a rendered path partial view
     */
    function _renderPathPartial(path) {
        var view = Mustache.render(_unrenderedPartialPath, {'path': {'url' : path}});
        return view;
    }
    
    /*
     * Returns the rendered manage view
     */
    function _renderManageView(workspaces) {
        
        // Initialize array of workspace partials
        var workspacePartials = [];
        
        // Render all workspace partials
        $.each(workspaces, function () {
            workspacePartials.push(_renderWorkspacePartial(this));
        });
        
        var view = $(Mustache.render(_unrenderedViewManage, {'workspacePartials' : workspacePartials}));
        
        // Hide message if needed
        if (workspacePartials.length > 0) {
            view.find("#no-workspace-message").first().hide();
        }
        
        return view;
    }
 
    /*
     * Returns a rendered modify view for given workspace if exists,
     * null otherwise
     */
    function _renderModifyView(workspace) {
        if (workspace) {
            
            // Init data to send to modify view
            var data = {
                    'workspace': workspace
                };
            
            if (workspace.paths.length > 0) {
                
                // Initialize array of path partials
                var pathPartials = [];
                
                // Render all path partials
                $.each(workspace.paths, function () {
                    pathPartials.push(_renderPathPartial(this));
                });
                
                if (pathPartials.length > 0) {
                    data.pathPartials = pathPartials;
                }
            }
            
            var view = $(Mustache.render(_unrenderedViewModify, data));
            
            // Hide message if needed
            if (data.pathPartials) {
                view.find("#no-path-message").first().hide();
            }
            
            return view;
            
        } else {
            console.error("Could not render modify view without workspace");
        }
        
        return null;
    }

    /*
     * Returns an array containing all rendered modify views
     */
    function _renderAllModifyViews(workspaces) {
        
        var views = [],
            i;
        
        for (i = 0; i < workspaces.length; i++) {
            views.push(_renderModifyView(workspaces[i]));
        }
        return views;
    }

    /*
     * Returns a rendered index view
     */
    function _renderIndexView() {
        // Render index view
        var view = $(Mustache.render(_unrenderedViewIndex));
        
        return view;
    }
    
    /*
     * Adds a view to the popup window
     */
    function addView(view) {
        var position = _getTabPositionForView(view);
        
        if (position !== null) {
            view = _setListenersForView(view);
            
            // If view goes to the left
            if (position < 0) {
                _setViewLeft(view, true);
                $(".workspace-view-container").prepend(view);
            } else if (position > 0) {
                // If position goes to the right
                _setViewRight(view, true);
                _dialog.getElement().find(".workspace-view-container").append(view);
            } else if (position === 0) {
                // If position goes to the center
                _setViewCenter(view, true);
                $(".workspace-view-container").prepend(view);
            }
        } else {
            console.error("Cannot add view with no known position.");
        }
    }

    /*
     * Closes the dialog and resets the variables
     */
    function closeDialog() {
    
        if (_dialog) {
            _dialog.close();
            _dialog             = null;
            _currentView        = null;
            _previousView       = null;
            _pushInProgress     = false;
        }
    }
    
    /*
     * Sets the listeners for index view
     */
    function _setIndexViewListeners() {
        $("#closeButton").click(function () {
            closeDialog();
        });
        $("#manageTab").click(function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            pushView(getManageView());
        });
        $("#addTab").click(function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            pushView(getAddView());
        });
        $("#addFolderButton").click(function () {
            _triggerEvent("addPath");
        });
        $("#submitButton").click(function () {
            // Get workspace name
            var name = _currentView.find("#workspaceName").first().val().trim();
            var description = _currentView.find("#workspaceDescription").first().val();
            
            _triggerEvent("submitWorkspace", [
                name,
                description
            ]);
        });
        $("#cancelButton").click(function () {
            pushView(getManageView());
        });
    }
    
    /*
     * Returns a newly rendered manage view
     */
    function getNewManageView(workspaces) {
        return $(_renderManageView(workspaces));
    }
    
    /*
     * Returns a newly rendered add view
     */
    function getNewAddView() {
        return $(_renderAddView());
    }
    
    /*
     * Returns a newly rendered modify view for the given workspace
     */
    function getNewModifyView(workspace) {
        return $(_renderModifyView(workspace));
    }
    
    /*
     * Returns the modify view if exists,
     * null otherwise
     */
    function _getModifyViewWithWorkspaceId(workspaceID) {
        var viewList = _dialog.getElement().find("#modify-view-" + workspaceID);
        
        return viewList.length === 0 ? null : $(viewList[0]);
    }
    
    /*
     * Returns true if modify view already exists
     */
    function modifyViewExistsWithWorkspaceId(id) {
        // Get modify view
        var view = _getModifyViewWithWorkspaceId(id);
        
        return view !== null;
    }
    
    /*
     * Replaces the existing view with the given one
     */
    function replaceView(view) {
        
        // Get type
        var type = getTypeForView(view),
            current = null;
        
        if (type) {
            
            // Set listeners
            view = _setListenersForView(view);
            
            if (type === WorkspacesGlobals.VIEW_TYPE_MANAGE) {
                
                // Get current manage view
                current = getManageView();
                
                // Copy style
                view.attr("class", current.attr("class"));
                view.attr("style", current.attr("style"));
                
                // Replace element
                current.replaceWith(view);
                
            } else if (type === WorkspacesGlobals.VIEW_TYPE_ADD) {
                
                // Get current add view
                current = getAddView();
                
                // Copy style
                view.attr("class", current.attr("class"));
                view.attr("style", current.attr("style"));
                
                // Repalce element
                current.replaceWith(view);
            } else if (type === WorkspacesGlobals.VIEW_TYPE_MODIFY) {
                
                // Get workspace id
                var workspaceId = _getWorkspaceIdForView(view);
                
                if (workspaceId) {
                    
                    // Get current modify view
                    current = _getModifyViewWithWorkspaceId(workspaceId);
                    
                    // Copy style
                    view.attr("class", current.attr("class"));
                    view.attr("style", current.attr("style"));
                    
                    // Replace element
                    current.replaceWith(view);
                    
                } else {
                    console.error("Could not replace modify view because no workspace id was found.");
                }
            }
        }
    }
    
    /*
     * Adds the workspace to the current view
     */
    function addWorkspaceToManageView(workspace) {
        
        // Get manage view
        var view = getManageView();
        
        // Render workspace partial
        var partial = $(_renderWorkspacePartial(workspace));
        
        // If view has no workspaces,
        // hide message
        if (view.find("[data-type=" + WorkspacesGlobals.PARTIAL_TYPE_WORKSPACE + "]").length === 0) {
            view.find("#no-workspace-message").first().hide();
        }
    
        // Set listeners
        _setListenersForPartial(partial, view);
        
        // If workspace already exists, repalce
        if (view.find("#" + workspace.id).length > 0) {
            view.find("#" + workspace.id).replaceWith(partial);
        } else {
            // Add to view
            view.find("#no-workspace-message").first().after(partial);
        }
        
    }
    
    /*
     * Adds the path to the current view
     */
    function addPathToCurrentView(path) {
        
        // If current view is MODIFY or ADD
        if (getTypeForView(_currentView) === WorkspacesGlobals.VIEW_TYPE_ADD ||
                getTypeForView(_currentView) === WorkspacesGlobals.VIEW_TYPE_MODIFY) {
            // Render path partial
            var partial = $(_renderPathPartial(path));
            
            // If view has no paths,
            // hide message
            if (_currentView.find("[data-type=" + WorkspacesGlobals.PARTIAL_TYPE_PATH + "]").length === 0) {
                _currentView.find("#no-path-message").first().hide();
            }
            
            // Set listeners
            _setListenersForPartial(partial, _currentView);
            
            // Add to view
            _currentView.find("#no-path-message").first().after(partial);
            
        }
    }
    
    /*
     * Removes all views attached to given workspace
     */
    function removeWorkspaceWithId(workspaceId) {
        // Get manage view
        var manageView = getManageView();
        
        // Get and remove corresponding modify view
        var modifyView = _getModifyViewWithWorkspaceId(workspaceId);
        modifyView.remove();
        
        // Remove partial
        manageView.find("tr[id=" + workspaceId + "][data-type=" + WorkspacesGlobals.PARTIAL_TYPE_WORKSPACE + "]").first().remove();
        
        // Get all partials remaining
        var allWorkspacePartials = manageView.find("tr[data-type=" + WorkspacesGlobals.PARTIAL_TYPE_WORKSPACE + "]");
        
        // If no partials left, show message
        if (allWorkspacePartials.length === 0) {
            manageView.find("#noWorkspacesMessage").show();
        }
        
    }
    
    /*
     * Opens the dialog
     */
    function open(workspaces) {
        
        // Render index view
        var renderedIndexView = _renderIndexView();
        
        // Open dialog
        _dialog = Dialogs.showModalDialogUsingTemplate(renderedIndexView, false);
        
        // Set listeners
        _setIndexViewListeners();
        
        // Setup views
        var renderedManageView  = _renderManageView(workspaces),
            renderedAddView     = _renderAddView(),
            renderedAllModifyViews  = _renderAllModifyViews(workspaces);
        
        // Add views
        addView(renderedManageView);
        addView(renderedAddView);
        $.each(renderedAllModifyViews, function () {
            addView($(this));
        });
        
        // Push manage view in front
        pushView(getManageView());
    }
    
    exports.open = open;
    exports.getNewAddView = getNewAddView;
    exports.addPathToCurrentView = addPathToCurrentView;
    exports.addView = addView;
    exports.getNewModifyView = getNewModifyView;
    exports.getNewManageView = getNewManageView;
    exports.replaceView = replaceView;
    exports.modifyViewExistsWithWorkspaceId = modifyViewExistsWithWorkspaceId;
    exports.pushView = pushView;
    exports.getManageView = getManageView;
    exports.removeWorkspaceWithId = removeWorkspaceWithId;
    exports.addWorkspaceToManageView = addWorkspaceToManageView;
});