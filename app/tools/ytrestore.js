import * as fs from 'fs/promises';
import { 
    YTubePl, 
    YTubePlItems, 
    YTubeSubscr,    
    
} from '../index.js';

/**
* 
* @param {Object} [params] 
* @param {Array<string>} [params.scopes] example: `['https://www.googleapis.com/auth/youtube.readonly']`
* @param {string} [params.tokenDir] example: `'C:\\Users\\userName\\.credentials\\'`
* @param {string} [params.tokenFN] example: `'yt.json'`
*/
async function ytRestore(params, dbPath) {
    const
        pl = new YTubePl(params),
        plItems = new YTubePlItems(params),
        subscr = new YTubeSubscr(params),        
        db = new Map(
            JSON.parse(
                await fs.readFile(dbPath, 'utf-8')
            )
        )
    ;

    for ( const {title, privacyStatus, items, description} of db.get("playlists") ) {
        const { id: playlistId } = await pl.insert(title, privacyStatus, description);

        for(const videoId of items) {
            await plItems.insert(playlistId, videoId);
        }
    }

    console.log("Playlists restored.");

    for( let {channelId} of db.get("subscriptions") ) {
        await subscr.insert(channelId);
    }

    console.log("Subscriptions restored.");    
}

export { ytRestore }