// src/components/ResultsList.tsx
import { SearchResult } from '../types';

interface ResultsListProps {
  result: SearchResult | null;
  loading: boolean;
}

export default function ResultsList({ result, loading }: ResultsListProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-pulse text-xl">🐉 Searching through the codebase...</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center py-12 text-gray-600">
        Enter a query to explore the codebase
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Main Answer */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Answer:</h2>
        <div className="prose max-w-none">
          {result.message.split('\n').map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>

      {/* Source Files */}
      {result.sources && result.sources.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Relevant Files:</h2>
          <div className="space-y-4">
            {result.sources.map((source, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{source.file}</h3>
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View on GitHub →
                    </a>
                  )}
                </div>
                <pre className="bg-gray-50 p-4 rounded overflow-x-auto text-sm">
                  <code>{source.content}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}