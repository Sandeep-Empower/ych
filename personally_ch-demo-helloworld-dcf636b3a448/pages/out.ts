// pages/redirect.tsx
import { GetServerSideProps } from 'next';

const KNOWN_BOTS = [/selenium/i, /headless/i, /phantomjs/i, /chrome-lighthouse/i];

function isKnownBot(userAgent: string) {
  return KNOWN_BOTS.some(pattern => pattern.test(userAgent));
}

function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export const getServerSideProps: GetServerSideProps = async ({ req, query }) => {
  const userAgent = req.headers['user-agent'] ?? '';
  const secChUa = req.headers['sec-ch-ua'] || '';
  const redirectUrl = typeof query.url === 'string' ? query.url : '/';

  // 1. JS detection
  if (query.js !== '1') {
    console.warn('JavaScript not detected, redirecting to home page');
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  // 2. Header consistency
  if (secChUa && typeof userAgent === 'string' && !userAgent.includes((secChUa as string).replace(/"/g, ''))) {
    console.warn('Inconsistent headers detected, redirecting to home page');
    return {
      redirect: {
        destination: '/?reason=inconsistentheaders',
        permanent: false,
      },
    };
  }

  // 3. Known bot detection
  if (typeof userAgent === 'string' && isKnownBot(userAgent)) {
    console.warn('Known bot detected, redirecting to home page');
    return {
      redirect: {
        destination: '/?reason=automation',
        permanent: false,
      },
    };
  }

  if (isKnownBot(userAgent)) {
    console.warn('Known bot detected, redirecting to home page');
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  // 6. URL validation and click tracking
  if (!isValidUrl(redirectUrl)) {
    console.warn('Invalid URL detected, redirecting to home page');
    return {
      redirect: {
        destination: '/?reason=nourl',
        permanent: false,
      },
    };
  }

  // Optional: click tracking
  const clickId = query.ci as string;
  const keyword = query.keyword as string;
  if (clickId) {
    const postbackUrl = `https://boostyoffers.com/cf/cv?click_id=${encodeURIComponent(clickId)}&ct=click&param1=${encodeURIComponent(keyword || '')}`;
    try {
      const response = await fetch(postbackUrl, { method: 'GET' });
      if (!response.ok) {
        console.error('Failed to send click postback:', response.statusText);
      }
      const responseData = await response.json();
    } catch (e) {
      // Log error if needed
      console.error('Error sending click postback:', e);
    }
  }

  return {
    redirect: {
      destination: redirectUrl,
      permanent: false,
    },
  };
};

export default function RedirectPage() {
  // This will never actually render because of the redirects in getServerSideProps
  return null;
}
