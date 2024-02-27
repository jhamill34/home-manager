import { get } from "https";
import { z } from "zod";

const tellerAccount = z.object({
  enrollment_id: z.string(),
  links: z.object({
    balances: z.string(),
    self: z.string(),
    transactions: z.string(),
  }),
  institution: z.object({
    name: z.string(),
    id: z.string(),
  }),
  type: z.string(),
  name: z.string(),
  subtype: z.string(),
  currency: z.string(),
  id: z.string(),
  last_four: z.string(),
  status: z.string(),
});

const tellerTransaction = z.object({
  account_id: z.string(),
  amount: z.string(),
  date: z.string(),
  description: z.string(),
  details: z.object({
    processing_status: z.string(),
    category: z.string().nullable(),
    counterparty: z
      .object({
        name: z.string().nullable(),
        type: z.string().nullable(),
      })
      .nullable(),
  }),
  status: z.string(),
  id: z.string(),
  links: z.object({
    self: z.string(),
    account: z.string(),
  }),
  running_balance: z.string().nullable(),
  type: z.string(),
});

type TellerClientOptions = {
  host: string;
  port: number;
  cert: string;
  key: string;
};

type TellerRequest = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  token: string;
};

export type ListTransactionsOpts = {
  count?: string;
  from_id?: string;
};

export class TellerClient {
  private readonly opts: TellerClientOptions;

  constructor(opts: TellerClientOptions) {
    this.opts = opts;
  }

  public async listTransactions(
    token: string,
    accountId: string,
    opts: ListTransactionsOpts,
  ) {
    const query = new URLSearchParams(opts);

    let path = `/accounts/${accountId}/transactions`;

    if (Object.keys(opts).length > 0) {
      path += `?${query.toString()}`;
    }

    console.log(path);

    const result = await this.request({
      method: "GET",
      path,
      token,
    });

    return z.array(tellerTransaction).parse(result);
  }

  public async listAccounts(token: string) {
    const result = await this.request({
      method: "GET",
      path: "/accounts",
      token,
    });

    return z.array(tellerAccount).parse(result);
  }

  private async request(reqOpts: TellerRequest) {
    const authorization = Buffer.from(reqOpts.token + ":").toString("base64");

    return new Promise((resolve, reject) => {
      const req = get(
        {
          hostname: this.opts.host,
          port: this.opts.port,
          method: reqOpts.method,
          path: reqOpts.path,
          cert: this.opts.cert,
          key: this.opts.key,
          headers: {
            Authorization: `Basic ${authorization}`,
          },
        },
        (res) => {
          let response = "";
          res.on("data", (data: Buffer) => {
            response += data.toString();
          });

          res.on("end", () => {
            resolve(JSON.parse(response.toString()));
          });

          res.on("error", (err) => {
            reject(err);
          });
        },
      );

      req.end();
    });
  }
}
