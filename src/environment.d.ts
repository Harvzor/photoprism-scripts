declare global {
  namespace NodeJS {
    interface ProcessEnv {
        ORIGINALS_PATH: string
        STORAGE_PATH: string
        SIDECAR_LOST_AND_FOUND_PATH: string
        SIDECAR_PATH: string
    }
  }
}

export {}