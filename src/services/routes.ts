import { Request, Response } from "express";
import CoverService from './CoverService';

const service = new CoverService();
// Init Tydom to MQTT communication
service.startCoverPositionListener();
// Init MQTT to Tydom communication
service.startCoverCommandListener();

export default [
  {
    path: "/api/cover",
    method: "put",
    handler: async (req: Request, res: Response) => {
      const {id, position} = req.body;
      const result = await service.setPosition(id, position);
      res.status(200).send();
    }
  },
  {
    path: "/api/cover/:name",
    method: "get",
    handler: async (req: Request, res: Response) => {
      const result = await service.getCoverPosition(req.params.name);
      
      res.status(200).send(result);
    }
  }, 
  {
    path: "/api/covers",
    method: "get",
    handler: async (req: Request, res: Response) => {
      const result = await service.getAllCoversPositions();
      
      res.status(200).send(result);
    }
  }
];