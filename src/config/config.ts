import {tydom, mqtt, devices} from '../config.json'


export const tydomConfig = {
    mac: process.env.TB_TYDOM_MAC || tydom.mac,
    password: process.env.TB_TYDOM_PASSWORD || tydom.password,
    hostname: process.env.TB_TYDOM_HOSTNAME || tydom.hostname
}

export const mqttConfig = {
    client: {
        host: process.env.TB_MQTT_HOST || mqtt.client.host,
        port: mqtt.client.port || 1883,
        username: process.env.TB_MQTT_USERNAME || mqtt.client.username,
        password: process.env.TB_MQTT_PASSWORD || mqtt.client.password
    },
    topics: mqtt.topics,
    ha_discovery_prefix: mqtt.ha_discovery_prefix
};

const deviceConfig : IDevicesConfig = devices;

let idTydomToName : { [id: number] : string } = {}
let nameToTydom : { [id: string] : number } = {}
deviceConfig.covers.forEach((cover) => {
    idTydomToName[cover.tydomId] = cover.localId,
    nameToTydom[cover.localId] = cover.tydomId
})

export const coverConfig = {
    idTydomToName: idTydomToName,
    nameToTydom: nameToTydom
}

interface IDevicesConfig {
    covers: IIdMapping[]
    energy?: IIdMapping[]
}

interface IIdMapping {
    tydomId: number
    localId: string
}
