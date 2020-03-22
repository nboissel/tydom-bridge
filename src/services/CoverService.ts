import { coverConfig } from '../config/config';
import TydomClient, { TDeviceInfo } from "../clients/TydomConnector";
import {Logger} from 'winston';
import createLogger from '../utils/logger';

export default class CoverService {
    client: TydomClient
    logger: Logger

    constructor() {
        this.client = new TydomClient();
        this.logger = createLogger('CoverService');
        this.startCoverPositionListener();
    }

    /**
     * Set cover `coverName` to position `position` (0 = closed, 100 = open)
     * @param coverName 
     * @param position number (0-100)
     */
    async setPosition(coverName: string, position: number) {
        const coverId = this._getTydomId(coverName);
        this.logger.info(`Setting cover ${coverName} (${coverId}) to position ${position}.`)
        return await this.client.setData(coverId, {
            name: 'position',
            value: position
        });
    };

    /**
     * Close cover `coverName`
     * @param coverName 
     */
    async closeCover(coverName: string) {
        this.setPosition(coverName, 0);
    }

    /**
     * Open cover `coverName`
     * @param coverName 
     */
    async openCover(coverName: string) {
        this.setPosition(coverName, 100);
    }

    /**
     * Get cover `coverName` position (0-100)
     * @param coverName 
     */
    async getCoverPosition(coverName: string) : Promise<ICoverInfo> {
        const coverId = this._getTydomId(coverName);
        this.logger.info(`Getting cover ${coverName} (${coverId}) position.`)
        const coverInfo = await this.client.getInfo(coverId);
        const position = coverInfo.data.filter(entry => entry.name == 'position')
                      .pop()?.value;
        return {position: position};
    }

    /**
     * Get positions for all covers
     */
    async getAllCoversPositions() : Promise<ICoverInfo[]> {
        this.logger.info(`Getting positions for all covers.`)
        const coverInfo = await this.client.getAllInfo();
        const result = coverInfo.filter(raw => raw.endpoints.length == 1) // covers only have 1 endpoints
                 .map(raw => raw.endpoints[0])
                 .map(device => { 
                     const name = (typeof device.id == 'number') ? this._getName(device.id) : device.id;
                     return {
                        name: name, 
                        position: device.data.filter(entry => entry.name == 'position').pop()?.value
                     }});
        return result;
    }

    /**
     * Start listener on cover position changes
     */
    startCoverPositionListener() {
        this.client.startListener(change => {
            const deviceInfo = this._getPositionFromEndpoint(change.body[0]?.endpoints[0]);
            this.logger.info(`Position change detected for cover ${deviceInfo.name}. New position ${deviceInfo.position}`);
        })
    }
    
    _getTydomId(coverName: string) : number {
        return coverConfig.nameToTydom[coverName];
    }

    _getName(tydomId: number) : string {
        return coverConfig.idTydomToName[tydomId];
    }

    _getPositionFromEndpoint(device : TDeviceInfo): ICoverInfo {
        const name = (typeof device.id == 'number') ? this._getName(device.id) : device.id;
        return {
            name: name, 
            position: device.data.filter(entry => entry.name == 'position').pop()?.value
        };
    }
}

interface ICoverInfo {
    name?: string
    position: number
}
