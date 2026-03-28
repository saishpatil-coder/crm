import React from "react";
import { ThumbsUpIcon } from "./ThumbsUpIcon";
import { MessageBubbleIcon } from "./MessageBubbleIcon";
import { ShareNodesIcon } from "./ShareNodesIcon";

function FeedCard() {
    return (
        <div className="min-h-screen w-full py-4">
            <div className="w-full p-4 rounded-xl bg-[#F1F5F9] shadow-md flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full overflow-hidden">
                        <img className="h-full w-full object-cover" src="https://images.unsplash.com/photo-1474176857210-7287d38d27c6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjR8fHVzZXJ8ZW58MHx8MHx8fDA%3D" alt=""/>
                    </div>
                    <div>
                        <h1 className="text-sm font-semibold text-neutral-500">Jhon Sena</h1>
                    </div>
                </div>
                <div className="w-full h-60 border-1 rounded-xl overflow-hidden border-gray-400">
                    <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1532635241-17e820acc59f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cGVvcGxlc3xlbnwwfHwwfHx8MA%3D%3D" alt="" />
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                    {/* Acknowledge / Like Action */}
                    <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 active:text-blue-700 transition-colors group  cursor-pointer">
                        <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                        <ThumbsUpIcon className="w-5 h-5 group-active:scale-90 transition-transform" />
                        </div>
                        <span className="text-xs font-bold">12</span>
                    </button>

                    {/* Note / Comment Action */}
                    <button className="flex items-center gap-2 text-gray-500 hover:text-purple-600 active:text-purple-700 transition-colors group  cursor-pointer">
                        <div className="p-2 rounded-full group-hover:bg-purple-50 transition-colors">
                        <MessageBubbleIcon className="w-5 h-5 group-active:scale-90 transition-transform" />
                        </div>
                        <span className="text-xs font-bold">Add Note</span>
                    </button>

                    {/* Share Action */}
                    <button className="flex items-center gap-2 text-gray-500 hover:text-green-600 active:text-green-700 transition-colors group cursor-pointer">
                        <div className="p-2 rounded-full group-hover:bg-green-50 transition-colors">
                        <ShareNodesIcon className="w-5 h-5 group-active:scale-90 transition-transform" />
                        </div>
                        <span className="text-xs font-bold">Share</span>
                    </button>

                    </div>
            </div>
        </div>
    )
}

export default FeedCard;