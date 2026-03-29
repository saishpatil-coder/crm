import React from "react";
import ThumbsUpBtn from "./ThumbsUpBtn";
import MessageBubbleBtn from "./MessageBubbleBtn";
import ShareNodesBtn from "./ShareNodesBtn";
import PostCreatorHeader from "./PostCreatorHeader";

function FeedCard() {
    return (
        <div className="min-h-screen w-full py-4">
            <div className="w-full p-4 rounded-xl bg-[#F1F5F9] shadow-md flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <PostCreatorHeader />
                </div>
                <div className="w-full h-60 border-1 rounded-xl overflow-hidden border-gray-400">
                    <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1532635241-17e820acc59f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cGVvcGxlc3xlbnwwfHwwfHx8MA%3D%3D" alt="" />
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                    {/* Acknowledge / Like Action */}
                    <ThumbsUpBtn />

                    {/* Note / Comment Action */}
                    <MessageBubbleBtn />

                    {/* Share Action */}
                    <ShareNodesBtn />

                </div>
            </div>
        </div>
    )
}

export default FeedCard;