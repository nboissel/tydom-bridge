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
        this.logger.info(`Send position ${position} to cover ${coverName} (${coverId}).`)
        return await this.client.setData(coverId, {
            name: 'position',
            value: position
        });
    };

    /**
     * Send command to cover `coverName`. Can be UP, DOWN or STOP.
     * @param coverName 
     * @param command number (0-100)
     */
    async setPositionCmd(coverName: string, command: string) {
        const coverId = this._getTydomId(coverName);
        this.logger.info(`Send command ${command} to cover ${coverName} (${coverId}).`)
        return await this.client.setData(coverId, {
            name: 'positionCmd',
            value: command
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
        // Init Tydom and start Tydom listener to listen position changes
        await this.client.initAndStartListener(this._handlePositionChange.bind(this));

        // Ensure MQTT is updated with current positions
        const coverPositions = await this.getAllCoversPositions();
        coverPositions.forEach(coverPosition => {
                this.mqttClient.updateCoverPosition(coverPosition.name, coverPosition.position);
        });
    }

    startCoverCommandListener() {
        this.mqttClient.startTopicListener(this.setPositionCmd.bind(this), this.setPosition.bind(this));
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
                this.mqttClient.updateCoverPosition('' + deviceInfo.name, deviceInfo.position);
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
