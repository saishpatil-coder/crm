import React from 'react'
import { ShareNodesIcon } from '@/assets/svgs/ShareNodesIcon'

function ShareNodesBtn() {
  return (
        <button className="flex items-center gap-2 text-gray-500 hover:text-green-600 active:text-green-700 transition-colors group cursor-pointer">
            <div className="p-2 rounded-full group-hover:bg-green-50 transition-colors">
            <ShareNodesIcon className="w-5 h-5 group-active:scale-90 transition-transform" />
            </div>
            <span className="text-xs font-bold">Share</span>
        </button>
  )
}

export default ShareNodesBtn
