interface GraptileAPI {
    successfulBranch: string;
    indexRepo: (repository: string) => Promise<any>;
    checkIndexStatus: (repository: string) => Promise<boolean>;
    queryRepo: (repository: string) => Promise<any>;
    attemptIndexing: (repository: string, branch: string) => Promise<Response>;
    checkIfIndexed: (repository: string) => Promise<boolean>;
    findSourceFiles: (repository: string, discoveries: string) => Promise<any>;
  }
  
  const GREPTILE_API: GraptileAPI = {
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
  
    async findSourceFiles(repository: string, discoveries: string) {
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
              content: `Here are some discoveries from the codebase:\n\n${discoveries}\n\nPlease list only the source files where these discoveries were found. Format the response as a list of markdown links to the GitHub source files.`,
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
          throw new Error(`Source files query failed: ${response.status}`);
        }
    
        const sourceFiles = await response.json();
        return {
          type: 'sourceFiles',
          data: sourceFiles
        };
      } catch (error) {
        console.error('Source files query error:', error);
        throw error;
      }
    },
    
    async checkIfIndexed(repository: string): Promise<boolean> {
      for (const branch of ['main', 'master']) {
        const encodedRepo = encodeURIComponent(`github:${branch}:${repository}`);
        const url = `${process.env.NEXT_PUBLIC_GREPTILE_API_URL}/repositories/${encodedRepo}`;
  
        try {
          const headers: HeadersInit = {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_GREPTILE_API_KEY}`,
          };
          if (process.env.NEXT_PUBLIC_GITHUB_TOKEN) {
            headers["X-Github-Token"] = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
          }
  
          const response = await fetch(url, { method: 'GET', headers });
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
    },
      
    async indexRepo(repository: string) {
      try {
        const isIndexed = await this.checkIfIndexed(repository);
        if (isIndexed) {
          console.log('Repository already indexed');
          return { status: 'COMPLETED' };
        }
  
        console.log('Repository not indexed, starting indexing...');
        const response = await this.attemptIndexing(repository, 'main');
        if (response.ok) {
          this.successfulBranch = 'main';
          return await response.json();
        }
        
        console.log('Main branch failed, trying master...');
        const responseMaster = await this.attemptIndexing(repository, 'master');
        if (responseMaster.ok) {
          this.successfulBranch = 'master';
          return await responseMaster.json();
        }
  
        const errorText = await response.text();
        throw new Error(`Indexing failed: ${response.status} - ${errorText}`);
      } catch (error) {
        console.error('Indexing error:', error);
        throw error;
      }
    },
  
    async checkIndexStatus(repository: string) {
      return await this.checkIfIndexed(repository);
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
    
        // First query for discoveries
        const discoveryResponse = await fetch(`${process.env.NEXT_PUBLIC_GREPTILE_API_URL}/query`, {
          method: "POST",
          headers: headers,
          body: JSON.stringify({
            messages: [{
              content: `give me some interesting comments from the codebase. These could include things like interesting naming conventions, reasons for certain design choices, expressions of frustrations, or other funny idiosyncracies of the programmer. Don't categorize or number the findings or offer any explanations, don't start with an introduction - your response should contain the individual discoveries only. Wrap each individual discovery in triple backquotes (so that it can be rendered as markdown)`,
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
    
        if (!discoveryResponse.ok) {
          throw new Error(`Query failed: ${discoveryResponse.status}`);
        }
    
        const discoveries = await discoveryResponse.json();
        return {
          type: 'discoveries',
          data: discoveries
        };
  
      } catch (error) {
        console.error('Query error:', error);
        throw error;
      }
    }
  };
  
  export default GREPTILE_API;