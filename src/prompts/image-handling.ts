/**
 * IMAGE HANDLING PROMPT - Compressed
 */

export const IMAGE_HANDLING_PROMPT = `
## EXTERNAL IMAGES - CONFIGURATION REQUIRED

KEYWORDS: image, photo, gallery, movie, poster, TMDB, Unsplash, Pexels

### STEP 1: Configure next.config.ts FIRST
\`\`\`ts
const config = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org', pathname: '/t/p/**' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
    ],
  },
};
export default config;
\`\`\`

### STEP 2: Use Image Component
\`\`\`tsx
import Image from 'next/image';

<Image 
  src="https://image.tmdb.org/t/p/w500/abc.jpg"
  alt="Movie poster"
  width={500}
  height={750}
/>
\`\`\`

### RULES
✅ Always use Image from 'next/image' (not <img>)
✅ Always include width + height
✅ Always include alt text
✅ Add domain to remotePatterns BEFORE using

### COMMON ERRORS
❌ "Invalid src prop, hostname not configured" → Add to remotePatterns
❌ Missing width/height → Add dimensions
❌ Using <img> → Use <Image>

### COMMON DOMAINS
- TMDB: image.tmdb.org
- Unsplash: images.unsplash.com, source.unsplash.com
- Pexels: images.pexels.com
- Pixabay: pixabay.com
`;

export default IMAGE_HANDLING_PROMPT;
