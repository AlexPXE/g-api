"use strict"

import {
    YouTubeAPI,
    YTubePl,
    YTubePlItems,
    YTubeSubscr
} from "../index.js";

class YTBackup extends YouTubeAPI{
    pl;
    plItems;
    subscr;    

    /**
     * 
     * @param {object} options
     * @param {Array<string>} options.scopes 
     * example: 
     * [
     *  "https://www.googleapis.com/auth/youtube.readonly",
     *  'https://www.googleapis.com/auth/youtube.force-ssl'
     * ]
     * @param {string} options.tokenDir The directory where the token should be stored
     * @param {string} options.tokenFN Token file name
     * @param {string} options.clientSecretDir The directory where the client_secret.json file is stored
     * @param {object} ytServiceClasses
     * @param {class} ytServiceClasses.Playlists
     * @param {class} ytServiceClasses.Plitems
     * @param {class} ytServiceClasses.Subscriptions     
     */
    constructor(options, ytServiceClasses) {
        super(options);

        this.pl = new ytServiceClasses.Playlists(this);
        this.plItems = new ytServiceClasses.Plitems(this);
        this.subscr = new ytServiceClasses.Subscriptions(this);        
    }

    /**
     * 
     * @param {Object} [db]
     * @param {function} db.set
     * @param {function} db.get
     * @returns {Promise<Object|Map>}
     */
    async restore(db = new Map()) {
        const {
            pl,
            plItems,
            subscr
        } = this;

        for ( const {title, privacyStatus, items, description} of db.get("playlists") ) {
            const { id: playlistId } = await pl.insert(title, privacyStatus, description);
    
            for(const videoId of items) {
                await plItems.insert(playlistId, videoId);
            }
        }
    
        for( let {channelId} of db.get("subscriptions") ) {
            await subscr.insert(channelId);
        }

        return this;
    }

    /**
     * 
     * @param {Object} [db]
     * @param {function} db.set
     * @param {function} db.get
     * @returns {Promise<Object|Map>}
     */
    async backup(db = new Map()) {
        const {
            pl,
            plItems,
            subscr
        } = this, data = [];        

        for (let {items} of await pl.list() ) {        
            for (let item of items) {
                const {
                    id,
                    status: { privacyStatus },
                    snippet: { title, description }
                } = item;
        
                data.push({
                    title,
                    description,
                    privacyStatus,
                    items: ( await plItems.list(id) ).reduce(
                        (acc, {items}) => items.reduce(
                            ( acc, {contentDetails: { videoId }} ) => {
                              acc.push(videoId);
                              return acc;
                            },
                            acc
                        ),
                        []
                    )
                });
            }
        }
    
        db.set(
            'playlists',
            data
        ).set(
            'subscriptions',
            ( await  subscr.list() ).reduce(
                (acc, {items}) => items.reduce(
                    (acc, { snippet: {title, resourceId} }) => {
                        acc.push({...resourceId, title});
                        return acc;
                    },
                    acc
                ),            
                []
            )
        );
        return this;
    }

    async clearPls() {
        const {pl} = this;

        for (let {items} of await pl.list() ) {
            for (let item of items) {
                const { id } = item;
                await pl.delete(id);
            }
        }
    }    
}

class YTBackupFactory {
    ytServiceClasses;
    YTBackup;

    /**
     * 
     * @param {object} ytServiceClasses
     * @param {class} ytServiceClasses.Playlists
     * @param {class} ytServiceClasses.Plitems
     * @param {class} ytServiceClasses.Subscriptions
     * @param {class} YTBackup 
     */
    constructor(ytServiceClasses, YTBackup) {
        this.ytServiceClasses = ytServiceClasses;
        this.YTBackup = YTBackup;
    }

    /**
     * @param {object} options
     * @param {Array<string>} options.scopes 
     * example: 
     * [
     *  "https://www.googleapis.com/auth/youtube.readonly",
     *  'https://www.googleapis.com/auth/youtube.force-ssl'
     * ]
     * @param {string} options.tokenDir The directory where the token should be stored
     * @param {string} options.tokenFN Token file name
     * @param {string} options.clientSecretDir The directory where the client_secret.json file is stored
     * @returns {YTBackup}
     */
    create(options) {
        return new this.YTBackup(options, this.ytServiceClasses);
    }
}

const ytBackupFactory = new YTBackupFactory({
    Playlists: YTubePl,
    Plitems: YTubePlItems,
    Subscriptions: YTubeSubscr
}, YTBackup);

export {
    YTBackup,
    YTBackupFactory,
    ytBackupFactory
}