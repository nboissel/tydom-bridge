import {tydom, mqtt, devices} from '../config.json'

export const tydomConfig : ITydomConfig = tydom;
export const mqttConfig : IMqttConfig = mqtt;
export const deviceMap : IDevicesConfig = devices;

interface ITydomConfig {
    mac: string
    password: string
    hostname: string
}

interface IMqttConfig {
    host: string
    port: number
    username?: string
    password?: string
}

interface IDevicesConfig {
    covers: IIdMapping[]
    energy?: IIdMapping[]
}

interface IIdMapping {
    tydomId: string
    localId: string
}
