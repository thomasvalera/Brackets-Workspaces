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
 *  Workspace
 *
 *  Defines a workspace class.
 *  
 */
// ------------------------------------------------------------------------

/*jslint vars: true, plusplus: true, nomen: true*/
/*global define, brackets, $ */

define(function (require, exports, module) {
    'use strict';
    
    /*
     * Constructs a Workspace object
     */
    function Workspace() {
        
        // Define variables
        this.name = null;
        this.paths = [];
        this.id = new Date().getTime().toString();
        this.description = "No Description";
    }
    
    /*
     * Loads data of workspace
     */
    Workspace.prototype.loadData = function (data) {
        
        if (data.name) {
            this.name = data.name;
        }
        
        if (data.description) {
            if (data.description === "") {
                this.description = "This workspace has no description";
            } else {
                this.description = data.description;
            }
        }
        
        if (data.paths) {
            this.paths = data.paths;
        }
        
        if (data.id) {
            this.id = data.id;
        }
    };
    
    /*
     * Returns the data
     */
    Workspace.prototype.getData = function () {
        var data = {
            'id': this.id,
            'name': this.name,
            'description': this.description,
            'paths': $.extend(true, [], this.paths)
        };
        return data;
    };
    
    /*
     * Returns the path at given location if it exists,
     * null otherwise
     */
    Workspace.prototype.getPathAtPosition = function (pos) {
        
        // If path exists
        if (this.paths.length > pos) {
            return this.paths[pos];
        }
        return null;
    };
    
    /*
     * Removes the given path
     */
    Workspace.prototype.removePath = function (path) {
        var i;
        
        for (i = 0; i < this.paths.length; i++) {
            if (this.paths[i] === path) {
                this.paths.splice(i, 1);
            }
        }
    };
    
    exports.Workspace = Workspace;
});