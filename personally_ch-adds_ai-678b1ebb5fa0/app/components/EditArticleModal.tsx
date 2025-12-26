"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import React, { ChangeEvent } from "react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

type EditArticleModalProps = {
  open: boolean;
  onClose: () => void;
  article: SiteArticle | null;
};

export default function EditArticleModal({
  open,
  onClose,
  article,
}: EditArticleModalProps) {
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
  };

  if (!article) return null;

  // Example state for editing (replace with your form logic as needed)
  // const [form, setForm] = useState({ ...article });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="fixed inset-0 w-full h-full flex items-center justify-center bg-white z-50 overflow-y-auto p-0">
        <div className="w-full  h-full flex flex-col bg-white shadow-lg">
          <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b">
            <DialogTitle className="text-2xl font-semibold">
              Edit Article
            </DialogTitle>
            {/* <DialogClose asChild>
                <button className="text-gray-400 hover:text-gray-700 text-2xl">&times;</button>
              </DialogClose> */}
          </div>
          <div className="flex-1 overflow-y-auto px-8 pb-8">
            <div className="mb-6 text-gray-500">
              Make edits to the article here. Click update when you're done.
            </div>
            <form className="space-y-6">
              {/* Tags */}
              <div>
                <Label className="block mb-2">Tags</Label>
                {/* Replace with your tag selector component */}
                <Input
                  className="mb-2"
                  value={article.article_tags.map((t) => t.tag.name).join(", ")}
                  readOnly
                />
              </div>

              {/* Image */}
              <div>
                <Label className="block mb-2">Image</Label>
                <div className="flex items-center gap-4 mb-2">
                  <img
                    src={article.image_url}
                    alt="Article"
                    className="rounded object-cover border"
                    style={{ width: 180, height: 120 }}
                  />
                  <div className="flex flex-col gap-2">
                    <Button type="button" variant="outline">
                      Upload
                    </Button>
                    <Button type="button" variant="outline">
                      Regenerate
                    </Button>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <Label className="block mb-2">Title</Label>
                <Input
                  className="mb-2"
                  value={article.title}
                  onChange={handleChange}
                />
              </div>

              {/* Description */}
              <div>
                <Label className="block mb-2">Description</Label>
                {/* Replace with your rich text editor component */}
                <textarea
                  className="w-full border rounded p-2 min-h-[200px]"
                  rows={10}
                  value={article.meta_description}
                  onChange={handleChange}
                />
              </div>
            </form>
          </div>
          <div className="flex justify-end gap-2 px-8 py-4 border-t bg-white">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="text-white">
              Update Article
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
