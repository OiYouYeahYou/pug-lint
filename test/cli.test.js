const assert = require('assert');

const bin = require.resolve('../bin/pug-lint');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const fixturesPath = path.join(__dirname, 'fixtures/');
const fixturesRelativePath = './test/fixtures/';
const packageDetails = require('../package.json');

function run(args, cb) {
	const command = [bin, ...args];
	let stdout = '';
	let stderr = '';
	const node = process.execPath;
	const child = spawn(node, command);

	if (child.stderr) {
		child.stderr.on('data', (chunk) => {
			stderr += chunk;
		});
	}

	if (child.stdout) {
		child.stdout.on('data', (chunk) => {
			stdout += chunk;
		});
	}

	child.on('error', cb);

	child.on('close', (code) => {
		cb(null, code, stdout, stderr);
	});

	return child;
}
const carriageReturnRegex = /\r\n/g;
const getExpected = (name) =>
	fs
		.readFileSync(`${fixturesPath}reporters/${name}.txt`, 'utf-8')
		.replace(carriageReturnRegex, '\n');

describe('cli', () => {
	it('should output the current version number', (done) => {
		const args = ['-V'];

		run(args, (error, code, stdout, stderr) => {
			assert(!error, error);
			assert.equal(code, 0, code);
			assert.equal(stderr, '', stderr);
			assert.equal(stdout.includes(packageDetails.version), true, stdout);
			done();
		});
	});

	it('should output help', (done) => {
		const args = ['-h'];
		const message = 'Usage: pug-lint [options] <file ...>';

		run(args, (error, code, stdout, stderr) => {
			assert(!error, error);
			assert.equal(code, 0, code);
			assert.equal(stderr, '', stderr);
			assert.equal(stdout.includes(message), true, stdout);
			assert.equal(
				stdout.includes(packageDetails.description),
				true,
				stdout
			);
			done();
		});
	});

	it('should output help if no file specified', (done) => {
		const args = [];
		const message = 'Usage: pug-lint [options] <file ...>';

		run(args, (error, code, stdout, stderr) => {
			assert(!error, error);
			assert.equal(code, 0, code);
			assert.equal(stderr, '', stderr);
			assert.equal(stdout.includes(message), true, stdout);
			assert.equal(
				stdout.includes(packageDetails.description),
				true,
				stdout
			);
			done();
		});
	});

	it('should report errors for file path', (done) => {
		const args = [fixturesRelativePath + 'invalid.pug'];
		const expectedReport = getExpected('expected-invalid');

		run(args, (error, code, stdout, stderr) => {
			assert(!error, error);
			assert.equal(code, 2, code);
			assert.equal(stdout, '', stdout);
			assert.equal(
				stderr.trim(),
				expectedReport
					.replace(/%dirname%/g, fixturesRelativePath)
					.trim(),
				stderr
			);
			done();
		});
	});

	it('should report errors for directory path', (done) => {
		const dirname = fixturesRelativePath + 'rules/';
		const args = [dirname];
		const expectedReport = getExpected('expected-invalid');

		run(args, (error, code, stdout, stderr) => {
			assert(!error, error);
			assert.equal(code, 2, code);
			assert.equal(stdout, '', stdout);
			assert.equal(
				stderr.trim(),
				expectedReport.replace(/%dirname%/g, dirname).trim(),
				stderr
			);
			done();
		});
	});

	it('should use config when it is supplied', (done) => {
		const dirname = fixturesRelativePath + 'rules/';
		const args = [
			'-c',
			fixturesPath + 'config-file/dotfile/.pug-lintrc',
			dirname + 'disallow-block-expansion.pug'
		];
		const expectedReport = getExpected(
			'expected-disallow-block-expansion--console'
		);

		run(args, (error, code, stdout, stderr) => {
			assert(!error, error);
			assert.equal(code, 2, code);
			assert.equal(stdout, '', stdout);
			assert.equal(
				stderr.trim(),
				expectedReport.replace(/%dirname%/g, dirname).trim(),
				stderr
			);
			done();
		});
	});

	it('should error on invalid reporter', (done) => {
		const args = ['-r', 'nonexistent', fixturesRelativePath];

		run(args, (error, code, stdout, stderr) => {
			assert(!error, error);
			assert.equal(code, 1, code);
			assert.equal(stdout, '', stdout);
			assert.equal(
				stderr.trim(),
				'Reporter "nonexistent" does not exist',
				stderr
			);
			done();
		});
	});

	it('should report errors using reporter', (done) => {
		const dirname = fixturesRelativePath + 'rules/';
		const args = [
			'-r',
			'inline',
			'-c',
			fixturesPath + 'config-file/dotfile/.pug-lintrc',
			dirname + 'disallow-block-expansion.pug'
		];
		const expectedReport = getExpected(
			'expected-disallow-block-expansion--inline'
		);

		run(args, (error, code, stdout, stderr) => {
			assert(!error, error);
			assert.equal(code, 2, code);
			assert.equal(stdout, '', stdout);
			assert.equal(
				stderr.trim(),
				expectedReport.replace(/%dirname%/g, dirname).trim(),
				stderr
			);
			done();
		});
	});
});
