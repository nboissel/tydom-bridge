import { setPosition, getAllInfo, getInfo } from "./TydomProvider";

export const closeCover = async (coverId: string, position: number) => {
  return await setPosition(coverId, position);
};

export const getCoverInfo = async (coverId: string) : Promise<ICoverInfo> => {
    const coverInfo = await getInfo(coverId);
    const position = coverInfo.data.filter(entry => entry.name == 'position')
                  .pop()?.value;
    const result = {position: position};
    return result;
}

export const getAllCoversInfo = async (coverId: string) : Promise<ICoverInfo[]> => {
    const coverInfo = await getAllInfo();
    const result = coverInfo.filter(raw => raw.endpoints.length == 1) // covers only have 1 endpoints
             .map(raw => raw.endpoints[0])
             .map(device => { 
                 return {
                    id: device.id, 
                    position: device.data.filter(entry => entry.name == 'position').pop()?.value
                 }});
    return result;
}

interface ICoverInfo {
    id?: string
    position: number
}
