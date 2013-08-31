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
 *  WorkspacesGlobals
 *
 *  Contains the global constants of the extension.
 *  
 */
// ------------------------------------------------------------------------

/*global define*/

define(function (require, exports, module) {
    "use strict";
    
    // EXTENSION
    exports.EXTENSION_TITLE         = "Workspaces";
    exports.EXTENSION_ID            = "com-workspaces-tvalera";
    
    // MENU
    exports.MENU_ID                 = this.EXTENSION_ID + "-menu";
    exports.MENU_NAME               = this.EXTENSION_TITLE;
    
    // SUBMENU
    exports.SUBMENU_MANAGE_ID       = this.EXTENSION_ID + "-manage";
    exports.SUBMENU_MANAGE_NAME    = "Manage Workspaces";
    
    // URL
    exports.URL_WORKSPACE_ID        = this.EXTENSION_ID + "-workspace-id";
    exports.URL_PATH_POSITION       = this.EXTENSION_ID + "-path-position";
    
    // VIEW
    exports.VIEW_TYPE_ADD           = "add";
    exports.VIEW_TYPE_MANAGE        = "manage";
    exports.VIEW_TYPE_MODIFY        = "modify";
    exports.VIEW_POSITION_ADD       = 1;
    exports.VIEW_POSITION_MANAGE   = 0;
    exports.VIEW_POSITION_MODIFY    = -1;
    exports.VIEW_ANIMATION_TIME     = 500; // time in millis
    
    // PARTIAL
    exports.PARTIAL_TYPE_WORKSPACE  = "workspace";
    exports.PARTIAL_TYPE_PATH       = "path";
});