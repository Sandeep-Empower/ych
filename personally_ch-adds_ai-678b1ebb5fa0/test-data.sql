-- Insert test site
INSERT INTO sites (domain, site_name, tagline, theme_color, company, email)
VALUES (
    'earlycomputing.uk',
    'Early Computing',
    'Exploring the History of Computing',
    '#2563eb',
    'Early Computing Ltd',
    'contact@earlycomputing.uk'
);

-- Insert test articles
INSERT INTO articles (site_id, title, content, meta_description, tags)
SELECT 
    id,
    'The First Computer',
    'The history of computing begins with the abacus...',
    'A look at the first mechanical computing devices',
    ARRAY['history', 'computing', 'mechanical']
FROM sites
WHERE domain = 'earlycomputing.uk';

-- Insert test pages
INSERT INTO pages (site_id, page_key, title, content)
SELECT 
    id,
    'home',
    'Welcome to Early Computing',
    'Discover the fascinating history of computing...'
FROM sites
WHERE domain = 'earlycomputing.uk';

INSERT INTO pages (site_id, page_key, title, content)
SELECT 
    id,
    'about',
    'About Us',
    'We are dedicated to preserving and sharing the history of computing...'
FROM sites
WHERE domain = 'earlycomputing.uk'; 