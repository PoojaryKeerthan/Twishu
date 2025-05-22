"use client"
import { getPosts } from '@/actions/post.action';
import { useUser } from '@clerk/nextjs';
import React, { useState } from 'react'

type Posts = Awaited<ReturnType<typeof getPosts>>
type Post = Posts[number]

const PostCard = ({post,dbUserID}:{post:Post; dbUserID:string | null;}) => {
  const {user} = useUser();
  const [newComment,setNewComment] = useState("")
  const [isCommenting,setIsCommenting] = useState(false);
  const [isLiking,setIsLiking] = useState(false);
  const [isDeleting,setIsDeleting] = useState(false);
  const [hasliked,setHasLiked] = useState(post.likes.some(like => like.userId === dbUserID));
  const [optmistcLikes,setoptmistcLikes] = useState(post._count.likes);

  const handleLike = async () => {
    if(isLiking) return;
    try {
      setIsLiking(true)
      setHasLiked(prev=>(!prev))
      setoptmistcLikes(prev => hasliked ? prev - 1 : prev + 1)
      await toggleLike(post.id)
    } catch (error) {
      setoptmistcLikes(post._count.likes)
      setHasLiked(post.likes.some(like => like.userId === dbUserID))
    }
    finally{
      setIsLiking(false)
    }
  }

  const handleAddComment = async() =>{}

  const deletePost = async()=>{}

  return (
    <div>PostCard</div>
  )
}

export default PostCard