import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useState } from "react";

export default function TagsInput({
    tags,
    setTags,
  }: {
    tags: string[];
    setTags: (tags: string[]) => void;
  }) {
    const [input, setInput] = useState("");
    const maxTags = 2;
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
      setInput(e.target.value);
    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if ((e.key === "Enter" || e.key === ",") && input.trim()) {
        e.preventDefault();
        if (tags.length < maxTags && !tags.includes(input.trim())) {
          setTags([...tags, input.trim()]);
        }
        setInput("");
      }
      if (e.key === "Backspace" && !input && tags.length) {
        setTags(tags.slice(0, -1));
      }
    };
    const removeTag = (idx: number) => {
      setTags(tags.filter((_, i) => i !== idx));
    };
    return (
      <div className="flex items-center flex-wrap gap-2 border rounded-md px-2 py-1 min-h-[44px]">
        {tags.map((tag, idx) => (
          <span
            key={tag + idx}
            className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1 text-sm"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(idx)}
              className="ml-1 text-gray-500 hover:text-red-700 focus:outline-none"
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="flex-1 min-w-[120px] border-none outline-none bg-transparent py-1 px-2 text-sm"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder={tags.length >= maxTags ? "Max 2 tags" : "Add tag..."}
          disabled={tags.length >= maxTags}
        />
        {/* <Button
          type="button"
          variant="outline"
          className="bg-white text-sm border-primary border text-primary !p-2 h-[30px] w-[30px]"
        >
          <Sparkles />
        </Button> */}
      </div>
    );
  }