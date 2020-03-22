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
        this.client.connect();
    }

    /**
     * Set data for a specified device
     */
    async setData(deviceId: number, data: object) {
        await this.client.put(`/devices/${deviceId}/endpoints/${deviceId}/data`, [
            data
          ]);
    }

    /**
     * Get info for a specified device
     */ 
    async getInfo(deviceId: number) : Promise<TDeviceInfo> {
        this.logger.info(`Getting info for device ${deviceId}.`)
        const response: unknown = await this.client.get(`/devices/${deviceId}/endpoints/${deviceId}/data`);
        return <TDeviceInfo> response;
    }

    /**
     * Get info for all existing devices
     */
    async getAllInfo() : Promise<TAllInfo[]> {
        this.logger.info(`Getting info for all devices.`)
        const response: unknown = await this.client.get(`/devices/data`);
        return <TAllInfo[]> response;
    }

    /**
     * Create a listener for state change in Tydom
     * 
     * @param fun function to apply to received messages
     */
    startListener(fun: (change: TChangeEvent) => void) {
        this.logger.info('Starting listener on Tydom changes');
        this.client.on('message', message => {
            if(message.uri !== '/device/data' && message.method !== 'PUT' 
                && message.status != 200) {
                return;
            } else {
                const change : TChangeEvent = message;
                fun(change);
            }
        })
    }
}

export interface TDeviceInfo {
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

interface TChangeEvent {
    type: string
    uri: string
    method: string
    status: number
    body: TAllInfo[]
    headers: object
}