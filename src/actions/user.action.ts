"use server";

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { get } from "http";
import { revalidatePath } from "next/cache";


export async function syncUser() {
    try {
        const { userId } = await auth();
        const user = await currentUser();
        if (!userId || !user) return;

        const existingUser = await prisma.user.findUnique({
            where: {
                clerkId: userId,
            },
        })
        if (existingUser) { return existingUser; }

        const dbUser = await prisma.user.create({
            data: {
                clerkId: userId,
                name: `${user.firstName || ''} ${user.lastName || ''}`,
                username: user.username ?? user.emailAddresses[0].emailAddress.split("@")[0],
                email: user.emailAddresses[0].emailAddress,
                image: user.imageUrl,

            }
        })
        return dbUser;
    } catch (error) {
        console.log("Error syncing user: ", error);
        return null;
    }
}

export async function getUserbyClerkId(clerkId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: {
                clerkId,
            },
            include: {
                _count: {
                    select: {
                        followers: true,
                        following: true,
                        posts: true,
                    }
                }
            }
        })
        return user;
    } catch (error) {
        console.log("Error getting user by clerkId: ", error);
        return null;
    }
}

export async function getdbUserId() {
    const { userId: clerkId } = await auth();
    if (!clerkId) return null

    const user = await getUserbyClerkId(clerkId);
    if (!user) throw new Error("User not found");
    return user.id;
}

export async function getRandomUsers() {
    try {
        const userId = await getdbUserId();

        if (!userId) return [];

        // get 3 random users exclude ourselves & users that we already follow
        const randomUsers = await prisma.user.findMany({
            where: {
                AND: [
                    { NOT: { id: userId } },
                    {
                        NOT: {
                            followers: {
                                some: {
                                    followerId: userId,
                                },
                            },
                        },
                    },
                ],
            },
            select: {
                id: true,
                name: true,
                username: true,
                image: true,
                _count: {
                    select: {
                        followers: true,
                    },
                },
            },
            take: 3,
        });

        return randomUsers;
    } catch (error) {
        console.log("Error fetching random users", error);
        return [];
    }
}

export async function toggleFollow(targetuserId: string) {
    try {
        const dbUserId = await getdbUserId();
        if (!dbUserId) return;
        if (dbUserId === targetuserId) throw new Error("You cannot follow yourself");
        const existingFollow = await prisma.follows.findUnique({
            where:{
                followerId_followingId:{
                    followerId: dbUserId,
                    followingId: targetuserId,
                }
            }
        })
        if (existingFollow) {
            await prisma.follows.delete({
                where: {
                    followerId_followingId: {
                        followerId: dbUserId,
                        followingId: targetuserId,
                    }
                }
            })
        } else{
            await prisma.$transaction([
                prisma.follows.create({
                    data: {
                        followerId: dbUserId,
                        followingId: targetuserId,
                    }
                }),
                prisma.notification.create({
                    data: {
                        userId: targetuserId,
                        type: "FOLLOW",
                        creatorId: dbUserId,
                    }
                })
            ])
        }
        revalidatePath('/')
        return {success:true}
    } catch (error) {
        console.log("Error toggling follow: ", error);
        return {success:false,error:"Failed to follow user"}
    }
}