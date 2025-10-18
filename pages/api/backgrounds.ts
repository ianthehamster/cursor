import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Helper function to extract scenario from filename
function extractScenario(filename: string, character: string): string {
  if (character === 'jinx') {
    // For Jinx: "jinx karate 1.png" -> "karate"
    const match = filename.match(/jinx\s+(.+?)\s+\d+\./i);
    return match ? match[1].toLowerCase() : 'default';
  } else {
    // For Chloe: Handle both "picture1-chloe-couch-sleeping-1.png" and "picture4-chloe whisking 3.png"
    // Try pattern with dashes first
    let match = filename.match(/picture\d+-chloe-(.+?)-\d+\./i);
    if (match) {
      return match[1].toLowerCase();
    }

    // Try pattern with spaces (after chloe)
    match = filename.match(/picture\d+-chloe\s+(.+?)\s+\d+\./i);
    if (match) {
      return match[1].toLowerCase();
    }

    return 'default';
  }
}

// Group images by scenario
function groupImagesByScenario(files: string[], character: string): Record<string, string[]> {
  const scenarios: Record<string, string[]> = {};

  files.forEach(file => {
    const scenario = extractScenario(file, character);
    if (!scenarios[scenario]) {
      scenarios[scenario] = [];
    }
    scenarios[scenario].push(file);
  });

  return scenarios;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { character, scenario } = req.query;

    // Normalize character name (case-insensitive, defaults to 'chloe')
    let characterFolder = 'chloe';
    if (typeof character === 'string') {
      const normalizedChar = character.toLowerCase();
      if (normalizedChar === 'jinx') {
        characterFolder = 'jinx';
      } else if (normalizedChar === 'mf' || normalizedChar === 'chloe') {
        characterFolder = 'chloe';
      }
    }

    const characterDir = path.join(process.cwd(), 'public', characterFolder);

    // Check if character folder exists
    if (!fs.existsSync(characterDir)) {
      return res.status(404).json({ error: `Character folder not found: ${characterFolder}` });
    }

    const files = fs.readdirSync(characterDir);

    // Filter for image files (png, jpg, jpeg, webp, gif)
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });

    // Group images by scenario
    const scenarioGroups = groupImagesByScenario(imageFiles, characterFolder);

    // If no scenario specified, return available scenarios
    if (!scenario) {
      return res.status(200).json({
        scenarios: Object.keys(scenarioGroups),
        allScenarios: scenarioGroups
      });
    }

    // Get images for the specified scenario
    const scenarioImages = scenarioGroups[scenario as string] || [];

    if (scenarioImages.length === 0) {
      return res.status(404).json({
        error: `No images found for scenario: ${scenario}`,
        availableScenarios: Object.keys(scenarioGroups)
      });
    }

    // Sort images within the scenario and map to full paths
    const backgroundImages = scenarioImages
      .sort((a, b) => {
        // Extract numbers from filenames for sorting
        const getNumber = (filename: string) => {
          const match = filename.match(/(\d+)\.png$/i);
          return match ? parseInt(match[1], 10) : 999;
        };
        return getNumber(a) - getNumber(b);
      })
      .map(file => `/${characterFolder}/${file}`);

    res.status(200).json({ images: backgroundImages, scenario });
  } catch (error) {
    console.error('Error reading background images:', error);
    res.status(500).json({ error: 'Failed to read background images' });
  }
}
