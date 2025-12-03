// Script to push mobile app to GitHub
// Uses Replit GitHub integration (connection:conn_github_01KB4NXK8Y3A776PEF8S1HP0Z0)

import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
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

async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

// Recursively get all files in a directory
function getAllFiles(dirPath: string, basePath: string = ''): { path: string; content: string }[] {
  const files: { path: string; content: string }[] = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.join(basePath, entry.name);
    
    // Skip ignored directories and files
    if (
      entry.name === 'node_modules' ||
      entry.name === '.expo' ||
      entry.name === 'dist' ||
      entry.name === 'android' ||
      entry.name === 'ios' ||
      entry.name === '.DS_Store' ||
      entry.name.endsWith('.tmp') ||
      entry.name.endsWith('.temp')
    ) {
      continue;
    }
    
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, relativePath));
    } else {
      try {
        const content = fs.readFileSync(fullPath);
        // Check if file is binary by looking for null bytes
        const isBinary = content.includes(0);
        files.push({
          path: relativePath,
          content: isBinary ? content.toString('base64') : content.toString('utf-8')
        });
      } catch (err) {
        console.warn(`Skipping file ${relativePath}: ${err}`);
      }
    }
  }
  
  return files;
}

async function main() {
  const repoName = 'campus-music-mobile';
  const mobileDir = path.join(process.cwd(), 'mobile');
  
  console.log('🔐 Getting GitHub client...');
  const octokit = await getUncachableGitHubClient();
  
  // Get authenticated user
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`✅ Authenticated as: ${user.login}`);
  
  // Check if repo exists, create if not
  let repo;
  try {
    const { data: existingRepo } = await octokit.repos.get({
      owner: user.login,
      repo: repoName
    });
    repo = existingRepo;
    console.log(`📁 Found existing repository: ${repo.html_url}`);
  } catch (error: any) {
    if (error.status === 404) {
      console.log('📁 Creating new repository...');
      const { data: newRepo } = await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        description: 'Campus Music - React Native + Expo mobile app for iOS and Android',
        private: false,
        auto_init: true
      });
      repo = newRepo;
      console.log(`✅ Created repository: ${repo.html_url}`);
      // Wait a moment for GitHub to initialize the repo
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      throw error;
    }
  }
  
  // Get all files from mobile directory
  console.log('📂 Reading mobile app files...');
  const files = getAllFiles(mobileDir);
  console.log(`Found ${files.length} files to upload`);
  
  // Get the default branch ref
  let treeSha: string;
  let commitSha: string;
  try {
    const { data: ref } = await octokit.git.getRef({
      owner: user.login,
      repo: repoName,
      ref: 'heads/main'
    });
    commitSha = ref.object.sha;
    
    const { data: commit } = await octokit.git.getCommit({
      owner: user.login,
      repo: repoName,
      commit_sha: commitSha
    });
    treeSha = commit.tree.sha;
  } catch (error) {
    // Try master branch instead
    const { data: ref } = await octokit.git.getRef({
      owner: user.login,
      repo: repoName,
      ref: 'heads/master'
    });
    commitSha = ref.object.sha;
    
    const { data: commit } = await octokit.git.getCommit({
      owner: user.login,
      repo: repoName,
      commit_sha: commitSha
    });
    treeSha = commit.tree.sha;
  }
  
  // Create blobs for each file
  console.log('📤 Uploading files to GitHub...');
  const treeItems: any[] = [];
  
  for (const file of files) {
    try {
      // Determine if file is binary (images, etc.)
      const isBinary = file.path.endsWith('.png') || 
                       file.path.endsWith('.jpg') || 
                       file.path.endsWith('.jpeg') ||
                       file.path.endsWith('.ico') ||
                       file.path.endsWith('.ttf') ||
                       file.path.endsWith('.otf');
      
      const { data: blob } = await octokit.git.createBlob({
        owner: user.login,
        repo: repoName,
        content: isBinary ? fs.readFileSync(path.join(mobileDir, file.path)).toString('base64') : file.content,
        encoding: isBinary ? 'base64' : 'utf-8'
      });
      
      treeItems.push({
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blob.sha
      });
      
      process.stdout.write('.');
    } catch (err) {
      console.warn(`\n⚠️ Skipping ${file.path}: ${err}`);
    }
  }
  console.log('\n');
  
  // Create tree
  console.log('🌳 Creating commit tree...');
  const { data: tree } = await octokit.git.createTree({
    owner: user.login,
    repo: repoName,
    base_tree: treeSha,
    tree: treeItems
  });
  
  // Create commit
  console.log('💾 Creating commit...');
  const { data: newCommit } = await octokit.git.createCommit({
    owner: user.login,
    repo: repoName,
    message: 'Campus Music Mobile App - Expo SDK 54 with NativeWind\n\nReady for Android Studio and Xcode builds.\nSee README.md for build instructions.',
    tree: tree.sha,
    parents: [commitSha]
  });
  
  // Update branch reference
  console.log('🔄 Updating branch...');
  try {
    await octokit.git.updateRef({
      owner: user.login,
      repo: repoName,
      ref: 'heads/main',
      sha: newCommit.sha
    });
  } catch {
    await octokit.git.updateRef({
      owner: user.login,
      repo: repoName,
      ref: 'heads/master',
      sha: newCommit.sha
    });
  }
  
  console.log('\n✅ Successfully pushed mobile app to GitHub!');
  console.log(`\n🔗 Repository URL: ${repo.html_url}`);
  console.log('\n📱 Next steps:');
  console.log('1. Clone the repository: git clone ' + repo.clone_url);
  console.log('2. cd campus-music-mobile');
  console.log('3. npm install');
  console.log('4. For Android: npx expo prebuild --platform android');
  console.log('5. For iOS: npx expo prebuild --platform ios');
  console.log('6. Open in Android Studio or Xcode to build');
}

main().catch(console.error);
