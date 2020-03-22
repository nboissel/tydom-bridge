// Required when testing against a local Tydom hardware
// to fix "self signed certificate" errors
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import createLogger from '../../utils/logger';
import {createClient} from 'tydom-client';
import {tydomConfig} from '../../config/config';

const client = createClient({
    username: tydomConfig.mac,
    password: tydomConfig.password,
    hostname: tydomConfig.hostname
});
const logger = createLogger('TydomProvider');

export const setPosition = async (deviceId: string, position: number) => {
    logger.info(`Setting position ${position} for cover ${deviceId}.`)
    await client.connect();
    await client.put(`/devices/${deviceId}/endpoints/${deviceId}/data`, [
        {
          name: 'position',
          value: position
        }
      ]);
    await client.close();
}

export const getInfo = async (deviceId: string) : Promise<TDeviceInfo> => {
    logger.info(`Getting info for device ${deviceId}.`)
    await client.connect();
    const response: unknown = await client.get(`/devices/${deviceId}/endpoints/${deviceId}/data`);
    await client.close();
    return <TDeviceInfo> response;
}

export const getAllInfo = async () : Promise<TAllInfo[]> => {
    logger.info(`Getting info for all devices.`)
    await client.connect();
    const response: unknown = await client.get(`/devices/data`);
    await client.close();
    return <TAllInfo[]> response;
}

export const getTest = async () => {
    await client.connect();
    const deviceId = '1584296123';
    const resp = await client.put(`/devices/${deviceId}/endpoints/${deviceId}/cdata?name=energyHisto`, [
        {
          name: 'period',
          value: 'MONTH'
        },
        {
            name: 'dest',
            value: 'ELEC_TOTAL'
        }
      ]);
      console.dir(resp);
    await client.close();
    return resp;
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
