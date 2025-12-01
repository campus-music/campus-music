import { getUncachableGitHubClient } from '../server/github-client';
import * as fs from 'fs';
import * as path from 'path';

const REPO_OWNER = 'campus-music';
const REPO_NAME = 'campus-music';
const BRANCH = 'main';
const COMMIT_MESSAGE = 'Update: Playlist detail page, search functionality, analytics security, and UI improvements';

// Files and directories to exclude
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  '.cache',
  '.config',
  '.upm',
  'dist',
  '.replit',
  'replit.nix',
  '.breakpoints',
  'scripts/list-repos.ts',
  'scripts/push-to-github.ts',
  'attached_assets',
  '.local',
  'package-lock.json',
];

function shouldExclude(filePath: string): boolean {
  return EXCLUDE_PATTERNS.some(pattern => 
    filePath.includes(pattern) || filePath.startsWith(pattern)
  );
}

function getAllFiles(dirPath: string, baseDir: string = dirPath): string[] {
  const files: string[] = [];
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const relativePath = path.relative(baseDir, fullPath);
      
      if (shouldExclude(relativePath)) continue;
      
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...getAllFiles(fullPath, baseDir));
      } else if (stat.isFile()) {
        files.push(relativePath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
  
  return files;
}

function isBinaryFile(filePath: string): boolean {
  const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.mp3', '.mp4', '.wav', '.ogg', '.woff', '.woff2', '.ttf', '.eot'];
  return binaryExtensions.some(ext => filePath.toLowerCase().endsWith(ext));
}

async function pushToGitHub() {
  try {
    const octokit = await getUncachableGitHubClient();
    const baseDir = process.cwd();
    
    console.log('Getting current commit SHA...');
    
    // Get the reference for main branch
    let baseSha: string;
    try {
      const { data: ref } = await octokit.git.getRef({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        ref: `heads/${BRANCH}`,
      });
      baseSha = ref.object.sha;
    } catch (error: any) {
      if (error.status === 404) {
        // Branch doesn't exist, create initial commit
        console.log('Branch not found, creating initial commit...');
        baseSha = '';
      } else {
        throw error;
      }
    }
    
    console.log('Collecting files...');
    const files = getAllFiles(baseDir);
    console.log(`Found ${files.length} files to upload`);
    
    // Create blobs for each file
    console.log('Creating file blobs...');
    const treeItems: Array<{
      path: string;
      mode: '100644';
      type: 'blob';
      sha: string;
    }> = [];
    
    for (const file of files) {
      const fullPath = path.join(baseDir, file);
      
      try {
        let blobSha: string;
        
        if (isBinaryFile(file)) {
          // For binary files, read as base64
          const content = fs.readFileSync(fullPath);
          const { data: blob } = await octokit.git.createBlob({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            content: content.toString('base64'),
            encoding: 'base64',
          });
          blobSha = blob.sha;
        } else {
          // For text files, read as utf-8
          const content = fs.readFileSync(fullPath, 'utf-8');
          const { data: blob } = await octokit.git.createBlob({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            content: content,
            encoding: 'utf-8',
          });
          blobSha = blob.sha;
        }
        
        treeItems.push({
          path: file,
          mode: '100644',
          type: 'blob',
          sha: blobSha,
        });
        
        process.stdout.write('.');
      } catch (error) {
        console.error(`\nError uploading ${file}:`, error);
      }
    }
    
    console.log('\n\nCreating tree...');
    
    // Create a new tree
    const { data: tree } = await octokit.git.createTree({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      tree: treeItems,
      base_tree: baseSha || undefined,
    });
    
    console.log('Creating commit...');
    
    // Create a commit
    const commitParams: any = {
      owner: REPO_OWNER,
      repo: REPO_NAME,
      message: COMMIT_MESSAGE,
      tree: tree.sha,
    };
    
    if (baseSha) {
      commitParams.parents = [baseSha];
    }
    
    const { data: commit } = await octokit.git.createCommit(commitParams);
    
    console.log('Updating branch reference...');
    
    // Update the reference
    try {
      await octokit.git.updateRef({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        ref: `heads/${BRANCH}`,
        sha: commit.sha,
      });
    } catch (error: any) {
      if (error.status === 422) {
        // Reference doesn't exist, create it
        await octokit.git.createRef({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          ref: `refs/heads/${BRANCH}`,
          sha: commit.sha,
        });
      } else {
        throw error;
      }
    }
    
    console.log(`\n✅ Successfully pushed to https://github.com/${REPO_OWNER}/${REPO_NAME}`);
    console.log(`Commit SHA: ${commit.sha}`);
    
  } catch (error) {
    console.error('Error pushing to GitHub:', error);
  }
}

pushToGitHub();
