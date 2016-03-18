'use strict';
var path = require('path');
var assert = require('yeoman-assert');
var helpers = require('yeoman-generator').test;

describe('generator-frontend-incubator:app', function () {
	describe('default settings', function () {
		before(function (done) {
			helpers.run(path.join(__dirname, '../app'))
				.withPrompts({projectName: 'testing-project'})
				.on('end', done);
		});

		it('creates config files', function () {

			assert.file([
				'.editorconfig',
				'.gitattributes',
				'.gitignore',
				'.jshintrc',
				'.sass-lint.yml',
				'config.json',
				'gulpfile.js',
				'package.json',
				'README.md',
				'tasks.json'
			]);
		});

		it('configures config files', function () {
			assert.fileContent('package.json', '"name": "testing-project"');
		});

		it('creates assets', function () {
			assert.file([
				'src/asset/scss/components/_components.scss',
				'src/asset/scss/site.scss',
				'src/asset/javascript/site.js',
				'src/asset/font',
				'src/asset/image'
			]);
		});

		it('creates prototype', function () {
			assert.file([
				'src/prototype/template/index.html',
				'src/prototype/webroot'
			]);
		});
	});
});
