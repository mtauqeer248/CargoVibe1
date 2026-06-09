import express from 'express';
import cors from 'cors';
import { seed } from './services/ParkingRequestRepository';
import {
  listParkingRequests,
  getParkingRequest,
  createParkingRequest,
  updateParkingRequestStatus,
  deleteParkingRequest,
  healthCheck,
} from './functions/parkingRequests';
import { aiChat } from './functions/aiAssistant';
import { InvocationContext } from '@azure/functions';

const app = express();
app.use(cors());
app.use(express.json());

const ctx = {} as InvocationContext;

function makeAFRequest(req: express.Request): any {
  return {
    params: req.params,
    json: async () => req.body,
  };
}

function adaptHandler(handler: Function) {
  return async (req: express.Request, res: express.Response) => {
    const afReq = makeAFRequest(req);
    const afRes = await handler(afReq, ctx);
    res.status(afRes.status ?? 200);
    if (afRes.jsonBody !== undefined) {
      res.json(afRes.jsonBody);
    } else {
      res.send();
    }
  };
}

app.get('/api/health',                          adaptHandler(healthCheck));
app.get('/api/parking-requests',                adaptHandler(listParkingRequests));
app.get('/api/parking-requests/:id',            adaptHandler(getParkingRequest));
app.post('/api/parking-requests',               adaptHandler(createParkingRequest));
app.patch('/api/parking-requests/:id/status',   adaptHandler(updateParkingRequestStatus));
app.delete('/api/parking-requests/:id',         adaptHandler(deleteParkingRequest));
app.post('/api/ai/chat',                        adaptHandler(aiChat));

seed();

app.listen(7071, () => {
  console.log('\n🚚 CargoVibe Azure Functions running at http://localhost:7071/api');
});
