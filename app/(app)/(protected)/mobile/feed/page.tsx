import React from 'react'
import FeedCard from '@/components/FeedCard.tsx'

function page() {
  return (
    <div className='bg-[#F3F4F6] w-full p-4'>
      <div className='w-full flex items-center justify-end'>
        <button className='py-2 px-3 text-sm font-semibold rounded-lg bg-blue-600 border-none cursor-pointer'>Add</button>
      </div>
      <FeedCard />
    </div>
  )
}

export default page
