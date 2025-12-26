import React from 'react';
import Link from 'next/link';


function TagCloud({ tags }: { tags: { name: string; slug: string }[] }): React.JSX.Element {

	if (!tags || tags.length === 0) {
		return (
			<div className="bg-white rounded-xl shadow flex flex-col">
				<h3 className="text-lg font-bold px-6 py-4 border-b">Tag Cloud</h3>
				<p className="text-gray-600 p-6">There are currently no tags to display.</p>
			</div>
		);
	}

	return (
		<>
			<div className="bg-white rounded-xl shadow flex flex-col">
				<h3 className="text-lg font-bold px-6 py-4 border-b">Tag Cloud</h3>
				<div className="flex flex-wrap gap-3 p-6">
					{tags.map(tag => (
						<Link href={`/tag/${tag.slug}`} key={tag.slug} className="text-gray-600 hover:text-gray-900 border text-sm border-gray-300 hover:bg-gray-100 font-medium px-3 py-1 rounded-full">{tag.name}</Link>
					))}
				</div>
			</div>
		</>
	)
}

export default TagCloud