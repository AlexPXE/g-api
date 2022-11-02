"use strict";
import * as fs from 'fs/promises';
import * as readline from 'node:readline';
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
		scopes = ['https://www.googleapis.com/auth/youtube.readonly'],
		tokenDir = 'C:\\Users\\Nav\\.credentials\\',
		tokenFN = 'yt.json',
	} = {}) {
		
		this.scopes = scopes;
		this.tokenFN = tokenFN;
		this.tokenDir = tokenDir;

		this.setClientSecrets();
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

		rl.question(
			'Enter the code from that page here: ', 
			(code) => {			
				rl.close();
				this.oauth2Client.getToken(
					code, 
					async (err, token) => {
						if (err) {
							console.log('Error while trying to retrieve access token', err);
							return;
						}

						this.oauth2Client.credentials = token;												
						fs.writeFile( this.tokenDir + this.tokenFN, JSON.stringify(token, null, 4) );
					}
				);
			}
		);

		return this;
	}

	/**
	 * 
	 * @param {string} reference 
	 * @param {string} method
	 * @param {object} options
	 * 
	 * @returns {Object}
	 */
	async getData(reference, method, options) {
		if (this.oauth2Client === undefined) {
			await this.getNewToken();
		}

		options.auth = this.oauth2Client;

		try {
			const { data } = await this.service[reference][method](options);
			return data;

		} catch (e) {			
			throw new Error('The API returned an error: ' + e);
		}
	}
}

export {
	YouTubeAPI
}