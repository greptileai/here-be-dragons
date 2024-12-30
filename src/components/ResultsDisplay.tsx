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
  results: SearchResult | null;
}

const CodeBlock = ({ content }: { content: string }) => (
    <div className="bg-slate-900 border border-slate-200 rounded-lg p-4 my-4 shadow-sm">
      <pre>
        <code className="text-slate-100 font-mono text-sm whitespace-pre-wrap">
          {content.trim()}
        </code>
      </pre>
    </div>
  );

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  if (!results) return null;

  const renderMessage = (message: string) => {
    const paragraphs = message.split('\n\n');
    
    return paragraphs.map((paragraph, idx) => {
      // Check if the paragraph is a code block (starts with triple quotes)
      if (paragraph.startsWith("```")) {
        // Remove the triple quotes at the start and end
        const cleanContent = paragraph.replace(/^[`]{3}|[`]{3}$/g, '');
        return <CodeBlock key={idx} content={cleanContent} />;
      }

      // Regular paragraph
      return (
        <p key={idx} className="my-4 text-slate-100">
          {paragraph}
        </p>
      );
    });
  };

  return (
    <ScrollArea className="h-[500px] rounded-md border p-4">
      <div className="space-y-8">
        {/* AI Analysis */}
        {results.message && (
          <div className="prose prose-slate max-w-none">
            {renderMessage(results.message)}
          </div>
        )}
        
        {/* Source files */}
        {results.sources?.filter(source => source?.content && source.content.trim() !== '').map((source, index) => (
          <Card key={index} className="border border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-mono text-sm font-semibold text-slate-700">
                  {source.file}
                </h3>
                {source.url && (
                  <a 
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    View on GitHub →
                  </a>
                )}
              </div>
              <div className="bg-slate-900 border border-slate-200 rounded-lg p-4 shadow-sm">
                <pre>
                    <code className="text-slate-100 font-mono text-sm whitespace-pre-wrap">
                    {source.content}
                    </code>
                </pre>
                </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};

export default ResultsDisplay;