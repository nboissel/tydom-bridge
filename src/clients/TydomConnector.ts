// Required when testing against a local Tydom hardware
// to fix "self signed certificate" errors
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import {Logger} from 'winston';
import createLogger from '../utils/logger';
import TydomClient, {createClient} from 'tydom-client';
import {tydomConfig} from '../config/config';

export default class TydomConnector {
    client: TydomClient;
    logger: Logger

    constructor() {
        this.client = createClient({
            username: tydomConfig.mac,
            password: tydomConfig.password,
            hostname: tydomConfig.hostname
        });
        this.logger = createLogger('TydomConnector');
    }

    /**
     * Set data for a specified device
     */
    async setData(deviceId: number, data: object) {
        await this.client.connect();
        await this.client.put(`/devices/${deviceId}/endpoints/${deviceId}/data`, [
            data
          ]);
        await this.client.close();
    }

    /**
     * Get info for a specified device
     */ 
    async getInfo(deviceId: number) : Promise<TDeviceInfo> {
        this.logger.info(`Getting info for device ${deviceId}.`)
        await this.client.connect();
        const response: unknown = await this.client.get(`/devices/${deviceId}/endpoints/${deviceId}/data`);
        await this.client.close();
        return <TDeviceInfo> response;
    }

    /**
     * Get info for all existing devices
     */
    async getAllInfo() : Promise<TAllInfo[]> {
        this.logger.info(`Getting info for all devices.`)
        await this.client.connect();
        const response: unknown = await this.client.get(`/devices/data`);
        await this.client.close();
        return <TAllInfo[]> response;
    }

}

interface TDeviceInfo {
    id?: string
    error: number
    data: TData[]
}

interface TData {
    name: string
    validity: string
    value: any
}

interface TAllInfo {
    id: string
    endpoints: TDeviceInfo[]
}
