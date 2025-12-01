import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createRepository, pushFiles, getUncachableGitHubClient } from "./github";
import * as fs from "fs";
import * as path from "path";

function getAllFiles(dirPath: string, basePath: string = ''): Array<{path: string, content: string}> {
  const files: Array<{path: string, content: string}> = [];
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const relativePath = basePath ? `${basePath}/${item}` : item;
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (item !== 'node_modules' && item !== 'dist' && item !== '.git' && !item.startsWith('.')) {
        files.push(...getAllFiles(fullPath, relativePath));
      }
    } else {
      if (!item.endsWith('.log') && !item.startsWith('.')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          files.push({ path: relativePath, content });
        } catch (e) {
          // Skip binary files
        }
      }
    }
  }
  
  return files;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // GitHub push endpoint
  app.post('/api/github/push', async (req, res) => {
    try {
      const { repoName } = req.body;
      
      if (!repoName) {
        return res.status(400).json({ error: 'Repository name is required' });
      }
      
      // Get authenticated user
      const octokit = await getUncachableGitHubClient();
      const { data: user } = await octokit.users.getAuthenticated();
      const owner = user.login;
      
      // Check if repository exists
      let repoExists = false;
      try {
        await octokit.repos.get({ owner, repo: repoName });
        repoExists = true;
      } catch (error) {
        // Repository doesn't exist
      }
      
      // Create repository if it doesn't exist
      if (!repoExists) {
        await createRepository(repoName, 'Texas Hold\'em Hand Strength Trainer - A poker training game');
        // Wait for GitHub to initialize the repository with README
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      // Get all project files
      const projectRoot = process.cwd();
      const files = getAllFiles(projectRoot);
      
      // Push files to GitHub
      await pushFiles(owner, repoName, files, 'Upload poker trainer project from Replit');
      
      res.json({ 
        success: true, 
        url: `https://github.com/${owner}/${repoName}`,
        message: `Successfully pushed to GitHub: ${owner}/${repoName}`
      });
    } catch (error: any) {
      console.error('GitHub push error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
