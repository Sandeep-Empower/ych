import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCloudflareDNSId, getCloudflareDomainZoneID, removeCloudflareDNSRecord, removeServerSSL } from '@/lib/cloudflare';
import { removeFromHosts } from '@/lib/local';
import { deleteFilesFromSpaces } from '@/lib/do-spaces';


export async function DELETE(request: NextRequest) {
    try {
      const { site_id } = await request.json();
      if (!site_id) {
        return NextResponse.json({ error: 'site_id is required' }, { status: 400 });
      }
  
      // Find the site by domain
      const site = await prisma.site.findUnique({ where: { id: site_id } });
      if (!site) {
        return NextResponse.json({ error: 'Site not found' }, { status: 404 });
      }
  
      // Delete related data: SiteMeta, StaticPage, ArticleTag, Article
      await prisma.siteMeta.deleteMany({ where: { site_id: site.id } });

      await prisma.staticPage.deleteMany({ where: { site_id: site.id } });

      // Delete all the contact form submissions
      await prisma.contact.deleteMany({ where: { site_id: site.id } });

      // Delete ArticleTags for all articles of this site
      const articles = await prisma.article.findMany({ where: { site_id: site.id }, select: { id: true } });

      // Delete all the files in the spaces
      await deleteFilesFromSpaces(site.id);

      const articleIds = articles.map(a => a.id);
      if (articleIds.length > 0) {
        await prisma.articleTag.deleteMany({ where: { article_id: { in: articleIds } } });
      }

      await prisma.article.deleteMany({ where: { site_id: site.id } });

      // Finally, delete the site
      await prisma.site.delete({ where: { id: site.id } });

      // Remove Cloudflare A record and SSL certificate
      if (process.env.APP_ENV !== 'production' && process.env.APP_ENV !== 'staging') {
        await removeFromHosts(site.domain);
      } else {
        const domainIP = process.env.APP_IPv4;
        const domain = site.domain;
        const zoneID = await getCloudflareDomainZoneID(domain);
        const dnsID = await getCloudflareDNSId(zoneID, domainIP || '', domain || '' );
        await removeCloudflareDNSRecord(zoneID, dnsID);
        
        // Remove SSL certificate from the server
        try {
          await removeServerSSL(domain);
        } catch (sslError) {
          console.warn(`Failed to remove SSL certificate from server for ${domain}:`, sslError);
          // Continue with deletion even if SSL removal fails
        }
      }
  
      return NextResponse.json({ success: true, message: 'Site and all related data deleted, Cloudflare A record and SSL certificate removed.' });
    } catch (error) {
      console.error('Error deleting site and related data:', error);
      return NextResponse.json({ error: 'Failed to delete site and related data.' }, { status: 500 });
    }
  }
  