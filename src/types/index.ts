export interface SearchResult {
    message: string;
    sources?: {
      file: string;
      content: string;
      url?: string;
    }[];
  }
  
  export interface IndexStatus {
    status: 'pending' | 'complete' | 'failed';
    message?: string;
  }