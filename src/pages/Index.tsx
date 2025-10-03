import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/product-search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Medical Supplies Kenya</h1>
          <p className="text-xl text-muted-foreground">
            Search for medical equipment and get instant quotations
          </p>
        </div>

        <form onSubmit={handleSearch} className="w-full">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-6 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for medical supplies (e.g. Hospital Bed, Wheelchair)..."
              className="w-full pl-16 pr-6 py-6 text-lg rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <button type="submit" className="hidden">
            Search
          </button>
        </form>
      </div>
    </div>
  );
}
