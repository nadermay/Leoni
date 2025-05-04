/**
 * Utility functions for handling async operations safely
 */

/**
 * Execute an async operation with a small delay to prevent UI freezing
 * @param operation The async operation to execute
 * @param delay The delay in milliseconds (default: 10ms)
 * @returns A promise that resolves with the result of the operation
 */
export async function executeWithDelay<T>(operation: () => Promise<T>, delay = 10): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    setTimeout(async () => {
      try {
        const result = await operation()
        resolve(result)
      } catch (error) {
        reject(error)
      }
    }, delay)
  })
}

/**
 * Execute an async operation with a timeout
 * @param operation The async operation to execute
 * @param timeoutMs The timeout in milliseconds
 * @param timeoutMessage The message to use in the timeout error
 * @returns A promise that resolves with the result of the operation or rejects with a timeout error
 */
export async function executeWithTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs = 5000,
  timeoutMessage = "Operation timed out",
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(timeoutMessage))
    }, timeoutMs)

    operation()
      .then((result) => {
        clearTimeout(timeout)
        resolve(result)
      })
      .catch((error) => {
        clearTimeout(timeout)
        reject(error)
      })
  })
}

/**
 * Debounce a function to prevent multiple rapid executions
 * @param func The function to debounce
 * @param wait The wait time in milliseconds
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait = 300): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>): void => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Retry an async operation with exponential backoff
 * @param operation The async operation to retry
 * @param maxRetries The maximum number of retries
 * @param baseDelay The base delay in milliseconds
 * @returns A promise that resolves with the result of the operation
 */
export async function retryWithBackoff<T>(operation: () => Promise<T>, maxRetries = 3, baseDelay = 300): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error("Operation failed after retries")
}
