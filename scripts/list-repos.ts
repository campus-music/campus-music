import { getUncachableGitHubClient } from '../server/github-client';

async function listRepos() {
  try {
    const octokit = await getUncachableGitHubClient();
    
    // Get authenticated user
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`\nAuthenticated as: ${user.login}\n`);
    
    // List repositories
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 20
    });
    
    console.log('Your repositories:');
    repos.forEach((repo, index) => {
      console.log(`${index + 1}. ${repo.full_name} ${repo.private ? '(private)' : '(public)'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

listRepos();
