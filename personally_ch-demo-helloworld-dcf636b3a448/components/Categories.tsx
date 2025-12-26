import React from "react";
import Link from "next/link";

function Categories({
  tags,
}: {
  tags: { name: string; slug: string }[];
}): React.JSX.Element {
  if (!tags || tags.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow flex flex-col">
        <h3 className="text-lg font-bold px-6 py-4 border-b">Categories</h3>
        <p className="text-gray-600 p-6">
          There are currently no categories to display.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow flex flex-col  md:col-span-1 h-fit sticky top-12">
        <h3 className="text-lg font-bold px-6 py-4 border-b">Categories</h3>
        <ul className="flex flex-col p-6">
          {tags.map((tag) => (
            <li
              key={tag.slug}
              className=" text-gray-600 hover:text-gray-900 border-b text-sm font-medium last:border-b-0 py-2 flex items-center justify-between first:pt-0 last:pb-0"
            >
              <Link href={`/tag/${tag.slug}`}>{tag.name}</Link>
              {/* <span className="text-white text-xs w-5 h-5 rounded-full bg-primary flex items-center justify-center">5</span> */}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default Categories;
