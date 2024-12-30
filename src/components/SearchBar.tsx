// src/components/SearchBar.tsx
import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string, repository: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [repository, setRepository] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !repository.trim()) return;
    onSearch(query.trim(), repository.trim());
  };

  const formatRepoInput = (input: string) => {
    // Convert full GitHub URL to owner/repo format if needed
    return input.replace('https://github.com/', '').replace('.git', '');
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 space-y-4">
      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={repository}
          onChange={(e) => setRepository(formatRepoInput(e.target.value))}
          placeholder="Repository (e.g., diegocr/netcat)"
          className="p-3 border rounded-lg"
          required
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about the codebase (e.g., 'How does auth work?')"
          className="p-3 border rounded-lg"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Search Codebase
      </button>
    </form>
  );
}
