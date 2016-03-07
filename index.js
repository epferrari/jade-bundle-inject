'use strict';

var jade = require('jade');
var fs = require('fs');
var Promise = require('bluebird');
var shell = require('shelljs');
var APP_ROOT = require('app-root-path').toString();
var path = require('path');
var assign = require('object-assign');

Promise.promisifyAll(fs);

const jadeRenderFileAsync = (filename,options) => {
	return new Promise((resolve,reject) => {
		let html = jade.renderFile(filename,options);
		resolve(html);
	});
};

module.exports = compileJade;
/**
* Utitlity to compile all source jade templates and inject them into index.html in destination directory
* @param {string} src_dir - the source directory to search for jade template files
* @param {string} dest_dir - the destination directory to save index.html after compiling
* @param {object} options
* @param {boolean} [options.compileIndex=true] -
		expect to compile jade index file as well as templates
* @param {string} [options.indexSrcPath="index.html.jade"] -
		the name of the index file to inject rendered template bundle into. If
		`options.compileIndex=true` this file will be compiled before the
		templates are injected. Filepath should be **relative to `src_dir`**. The
		file itself should contain a comment `<!-- :jade templates: -->`  to indicate
		where to inject the template files.
* @param {array} [options.ignorePaths=Array["index.html.jade", "index.jade"]] -
		ignore these paths when searching for template files in `src_dir`. Paths
		are relative to `src_dir`
* @param {boolean} [options.pretty=true] - whether to prettify the jade rendered output
* @param {object} [options.locals] - data to inject into the templates at compile time
		keys are the filenames relative to `src_dir`, values are an object of key:value pairs.
		ex. To inject locals into `<src_dir>/templates/my-template.html.jade', use
		`locals: {"templates/my-template.html.jade":{greeting: "Hello World"}}` and refer
		to it in the template as `greeting`
* @returns {Promise}
*/
function compileJade(src_dir, dest_dir, options){

	let defaults = {
		compileIndex: true,
		indexSrcPath: 'index.html.jade',
		ignorePaths: ["index.html.jade", "index.jade"],
		pretty: true,
		locals: {}
	};

	options = assign(defaults, options);

	let indexPaths = [options.indexSrcPath]
	.concat(options.ignorePaths)
	.map( filePath => path.join(APP_ROOT, src_dir, filePath) )
	.join("|");

	let escapedIndexPath = (indexPaths).replace(/([^\|\w\d\s])/g, (match) => "\\"+match);
	let indexPattern = new RegExp( escapedIndexPath + "$");

	// get jade templates from src
	let jadeFiles = shell.find( path.join(APP_ROOT,src_dir) )
		.filter( filename => filename.match(/\.jade$/) )
		// ignore index, we'll convert this separately to insert other files into
		.filter( filename => !filename.match(indexPattern) )

	// convert each file to html markup
	return Promise
	.map(jadeFiles, (filename) => {
		// get options for compile, including locals
		let localPath = filename.replace( path.join(APP_ROOT,src_dir)+"/",'');
		let opts = assign({pretty: options.pretty}, options.locals[localPath]);

		// push Promise of compiled html
		return jadeRenderFileAsync(filename, opts);
	})

	.then( htmlArray => {
		let indexPath = path.join(APP_ROOT, src_dir, options.indexSrcPath);
		let renderIndex;
		if(options.compileIndex){
			// compile index.jade to html
			renderIndex = jadeRenderFileAsync(indexPath, {pretty: options.pretty});
		}else{
			// get html from file
			renderIndex = fs.readFileAsync(indexPath,'utf-8');
		}

		// bundle the templates into single string
		let htmlBundle = htmlArray.join('\n');

		return [renderIndex, htmlBundle];
	})

	.spread( (indexHtml,htmlBundle) => {
		// insert bundle into index.html
		let html = indexHtml.replace(/(<\!--\s*:jade templates:\s*-->)/,(match) => htmlBundle )
		let destIndex = path.join(APP_ROOT,dest_dir,'index.html');

		// write to src directory
		return fs.writeFileAsync(destIndex, html , 'utf-8')
	});
}
