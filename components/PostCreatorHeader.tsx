import React from 'react'
import { ProfileIcon } from '@/assets/svgs/ProfileIcon'

function PostCreatorHeader({ 
  creatorName = "Roman Ranges", 
  role = "Field Worker", 
  timestamp = "2h ago" 
}) {

  return (
    <div>
        <div>
        <button className="flex items-center gap-3 text-gray-700 hover:text-purple-600 active:text-purple-700 transition-colors group cursor-pointer text-left"> 
            {/* Icon Wrapper: Adapted from your reference */}
            <div className="p-2 rounded-full bg-gray-100 group-hover:bg-purple-50 transition-colors">
                <ProfileIcon className="w-6 h-6 text-gray-500 group-hover:text-purple-600 group-active:scale-90 transition-all" />
            </div>

                {/* Text Wrapper: Name stacked above Role/Timestamp */}
            <div className="flex flex-col">
                <span className="text-sm font-bold leading-tight group-hover:underline">
                    {creatorName}
                </span>
                <span className="text-xs text-gray-500 font-medium mt-0.5">
                    {role} • {timestamp}
                </span>
            </div>

        </button>
        </div>
    </div>
  )
}

export default PostCreatorHeader
