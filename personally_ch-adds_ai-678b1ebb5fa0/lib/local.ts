import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';


const execAsync = promisify(exec);


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
	const hostsPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts';
	const hostsEntry = `\n127.0.0.1\t${domain}`;

	try {
		// Check for admin privileges
		const hasAdmin = await isAdmin();
		if (!hasAdmin) {
			return false;
		}

		// Read current hosts file
		const hostsContent = fs.readFileSync(hostsPath, 'utf8');

		// Check if domain already exists in hosts file
		if (hostsContent.includes(domain)) {
			console.log(`Domain ${domain} already exists in hosts file`);
			return false;
		}

		// Append new domain to hosts file
		fs.appendFileSync(hostsPath, hostsEntry);

		// Flush DNS cache (Windows)
		try {
			await execAsync('ipconfig /flushdns');
			console.log('DNS cache flushed successfully');
		} catch (error) {
			console.warn('Failed to flush DNS cache:', error);
			// Continue even if DNS flush fails
		}

		console.log(`Added ${domain} to hosts file successfully`);
	} catch (error) {
		console.error('Error modifying hosts file:', error);
		return false;
	}
	return true;
}

// Function to remove domain from hosts file
export async function removeFromHosts(domain: string): Promise<boolean> {
	const hostsPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts';
    const hostsEntry = `\n127.0.0.1\t${domain}`;

	try {
		// Check for admin privileges
		const hasAdmin = await isAdmin();
		if (!hasAdmin) {
			console.warn('Administrator privileges required to remove domain from hosts file. Please remove the following entry manually: ' + hostsEntry);
			return false;
		}

		// Read current hosts file
		const hostsContent = fs.readFileSync(hostsPath, 'utf8');

		// Remove the domain entry
		const newContent = hostsContent.replace(new RegExp(hostsEntry, 'g'), '');

		// Write back the modified content
		fs.writeFileSync(hostsPath, newContent);

		// Flush DNS cache
		try {
			await execAsync('ipconfig /flushdns');
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
	try {
		// Run certbot to install SSL certificate for the domain
		const { stdout, stderr } = await execAsync(`sudo certbot --nginx -d ${domain} --non-interactive --agree-tos --register-unsafely-without-email`);
		console.log('Certbot output:', stdout, stderr);
		return true;
	} catch (error) {
		console.error('Error installing SSL certificate:', error);
		return false;
	}
}