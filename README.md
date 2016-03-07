<a name="bundleJade"></a>
## bundleJade(src_dir, dest_dir, options) ⇒ <code>Promise</code>
Utitlity to compile all source jade templates and inject them into index.html in destination directory

**Kind**: global function  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| src_dir | <code>string</code> |  | the source directory to search for jade template files |
| dest_dir | <code>string</code> |  | the destination directory to save index.html after compiling |
| options | <code>object</code> |  |  |
| [options.compileIndex] | <code>boolean</code> | <code>true</code> | expect to compile jade index file as well as templates |
| [options.indexSrcPath] | <code>string</code> | <code>&quot;index.html.jade&quot;</code> | the name of the index file to inject rendered template bundle into. If 		`options.compileIndex=true` this file will be compiled before the 		templates are injected. 		<br/><br/> 		The file itself should contain a comment `<!-- :jade templates: -->` 		<br/><br/> 		**Note:** indexSrcPath should be relative to `src_dir` 		to indicate where to inject the template files. |
| [options.ignorePaths] | <code>array</code> | <code>Array[&quot;index.html.jade&quot;, &quot;index.jade&quot;]</code> | ignore these paths when searching for template files in `src_dir`. 		<br/><br/> 		**Note:** Paths are relative to `src_dir` |
| [options.pretty] | <code>boolean</code> | <code>true</code> | whether to prettify the jade rendered output |
| [options.locals] | <code>object</code> |  | data to inject into the templates at compile time 		keys are the filenames relative to `src_dir`, values are an object of key:value pairs. 		<br/><br/> 		**Example** 		<br/><br/> 		To inject locals into `<src_dir>/templates/my-template.html.jade'`<br/> 		use `locals: {"templates/my-template.html.jade":{greeting: "Hello World"}}`<br/> 		and refer to it in the template as `greeting` |

