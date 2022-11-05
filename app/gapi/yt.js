import { YouTubeAPI } from "./ytapi.js";
class YTubePl extends YouTubeAPI {
    
    constructor(params) {
        super(params)
    }

    /**
     * 
     * @param {boolean} mine This parameter can only be used in a properly authorized request.
     * @param {string} [channelId] This parameter can only be used in a properly authorized request.
     * @returns {Object}
     */
    async list(mine = true, channelId) {

        const options = {
            part: "snippet,contentDetails"           
        };

        if (arguments.length > 1) {
            options.channelId = channelId;
        } else {
            options.mine = mine
        }

        return await this.exec('playlists', 'list', options);
    }

    /**
     * 
     * @param {string} title Playlist title
     * @param {string} privacyStatus private or public or unlisted
     * @returns {Object}
     */
    async insert(title = '', privacyStatus = 'private') {
        if (title === '')  {
            throw new Error("No title");
        }

        const options = {
            part: "snippet,status",
            resource: {
                snippet: {
                    title
                },
                status: {
                    privacyStatus
                }                
            }
        };

        return await this.exec('playlists', 'insert', options);
    }

    /**
     * 
     * @param {string} id Playlist id
     * @returns {Object}
     */
    async delete(id = '') {
        if (id === '') {
            throw new Error("You must specify an 'id' parametr");
        }
        const options = { id };
        return await this.exec('playlists', 'delete', options);
    }
}

class YTubePlItems extends YouTubeAPI {
    constructor(params) {
        super(params)
    }

    /**
     * 
     * @param {string} playlistId 
     * @returns {Object}
     */
    async list(playlistId = '') {
        if (playlistId === '') {
            throw new Error("You must specify an 'playlistId' parametr");
        }

        const options = {
            part: "snippet,contentDetails,status",
            maxResults: 50,
            playlistId
        };

        return await this.exec('playlistItems', 'list', options);
    }

    /**
     * 
     * @param {string} playlistId 
     * @param {string} videoId 
     * @returns {Object}
     */
    async insert(playlistId = '', videoId = '') {
        if (playlistId === '' || videoId === '') {
            throw new Error("You must specify an 'playlistId' and 'videoId' parametrs");
        }

        const options = {
            part: "snippet",
            resource: {
                snippet: {
                    playlistId,
                    resourceId : {
                        kind: "youtube#video",
                        videoId
                    }
                }
            }
        }

        return await this.exec('playlistItems', 'insert', options);
    }

    /**
     * 
     * @param {string} id The id parameter specifies the YouTube playlist item ID for the playlist item that is being deleted. 
     * In a playlistItem resource, the id property specifies the playlist item's ID.
     * @returns {Object}
     */
    async delete(id = '') {
        if (id === '') {
            throw new Error("You must specify an 'Id' parametr");
        }
        const options = { id };
        return await this.exec('playlistItems', 'delete', options);
    }

}

class YTubeSubscr extends YouTubeAPI {
    constructor(params) {
        super(params);
    }

    /**
     * 
     * @param {boolean} mine This parameter can only be used in a properly authorized request. 
     * Set this parameter's value to true to retrieve a feed of the authenticated user's subscriptions.
     * @param {string} channelId 
     * @returns {Object}
     */
    async list(mine = true, channelId) {
        
        const options = {
            part: "snippet,contentDetails",
            maxResults: 50
        };

        if (arguments.length > 1) {
            options.channelId = channelId;
        } else {
            options.mine = mine
        }

        return this.exec('subscriptions', 'list', options);
    }

    /**
     * 
     * @param {string} channelId The ID that YouTube uses to uniquely identify the subscriber's channel. 
     * The resource_id object identifies the channel that the user subscribed to.     
     * @returns {object}
     */
    async insert(channelId = '') {
        if (channelId === '') {
            throw new Error("You must specify an 'channelId' parametr");
        }

        const options = {
            part: "snippet",
            resource: {
                snippet: {
                    resourceId: {
                        kind: "youtube#channel",
                        channelId
                    }
                }
            }
        };

        return this.exec('subscriptions', 'insert', options);
    }

    /**
     * 
     * @param {string} id The id parameter specifies the YouTube subscription ID for the resource that is being deleted. 
     * In a subscription resource, the id property specifies the YouTube subscription ID.
     * @returns {object}
     */
    async delete(id = '') {
        if (id === '') {
            throw new Error("You must specify an 'Id' parametr");
        }

        const options = { id };

        return this.exec('subscriptions', 'delete', options);
    }
}

class YTubeSections extends YouTubeAPI {
    constructor(params) {
        super(params);
    }

    async list(mine = true, channelId) {

        const options = {
            part: "snippet,contentDetails"
        };

        if (arguments.length > 1) {
            options.channelId = channelId;
        } else {
            options.mine = mine
        }
        
        return this.exec('channelSections', 'list', options);
    }

    //IMPLEMENT
    /**
     * Not implemented
     */
    async insert() {
        throw new Error("Not implemented!");
    }

    //IMPLEMENT
    /**
     * Not implemented
     */
    async delete() {
        throw new Error("Not implemented!");
    }
}

export {
    YTubePl,
    YTubePlItems,
    YTubeSubscr,
    YTubeSections,
    YouTubeAPI
}