// GitHub integration using Replit connector
import { Octokit } from '@octokit/rest'

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

export async function createRepository(repoName: string, description: string = '') {
  const octokit = await getUncachableGitHubClient();
  
  try {
    const response = await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      description,
      private: false,
      auto_init: true  // Initialize with README to create default branch
    });
    
    // Wait a bit for GitHub to initialize the repository
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return response.data;
  } catch (error: any) {
    throw new Error(`Failed to create repository: ${error.message}`);
  }
}

export async function pushFiles(owner: string, repo: string, files: Array<{path: string, content: string}>, message: string = 'Initial commit') {
  const octokit = await getUncachableGitHubClient();
  
  // Push files one by one using the Contents API (works for empty repos too)
  let count = 0;
  for (const file of files) {
    try {
      // Check if file exists
      let existingSha: string | undefined;
      try {
        const existing = await octokit.repos.getContent({
          owner,
          repo,
          path: file.path
        });
        if (!Array.isArray(existing.data) && 'sha' in existing.data) {
          existingSha = existing.data.sha;
        }
      } catch (e) {
        // File doesn't exist
      }
      
      // Create or update file
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: file.path,
        message: existingSha ? `Update ${file.path}` : `Add ${file.path}`,
        content: Buffer.from(file.content).toString('base64'),
        sha: existingSha
      });
      count++;
      
      // Log progress
      if (count % 10 === 0) {
        console.log(`Pushed ${count}/${files.length} files...`);
      }
    } catch (error: any) {
      console.error(`Failed to push ${file.path}:`, error.message);
    }
  }
  
  console.log(`Pushed ${count}/${files.length} files total`);
  return { filesUploaded: count };
}
