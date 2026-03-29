import React from 'react'
import { ThumbsUpIcon } from '@/assets/svgs/ThumbsUpIcon'

function ThumbsUpBtn() {
  return (
    <div>
      <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 active:text-blue-700 transition-colors group  cursor-pointer">
        <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
        <ThumbsUpIcon className="w-5 h-5 group-active:scale-90 transition-transform" />
        </div>
        <span className="text-xs font-bold">12</span>
      </button>
    </div>
  )
}

export default ThumbsUpBtn
