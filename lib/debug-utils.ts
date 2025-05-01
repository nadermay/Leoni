/**
 * Utility functions for debugging form submissions and updates
 */

/**
 * Log form data with a custom label
 */
export function logFormData(label: string, data: any) {
  if (process.env.NODE_ENV !== "production") {
    console.group(`📝 ${label}`)
    console.log("Data:", data)
    console.groupEnd()
  }
}

/**
 * Log API requests with timing information
 */
export async function logApiRequest<T>(label: string, requestFn: () => Promise<T>): Promise<T> {
  if (process.env.NODE_ENV !== "production") {
    console.group(`🔄 ${label}`)
    console.time("Request duration")

    try {
      const result = await requestFn()
      console.log("Response:", result)
      return result
    } catch (error) {
      console.error("Error:", error)
      throw error
    } finally {
      console.timeEnd("Request duration")
      console.groupEnd()
    }
  } else {
    return requestFn()
  }
}

/**
 * Track state changes
 */
export function logStateChange(label: string, prevState: any, newState: any) {
  if (process.env.NODE_ENV !== "production") {
    console.group(`🔄 ${label}`)
    console.log("Previous:", prevState)
    console.log("New:", newState)
    console.groupEnd()
  }
}
