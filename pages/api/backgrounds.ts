import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const files = fs.readdirSync(publicDir);

    // Filter for image files (png, jpg, jpeg, webp, gif)
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
    const backgroundImages = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        // Only include files that start with 'chloe' and are images
        return file.startsWith('chloe') && imageExtensions.includes(ext);
      })
      .map(file => `/${file}`);

    res.status(200).json({ images: backgroundImages });
  } catch (error) {
    console.error('Error reading background images:', error);
    res.status(500).json({ error: 'Failed to read background images' });
  }
}
