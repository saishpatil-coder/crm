import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// GET /api/feed — Fetch the latest 50 posts for the current tenant
export async function GET() {
  try {
    const headerList = await headers();
    const user = JSON.parse(headerList.get("x-user") || "{}");

    if (!user.userId || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const posts = await prisma.post.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        author: {
          select: { id: true, name: true },
        },
        _count: {
          select: { likes: true },
        },
        likes: {
          where: { userId: user.userId },
          select: { id: true },
        },
      },
    });

    // Transform the response to include isLikedByMe and flatten
    const feed = posts.map((post) => ({
      id: post.id,
      tenantId: post.tenantId,
      authorId: post.authorId,
      authorName: post.author.name,
      description: post.description,
      mediaType: post.mediaType,
      mediaUrl: post.mediaUrl,
      likesCount: post._count.likes,
      isLikedByMe: post.likes.length > 0,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }));

    return NextResponse.json(feed);
  } catch (error) {
    console.error("GET /api/feed error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/feed — Create a new post
export async function POST(req: NextRequest) {
  try {
    const headerList = await headers();
    const user = JSON.parse(headerList.get("x-user") || "{}");

    if (!user.userId || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { description, mediaType, mediaUrl } = body;

    if (!description || description.trim().length === 0) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        tenantId: user.tenantId,
        authorId: user.userId,
        description: description.trim(),
        mediaType: mediaType || null,
        mediaUrl: mediaUrl || null,
      },
      include: {
        author: {
          select: { id: true, name: true },
        },
        _count: {
          select: { likes: true },
        },
      },
    });

    return NextResponse.json({
      id: post.id,
      tenantId: post.tenantId,
      authorId: post.authorId,
      authorName: post.author.name,
      description: post.description,
      mediaType: post.mediaType,
      mediaUrl: post.mediaUrl,
      likesCount: post._count.likes,
      isLikedByMe: false, // Just created, can't be liked yet
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    });
  } catch (error) {
    console.error("POST /api/feed error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
