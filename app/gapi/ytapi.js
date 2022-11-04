"use strict";
import * as fs from 'fs/promises';
import * as readline from 'node:readline/promises';
import { google } from 'googleapis';


class YouTubeAPI {
	
	clientSecret;
	oauth2Client;
	scopes = '';
	tokenDir = '';
	tokenFN = '';
	clientSecretFN = 'client_secret.json';
	service = google.youtube('v3');
	
	/**
	 * 
	 * @param {Object} [params] 
	 * @param {Array<string>} [params.scopes] example: `['https://www.googleapis.com/auth/youtube.readonly']`
	 * @param {string} [params.tokenDir] example: `'C:\\Users\\userName\\.credentials\\'`
	 * @param {string} [params.tokenFN] example: `'yt.json'`
	 */
	constructor({
		scopes = [],
		tokenDir = '',
		tokenFN = 'yt.json',
	} = {}) {
		
		this.scopes = scopes;
		this.tokenFN = tokenFN;
		this.tokenDir = tokenDir;
	}

	async setClientSecrets() {
		try {
			this.clientSecret = JSON.parse(
				await fs.readFile(this.clientSecretFN, 'utf-8')
			).web;
			
			
		} catch(e) {
			console.log('Error loading client secret file: ' + e);			
		}

		return this;
	}
	
	async setOAuth2() {
		if ( this.clientSecret === undefined) {
			const {clientSecret} = await this.setClientSecrets();			
			
			if (clientSecret === undefined) {
				throw new Error("'this.clientSecret' is missing");
			}
		}

		const {
			client_id,
			redirect_uris,
			client_secret

		} = this.clientSecret;

		this.oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

		try {
			this.oauth2Client.credentials = JSON.parse(
				await fs.readFile(this.tokenDir + this.tokenFN, 'utf-8')
			);	

		} catch(e) {
			return await this.getNewToken();
		}

		return this;
	}

	async getNewToken() {		

		if ( this.oauth2Client === undefined) {
			return await this.setOAuth2();
		}

		const authUrl = this.oauth2Client.generateAuthUrl({
			access_type: 'offline',
			scope: this.scopes
		});

		console.log('Authorize this app by visiting this url: ', authUrl);

		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		const code = await rl.question('Enter the code from that page here: ');
		rl.close();

		try {
			const { tokens } = await this.oauth2Client.getToken(code);
			this.oauth2Client.credentials = tokens;
			await fs.writeFile( this.tokenDir + this.tokenFN, JSON.stringify(tokens, null, 4) );
		} catch(e) {
			console.log('Error while trying to retrieve access token', e);
			return;
		}

		return this;
	}

	async refreshToken() {
		await fs.rm(this.tokenDir + this.tokenFN);
		return await this.getNewToken();
	}

	/**
	 * 
	 * @param {string} reference 
	 * @param {string} method
	 * @param {object} options
	 * 
	 * @returns {Object}
	 */
	async exec(reference, method, options) {
		if (this.oauth2Client === undefined) {
			await this.getNewToken();
		}

		options.auth = this.oauth2Client;

		try {
			const { data } = await this.service[reference][method](options);
			return data;

		} catch (e) {
			if (e.message === 'No refresh token is set.') {
				await this.refreshToken();
				return await this.exec(reference, method, options);				
			}

			throw new Error('The API returned an error: ' + e);
		}
	}
}

async function insPl() {
	const api = new YouTubeAPI();

	const data = await api.exec('playlists', 'insert', {
		part: "snippet,status",
		resource: {
			snippet: {
				title: "TEST"
			}			
		},
		status: {
			privacyStatus : "private"
		}
	});

	console.log(data);
}

async function delPl() {
	const api = new YouTubeAPI();

	const data = await api.exec('playlists', 'delete', {
		"id": "PLnIgY94VK258gVAqnFqkwE0a1CVRcfE9C"
	});

	console.log(data);
}

async function addIt() {
	const api = new YouTubeAPI();

	const data = await api.exec('playlistItems', 'insert', {
		part: "snippet",
		"resource": {
			"snippet": {
				playlistId: "PLnIgY94VK25_ZiHbgBc0n5zZNEF2AwEkJ",
				resourceId : {
					kind: "youtube#video",
					videoId: "mBL_nPM6I1o"
				}
			}
		}
	});

	console.log(data);
}

async function getPlIt() {
	const api = new YouTubeAPI();

	const data = await api.exec('playlistItems', 'list', {
		part: "snippet",
		maxResults: 25,
		playlistId: "PLnIgY94VK259M2MdBb1tugtjwdfn6H-dJ"
	});

	console.log(data.items);
}

async function getPls() {
	const api = new YouTubeAPI({
		scopes: [
			'https://www.googleapis.com/auth/youtube.readonly', 
            'https://www.googleapis.com/auth/youtube.force-ssl'
		],
		tokenDir: "C:\\Users\\Nav\\.credentials\\",
		tokenFN: "yt.json"	
	});

	const data = await api.exec('playlists', 'list', {
		part: "snippet,contentDetails",
		maxResults: 40,
		channelId: "UC3VTJri71e2NSbe0jVkv1MQ"
		
	});

	console.log(data.items);
}

async function getSections() {
	const api = new YouTubeAPI({
		scopes: [
			'https://www.googleapis.com/auth/youtube.readonly', 
            'https://www.googleapis.com/auth/youtube.force-ssl'
		],
		tokenDir: "C:\\Users\\Nav\\.credentials\\",
		tokenFN: "yt.json"	
	});

	const data = await api.exec('channelSections', 'list', {
		"part": [
		  "snippet,contentDetails"
		],		
		"mine": true
	});

	console.log(data.items, data.items[0]);
}


getSections();





export {
	YouTubeAPI
}