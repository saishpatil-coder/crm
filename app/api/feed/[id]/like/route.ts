import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// POST /api/feed/[id]/like — Toggle like on a post
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headerList = await headers();
    const user = JSON.parse(headerList.get("x-user") || "{}");

    if (!user.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const postId = parseInt(id, 10);

    if (isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    // Check if the post exists
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if a like already exists
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: postId,
          userId: user.userId,
        },
      },
    });

    if (existingLike) {
      // Unlike — delete the existing like
      await prisma.like.delete({ where: { id: existingLike.id } });
    } else {
      // Like — create a new like
      await prisma.like.create({
        data: {
          postId: postId,
          userId: user.userId,
        },
      });
    }

    // Get the updated like count
    const likesCount = await prisma.like.count({ where: { postId: postId } });

    return NextResponse.json({
      postId,
      likesCount,
      isLikedByMe: !existingLike, // Toggled state
    });
  } catch (error) {
    console.error("POST /api/feed/[id]/like error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
