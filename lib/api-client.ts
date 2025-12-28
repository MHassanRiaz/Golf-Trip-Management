// export function getAuthHeaders(): Record<string, string> {
//   const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
//   return {
//     "Content-Type": "application/json",
//     ...(token && { Authorization: `Bearer ${token}` }),
//   }
// }

// // Helper function to make authenticated API calls
// export async function authenticatedFetch(url: string, options: RequestInit = {}) {
//   return fetch(url, {
//     ...options,
//     headers: {
//       ...getAuthHeaders(),
//       ...options.headers,
//     },
//   })
// }
