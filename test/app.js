'use strict';

const path = require('path');
const assert = require('yeoman-assert');
const test = require('yeoman-test');

describe('generator-frontend-incubator:app', () => {
	describe('default settings', () => {
		before((done) => {
			test.run(path.join(__dirname, '../app'))
				.withPrompts({projectName: 'testing-project'})
				.on('end', done);
		});

		it('creates config files', () => {

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

		it('configures config files', () => {
			assert.fileContent('package.json', '"name": "testing-project"');
		});

		it('creates assets', () => {
			assert.file([
				'src/asset/scss/3.components/__components.scss',
				'src/asset/scss/site.scss',
				'src/asset/javascript/site.js',
				'src/asset/font',
				'src/asset/image'
			]);
		});

		it('creates prototype', () => {
			assert.file([
				'src/prototype/template/index.html',
				'src/prototype/webroot'
			]);
		});
	});
});
