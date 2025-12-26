"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function SearchBox({ query, onSubmit }: { query?: string, onSubmit?: () => void }) {
  const [searchQuery, setSearchQuery] = React.useState(query ? query : '');
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search/${encodeURIComponent(searchQuery.trim())}`);
      onSubmit?.(); 
    }
    // Close the radix UI dialog if it's open
    const dialog = document.querySelector('[data-radix-dialog-content]');
    if (dialog) {
      const dialogInstance = dialog as HTMLDialogElement;
      if (dialogInstance.open) {
        dialogInstance.close();
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full mt-8">
      <div className="relative w-full">
        <input
          type='search'
          name='query'
          placeholder='Search'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-[70px]"
        />
        <button
          type='submit'
          className="absolute right-2 top-1/2 h-[54px] transform -translate-y-1/2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary flex items-center gap-2"
        >
          <Search className="w-5 h-5" />
          Search
        </button>
      </div>
    </form>
  );
}