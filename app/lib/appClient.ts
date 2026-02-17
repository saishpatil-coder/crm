import axios from "axios";

// Create a globally configured Axios instance
export const apiClient = axios.create({
  // Since frontend and backend are in the same Next.js app,
  // we can just use the relative path '/api'
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});
