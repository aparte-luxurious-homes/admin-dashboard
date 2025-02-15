const getApiUrl = (env: string) => {
    switch(env) {
        case 'test':
            return process.env.NEXT_PUBLIC_BASE_LOCAL_API_URL
        case 'development':
            return process.env.NEXT_PUBLIC_BASE_STAGING_API_URL
        case 'production':
            return process.env.NEXT_PUBLIC_BASE_API_URL
    }
}

export const BASE_API_URL = getApiUrl(process.env.NEXT_PUBLIC_NODE_ENV!)

// export const API_ROUTES = 