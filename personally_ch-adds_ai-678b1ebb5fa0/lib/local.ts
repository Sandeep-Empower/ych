import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { validateDomain } from './security';

const execFileAsync = promisify(execFile);

// Function to check if running with admin privileges
export async function isAdmin(): Promise<boolean> {
	try {
		// Try to write to a protected directory
		const testPath = 'C:\\Windows\\System32\\drivers\\etc\\test.txt';
		fs.writeFileSync(testPath, 'test');
		fs.unlinkSync(testPath);
		return true;
	} catch (error) {
		return false;
	}
}

// Function to create local configuration for a domain
export async function createLocalConfig(domain: string): Promise<boolean> {
	// SECURITY: Validate domain before any operations
	const validation = validateDomain(domain);
	if (!validation.isValid) {
		console.error(`Invalid domain for hosts file: ${validation.error}`);
		return false;
	}

	const safeDomain = validation.sanitized!;
	const hostsPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts';
	const hostsEntry = `\n127.0.0.1\t${safeDomain}`;

	try {
		// Check for admin privileges
		const hasAdmin = await isAdmin();
		if (!hasAdmin) {
			return false;
		}

		// Read current hosts file
		const hostsContent = fs.readFileSync(hostsPath, 'utf8');

		// Check if domain already exists in hosts file (exact match with escaped regex)
		const escapedDomain = safeDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const domainPattern = new RegExp(`^127\\.0\\.0\\.1\\s+${escapedDomain}$`, 'm');
		if (domainPattern.test(hostsContent)) {
			console.log(`Domain ${safeDomain} already exists in hosts file`);
			return false;
		}

		// Append new domain to hosts file
		fs.appendFileSync(hostsPath, hostsEntry);

		// Flush DNS cache (Windows) - using execFile for safety
		try {
			await execFileAsync('ipconfig', ['/flushdns']);
			console.log('DNS cache flushed successfully');
		} catch (error) {
			console.warn('Failed to flush DNS cache:', error);
			// Continue even if DNS flush fails
		}

		console.log(`Added ${safeDomain} to hosts file successfully`);
	} catch (error) {
		console.error('Error modifying hosts file:', error);
		return false;
	}
	return true;
}

// Function to remove domain from hosts file
export async function removeFromHosts(domain: string): Promise<boolean> {
	// SECURITY: Validate domain before any operations
	const validation = validateDomain(domain);
	if (!validation.isValid) {
		console.error(`Invalid domain for hosts removal: ${validation.error}`);
		return false;
	}

	const safeDomain = validation.sanitized!;
	const hostsPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts';
	const hostsEntry = `\n127.0.0.1\t${safeDomain}`;

	try {
		// Check for admin privileges
		const hasAdmin = await isAdmin();
		if (!hasAdmin) {
			console.warn('Administrator privileges required to remove domain from hosts file.');
			return false;
		}

		// Read current hosts file
		const hostsContent = fs.readFileSync(hostsPath, 'utf8');

		// Remove the domain entry using escaped regex to prevent ReDoS
		const escapedEntry = hostsEntry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const newContent = hostsContent.replace(new RegExp(escapedEntry, 'g'), '');

		// Write back the modified content
		fs.writeFileSync(hostsPath, newContent);

		// Flush DNS cache using execFile (safe)
		try {
			await execFileAsync('ipconfig', ['/flushdns']);
		} catch (error) {
			console.warn('Failed to flush DNS cache during cleanup:', error);
		}
	} catch (error) {
		console.error('Error removing domain from hosts file:', error);
		// Don't throw error here since this is cleanup code
	}
	return true;
}

export async function installSSLCertificate(domain: string): Promise<boolean> {
	// SECURITY: Validate domain BEFORE any command execution
	const validation = validateDomain(domain);
	if (!validation.isValid) {
		console.error(`SSL installation rejected - invalid domain: ${validation.error}`);
		throw new Error(`Invalid domain: ${validation.error}`);
	}

	const safeDomain = validation.sanitized!;

	try {
		// SECURITY: Use execFile instead of exec to prevent command injection
		// execFile does NOT interpret shell metacharacters - arguments passed as array
		const { stdout, stderr } = await execFileAsync('sudo', [
			'certbot',
			'--nginx',
			'-d', safeDomain,
			'--non-interactive',
			'--agree-tos',
			'--register-unsafely-without-email'
		]);
		console.log('Certbot output:', stdout, stderr);
		return true;
	} catch (error) {
		console.error('Error installing SSL certificate:', error);
		return false;
	}
}
