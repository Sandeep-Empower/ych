"use server"

import { execFile } from 'child_process';
import { promisify } from 'util';
import { validateDomain } from './security';

const execFileAsync = promisify(execFile);

/**
 * Verify if a domain exists in Cloudflare.
 * @param {string} domain - The domain to verify.
 * @return {Promise<string | false>} - Returns Zone ID if the domain exists, false otherwise.
 */
export async function getCloudflareDomainZoneID(domain: string): Promise<string | false> {
    try {
        if(process.env.APP_ENV === "staging") {
            // Remove the dev. from the domain
            domain = domain.replace('dev.', '');
        }
        const response = await fetch(`https://api.cloudflare.com/client/v4/zones?name=${domain}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Cloudflare API error:', response.statusText);
            return false;
        }

        const data = await response.json();
        return data.success && data.result.length > 0 ? data.result[0].id : false;
    } catch (error) {
        console.error('Error verifying domain with Cloudflare:', error);
        return false;
    }
    
}

/**
 * List all DNS records for a zone.
 * @param {string} zoneID - The zone ID.
 * @return {Promise<string | false>} - Returns Zone ID if the domain exists, false otherwise.
 */
export async function getCloudflareDNSId(zoneID: string|boolean, domainIP: string, domain: string): Promise<string | false> {
    if(!zoneID){
        return false;
    }
    try {
        const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneID}/dns_records`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Cloudflare API error:', response.statusText);
            return false;
        }

        const data = await response.json();
        const record = data.result.find((record: any) => record.content === domainIP && record.name === domain);
        return record ? record.id : false;
    } catch (error) {
        console.error('Error verifying domain with Cloudflare:', error);
        return false;
    }
    
}


export async function createCloudflareDNSRecord(zoneID: string) {
    try {
        const domainName = process.env.APP_ENV === "staging" ? 'dev' : '@';
        const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneID}/dns_records`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json',
            },  
            body: JSON.stringify({
                "name": domainName,
                "ttl": 3600,
                "type": "A",
                "comment": "Dynamic website generator (adds-ai)",
                "content": process.env.APP_IPv4,
                "proxied": true
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            const errors = data.errors as Array<{code: number, message: string}>;
            const identicle = errors.some((error)=>{
                return error.code === 81058;
            });
            if(!identicle) {
                console.error('An identical record already exists.');
                return {success: false, error: "An identical record already exists."};
            } else {
                console.error('Cloudflare API error:', data.errors[0].message);
                return {success: false, error: data.errors[0].message};
            }
        }
        return {success: true, error: "", id: data.result?.id};
    } catch (error) {
        console.error('Error creating Cloudflare DNS record:', error);
        return {success: false, error: "An unexpected error occurred while creating the site. Please try again or contact support if the issue persists."};
    }
}


/**
 * Remove a Cloudflare DNS record.
 * @param {string} zoneID - The zone ID to remove the record from.
 * @return {Promise<boolean>} - Returns true if the record is removed, false otherwise.
 */
export async function removeCloudflareDNSRecord(zoneID: string|boolean, dnsID: string|boolean) {
    if(!zoneID){
        return;
    }
    try {
        const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneID}/dns_records/${dnsID}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            console.error('Cloudflare API error:', response.statusText);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error removing Cloudflare DNS record:', error);
        return false;
    }
}

/**
 * Remove SSL certificate for a domain from the server.
 * @param {string} domain - The domain to remove SSL from.
 * @return {Promise<boolean>} - Returns true if SSL is removed, false otherwise.
 */
export async function removeServerSSL(domain: string): Promise<boolean> {
    // SECURITY: Validate domain BEFORE any command execution
    const validation = validateDomain(domain);
    if (!validation.isValid) {
        console.error(`SSL removal rejected - invalid domain: ${validation.error}`);
        return false;
    }

    const safeDomain = validation.sanitized!;

    try {
        console.log(`Removing SSL certificate from server for domain: ${safeDomain}`);

        // Step 1: Revoke the existing certificate
        // SECURITY: Use execFile instead of exec - arguments are NOT shell-interpreted
        try {
            await execFileAsync('sudo', [
                'certbot',
                'revoke',
                '--cert-path', `/etc/letsencrypt/live/${safeDomain}/fullchain.pem`,
                '--reason', 'cessation_of_operation',
                '--non-interactive'
            ]);
            console.log(`Certificate revoked successfully for ${safeDomain}`);
        } catch (revokeError: any) {
            console.warn(`Warning: Failed to revoke certificate for ${safeDomain}:`, revokeError.message);
            // Continue with deletion even if revocation fails
        }

        // Step 2: Delete the certificate
        // SECURITY: Use execFile instead of exec
        try {
            await execFileAsync('sudo', [
                'certbot',
                'delete',
                '--cert-name', safeDomain,
                '--non-interactive'
            ]);
            console.log(`Certificate deleted successfully for ${safeDomain}`);
        } catch (deleteError: any) {
            console.error(`Error deleting certificate for ${safeDomain}:`, deleteError.message);
            return false;
        }

        console.log(`SSL certificate removal completed for domain: ${safeDomain}`);
        return true;

    } catch (error) {
        console.error('Error removing SSL certificate from server:', error);
        return false;
    }
}