
import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';

const app = express();
const port = 3001;

// Enable CORS for the React dev server
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json({ limit: '50mb' })); // Increase payload size limit

// Root route for backend status
app.get('/', (req, res) => {
    res.send('Backend server is running. Access the frontend at http://localhost:3000');
});


const dataDir = path.join(__dirname, '../src/work_list');

// Files hidden from admin UI (auto-managed or deprecated)
const hiddenFiles = new Set([
    'experience.csv',
    'portfolioMap.json',
    'publish.csv',
]);

// Endpoint to get the list of manageable files
app.get('/api/data-files', async (req, res) => {
    try {
        const files = await fs.readdir(dataDir);
        const manageableFiles = files.filter(file =>
            (file.endsWith('.json') || file.endsWith('.csv')) && !hiddenFiles.has(file)
        );
        res.json(manageableFiles);
    } catch (error) {
        console.error('Error reading data directory:', error);
        res.status(500).json({ message: 'Error reading data directory' });
    }
});

// Endpoint to get the content of a specific file
app.get('/api/data-files/:filename', async (req, res) => {
    const { filename } = req.params;
    // Basic security check to prevent path traversal
    if (filename.includes('..')) {
        return res.status(400).json({ message: 'Invalid filename' });
    }
    const filePath = path.join(dataDir, filename);

    try {
        const content = await fs.readFile(filePath, 'utf-8');
        res.send(content);
    } catch (error) {
        console.error(`Error reading file ${filename}:`, error);
        res.status(500).json({ message: `Error reading file ${filename}` });
    }
});

// Helper: regenerate portfolioMap.json from allWorkData.json content
async function syncPortfolioMap(allWorkDataContent: string): Promise<void> {
    try {
        const allWorkData = JSON.parse(allWorkDataContent);
        const portfolioMap: Record<string, string> = {};
        for (const [code, detail] of Object.entries(allWorkData)) {
            const d = detail as any;
            // Use tableName first, then fullName, then code itself as fallback
            portfolioMap[code] = (d.tableName || d.fullName || code).replace(/\n/g, ' ').trim();
        }
        const mapPath = path.join(dataDir, 'portfolioMap.json');
        await fs.writeFile(mapPath, JSON.stringify(portfolioMap, null, 2) + '\n', 'utf-8');
        console.log(`portfolioMap.json synced (${Object.keys(portfolioMap).length} entries)`);
    } catch (err) {
        console.error('Failed to sync portfolioMap.json:', err);
    }
}

// Endpoint to update a specific file
app.post('/api/data-files/:filename', async (req, res) => {
    const { filename } = req.params;
    const { content } = req.body;

    // Basic security check
    if (filename.includes('..')) {
        return res.status(400).json({ message: 'Invalid filename' });
    }
    const filePath = path.join(dataDir, filename);

    try {
        await fs.writeFile(filePath, content, 'utf-8');

        // Auto-sync portfolioMap.json when allWorkData.json is saved
        if (filename === 'allWorkData.json') {
            await syncPortfolioMap(content);
        }

        res.json({ message: `${filename} updated successfully` });
    } catch (error) {
        console.error(`Error writing to file ${filename}:`, error);
        res.status(500).json({ message: `Error writing to file ${filename}` });
    }
});


app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});
