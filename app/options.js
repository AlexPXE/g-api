export const options = {
    server: {
        port: 3000,
    },
    
    ytAPI: {
        scopes: [
            'https://www.googleapis.com/auth/youtube.readonly', 
            'https://www.googleapis.com/auth/youtube.force-ssl'
        ],
        tokenDir: "C:\\Users\\Nav\\.credentials\\",
        tokenFN: "yt.json"
    }
}