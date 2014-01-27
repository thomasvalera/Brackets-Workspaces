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
/*global define */
/*jslint nomen:true */
define(function (require, exports, module) {
    'use strict';
   
    /*
     * Construct a Workspace object
     */
    function Workspace() {
        
        // Define variables
        this._name = "";
        this._paths = [];
        this._id = new Date().getTime().toString();
        this._description = "";
    }
    
    /*
     * Returns the path at given location if it exists,
     * null otherwise
     */
    Workspace.prototype.getPathAtPosition = function (pos) {
        
        // If path exists
        if (this._paths.length > pos) {
            return this._paths[pos];
        }
        return null;
    };
    
    /*
     * Loads data of workspace
     */
    Workspace.prototype.loadData = function (data) {
        
        if (data._name) {
            this.setName(data._name);
        }
        
        if (data._description && data._description !== "") {
            this.setDescription(data._description);
        }
        
        if (data._paths) {
            this.setPaths(data._paths);
        }
        
        if (data._id) {
            this.setId(data._id);
        }
    };
    
    /*
     * Returns the id
     */
    Workspace.prototype.getId = function () {
        return this._id;
    };
    
    /*
     * Sets the id
     */
    Workspace.prototype.setId = function (id) {
        this._id = id;
    };
    
    /*
     * Returns the name
     */
    Workspace.prototype.getName = function () {
        return this._name;
    };
    
    /*
     * Sets the name
     */
    Workspace.prototype.setName = function (name) {
        this._name = name;
    };
    
    /*
     * Returns the description
     */
    Workspace.prototype.getDescription = function () {
        return this._description;
    };
    
    /*
     * Sets the description
     */
    Workspace.prototype.setDescription = function (description) {
        this._description = description;
    };
    
    /*
     * Returns the paths array
     */
    Workspace.prototype.getPaths = function () {
        return this._paths;
    };
    
    /*
     * Sets the paths array
     */
    Workspace.prototype.setPaths = function (paths) {
        this._paths = paths;
    };
    
    /*
     * Removes the url from paths
     */
    Workspace.prototype.removePath = function (url) {
        
        var i,
            tempUrl;
        
        for (i = 0; i < this._paths.length; i += 1) {
            
            tempUrl = this._paths[i];
            
            if (tempUrl === url) {
                this._paths.splice(i, 1);
            }
        }
    };
    
    /*
     * Adds the url to the paths list
     */
    Workspace.prototype.addPath = function (path) {
        
        if (path !== "" && path !== null) {
            this._paths.push(path);
        }
    };
    
    // API
    exports.Workspace = Workspace;
});