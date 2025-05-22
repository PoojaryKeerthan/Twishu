"use client"
import React, { useState } from 'react'
import { Button } from './ui/button'
import { Loader2Icon } from 'lucide-react'
import toast from 'react-hot-toast'
import { toggleFollow } from '@/actions/user.action'

const FollowButton = ({ userId }: { userId: string }) => {
    const [loading, setLoading] = useState(false)

    const handlefollow = async () => {
        setLoading(true)
        try {
            await toggleFollow(userId)
            toast.success("Followed user successfully")
        } catch (error) {
            toast.error("Failed to follow user")
        }
        finally {
            setLoading(false)
        }
    }

    return (
        <Button
            size={"sm"}
            variant={"secondary"}
            onClick={handlefollow}
            disabled={loading}
            className='w-20'
        >
            {loading ? <Loader2Icon className='w-4 h-4 animate-spin' /> : "Follow"}
            Follow
        </Button>
    )
}

export default FollowButton