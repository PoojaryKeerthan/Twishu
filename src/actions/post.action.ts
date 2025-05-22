"use server";

import prisma from "@/lib/prisma";
import { getdbUserId } from "./user.action";
import { revalidatePath } from "next/cache";

export async function createPost(content: string, imageUrl: string) {
    try {
        const userId = await getdbUserId();
        if (!userId) return;
        const post = await prisma.post.create({
            data: {
                content,
                image: imageUrl,
                authorId: userId,
            }
        })
        revalidatePath("/")
        return { success: true, post }
    } catch (error) {
        console.log("Error creating post: ", error);
        return { success: false, error: "falied to post" }
    }
}

export async function getPosts() {
    try {
        const posts = await prisma.post.findMany({
            orderBy: {
                createdAt: "desc"
            },

            include: {
                author: {
                    select: {
                        name: true,
                        username: true,
                        image: true,
                    }
                },
                comments: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                image: true,
                            }
                        }
                    },
                    orderBy: {
                        createdAt: "asc",
                    }
                },
                likes: {
                    select: {
                        id: true,
                        userId: true,
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    }
                }

            }
        })
        return posts
    } catch (error) {
        console.log("Error getting posts: ", error);
        throw new Error("Failed to get posts");
    }
}

