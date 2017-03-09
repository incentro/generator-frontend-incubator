'use strict';
const yo = require('yeoman-generator');
const art = require('./art');
const chalk = require('chalk');
const yosay = require('yosay');
const path = require('path');
const config = require('./config.json');

////////////////////////////////////////////////////////////////////////////////////////////
// initializing - Your initialization methods (checking current project state, getting configs, etc)
// prompting - Where you prompt users for options (where you'd call this.prompt())
// configuring - Saving configurations and configure the project (creating .editorconfig files and other metadata files)
// default - If the method name doesn't match a priority, it will be pushed to this group.
// writing - Where you write the generator specific files (routes, controllers, etc)
// conflicts - Where conflicts are handled (used internally)
// install - Where installation are run (npm, bower)
// end - Called last, cleanup, say good bye, etc
///////////////////////////////////////////////////////////////////////////////////////////

module.exports = yo.Base.extend({
	constructor: function (arg, options) {
		yo.Base.apply(this, arguments);
		this.settings = config;

		for (let i = 0; i < arguments.length; i = i + 1) {
			if (arguments[i]['skipInstall'] || arguments[i]['skip-install']) {
				this.log(yosay(
					'Hi there, the ' + chalk.bold(chalk.green('frontend-incubator')) +
					' heavily relies on the install step. I cannot guarantee any success when you continue. You can press ' +
					chalk.yellow('\'ctrl + c\'') + ' to cancel. Proceed only when you really know what you\'re doing.'));
				this.skipDefault = true;
			}
		}
	},
	prompting: function () {
		let done = this.async();

		if (!this.skipDefault) {
			// Have the Incentronaut greet the user.
			this.log(art.incentronaut);
		}

		let prompts = [{
			name: 'projectName',
			message: 'What is the name of your project?',
			default: path.basename(process.cwd())
		}, {
			name: 'projectVersion',
			message: 'What is version of your project?',
			default: '1.0.0'
		}, {
			name: 'es2015orLoose',
			message: 'Does Babel need to run in \'loose\' mode?',
			default: true,
			type: 'confirm'
		}, {
			name: 'dependencies',
			message: 'Select the dependencies you want to install:',
			type: 'checkbox',
			choices: [{
				name: 'fastclick' + chalk.grey(' - Polyfill to remove click delays on browsers with touch UIs'),
				value: 'fastclick'
			}, {
				name: 'fastdom' + chalk.grey(' - Eliminates layout thrashing by batching DOM read/write operations '),
				value: 'fastdom'
			}, {
				name: 'jQuery' + chalk.grey(' - A cross-platform JavaScript library designed to simplify the client-side scripting of HTML'),
				value: 'jquery',
				checked: true
			}]
		}, {
			name: 'itcss',
			message: 'Do you want to use ITCSS?',
			default: true,
			type: 'confirm'
		}, {
			name: 'useSasslint',
			message: 'Do you want to use sass-lint?',
			default: true,
			type: 'confirm'
		}, {
			name: 'configureFTP',
			message: 'Would you like to configure FTP? (You can always do this later in the config.json)',
			default: false,
			type: 'confirm'
		}, {
			name: 'ftpHost',
			message: 'FTP host',
			type: 'input',
			when: (answers) => {
				return answers.configureFTP;
			}
		}, {
			name: 'ftpUser',
			message: 'FTP username',
			type: 'input',
			when: (answers) => {
				return answers.configureFTP;
			}
		}, {
			name: 'ftpPass',
			message: 'FTP password',
			type: 'password',
			when: (answers) => {
				return answers.configureFTP;
			}
		}];


		return this.prompt(prompts).then(function (answers) {
			this.props = answers;
			done();
		}.bind(this));
	},

	writing: function () {

		this.fs.copyTpl(
			this.templatePath('_package.json'),
			this.destinationPath('package.json'),
			{
				name: this.props.projectName,
				version: this.props.projectVersion
			}
		);

		this.fs.copyTpl(
			this.templatePath('_config.json'),
			this.destinationPath('config.json'),
			{
				paths: this.settings.paths,
				esVersion: this.props.es2015orLoose ? true : false,
				ftp: {
					host: this.props.ftpHost || '',
					user: this.props.ftpUser || '',
					pass: this.props.ftpPass || ''
				}
			}
		);

		this.fs.copyTpl(
			this.templatePath('_README.md'),
			this.destinationPath('README.md'),
			{
				name: this.props.projectName,
				itcss: this.props.itcss
			}
		);

		let simpleCopyFiles = ['.editorconfig', '.gitattributes', '.gitignore', '.jshintrc', 'gulpfile.js', 'tasks.json'];
		if (this.props.useSasslint) {
			simpleCopyFiles.push('.sass-lint.yml');
		}

		for (let i = 0; i < simpleCopyFiles.length; i++) {
			this.fs.copyTpl(
				this.templatePath('_' + simpleCopyFiles[i]),
				this.destinationPath(simpleCopyFiles[i]),
				{
					useSasslint: this.props.useSasslint
				}
			);
		}

		let paths = this.settings.paths.src,
			keep = '/.keep',
			keepText = 'remove this file when you\'ve added content to this folder',
			stylePath = paths.asset.scss;

		this.fs.copyTpl(
			this.templatePath(paths.asset.javascript + '/site.js.txt'),
			this.destinationPath(paths.asset.javascript + '/site.js'),
			{dependencies: this.props.dependencies}
		);

		this.fs.write(paths.asset.image + keep, keepText);
		this.fs.write(paths.asset.font + keep, keepText);


		if (this.props.itcss) {
			this.fs.copy(this.templatePath('src/asset/scss/settings/_settings.scss'), this.destinationPath(stylePath + '/settings/_settings.scss'));
			this.fs.copy(this.templatePath('src/asset/scss/tools/_tools.scss'), this.destinationPath(stylePath + '/tools/_tools.scss'));
			this.fs.copy(this.templatePath('src/asset/scss/generic/_generic.scss'), this.destinationPath(stylePath + '/generic/_generic.scss'));
			this.fs.copy(this.templatePath('src/asset/scss/base/_base.scss'), this.destinationPath(stylePath + '/base/_base.scss'));
			this.fs.copy(this.templatePath('src/asset/scss/components/_components.scss'), this.destinationPath(stylePath + '/components/_components.scss'));
			this.fs.copy(this.templatePath('src/asset/scss/theme/_theme.scss'), this.destinationPath(stylePath + '/theme/_theme.scss'));
			this.fs.copy(this.templatePath('src/asset/scss/trumps/_trumps.scss'), this.destinationPath(stylePath + '/trumps/_trumps.scss'));
			this.fs.copy(this.templatePath('src/asset/scss/itcss.scss'), this.destinationPath(stylePath + '/site.scss'));
		} else {
			this.fs.copy(this.templatePath('src/asset/scss/site.scss'), this.destinationPath(stylePath + '/site.scss'));
		}

		this.bulkDirectory(paths.prototype.template, paths.prototype.template);
		this.fs.write(paths.prototype.data + keep, keepText);
		this.fs.write(paths.prototype.webroot + keep, keepText);
	},

	install: function () {
		let useLoosePreset = this.props.es2015orLoose;
		let devDependencies = this.settings.dependencies;
		if (useLoosePreset === true) {
			devDependencies.push('babel-preset-es2015-loose');
		}
		if (this.props.useSasslint) {
			devDependencies.push('sass-lint');
			devDependencies.push('gulp-sass-lint');
		}
		devDependencies.push('babel-preset-es2015');
		this.npmInstall(devDependencies, {saveDev: true});

		// install extra dependencies:
		let dependencies = this.props.dependencies || [];
		if (dependencies && dependencies.length > 0) {
			this.npmInstall(dependencies, {save: true});
		}

		// yeoman defaults with bower so turn it off here
		this.installDependencies({bower: false});
	},
	end: function () {
		this.log(yosay(
			'Thank you for using ' + chalk.bold.green('frontend-incubator') + ' generator!'
		));
	}
});
