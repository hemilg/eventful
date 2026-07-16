#!/usr/bin/env bun
/**
 * Interactive provisioning wizard for eventful.
 * Creates Cloudflare resources: D1 database, KV namespace, and R2 bucket.
 *
 * Usage: bun run scripts/init.ts
 */

import { createInterface } from 'readline/promises';
import { spawn } from 'child_process';

const readline = createInterface({
	input: process.stdin,
	output: process.stdout
});

interface Colors {
	reset: string;
	bold: string;
	dim: string;
	red: string;
	yellow: string;
	green: string;
	blue: string;
}

const colors: Colors = {
	reset: '\x1b[0m',
	bold: '\x1b[1m',
	dim: '\x1b[2m',
	red: '\x1b[31m',
	yellow: '\x1b[33m',
	green: '\x1b[32m',
	blue: '\x1b[34m'
};

function print(msg: string): void {
	process.stdout.write(msg + '\n');
}

function error(msg: string): void {
	process.stderr.write(colors.red + msg + colors.reset + '\n');
}

function success(msg: string): void {
	process.stdout.write(colors.green + msg + colors.reset + '\n');
}

function warn(msg: string): void {
	process.stdout.write(colors.yellow + msg + colors.reset + '\n');
}

function info(msg: string): void {
	process.stdout.write(colors.blue + msg + colors.reset + '\n');
}

async function question(prompt: string): Promise<string> {
	const answer = await readline.question(colors.bold + prompt + colors.reset + ' ');
	return answer.trim();
}

async function confirm(prompt: string): Promise<boolean> {
	const answer = await question(prompt + ' ' + colors.dim + '(yes/no)' + colors.reset + ':');
	return /^(y|yes)$/i.test(answer);
}

/**
 * Execute a shell command and return stdout, stderr, and exit code
 */
function executeCommand(
	command: string,
	args: string[]
): Promise<{ stdout: string; stderr: string; code: number }> {
	return new Promise((resolve) => {
		const proc = spawn(command, args, {
			stdio: ['pipe', 'pipe', 'pipe'],
			shell: true
		});

		let stdout = '';
		let stderr = '';

		proc.stdout?.on('data', (data: Buffer) => {
			stdout += data.toString();
		});

		proc.stderr?.on('data', (data: Buffer) => {
			stderr += data.toString();
		});

		proc.on('close', (code: number | null) => {
			resolve({
				stdout: stdout.trim(),
				stderr: stderr.trim(),
				code: code ?? 1
			});
		});
	});
}

async function checkWranglerLogin(): Promise<boolean> {
	info('\n📋 Checking Wrangler authentication...');
	const result = await executeCommand('wrangler', ['whoami']);

	if (result.code !== 0) {
		error('\n❌ Not logged into Wrangler!');
		print('Please run: ' + colors.bold + 'wrangler login' + colors.reset);
		print('Then try again.');
		return false;
	}

	success('✅ Logged in as: ' + result.stdout);
	return true;
}

async function createD1Database(prefix: string): Promise<string | null> {
	const dbName = `${prefix}-db`;

	warn('\n⚠️  About to create Cloudflare D1 database');
	print('Database name: ' + colors.bold + dbName + colors.reset);
	print('This will create a new D1 database in your Cloudflare account.');
	print(colors.dim + '(D1 is covered under Cloudflare\'s free tier.)' + colors.reset);

	const shouldProceed = await confirm('\nProceed?');
	if (!shouldProceed) {
		print('Skipped D1 database creation.');
		return null;
	}

	print('\n🔄 Creating D1 database...');
	const result = await executeCommand('wrangler', ['d1', 'create', dbName]);

	if (result.code !== 0) {
		if (result.stderr.includes('already exists')) {
			error('Database already exists.');
			const shouldRetry = await confirm('Continue anyway?');
			if (!shouldRetry) return null;
		} else {
			error('Error creating D1 database:');
			error(result.stderr);
			const shouldRetry = await confirm('Continue anyway?');
			if (!shouldRetry) return null;
		}
	}

	// Extract binding ID from output
	const idMatch = result.stdout.match(/id = "([^"]+)"/);
	if (idMatch) {
		success('✅ D1 database created: ' + idMatch[1]);
		return idMatch[1];
	}

	print('Wrangler output:');
	print(result.stdout);
	warn('Could not extract database ID. Check wrangler output above.');
	return null;
}

async function createKVNamespace(prefix: string): Promise<string | null> {
	const nsName = `${prefix}-kv`;

	warn('\n⚠️  About to create Cloudflare KV namespace');
	print('Namespace name: ' + colors.bold + nsName + colors.reset);
	print('This will create a new KV namespace in your Cloudflare account.');
	print(colors.dim + '(KV is covered under Cloudflare\'s free tier.)' + colors.reset);

	const shouldProceed = await confirm('\nProceed?');
	if (!shouldProceed) {
		print('Skipped KV namespace creation.');
		return null;
	}

	print('\n🔄 Creating KV namespace...');
	const result = await executeCommand('wrangler', ['kv', 'namespace', 'create', nsName]);

	if (result.code !== 0) {
		if (result.stderr.includes('already exists')) {
			error('Namespace already exists.');
			const shouldRetry = await confirm('Continue anyway?');
			if (!shouldRetry) return null;
		} else {
			error('Error creating KV namespace:');
			error(result.stderr);
			const shouldRetry = await confirm('Continue anyway?');
			if (!shouldRetry) return null;
		}
	}

	// Extract binding ID from output
	const idMatch = result.stdout.match(/id = "([^"]+)"/);
	if (idMatch) {
		success('✅ KV namespace created: ' + idMatch[1]);
		return idMatch[1];
	}

	print('Wrangler output:');
	print(result.stdout);
	warn('Could not extract namespace ID. Check wrangler output above.');
	return null;
}

