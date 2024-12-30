'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import GREPTILE_API from '../lib/greptile';
import { SearchResult } from '../types';
import ResultsDisplay from '../components/ResultsDisplay';


export default function Home() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [repository, setRepository] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const validateRepo = (repo: string) => {
    const parts = repo.trim().split('/');
    return parts.length === 2 && parts[0] && parts[1];
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRepo(repository)) {
      setError('Please enter a valid repository in the format "owner/repo"');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setStatus('Starting indexing process...');

    try {
      const indexResponse = await GREPTILE_API.indexRepo(repository);
      console.log('Index response:', indexResponse);
      setStatus('Repository submitted for indexing. Checking status...');

      let isComplete = false;
      let attempts = 0;
      const maxAttempts = 48; // 4 minutes (48 * 5 seconds)

      while (!isComplete && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        attempts++;
        
        try {
          isComplete = await GREPTILE_API.checkIndexStatus(repository);
          if (isComplete) {
            break;
          }
          setStatus(`Still indexing... (progress ${attempts}/${maxAttempts})`);
        } catch (error) {
          console.error('Status check failed:', error);
          setStatus(`Status check attempt ${attempts} failed, retrying...`);
        }
      }

      if (!isComplete) {
        throw new Error('Indexing timed out after 4 minutes. Try again later.');
      }

      setStatus('Indexing complete. Searching for wacky stuff...');
      const data = await GREPTILE_API.queryRepo(repository);
      setResults(data);
      setStatus('');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
          🐉 Here Be Dragons 
          </h1>
          <p className="text-slate-500">Discover quirks that make code human</p>
        </div>

        {/* Search Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Repository</CardTitle>
            <CardDescription>
              Enter a GitHub repository to find wacky stuff
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1">
                <Input 
                  value={repository}
                  onChange={(e) => setRepository(e.target.value.replace('https://github.com/', '').replace('.git', ''))}
                  placeholder="owner/repo (e.g., diegocr/netcat)"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Searching..." : "Find Dragons"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Status or Error Alert */}
        {(status || error) && (
          <Alert className="mb-6" variant={error ? "destructive" : "default"}>
            <AlertDescription>
              {error || status}
            </AlertDescription>
          </Alert>
        )}

        {/* Results Section */}
<Card>
  <CardHeader>
    <CardTitle>Discoveries</CardTitle>
    <CardDescription>
    </CardDescription>
  </CardHeader>
  {loading ? (
    <CardContent>
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </CardContent>
  ) : results ? (
    <ResultsDisplay results={results} />
  ) : (
    <CardContent>
      <div className="text-center py-12 text-slate-500">
        Enter a repository to start discovering interesting code comments
      </div>
    </CardContent>
  )}
</Card>
      </div>
    </div>
  );
}