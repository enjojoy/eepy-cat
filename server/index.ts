import express, { Request, Response } from 'express';
import * as MultiBaas from '@curvegrid/multibaas-sdk';
import { isAxiosError } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

const config = new MultiBaas.Configuration({
  basePath: "https://cpjgetohcbbjhc2vqmong7u73q.multibaas.com/api/v0",
  accessToken: process.env.MULTIBASS_API_KEY,
});
const contractsApi = new MultiBaas.ContractsApi(config);

app.post('/claim', async (req: Request, res: Response) => {
  const { proof } = req.body;

  console.log('Received claim request:');
  console.log('Proof:', proof);

  const deployedAddressOrAlias = "groth16verifier1";
  const contractLabel = "groth16verifier";
  const contractMethod = "verifyProof";
  const payload: MultiBaas.PostMethodArgs = {
    args: [
      proof.pi_a,
      proof.pi_b,
      proof.pi_c,
      proof.pubSignals
    ],
  };

  try {
    const resp = await contractsApi.callContractFunction(deployedAddressOrAlias, contractLabel, contractMethod, payload);
    console.log("Function call result:\n", resp.data.result);
    res.json({ status: 'success', message: 'Claim received and verified', data: resp.data.result });

  } catch (e) {
    if (isAxiosError(e)) {
      console.log(`MultiBaas error with status '${e.response?.data.status}' and message: ${e.response?.data.message}`);
      res.status(500).json({ status: 'error', message: 'MultiBaas Error' });
    } else {
      console.log("An unexpected error occurred:", e);
      res.status(500).json({ status: 'error', message: 'An unexpected error occurred' });
    }
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});