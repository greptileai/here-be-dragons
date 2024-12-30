interface GraptileAPI {
    successfulBranch: string;
    indexRepo: (repository: string) => Promise<any>;
    checkIndexStatus: (repository: string) => Promise<boolean>;
    queryRepo: (repository: string) => Promise<any>;
    attemptIndexing: (repository: string, branch: string) => Promise<Response>;
  }
  
  const GREPTILE_API: GraptileAPI = {
    successfulBranch: 'main',
  
    async attemptIndexing(repository: string, branch: string) {
      return await fetch(`${process.env.NEXT_PUBLIC_GREPTILE_API_URL}/repositories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_GREPTILE_API_KEY}`,
          "X-Github-Token": process.env.NEXT_PUBLIC_GITHUB_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          remote: "github",
          repository: repository,
          branch: branch
        })
      });
    },
  
    async indexRepo(repository: string) {
      try {
        console.log('Attempting indexing with main branch...');
        // Try 'main' first
        const response = await this.attemptIndexing(repository, 'main');
        if (response.ok) {
          this.successfulBranch = 'main';
          return await response.json();
        }
        
        console.log('Main branch failed, trying master...');
        // If 'main' fails, try 'master'
        const responseMaster = await this.attemptIndexing(repository, 'master');
        if (responseMaster.ok) {
          this.successfulBranch = 'master';
          return await responseMaster.json();
        }
  
        // If both fail, throw error from the first attempt
        const errorText = await response.text();
        throw new Error(`Indexing failed: ${response.status} - ${errorText}`);
      } catch (error) {
        console.error('Indexing error:', error);
        throw error;
      }
    },
  
    async checkIndexStatus(repository: string) {
      try {
        // Try both branches
        const branches = ['main', 'master'];
        for (const branch of branches) {
          const encodedRepo = encodeURIComponent(`github:${branch}:${repository}`);
          const url = `${process.env.NEXT_PUBLIC_GREPTILE_API_URL}/repositories/${encodedRepo}`;
          
          console.log('Checking index status:', { url, branch });
  
          try {
            const response = await fetch(url, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_GREPTILE_API_KEY}`,
                "X-Github-Token": process.env.NEXT_PUBLIC_GITHUB_TOKEN,
              },
            });
  
            if (response.ok) {
              const data = await response.json();
              console.log('Status check data:', data);
              if (data.status === 'COMPLETED' || data.status === 'READY') {
                // Store the successful branch for later use
                this.successfulBranch = branch;
                return true;
              }
            }
          } catch (error) {
            console.log(`Check failed for ${branch} branch:`, error);
          }
        }
        return false;
      } catch (error) {
        console.error('Status check error:', error);
        throw error;
      }
    },
  
    async queryRepo(repository: string) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_GREPTILE_API_URL}/query`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_GREPTILE_API_KEY}`,
            "X-Github-Token": process.env.NEXT_PUBLIC_GITHUB_TOKEN,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [{
              content: `give me some interesting comments from the codebase. These could include things like interesting naming conventions, reasons for certain design choices or other funny idiosyncracies of the programmer. Don't categorize or number the findings or offer any explanations - just present them as individual discoveries. Wrap each individual discovery in triple backquotes (so that it can be rendered as markdown)`,
              role: "user"
            }],
            repositories: [{
              remote: "github",
              repository: repository,
              branch: this.successfulBranch // Use the branch that worked
            }],
            genius: true
          })
        });
  
        if (!response.ok) {
          throw new Error(`Query failed: ${response.status}`);
        }
  
        return await response.json();
      } catch (error) {
        console.error('Query error:', error);
        throw error;
      }
    }
  };
  
  export default GREPTILE_API;