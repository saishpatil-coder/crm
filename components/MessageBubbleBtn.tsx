import React from 'react'
import { MessageBubbleIcon } from '@/assets/svgs/MessageBubbleIcon'

function MessageBubbleBtn() {
  return (
    <div>
      <div>
        <button className="flex items-center gap-2 text-gray-500 hover:text-purple-600 active:text-purple-700 transition-colors group  cursor-pointer">
            <div className="p-2 rounded-full group-hover:bg-purple-50 transition-colors">
            <MessageBubbleIcon className="w-5 h-5 group-active:scale-90 transition-transform" />
            </div>
            <span className="text-xs font-bold">Add Note</span>
        </button>
    </div>
    </div>
  )
}

export default MessageBubbleBtn
