'use strict';

var jade = require('jade');
var fs = require('fs');
var Promise = require('bluebird');
var shell = require('shelljs');
var APP_ROOT = require('app-root-path').toString();
var path = require('path');
var assign = require('object-assign');

Promise.promisifyAll(fs);

const jadeRenderFileAsync = (filename) => {
	return new Promise((resolve,reject) => {
		let html = jade.renderFile(filename);
		resolve(html);
	});
};

module.exports = compileJade;
/**
* compile all source jade templates and inject them into index.html in destination directory
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
* @param {boolean} [options.ignoreCommonIndexPaths=true] -
		ignore `<src_dir>/index.jade` and `<src_dir>/index.html.jade`
		when searching for template files in `<src_dir>`
* @returns {Promise}
*/
function compileJade(src_dir, dest_dir, options){

	let defaults = {
		compileIndex: true,
		indexSrcPath: 'index.html.jade',
		ignoreCommonIndexPaths: true
	};

	options = Object.assign(defaults, options);

	let indexPaths = [options.indexSrcPath]
	.concat( options.ignoreCommonIndexPaths ? ["index.html.jade", "index.jade"] : [])
	.map( filePath => path.join(APP_ROOT, src_dir, filePath) )
	.join("|");

	let escapedIndexPath = (indexPaths).replace(/([^\|\w\d\s])/g, (match) => "\\"+match);
	let indexPattern = new RegExp( escapedIndexPath + "$");

		// get jade templates from src
	let jadeFiles = shell.find( path.join(APP_ROOT,src_dir) )
		.filter( filename => filename.match(/\.jade$/) )
		// ignore index, we'll convert this separately to insert other files into
		.filter( filename => !filename.match(indexPattern) )

	return Promise
		// convert each file to html markup
	.map(jadeFiles, jadeRenderFileAsync)
	.reduce((result, html) => {
		// create array of compiled html
		result.push(html);
		return result;
	},[])

	.then( htmlArray => {

		let indexPath = path.join(APP_ROOT, src_dir, options.indexSrcPath);
		let renderIndex;
		if(options.compileIndex){
			// compile index.jade to html
			renderIndex = jadeRenderFileAsync(indexPath);
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