async function createR2Bucket(prefix: string): Promise<string | null> {
	const bucketName = `${prefix}-bucket`;

	warn('\n⚠️  About to create Cloudflare R2 bucket');
	print('Bucket name: ' + colors.bold + bucketName + colors.reset);
	print('This will create a new R2 bucket in your Cloudflare account.');
	print(
		colors.dim + '(R2 is covered under Cloudflare\'s free tier with 10GB/month included.)' +
			colors.reset
	);

	const shouldProceed = await confirm('\nProceed?');
	if (!shouldProceed) {
		print('Skipped R2 bucket creation.');
		return null;
	}

	print('\n🔄 Creating R2 bucket...');
	const result = await executeCommand('wrangler', ['r2', 'bucket', 'create', bucketName]);

	if (result.code !== 0) {
		if (result.stderr.includes('already exists')) {
			error('Bucket already exists.');
			const shouldRetry = await confirm('Continue anyway?');
			if (!shouldRetry) return null;
		} else {
			error('Error creating R2 bucket:');
			error(result.stderr);
			const shouldRetry = await confirm('Continue anyway?');
			if (!shouldRetry) return null;
		}
	}

	success('✅ R2 bucket created: ' + bucketName);
	return bucketName;
}

function printSummary(
	prefix: string,
	dbId: string | null,
	kvId: string | null,
	bucketName: string | null
): void {
	print('\n' + colors.bold + colors.blue + '═══════════════════════════════════════════' + colors.reset);
	print(colors.bold + colors.blue + '  Provisioning Complete' + colors.reset);
	print(colors.bold + colors.blue + '═══════════════════════════════════════════' + colors.reset);

	print('\n📋 Resource Summary:');
	print('Prefix: ' + colors.bold + prefix + colors.reset);

	if (dbId) {
		print(colors.green + '✅' + colors.reset + ' D1 Database ID: ' + colors.bold + dbId + colors.reset);
	} else {
		print(colors.dim + '⊘ D1 Database' + colors.reset + ' (skipped or failed)');
	}

	if (kvId) {
		print(colors.green + '✅' + colors.reset + ' KV Namespace ID: ' + colors.bold + kvId + colors.reset);
	} else {
		print(colors.dim + '⊘ KV Namespace' + colors.reset + ' (skipped or failed)');
	}

	if (bucketName) {
		print(colors.green + '✅' + colors.reset + ' R2 Bucket: ' + colors.bold + bucketName + colors.reset);
	} else {
		print(colors.dim + '⊘ R2 Bucket' + colors.reset + ' (skipped or failed)');
	}

	print('\n📝 Add these bindings to your ' + colors.bold + 'wrangler.jsonc' + colors.reset + ':');
	print(
		colors.dim +
			'(Full format at https://developers.cloudflare.com/workers/runtime-apis/bindings/)' +
			colors.reset
	);

	if (dbId) {
		print('\n  "d1_databases": [');
		print('    {');
		print('      "binding": "DB",');
		print('      "database_name": "' + prefix + '-db",');
		print('      "database_id": "' + dbId + '"');
		print('    }');
		print('  ],');
	}

	if (kvId) {
		print('\n  "kv_namespaces": [');
		print('    {');
		print('      "binding": "KV",');
		print('      "id": "' + kvId + '"');
		print('    }');
		print('  ],');
	}

	if (bucketName) {
		print('\n  "r2_buckets": [');
		print('    {');
		print('      "binding": "R2",');
		print('      "bucket_name": "' + bucketName + '"');
		print('    }');
		print('  ]');
	}

	print(
		'\n' + colors.dim + 'Paste the bindings above into your wrangler.jsonc inside the main object.' +
			colors.reset
	);
}

async function main(): Promise<void> {
	print(
		colors.bold +
			colors.blue +
			'\n╭─ eventful provisioning wizard ─╮' +
			colors.reset
	);
	print('This will help you set up Cloudflare resources for your eventful deployment.');
	print(
		colors.dim +
			'(All resources below are free-tier eligible under Cloudflare\'s standard pricing.)' +
			colors.reset
	);

	// Check authentication
	const isLoggedIn = await checkWranglerLogin();
	if (!isLoggedIn) {
		readline.close();
		process.exit(1);
	}

	// Get project prefix
	print('\n' + colors.bold + 'Step 1: Project Prefix' + colors.reset);
	print(
		'This prefix will be used to name your resources: ${prefix}-db, ${prefix}-kv, ${prefix}-bucket'
	);
	let prefix = '';
	while (!prefix) {
		prefix = await question('Enter a prefix (e.g., "myevent"):');
		if (!prefix.match(/^[a-z0-9][a-z0-9-]*$/)) {
			error(
				'Invalid prefix. Use lowercase letters, numbers, and hyphens only (no leading hyphens).'
			);
			prefix = '';
		}
	}

	// Create resources
	print('\n' + colors.bold + 'Step 2: Create Resources' + colors.reset);
	const dbId = await createD1Database(prefix);
	const kvId = await createKVNamespace(prefix);
	const bucketName = await createR2Bucket(prefix);

	// Print summary
	printSummary(prefix, dbId, kvId, bucketName);

	print(
		'\n💡 Next steps:' +
			'\n  1. Update wrangler.jsonc with the binding IDs above' +
			'\n  2. Run: ' +
			colors.bold +
			'bun run build' +
			colors.reset +
			'\n  3. Deploy: ' +
			colors.bold +
			'bun run deploy' +
			colors.reset +
			'\n'
	);

	readline.close();
}

main().catch((err) => {
	error('Fatal error: ' + String(err));
	readline.close();
	process.exit(1);
});
