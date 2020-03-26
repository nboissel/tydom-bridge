import { coverConfig } from '../config/config';
import TydomClient, { TDeviceInfo, TChangeEvent } from "../clients/TydomConnector";
import MqttClient from '../clients/MqttConnector';
import {Logger} from 'winston';
import createLogger from '../utils/logger';

export default class CoverService {
    client: TydomClient
    mqttClient: MqttClient
    logger: Logger

    constructor() {
        this.client = new TydomClient();
        this.logger = createLogger('CoverService');
        this.mqttClient = new MqttClient();
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

    async startCoverPositionListener() {
        await this.client.startListener(this._handlePositionChange.bind(this));
    }

    startCoverCommandListener() {
        this.mqttClient.startTopicListener(this._commandAction.bind(this), this.setPosition.bind(this));
    }

    _commandAction(coverName: string, command: string) {
        switch(command){
            case 'OPEN': 
                this.openCover(coverName);
                break;
            case 'CLOSE':
                this.closeCover(coverName);
                break;
            default:
        }
    }
    
    _getTydomId(coverName: string) : number {
        return coverConfig.nameToTydom[coverName];
    }

    _getName(tydomId: number) : string {
        return coverConfig.idTydomToName[tydomId];
    }

    _handlePositionChange(change: TChangeEvent) {
        change.body.forEach(body => {
            body.endpoints.forEach(endpoint => {
                const deviceInfo = this._getPositionFromEndpoint(endpoint);
                this.logger.info(`Sending new position for cover ${deviceInfo.name}: ${deviceInfo.position}`);
                this.mqttClient.sendCoverNewPosition('' + deviceInfo.name, deviceInfo.position);
            });
        });
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
