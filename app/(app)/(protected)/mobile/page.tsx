"use client";
import React, { useEffect } from 'react'

function page() {
    useEffect(() => {
        // Redirect to the default sub-page (e.g., /mobile/voters)
        window.location.href = "/mobile/all-voters";
    }, []);
  return (
    <div>
      hi
    </div>
  )
}

export default page
