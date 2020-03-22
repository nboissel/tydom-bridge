import {tydom, mqtt, devices} from '../config.json'

export const tydomConfig : ITydomConfig = tydom;
export const mqttConfig : IMqttConfig = mqtt;

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
    tydomId: number
    localId: string
}
