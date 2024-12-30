  interface GreptileAPI {
    successfulBranch: string;
    indexRepo: (repository: string) => Promise<any>;
    checkIndexStatus: (repository: string) => Promise<boolean>;
    queryRepo: (repository: string) => Promise<any>;
    attemptIndexing: (repository: string, branch: string) => Promise<Response>;
  }
  
  const GREPTILE_API: GreptileAPI = {
    successfulBranch: 'main',
  
    async attemptIndexing(repository: string, branch: string) {
      const headers: HeadersInit = {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_GREPTILE_API_KEY}`,
        "Content-Type": "application/json",
      };
      
      if (process.env.NEXT_PUBLIC_GITHUB_TOKEN) {
        headers["X-Github-Token"] = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
      }
      
      return await fetch(`${process.env.NEXT_PUBLIC_GREPTILE_API_URL}/repositories`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          remote: "github",
          repository: repository,
          branch: branch
        })
      });
    },
      
    async checkIndexStatus(repository: string) {
      try {
        // Try both branches
        const branches = ['main', 'master'];
        for (const branch of branches) {
          const encodedRepo = encodeURIComponent(`github:${branch}:${repository}`);
          const url = `${process.env.NEXT_PUBLIC_GREPTILE_API_URL}/repositories/${encodedRepo}`;
          
          try {
            const headers: HeadersInit = {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_GREPTILE_API_KEY}`,
            };
    
            if (process.env.NEXT_PUBLIC_GITHUB_TOKEN) {
              headers["X-Github-Token"] = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
            }
    
            const response = await fetch(url, {
              method: 'GET',
              headers: headers,
            });
    
            if (response.ok) {
              const data = await response.json();
              if (data.status === 'COMPLETED' || data.status === 'READY') {
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
  
    async indexRepo(repository: string) {
      try {
        // First check if repository is already indexed
        const isIndexed = await this.checkIndexStatus(repository);
        if (isIndexed) {
          console.log('Repository already indexed');
          return { status: 'READY' };
        }
  
        console.log('Repository not indexed, starting indexing...');
        
        // Try 'main' first
        const response = await this.attemptIndexing(repository, 'main');
        if (response.ok) {
          this.successfulBranch = 'main';
          return await response.json();
        }
        
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
  
    async queryRepo(repository: string) {
      try {
        const headers: HeadersInit = {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_GREPTILE_API_KEY}`,
          "Content-Type": "application/json",
        };
    
        if (process.env.NEXT_PUBLIC_GITHUB_TOKEN) {
          headers["X-Github-Token"] = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
        }
    
        const response = await fetch(`${process.env.NEXT_PUBLIC_GREPTILE_API_URL}/query`, {
          method: "POST",
          headers: headers,
          body: JSON.stringify({
            messages: [{
              content: `give me some interesting comments from the codebase. These could be related to things like interesting naming conventions, frustrations of the programmer, reasons for certain design choices or other funny idiosyncracies of the programmer. Do NOT make things up. You are only allowed to output parts of the codebase that actually exist. Don't categorize or number the findings or offer any explanations - just present the relavent snippets from the codebase as individual discoveries. If it is from a code file, include a few lines of code that are near the comment. Wrap each individual discovery in triple backquotes (so that it can be rendered as markdown)`,
              role: "user"
            }],
            repositories: [{
              remote: "github",
              repository: repository,
              branch: this.successfulBranch
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