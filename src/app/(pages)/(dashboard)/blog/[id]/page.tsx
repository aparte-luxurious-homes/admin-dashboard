import BlogEditor from "@/src/components/blog-mgt/BlogEditor";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <div className="w-full">
            <BlogEditor postId={id} />
        </div>
    );
}
