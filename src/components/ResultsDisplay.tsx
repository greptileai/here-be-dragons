import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Source {
  file: string;
  content: string;
  url?: string;
}

interface SearchResult {
  message?: string;
  sources?: Source[];
}

interface ResultsDisplayProps {
  results: SearchResult;
  sourceFiles: string | null;
}

const SourceFiles: React.FC<{ content: string }> = ({ content }) => {
  const links = content
    .split('\n')
    .filter(line => line.includes(']('))
    .map(line => {
      const titleMatch = line.match(/\[(.*?)\]/);
      const urlMatch = line.match(/\((.*?)\)/);
      return {
        title: titleMatch ? titleMatch[1] : '',
        url: urlMatch ? urlMatch[1] : ''
      };
    });

  return (
    <Card className="mt-8 bg-slate-50 border border-slate-200">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4 text-slate-800">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span className="font-medium">Source Files</span>
        </div>
        <div className="grid gap-2">
          {links.map((link, index) => (
            <a 
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors group"
            >
              <span className="text-slate-400 font-mono text-sm group-hover:text-blue-500">
                {link.title}
              </span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="ml-2 text-slate-400 group-hover:text-blue-500"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const CodeBlock = ({ content, sourceUrl, fileName }: { content: string, sourceUrl?: string, fileName?: string }) => (
  <div className="relative bg-slate-900 rounded-lg p-4 my-4">
    {(fileName || sourceUrl) && (
      <div className="flex items-center justify-between mb-2 text-slate-400 text-sm">
        {fileName && <span className="font-mono">{fileName}</span>}
        {sourceUrl && (
          <a 
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors ml-2"
          >
            View on GitHub ↗
          </a>
        )}
      </div>
    )}
    
    <div className="relative">
      <pre className="overflow-x-auto">
        <code className="text-slate-100 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words">
          {content.trim()}
        </code>
      </pre>
    </div>
  </div>
);

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, sourceFiles }) => {
  if (!results) return null;

  const processMessageContent = (message: string) => {
    const discoveries = message.split('\n\n');
    
    return discoveries.map((discovery, idx) => {
      const urlMatch = discovery.match(/\[Source:.*?\]\((.*?)\)/);
      const sourceUrl = urlMatch ? urlMatch[1] : undefined;
      
      const fileMatch = discovery.match(/\[Source: (.*?)\]/);
      const fileName = fileMatch ? fileMatch[1] : undefined;
      
      const cleanContent = discovery
        .replace(/\[Source:.*?\]\(.*?\)/, '')
        .replace(/```/g, '')
        .trim();

      return (
        <div key={idx} className="mb-8">
          <CodeBlock 
            content={cleanContent} 
            sourceUrl={sourceUrl} 
            fileName={fileName}
          />
        </div>
      );
    });
  };

  return (
    <ScrollArea className="h-[600px] rounded-md border p-6">
      <div className="space-y-6">
        {results.message && (
          <div className="prose prose-slate max-w-none">
            {processMessageContent(results.message)}
          </div>
        )}
        
        {sourceFiles && (
          <SourceFiles content={sourceFiles} />
        )}
      </div>
    </ScrollArea>
  );
};

export default ResultsDisplay;